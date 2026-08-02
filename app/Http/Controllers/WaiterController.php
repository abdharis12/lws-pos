<?php

namespace App\Http\Controllers;

use App\Enums\OrderStatus;
use App\Events\OrderStatusUpdated;
use App\Models\Order;
use App\Models\User;
use App\Services\ActivityLogService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class WaiterController extends Controller
{
    public function __construct(
        private readonly ActivityLogService $activityLog,
    ) {}

    public function index(): Response
    {
        Gate::authorize('accessWaiterDashboard');

        $user = auth()->user();
        $outletId = $user?->employee?->outlet_id;

        $readyOrders = Order::with(['tableSession.table', 'items.menu', 'items.options.optionItem', 'servedBy'])
            ->where('status', OrderStatus::Ready)
            ->when($outletId, fn ($query) => $query->whereHas(
                'tableSession.table',
                fn ($q) => $q->where('outlet_id', $outletId)
            ))
            ->orderBy('updated_at', 'asc')
            ->get();

        $leaderboard = Order::where('status', OrderStatus::Completed)
            ->whereNotNull('served_by')
            ->where('served_at', '>=', now()->startOfDay())
            ->when($outletId, fn ($query) => $query->whereHas(
                'tableSession.table',
                fn ($q) => $q->where('outlet_id', $outletId)
            ))
            ->with('servedBy')
            ->get()
            ->groupBy('served_by')
            ->map(fn ($orders) => [
                'waiter' => $orders->first()->servedBy?->name ?? 'Tidak diketahui',
                'points' => $orders->count(),
            ])
            ->sortByDesc('points')
            ->values();

        return Inertia::render('waiter/ReadyOrders', [
            'readyOrders' => $readyOrders,
            'leaderboard' => $leaderboard,
        ]);
    }

    public function serve(Request $request, Order $order): RedirectResponse
    {
        Gate::authorize('serve', $order);

        if ($order->status !== OrderStatus::Ready) {
            abort(422, 'Pesanan tidak dalam status siap saji.');
        }

        /** @var User $user */
        $user = $request->user();

        $order->update([
            'status' => OrderStatus::Completed,
            'served_by' => $user->id,
            'served_at' => now(),
        ]);

        broadcast(new OrderStatusUpdated($order))->toOthers();

        $this->activityLog->log(
            $user,
            'order.served',
            Order::class,
            $order->id,
            "Order #{$order->id} diantar oleh {$user->name}",
            [
                'table_code' => $order->tableSession?->table?->code,
                'served_by' => $user->id,
            ],
        );

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Pesanan telah diantar.']);

        return redirect()->back();
    }
}
