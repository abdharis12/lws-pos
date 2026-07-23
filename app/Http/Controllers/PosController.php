<?php

namespace App\Http\Controllers;

use App\Models\Meja;
use App\Models\Menu;
use App\Models\MenuCategory;
use App\Models\OptionItem;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Outlet;
use App\Models\TableSession;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PosController extends Controller
{
    public function index(): Response
    {
        $outlet = Outlet::first();
        $categories = MenuCategory::where('outlet_id', $outlet?->id)
            ->where('is_active', true)
            ->with(['menus' => fn ($q) => $q->with('optionGroups.optionItems')])
            ->orderBy('sort_order')
            ->get();

        $tables = Meja::where('outlet_id', $outlet?->id)
            ->orderBy('code')
            ->get();

        $activeSessions = TableSession::whereIn('table_id', $tables->pluck('id'))
            ->where('status', 'active')
            ->with(['table', 'orders' => fn ($q) => $q->with('items')])
            ->get();

        $pendingOrders = Order::where('status', 'pending')
            ->where('order_type', 'dine_in_qr')
            ->with(['tableSession.table', 'items.menu', 'items.options.optionItem'])
            ->orderByDesc('created_at')
            ->get();

        return Inertia::render('pos/Index', [
            'categories' => $categories,
            'tables' => $tables,
            'activeSessions' => $activeSessions,
            'pendingOrders' => $pendingOrders,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'table_id' => 'nullable|exists:tables,id',
            'items' => 'required|array|min:1',
            'items.*.menu_id' => 'required|exists:menus,id',
            'items.*.qty' => 'required|integer|min:1',
            'items.*.notes' => 'nullable|string|max:500',
            'items.*.option_ids' => 'nullable|array',
            'items.*.option_ids.*' => 'exists:option_items,id',
            'payment_method' => 'nullable|in:cash,qris,debit,credit',
        ]);

        $session = null;
        if ($validated['table_id'] ?? false) {
            $table = Meja::find($validated['table_id']);
            $session = $table->sessions()->where('status', 'active')->first();
            if (! $session) {
                $session = $table->sessions()->create([
                    'opened_at' => now(),
                    'status' => 'active',
                ]);
            }
            $table->update(['status' => 'occupied']);
        }

        $subtotal = 0;
        $orderItems = [];

        foreach ($validated['items'] as $item) {
            $menu = Menu::findOrFail($item['menu_id']);
            $itemTotal = $menu->price * $item['qty'];
            $subtotal += $itemTotal;

            $orderItems[] = [
                'menu_id' => $menu->id,
                'qty' => $item['qty'],
                'base_price' => $menu->price,
                'total_price' => $itemTotal,
                'notes' => $item['notes'] ?? null,
            ];
        }

        $total = $subtotal;

        $order = $session?->orders()->create([
            'created_by' => $request->user()->id,
            'order_type' => 'cashier',
            'status' => 'paid',
            'subtotal' => $subtotal,
            'tax' => 0,
            'discount' => 0,
            'total' => $total,
        ]) ?? Order::create([
            'created_by' => $request->user()->id,
            'order_type' => 'cashier',
            'status' => 'paid',
            'subtotal' => $subtotal,
            'tax' => 0,
            'discount' => 0,
            'total' => $total,
        ]);

        foreach ($orderItems as $orderItemData) {
            $order->items()->create($orderItemData);
        }

        return redirect()->route('pos.index')->with('success', 'Pesanan berhasil dibuat.');
    }

    public function confirmPay(Request $request, Order $order): RedirectResponse
    {
        abort_if($order->status !== 'pending', 403);

        $validated = $request->validate([
            'items' => 'required|array|min:1',
            'items.*.id' => 'nullable|exists:order_items,id',
            'items.*.menu_id' => 'required|exists:menus,id',
            'items.*.qty' => 'required|integer|min:1',
            'items.*.notes' => 'nullable|string|max:500',
            'items.*.option_ids' => 'nullable|array',
            'items.*.option_ids.*' => 'exists:option_items,id',
            'payment_method' => 'required|in:cash,qris,debit,credit',
        ]);

        $existingItemIds = $order->items()->pluck('id')->toArray();
        $keptItemIds = [];

        $newSubtotal = 0;

        foreach ($validated['items'] as $itemData) {
            $menu = Menu::findOrFail($itemData['menu_id']);
            $itemTotal = $menu->price * $itemData['qty'];
            $optionTotal = 0;

            if (! empty($itemData['option_ids'])) {
                $adjustments = OptionItem::whereIn('id', $itemData['option_ids'])
                    ->pluck('price_adjustment')
                    ->sum();
                $optionTotal = $adjustments * $itemData['qty'];
            }

            $itemTotal += $optionTotal;
            $newSubtotal += $itemTotal;

            if (! empty($itemData['id']) && in_array($itemData['id'], $existingItemIds)) {
                $keptItemIds[] = $itemData['id'];
                $orderItem = OrderItem::find($itemData['id']);
                $orderItem->update([
                    'qty' => $itemData['qty'],
                    'total_price' => $itemTotal,
                    'notes' => $itemData['notes'] ?? null,
                ]);
            } else {
                $orderItem = $order->items()->create([
                    'menu_id' => $menu->id,
                    'qty' => $itemData['qty'],
                    'base_price' => $menu->price,
                    'total_price' => $itemTotal,
                    'notes' => $itemData['notes'] ?? null,
                ]);
            }
        }

        $itemsToDelete = array_diff($existingItemIds, $keptItemIds);
        if (! empty($itemsToDelete)) {
            OrderItem::whereIn('id', $itemsToDelete)->delete();
        }

        $order->update([
            'status' => 'paid',
            'subtotal' => $newSubtotal,
            'total' => $newSubtotal,
        ]);

        $order->payment()->create([
            'method' => $validated['payment_method'],
            'gross_amount' => $newSubtotal,
            'status' => 'settlement',
        ]);

        if ($order->tableSession?->table) {
            $order->tableSession->table->update(['status' => 'occupied']);
        }

        return redirect()->route('pos.index')->with('success', 'Pesanan berhasil dikonfirmasi dan dibayar.');
    }
}
