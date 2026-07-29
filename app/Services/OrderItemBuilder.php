<?php

namespace App\Services;

use App\Models\Menu;
use App\Models\OptionItem;

class OrderItemBuilder
{
    public function build(array $items): array
    {
        return array_map(fn (array $item) => $this->buildSingle($item), $items);
    }

    public function buildSingle(array $item): array
    {
        $menu = Menu::findOrFail($item['menu_id']);
        $options = $this->resolveOptions($item['option_ids'] ?? []);
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

            $orderItem = $order->items()->create($data);

            if (! empty($adjustments)) {
                $orderItem->options()->createMany($adjustments);
            }
        }
    }

    protected function resolveOptions(array $optionIds): array
    {
        if (empty($optionIds)) {
            return [];
        }

        $counts = array_count_values($optionIds);
        $options = OptionItem::whereIn('id', array_keys($counts))
            ->get()
            ->keyBy('id');

        $adjustments = [];
        foreach ($counts as $id => $count) {
            $opt = $options->get($id);
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
