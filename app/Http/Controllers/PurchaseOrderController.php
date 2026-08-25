<?php

namespace App\Http\Controllers;

use App\Models\Ingredient;
use App\Models\PurchaseOrder;
use App\Models\Supplier;
use App\Services\ProcurementService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PurchaseOrderController extends Controller
{
    public function __construct(
        private readonly ProcurementService $procurementService,
    ) {}

    public function index(Request $request): Response
    {
        $outletId = $this->outletId();

        $pos = $this->procurementService->getPos($outletId, [
            'status' => $request->status,
            'supplier_id' => $request->supplier_id,
            'date_from' => $request->date_from,
            'date_to' => $request->date_to,
            'per_page' => 15,
        ]);

        return Inertia::render('admin/procurement/Pos', [
            'purchaseOrders' => $pos,
            'suppliers' => Supplier::where('outlet_id', $outletId)->where('is_active', true)->get(['id', 'name']),
            'ingredients' => Ingredient::where('outlet_id', $outletId)->where('is_active', true)->orderBy('name')->get(['id', 'name', 'unit', 'cost_per_unit']),
            'filters' => $request->only(['status', 'supplier_id', 'date_from', 'date_to']),
        ]);
    }

    public function show(PurchaseOrder $po): Response
    {
        $data = $this->procurementService->getPoDetail($po->id);

        return Inertia::render('admin/procurement/PoDetail', [
            'purchaseOrder' => $data,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $this->validatePo($request);

        $po = $this->procurementService->createPo(
            $this->outletId(),
            $validated,
            $request->user(),
        );

        Inertia::flash('toast', ['type' => 'success', 'message' => "PO {$po->po_number} berhasil dibuat."]);

        return redirect()->route('admin.procurement.pos.show', $po);
    }

    public function send(PurchaseOrder $po): RedirectResponse
    {
        try {
            $updatedPo = $this->procurementService->sendPo($po);
            Inertia::flash('toast', ['type' => 'success', 'message' => "PO {$updatedPo->po_number} berhasil dikirim ke supplier."]);
        } catch (\InvalidArgumentException $e) {
            Inertia::flash('toast', ['type' => 'error', 'message' => $e->getMessage()]);
        }

        return redirect()->back();
    }

    public function cancel(PurchaseOrder $po): RedirectResponse
    {
        try {
            $updatedPo = $this->procurementService->cancelPo($po);
            Inertia::flash('toast', ['type' => 'info', 'message' => "PO {$updatedPo->po_number} dibatalkan."]);
        } catch (\InvalidArgumentException $e) {
            Inertia::flash('toast', ['type' => 'error', 'message' => $e->getMessage()]);
        }

        return redirect()->back();
    }

    protected function validatePo(Request $request): array
    {
        return $request->validate([
            'supplier_id' => 'required|exists:suppliers,id',
            'order_date' => 'nullable|date',
            'expected_date' => 'nullable|date|after_or_equal:order_date',
            'notes' => 'nullable|string|max:1000',
            'items' => 'required|array|min:1',
            'items.*.ingredient_id' => 'required|distinct|exists:ingredients,id',
            'items.*.qty_ordered' => 'required|numeric|min:0.0001',
            'items.*.unit_cost' => 'required|numeric|min:0',
        ]);
    }

    protected function outletId(): int
    {
        $outletId = auth()->user()?->employee?->outlet_id;
        abort_if(! $outletId, 403, 'User tidak terkait dengan outlet manapun.');

        return $outletId;
    }
}
