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
        $orders = Order::with(['items.menu', 'items.options.optionItem', 'tableSession.table'])
            ->whereIn('status', [OrderStatus::Paid, OrderStatus::Processing, OrderStatus::Ready])
            ->orderBy('created_at', 'asc')
            ->get();

        $stations = Menu::whereNotNull('station')
            ->distinct()
            ->pluck('station')
            ->sort()
            ->values()
            ->toArray();

        $activeOrders = $orders->whereIn('status', [OrderStatus::Paid, OrderStatus::Processing]);
        $readyOrders = $orders->where('status', OrderStatus::Ready)->values();

        $grouped = [];

        foreach ($stations as $station) {
            $filtered = $activeOrders->filter(function (Order $order) use ($station): bool {
                return $order->items->contains(fn ($item) => $item->menu?->station === $station);
            })->map(function (Order $order) use ($station) {
                $keptItems = $order->items->filter(
                    fn ($item) => $item->menu?->station === $station
                )->values();
                $keptItems->each(fn ($i) => $i->setRelation('options', $i->options));

                $order->setRelation('items', $keptItems);

                return $order;
            })->values();

            if ($filtered->isNotEmpty()) {
                $grouped[] = [
                    'name' => $station,
                    'orders' => $filtered,
                ];
            }
        }

        $unassigned = $activeOrders->filter(function (Order $order): bool {
            return $order->items->contains(fn ($item) => blank($item->menu?->station));
        })->map(function (Order $order) {
            $keptItems = $order->items->filter(
                fn ($item) => blank($item->menu?->station)
            )->values();
            $keptItems->each(fn ($i) => $i->setRelation('options', $i->options));

            $order->setRelation('items', $keptItems);

            return $order;
        })->values();

        return Inertia::render('kitchen/Index', [
            'stations' => $grouped,
            'unassignedOrders' => $unassigned,
            'readyOrders' => $readyOrders,
        ]);
    }
}
