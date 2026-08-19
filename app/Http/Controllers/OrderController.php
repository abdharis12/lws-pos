<?php

namespace App\Http\Controllers;

use App\Enums\OrderItemStatus;
use App\Enums\OrderStatus;
use App\Events\OrderStatusUpdated;
use App\Models\Order;
use App\Services\ActivityLogService;
use App\Services\OrderKitchenStatusResolver;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;

class OrderController extends Controller
{
    public function __construct(
        private readonly ActivityLogService $activityLog,
    ) {}

    public function updateStatus(Request $request, Order $order): RedirectResponse
    {
        $validated = $request->validate([
            'status' => 'required|in:processing,ready,completed,cancelled',
        ]);

        $oldStatus = $order->status->value;
        $order->update(['status' => OrderStatus::from($validated['status'])]);
        $order->refresh();

        broadcast(new OrderStatusUpdated($order))->toOthers();

        $this->activityLog->log(
            $request->user(),
            $validated['status'] === 'cancelled' ? 'order.cancelled' : "order.status.{$validated['status']}",
            Order::class,
            $order->id,
            $validated['status'] === 'cancelled'
                ? "Order #{$order->id} dibatalkan (sebelumnya: {$oldStatus})"
                : "Status Order #{$order->id} berubah: {$oldStatus} -> {$validated['status']}",
            [
                'old_status' => $oldStatus,
                'new_status' => $validated['status'],
            ],
        );

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Status pesanan berhasil diperbarui.']);

        return redirect()->back();
    }

    /**
     * Update the kitchen status of specific line items (one KDS station card).
     * The order's overall status is then re-derived from all of its items.
     */
    public function updateItemsStatus(Request $request, Order $order): RedirectResponse
    {
        $validated = $request->validate([
            'item_ids' => 'required|array|min:1',
            'item_ids.*' => 'integer',
            'status' => 'required|in:processing,ready',
        ]);

        $status = OrderItemStatus::from($validated['status']);

        $items = $order->items()->whereIn('id', $validated['item_ids'])->get();

        if ($items->isEmpty()) {
            abort(422, 'Tidak ada item pesanan yang cocok.');
        }

        \Log::info('OrderController::updateItemsStatus', [
            'order_id' => $order->id,
            'item_ids' => $validated['item_ids'],
            'status' => $status->value,
            'items_before' => $order->items()->whereIn('id', $validated['item_ids'])->get(['id', 'status'])->toArray(),
        ]);

        $order->items()->whereIn('id', $items->pluck('id'))->update(['status' => $status]);

        \Log::info('OrderController::updateItemsStatus - after update', [
            'items_after' => $order->items()->whereIn('id', $validated['item_ids'])->get(['id', 'status'])->toArray(),
        ]);

        OrderKitchenStatusResolver::apply($order->load('items'));

        $this->activityLog->log(
            $request->user(),
            "order.item_status.{$status->value}",
            Order::class,
            $order->id,
            "Status item Order #{$order->id} diubah ke {$status->value}",
            [
                'item_ids' => $validated['item_ids'],
                'new_status' => $status->value,
            ],
        );

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Status item berhasil diperbarui.']);

        return redirect()->back();
    }
}
