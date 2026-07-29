<?php

namespace App\Http\Controllers;

use App\Enums\OrderStatus;
use App\Models\Menu;
use App\Models\Order;
use Inertia\Inertia;
use Inertia\Response;

class KitchenDisplayController extends Controller
{
    public function index(): Response
    {
        $orders = Order::with(['items.menu', 'tableSession.table'])
            ->whereIn('status', [OrderStatus::Paid, OrderStatus::Processing])
            ->orderBy('created_at', 'asc')
            ->get();

        $stations = Menu::whereNotNull('station')
            ->distinct()
            ->pluck('station')
            ->sort()
            ->values()
            ->toArray();

        $grouped = [];

        foreach ($stations as $station) {
            $filtered = $orders->filter(function (Order $order) use ($station): bool {
                return $order->items->contains(fn ($item) => $item->menu?->station === $station);
            })->map(function (Order $order) use ($station) {
                $order->setRelation('items', $order->items->filter(
                    fn ($item) => $item->menu?->station === $station
                )->values());

                return $order;
            })->values();

            if ($filtered->isNotEmpty()) {
                $grouped[] = [
                    'name' => $station,
                    'orders' => $filtered,
                ];
            }
        }

        $unassigned = $orders->filter(function (Order $order): bool {
            return $order->items->contains(fn ($item) => blank($item->menu?->station));
        })->map(function (Order $order) {
            $order->setRelation('items', $order->items->filter(
                fn ($item) => blank($item->menu?->station)
            )->values());

            return $order;
        })->values();

        return Inertia::render('kitchen/Index', [
            'stations' => $grouped,
            'unassignedOrders' => $unassigned,
        ]);
    }
}
