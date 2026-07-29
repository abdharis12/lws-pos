<?php

namespace App\Http\Controllers;

use App\Enums\OrderStatus;
use App\Events\OrderStatusUpdated;
use App\Models\Order;
use App\Services\ActivityLogService;
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
}
