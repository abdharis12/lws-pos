<?php

namespace App\Http\Controllers;

use App\Models\GoodsReceivedNote;
use App\Models\PurchaseOrder;
use App\Services\ProcurementService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class GoodsReceivedNoteController extends Controller
{
    public function __construct(
        private readonly ProcurementService $procurementService,
    ) {}

    public function index(Request $request): Response
    {
        $outletId = $this->outletId();

        $grns = $this->procurementService->getGrns($outletId, [
            'status' => $request->status,
            'po_id' => $request->po_id,
            'date_from' => $request->date_from,
            'date_to' => $request->date_to,
            'per_page' => 15,
        ]);

        return Inertia::render('admin/procurement/Grns', [
            'grns' => $grns,
            'filters' => $request->only(['status', 'po_id', 'date_from', 'date_to']),
            'pendingPos' => PurchaseOrder::where('outlet_id', $outletId)
                ->whereIn('status', ['sent', 'partial'])
                ->with(['supplier', 'items.ingredient'])
                ->get(['id', 'po_number', 'supplier_id', 'status']),
        ]);
    }

    public function show(int $grnId): Response
    {
        $grn = GoodsReceivedNote::with([
            'purchaseOrder.supplier',
            'items.ingredient',
            'receivedBy',
        ])->findOrFail($grnId);

        return Inertia::render('admin/procurement/GrnDetail', [
            'grn' => $grn,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $this->validateGrn($request);

        try {
            $grn = $this->procurementService->createGrn(
                $validated['po_id'],
                ['items' => $validated['items'], 'notes' => $validated['notes'] ?? null],
                $request->user(),
            );

            Inertia::flash('toast', ['type' => 'success', 'message' => "Penerimaan barang {$grn->grn_number} berhasil disimpan. Stok & HPP diperbarui."]);
        } catch (\InvalidArgumentException $e) {
            Inertia::flash('toast', ['type' => 'error', 'message' => $e->getMessage()]);
        }

        return redirect()->back();
    }

    protected function validateGrn(Request $request): array
    {
        return $request->validate([
            'po_id' => 'required|exists:purchase_orders,id',
            'received_date' => 'nullable|date',
            'notes' => 'nullable|string|max:1000',
            'items' => 'required|array|min:1',
            'items.*.ingredient_id' => 'required|distinct|exists:ingredients,id',
            'items.*.qty_received' => 'required|numeric|min:0.0001',
            'items.*.unit_cost' => 'nullable|numeric|min:0',
            'items.*.notes' => 'nullable|string|max:500',
        ]);
    }

    protected function outletId(): int
    {
        $outletId = auth()->user()?->employee?->outlet_id;
        abort_if(! $outletId, 403, 'User tidak terkait dengan outlet manapun.');

        return $outletId;
    }
}
