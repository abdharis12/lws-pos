<?php

namespace App\Jobs;

use App\Models\Order;
use App\Services\StockMovementService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class DeductStockOnOrderPaid implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;

    public int $timeout = 60;

    public function __construct(
        public Order $order
    ) {}

    public function handle(StockMovementService $stockService): void
    {
        $outletId = $this->order->tableSession?->table?->outlet_id
            ?? $this->order->posSession?->outlet_id;

        if (! $outletId) {
            Log::warning('DeductStockOnOrderPaid: No outlet found for order', ['order_id' => $this->order->id]);

            return;
        }

        $this->order->load(['items.menu.recipes.ingredient']);

        foreach ($this->order->items as $item) {
            $menu = $item->menu;

            if ($menu->recipes->isEmpty()) {
                continue;
            }

            foreach ($menu->recipes as $recipe) {
                if (! $recipe->ingredient || ! $recipe->ingredient->is_active) {
                    continue;
                }

                $qtyToDeduct = $recipe->quantity_per_portion * $item->qty;

                try {
                    $stockService->recordOut(
                        $outletId,
                        $recipe->ingredient_id,
                        $qtyToDeduct,
                        "Auto deduct: Order #{$this->order->id} - {$menu->name}",
                        'order',
                        $this->order->id,
                    );
                } catch (\InvalidArgumentException $e) {
                    Log::error('Stock deduction failed', [
                        'order_id' => $this->order->id,
                        'ingredient_id' => $recipe->ingredient_id,
                        'required_qty' => $qtyToDeduct,
                        'available_qty' => $recipe->ingredient->current_stock,
                        'error' => $e->getMessage(),
                    ]);
                }
            }
        }
    }

    public function failed(\Throwable $exception): void
    {
        Log::critical('DeductStockOnOrderPaid job failed permanently', [
            'order_id' => $this->order->id,
            'error' => $exception->getMessage(),
        ]);
    }
}
