<?php

namespace App\Http\Controllers;

use App\Enums\OrderStatus;
use App\Models\Order;
use Illuminate\Database\Eloquent\Collection;
use Inertia\Inertia;
use Inertia\Response;

class KitchenDisplayController extends Controller
{
    private const GROUPS = [
        ['name' => 'Main', 'isDrink' => false],
        ['name' => 'Drink', 'isDrink' => true],
    ];

    public function index(): Response
    {
        $orders = $this->kitchenOrders();
        $activeOrders = $orders->whereIn('status', [OrderStatus::Paid, OrderStatus::Processing]);
        $readyOrders = $orders->where('status', OrderStatus::Ready)->values();

        return Inertia::render('kitchen/Index', [
            'stations' => $this->groupByType($activeOrders),
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

    /**
     * Bucket active orders into the 2 kitchen stations: Main (food) and Drink.
     */
    protected function groupByType(Collection $orders): array
    {
        $grouped = [];

        foreach (self::GROUPS as $group) {
            $filtered = $this->filterByGroup($orders, $group['isDrink']);

            if ($filtered->isNotEmpty()) {
                $grouped[] = ['name' => $group['name'], 'orders' => $filtered];
            }
        }

        return $grouped;
    }

    protected function filterByGroup(Collection $orders, bool $isDrink): Collection
    {
        $target = $isDrink ? 'drink' : 'main';

        return $orders
            ->filter(fn (Order $order) => $order->items->contains(
                fn ($item) => $this->stationOf($item) === $target
            ))
            ->map(function (Order $order) use ($target) {
                $copy = clone $order;

                $copy->setRelation('items', $copy->items->filter(
                    fn ($item) => $this->stationOf($item) === $target
                )->values());

                return $copy;
            })
            ->values();
    }

    protected function unassigned(Collection $orders): Collection
    {
        return $orders
            ->filter(fn (Order $order) => $order->items->contains(
                fn ($item) => $this->stationOf($item) === null
            ))
            ->map(function (Order $order) {
                $copy = clone $order;

                $copy->setRelation('items', $copy->items->filter(
                    fn ($item) => $this->stationOf($item) === null
                )->values());

                return $copy;
            })
            ->values();
    }

    /**
     * Classify an order item's menu station.
     * Returns 'drink' for drinks, 'main' for food, or null if the menu
     * has no station (those go to the unassigned bucket).
     */
    protected function stationOf(mixed $item): ?string
    {
        $station = $item->menu?->station;

        if (blank($station)) {
            return null;
        }

        return strtolower($station) === 'drink' ? 'drink' : 'main';
    }
}
