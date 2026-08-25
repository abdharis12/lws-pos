<?php

namespace App\Services;

use App\Models\Menu;
use App\Models\ProductionOrder;
use App\Models\User;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;

class CentralKitchenService
{
    public function createProductionOrder(int $centralOutletId, array $data, ?User $user = null): ProductionOrder
    {
        return DB::transaction(function () use ($centralOutletId, $data, $user) {
            $menu = Menu::with('recipes.ingredient')->findOrFail($data['menu_id']);

            if ($menu->recipes->isEmpty()) {
                throw new \InvalidArgumentException("Menu {$menu->name} belum memiliki resep.");
            }

            $costPerUnit = $menu->calculateHpp();
            $qtyToProduce = $data['qty_to_produce'];
            $totalCost = $costPerUnit * $qtyToProduce;

            $batchNumber = $this->generateBatchNumber();

            $order = ProductionOrder::create([
                'batch_number' => $batchNumber,
                'central_outlet_id' => $centralOutletId,
                'target_outlet_id' => $data['target_outlet_id'] ?? null,
                'menu_id' => $menu->id,
                'qty_to_produce' => $qtyToProduce,
                'qty_produced' => 0,
                'cost_per_unit' => $costPerUnit,
                'total_cost' => $totalCost,
                'status' => ProductionOrder::STATUS_PLANNED,
                'notes' => $data['notes'] ?? null,
                'produced_by' => $user?->id,
            ]);

            return $order->fresh(['menu', 'centralOutlet', 'targetOutlet']);
        });
    }

    public function updateProductionStatus(ProductionOrder $order, int $qtyProduced, ?User $user = null): ProductionOrder
    {
        return DB::transaction(function () use ($order, $qtyProduced, $user) {
            $actualCostPerUnit = $qtyProduced > 0 ? $order->total_cost / $qtyProduced : 0;

            $order->update([
                'qty_produced' => $qtyProduced,
                'cost_per_unit' => $actualCostPerUnit,
                'status' => $qtyProduced > 0 ? ProductionOrder::STATUS_COMPLETED : ProductionOrder::STATUS_IN_PROGRESS,
                'produced_at' => $qtyProduced > 0 ? now() : $order->produced_at,
                'produced_by' => $user?->id ?? $order->produced_by,
            ]);

            return $order->fresh(['menu', 'centralOutlet']);
        });
    }

    public function distributeProduction(ProductionOrder $order, int $targetOutletId, ?User $user = null): StockTransfer
    {
        if ($order->status !== ProductionOrder::STATUS_COMPLETED) {
            throw new \InvalidArgumentException('Hanya produksi dengan status completed yang bisa didistribusikan.');
        }

        if ($order->qty_produced <= 0) {
            throw new \InvalidArgumentException('Jumlah produksi yang dihasilkan harus lebih dari 0.');
        }

        $stockTransferService = app(StockTransferService::class);

        $transfer = $stockTransferService->createTransfer(
            $order->central_outlet_id,
            $targetOutletId,
            [
                [
                    'ingredient_id' => $order->menu_id,
                    'qty_requested' => $order->qty_produced,
                    'unit_cost' => $order->cost_per_unit,
                    'notes' => "Distribusi dari produksi #{$order->batch_number}",
                ],
            ],
            $user
        );

        $order->update([
            'target_outlet_id' => $targetOutletId,
            'status' => ProductionOrder::STATUS_DISTRIBUTED,
            'distributed_at' => now(),
        ]);

        return $transfer;
    }

    public function getProductionOrders(int $outletId, array $filters = []): LengthAwarePaginator
    {
        $query = ProductionOrder::where('central_outlet_id', $outletId)
            ->with(['menu', 'centralOutlet', 'targetOutlet', 'producedBy'])
            ->latest();

        if (! empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        if (! empty($filters['menu_id'])) {
            $query->where('menu_id', $filters['menu_id']);
        }

        if (! empty($filters['date_from'])) {
            $query->whereDate('created_at', '>=', $filters['date_from']);
        }

        if (! empty($filters['date_to'])) {
            $query->whereDate('created_at', '<=', $filters['date_to']);
        }

        return $query->paginate($filters['per_page'] ?? 15);
    }

    protected function generateBatchNumber(): string
    {
        $prefix = 'PO-'.now()->format('ymd');
        $lastOrder = ProductionOrder::where('batch_number', 'like', $prefix.'%')
            ->latest('id')
            ->first();

        $sequence = $lastOrder ? (int) substr($lastOrder->batch_number, -4) + 1 : 1;

        return $prefix.str_pad($sequence, 4, '0', STR_PAD_LEFT);
    }
}
