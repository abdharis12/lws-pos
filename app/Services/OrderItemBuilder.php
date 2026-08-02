<?php

namespace App\Services;

use App\Models\Menu;
use App\Models\OptionItem;
use Illuminate\Support\Collection;

class OrderItemBuilder
{
    public function build(array $items): array
    {
        $menuIds = array_unique(array_column($items, 'menu_id'));
        $menus = Menu::whereIn('id', $menuIds)->get()->keyBy('id');

        $allOptionIds = array_merge(...array_map(
            fn (array $item) => $item['option_ids'] ?? [],
            $items,
        ));
        $optionIds = array_unique($allOptionIds);
        $optionsByItem = $optionIds
            ? OptionItem::whereIn('id', $optionIds)->get()->keyBy('id')
            : collect();

        return array_map(
            fn (array $item) => $this->buildSingle($item, $menus, $optionsByItem),
            $items,
        );
    }

    public function buildSingle(array $item, ?Collection $menus = null, ?Collection $optionsByItem = null): array
    {
        $menus ??= Menu::whereKey($item['menu_id'])->get()->keyBy('id');
        $optionsByItem ??= OptionItem::whereIn('id', $item['option_ids'] ?? [])->get()->keyBy('id');

        $menu = $menus->get($item['menu_id']);
        abort_unless($menu, 404, 'Menu tidak ditemukan.');

        $options = $this->resolveOptions($item['option_ids'] ?? [], $optionsByItem);
        $optionTotal = array_sum(array_map(
            fn (array $o): float => (float) $o['price_adjustment'] * (int) $o['quantity'],
            $options,
        ));

        return [
            'menu_id' => $menu->id,
            'qty' => (int) $item['qty'],
            'base_price' => (float) $menu->price,
            'total_price' => ((float) $menu->price + $optionTotal) * (int) $item['qty'],
            'notes' => $item['notes'] ?? null,
            'option_adjustments' => $options,
        ];
    }

    public function attach(mixed $order, array $orderItems): void
    {
        foreach ($orderItems as $data) {
            $adjustments = $data['option_adjustments'];
            unset($data['option_adjustments']);

            $this->attachItem($order, $data, $adjustments);
        }
    }

    protected function attachItem(mixed $order, array $data, array $adjustments): void
    {
        $orderItem = $order->items()->create($data);

        if (! empty($adjustments)) {
            $orderItem->options()->createMany($adjustments);
        }
    }

    protected function resolveOptions(array $optionIds, Collection $optionsByItem): array
    {
        if (empty($optionIds)) {
            return [];
        }

        $counts = array_count_values($optionIds);

        $adjustments = [];
        foreach ($counts as $id => $count) {
            $opt = $optionsByItem->get($id);
            if (! $opt) {
                continue;
            }
            $adjustments[] = [
                'option_item_id' => $opt->id,
                'price_adjustment' => (float) $opt->price_adjustment,
                'quantity' => $count,
            ];
        }

        return $adjustments;
    }
}
