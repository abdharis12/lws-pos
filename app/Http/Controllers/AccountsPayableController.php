<?php

namespace App\Http\Controllers;

use App\Models\AccountsPayable;
use App\Models\PurchaseOrder;
use App\Models\SupplierInvoice;
use App\Services\AccountsPayableService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AccountsPayableController extends Controller
{
    public function __construct(
        private readonly AccountsPayableService $apService,
    ) {}

    public function index(Request $request): Response
    {
        $outletId = $this->outletId();
        $this->apService->markOverdueEntries($outletId);

        $tab = $request->tab ?? 'aging';

        return Inertia::render('admin/procurement/AccountsPayable', [
            'tab' => $tab,
            'aging' => $this->apService->getAgingReport($outletId),
            'unpaidInvoices' => $this->apService->getUnpaidInvoices($outletId, $request->supplier_id),
            'pendingInvoices' => SupplierInvoice::where('outlet_id', $outletId)
                ->where('status', SupplierInvoice::STATUS_PENDING)
                ->with(['supplier', 'purchaseOrder', 'goodsReceivedNote'])
                ->latest()
                ->limit(20)
                ->get(),
            'pos' => PurchaseOrder::where('outlet_id', $outletId)
                ->whereIn('status', ['sent', 'partial'])
                ->with(['supplier', 'grns'])
                ->latest()
                ->limit(20)
                ->get(),
            'recentPayments' => AccountsPayable::where('outlet_id', $outletId)
                ->where('status', AccountsPayable::STATUS_PAID)
                ->with(['supplier', 'supplierInvoice'])
                ->latest('paid_at')
                ->limit(20)
                ->get(),
        ]);
    }

    public function storeInvoice(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'supplier_id' => 'required|exists:suppliers,id',
            'po_id' => 'nullable|exists:purchase_orders,id',
            'grn_id' => 'nullable|exists:goods_received_notes,id',
            'invoice_number' => 'nullable|string|max:255',
            'invoice_date' => 'required|date',
            'due_date' => 'nullable|date|after_or_equal:invoice_date',
            'tax_amount' => 'nullable|numeric|min:0',
            'payment_terms' => 'nullable|in:cash,net_7,net_14,net_30,net_60',
            'notes' => 'nullable|string|max:1000',
            'items' => 'required|array|min:1',
            'items.*.ingredient_id' => 'required|exists:ingredients,id',
            'items.*.qty' => 'required|numeric|min:0.0001',
            'items.*.unit_price' => 'required|numeric|min:0',
        ]);

        $invoice = $this->apService->recordInvoice($this->outletId(), $validated, $request->user());

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => "Invoice {$invoice->invoice_number} berhasil dicatat dan AP entry dibuat otomatis.",
        ]);

        return redirect()->back();
    }

    public function recordPayment(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'accounts_payable_id' => 'required|exists:accounts_payable,id',
            'amount' => 'required|numeric|min:0.01',
            'method' => 'required|in:cash,bank_transfer,giro,other',
            'reference_number' => 'nullable|string|max:255',
            'notes' => 'nullable|string|max:500',
        ]);

        try {
            $ap = $this->apService->recordPayment(
                $validated['accounts_payable_id'],
                $validated['amount'],
                $validated['method'],
                $validated['reference_number'] ?? null,
                $request->user()
            );

            Inertia::flash('toast', [
                'type' => 'success',
                'message' => 'Pembayaran berhasil dicatat. Sisa: Rp '.number_format($ap->balance, 0, ',', '.'),
            ]);
        } catch (\InvalidArgumentException $e) {
            Inertia::flash('toast', ['type' => 'error', 'message' => $e->getMessage()]);
        }

        return redirect()->back();
    }

    public function threeWayMatch(Request $request, SupplierInvoice $invoice): RedirectResponse
    {
        $result = $this->apService->performThreeWayMatch($invoice);

        if ($result['matched']) {
            Inertia::flash('toast', ['type' => 'success', 'message' => '3-way match berhasil. Tidak ada perbedaan.']);
        } else {
            Inertia::flash('toast', [
                'type' => 'warning',
                'message' => 'Ditemukan perbedaan: '.implode('; ', $result['issues']),
            ]);
        }

        return redirect()->back();
    }

    protected function outletId(): int
    {
        $outletId = auth()->user()?->employee?->outlet_id;
        abort_if(! $outletId, 403, 'User tidak terkait dengan outlet manapun.');

        return $outletId;
    }
}
