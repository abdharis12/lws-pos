<?php

namespace App\Services;

use App\Models\Menu;
use App\Models\OptionItem;
use Illuminate\Support\Collection;
use Illuminate\Validation\ValidationException;

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

    public function buildForOutlet(array $items, int $outletId): array
    {
        $menuIds = array_unique(array_column($items, 'menu_id'));
        $menus = Menu::query()
            ->whereIn('id', $menuIds)
            ->where('is_available', true)
            ->whereHas('category', fn ($query) => $query
                ->where('outlet_id', $outletId)
                ->where('is_active', true))
            ->with('optionGroups:id,outlet_id')
            ->get()
            ->keyBy('id');

        if ($menus->count() !== count($menuIds)) {
            throw ValidationException::withMessages([
                'items' => 'Satu atau lebih menu sudah tidak tersedia di outlet ini.',
            ]);
        }

        $optionIds = array_unique(array_merge(...array_map(
            fn (array $item) => $item['option_ids'] ?? [],
            $items,
        )));
        $optionsByItem = $optionIds
            ? OptionItem::query()
                ->whereIn('id', $optionIds)
                ->where('is_available', true)
                ->whereHas('optionGroup', fn ($query) => $query
                    ->where('outlet_id', $outletId)
                    ->where('is_active', true))
                ->get()
                ->keyBy('id')
            : collect();

        foreach ($items as $item) {
            $menu = $menus->get($item['menu_id']);
            $allowedGroupIds = $menu->optionGroups->pluck('id');

            foreach ($item['option_ids'] ?? [] as $optionId) {
                $option = $optionsByItem->get($optionId);

                if (! $option || ! $allowedGroupIds->contains($option->option_group_id)) {
                    throw ValidationException::withMessages([
                        'items' => 'Satu atau lebih opsi tidak tersedia untuk menu ini.',
                    ]);
                }
            }
        }

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
