<?php

namespace App\Http\Controllers;

use App\Models\Meja;
use App\Models\Menu;
use App\Models\MenuCategory;
use App\Models\OptionItem;
use App\Models\Outlet;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class SelfOrderController extends Controller
{
    public function show(string $tableToken): Response
    {
        $table = Meja::where('table_token', $tableToken)->firstOrFail();

        $outlet = Outlet::findOrFail($table->outlet_id);

        $categories = MenuCategory::where('outlet_id', $outlet->id)
            ->where('is_active', true)
            ->with(['menus' => function ($query) {
                $query->where('is_available', true)->with('optionGroups.optionItems');
            }])
            ->orderBy('sort_order')
            ->get();

        return Inertia::render('self-order/Menu', [
            'table' => $table,
            'tableToken' => $tableToken,
            'categories' => $categories,
            'outlet' => $outlet,
        ]);
    }

    public function store(Request $request, string $tableToken): RedirectResponse
    {
        $table = Meja::where('table_token', $tableToken)->firstOrFail();

        $validated = $request->validate([
            'customer_name' => 'required|string|max:100',
            'items' => 'required|array|min:1',
            'items.*.menu_id' => 'required|exists:menus,id',
            'items.*.qty' => 'required|integer|min:1',
            'items.*.notes' => 'nullable|string|max:500',
            'items.*.option_ids' => 'nullable|array',
            'items.*.option_ids.*' => 'exists:option_items,id',
        ]);

        $session = $table->sessions()->where('status', 'active')->first();
        if (! $session) {
            $session = $table->sessions()->create([
                'opened_at' => now(),
                'status' => 'active',
            ]);
        }

        $subtotal = 0;
        $orderItems = [];

        foreach ($validated['items'] as $item) {
            $menu = Menu::findOrFail($item['menu_id']);
            $itemTotal = $menu->price * $item['qty'];
            $optionTotal = 0;

            if (! empty($item['option_ids'])) {
                $adjustments = OptionItem::whereIn('id', $item['option_ids'])
                    ->pluck('price_adjustment')
                    ->sum();
                $optionTotal = $adjustments * $item['qty'];
            }

            $itemTotal += $optionTotal;
            $subtotal += $itemTotal;

            $orderItems[] = [
                'menu_id' => $menu->id,
                'qty' => $item['qty'],
                'base_price' => $menu->price,
                'total_price' => $itemTotal,
                'notes' => $item['notes'] ?? null,
                'option_ids' => $item['option_ids'] ?? [],
            ];
        }

        $total = $subtotal;

        $order = $session->orders()->create([
            'order_type' => 'dine_in_qr',
            'status' => 'pending',
            'customer_name' => $validated['customer_name'],
            'subtotal' => $subtotal,
            'tax' => 0,
            'discount' => 0,
            'total' => $total,
        ]);

        foreach ($orderItems as $orderItemData) {
            $optionIds = $orderItemData['option_ids'];
            unset($orderItemData['option_ids']);

            $orderItem = $order->items()->create($orderItemData);

            if (! empty($optionIds)) {
                $items = OptionItem::whereIn('id', $optionIds)->get();
                foreach ($items as $optionItem) {
                    $orderItem->options()->create([
                        'option_item_id' => $optionItem->id,
                        'price_adjustment' => $optionItem->price_adjustment,
                    ]);
                }
            }
        }

        return redirect()->route('self-order.show', $tableToken);
    }
}
