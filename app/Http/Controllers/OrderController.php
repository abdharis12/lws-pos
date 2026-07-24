<?php

namespace App\Http\Controllers;

use App\Events\OrderStatusUpdated;
use App\Models\ActivityLog;
use App\Models\Order;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class OrderController extends Controller
{
    public function updateStatus(Request $request, Order $order): RedirectResponse
    {
        $validated = $request->validate([
            'status' => 'required|in:processing,ready,completed,cancelled',
        ]);

        $oldStatus = $order->status;
        $order->update(['status' => $validated['status']]);

        broadcast(new OrderStatusUpdated($order))->toOthers();

        ActivityLog::create([
            'user_id' => $request->user()->id,
            'action' => $validated['status'] === 'cancelled' ? 'order.cancelled' : "order.status.{$validated['status']}",
            'subject_type' => Order::class,
            'subject_id' => $order->id,
            'description' => $validated['status'] === 'cancelled'
                ? "Order #{$order->id} dibatalkan (sebelumnya: {$oldStatus})"
                : "Status Order #{$order->id} berubah: {$oldStatus} → {$validated['status']}",
            'metadata' => [
                'old_status' => $oldStatus,
                'new_status' => $validated['status'],
            ],
        ]);

        return redirect()->back()->with('success', 'Status pesanan berhasil diperbarui.');
    }
}
