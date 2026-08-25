<?php

namespace App\Http\Controllers;

use App\Models\ProductionOrder;
use App\Services\CentralKitchenService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ProductionOrderController extends Controller
{
    public function __construct(
        private readonly CentralKitchenService $centralKitchenService,
    ) {}

    public function index(Request $request): Response
    {
        $outletId = $this->outletId();

        $orders = $this->centralKitchenService->getProductionOrders($outletId, [
            'status' => $request->status,
            'date_from' => $request->date_from,
            'date_to' => $request->date_to,
            'per_page' => 15,
        ]);

        return Inertia::render('admin/kitchen/ProductionOrders', [
            'orders' => $orders,
            'filters' => $request->only(['status', 'date_from', 'date_to']),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'production_date' => 'required|date',
            'notes' => 'nullable|string|max:1000',
            'items' => 'required|array|min:1',
            'items.*.menu_recipe_id' => 'required|exists:menu_recipes,id',
            'items.*.qty_planned' => 'required|numeric|min:0.0001',
        ]);

        try {
            $order = $this->centralKitchenService->createProductionOrder(
                $this->outletId(),
                $validated,
                $request->user(),
            );

            Inertia::flash('toast', ['type' => 'success', 'message' => "Produksi {$order->production_number} berhasil dibuat."]);
        } catch (\InvalidArgumentException $e) {
            Inertia::flash('toast', ['type' => 'error', 'message' => $e->getMessage()]);
        }

        return redirect()->back();
    }

    public function show(ProductionOrder $order): Response
    {
        $detail = $this->centralKitchenService->getProductionDetail($order->id);

        return Inertia::render('admin/kitchen/ProductionDetail', [
            'order' => $detail,
        ]);
    }

    public function updateStatus(Request $request, ProductionOrder $order): RedirectResponse
    {
        $validated = $request->validate([
            'qty_produced' => 'required|numeric|min:0',
        ]);

        try {
            $this->centralKitchenService->updateProducedQty(
                $order,
                $validated['qty_produced'],
                $request->user(),
            );

            Inertia::flash('toast', ['type' => 'success', 'message' => 'Jumlah produksi berhasil diperbarui.']);
        } catch (\InvalidArgumentException $e) {
            Inertia::flash('toast', ['type' => 'error', 'message' => $e->getMessage()]);
        }

        return redirect()->back();
    }

    public function distribute(Request $request, ProductionOrder $order): RedirectResponse
    {
        $validated = $request->validate([
            'target_outlet_id' => 'required|exists:outlets,id',
            'items' => 'required|array|min:1',
            'items.*.menu_recipe_id' => 'required|exists:menu_recipes,id',
            'items.*.qty' => 'required|numeric|min:0.0001',
        ]);

        try {
            $this->centralKitchenService->distribute(
                $order,
                $validated['target_outlet_id'],
                $validated['items'],
                $request->user(),
            );

            Inertia::flash('toast', ['type' => 'success', 'message' => 'Distribusi ke outlet berhasil dilakukan.']);
        } catch (\InvalidArgumentException $e) {
            Inertia::flash('toast', ['type' => 'error', 'message' => $e->getMessage()]);
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
