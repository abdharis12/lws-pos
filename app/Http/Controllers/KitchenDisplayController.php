<?php

namespace App\Http\Controllers;

use App\Enums\OrderStatus;
use App\Models\Menu;
use App\Models\Order;
use Illuminate\Database\Eloquent\Collection;
use Inertia\Inertia;
use Inertia\Response;

class KitchenDisplayController extends Controller
{
    public function index(): Response
    {
        $orders = $this->kitchenOrders();
        $stations = $this->stationNames();
        $activeOrders = $orders->whereIn('status', [OrderStatus::Paid, OrderStatus::Processing]);
        $readyOrders = $orders->where('status', OrderStatus::Ready)->values();

        return Inertia::render('kitchen/Index', [
            'stations' => $this->groupByStation($activeOrders, $stations),
            'unassignedOrders' => $this->unassigned($activeOrders),
            'readyOrders' => $readyOrders,
        ]);
    }

    protected function kitchenOrders(): Collection
    {
        return Order::with(['items.menu', 'items.options.optionItem', 'tableSession.table'])
            ->whereIn('status', [OrderStatus::Paid, OrderStatus::Processing, OrderStatus::Ready])
            ->orderBy('created_at', 'asc')
            ->get();
    }

    protected function stationNames(): array
    {
        return Menu::whereNotNull('station')
            ->distinct()
            ->pluck('station')
            ->sort()
            ->values()
            ->toArray();
    }

    protected function groupByStation(Collection $orders, array $stations): array
    {
        $grouped = [];

        foreach ($stations as $station) {
            $filtered = $this->filterByStation($orders, $station);

            if ($filtered->isNotEmpty()) {
                $grouped[] = ['name' => $station, 'orders' => $filtered];
            }
        }

        return $grouped;
    }

    protected function filterByStation(Collection $orders, string $station): Collection
    {
        return $orders
            ->filter(fn (Order $order) => $order->items->contains(fn ($item) => $item->menu?->station === $station))
            ->map(function (Order $order) use ($station) {
                $this->setStationItems($order, $station);

                return $order;
            })
            ->values();
    }

    protected function setStationItems(Order $order, string $station): void
    {
        $keptItems = $order->items->filter(fn ($item) => $item->menu?->station === $station)->values();
        $keptItems->each(fn ($i) => $i->setRelation('options', $i->options));
        $order->setRelation('items', $keptItems);
    }

    protected function unassigned(Collection $orders): Collection
    {
        return $orders
            ->filter(fn (Order $order) => $order->items->contains(fn ($item) => blank($item->menu?->station)))
            ->map(function (Order $order) {
                $keptItems = $order->items->filter(fn ($item) => blank($item->menu?->station))->values();
                $keptItems->each(fn ($i) => $i->setRelation('options', $i->options));
                $order->setRelation('items', $keptItems);

                return $order;
            })
            ->values();
    }
}
