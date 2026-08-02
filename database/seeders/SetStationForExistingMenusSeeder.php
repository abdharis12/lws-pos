<?php

namespace Database\Seeders;

use App\Models\Menu;
use Illuminate\Database\Seeder;

class SetStationForExistingMenusSeeder extends Seeder
{
    /**
     * Mapping kategori -> station dapur.
     * Dipakai sebagai fallback saat menu.station masih NULL.
     */
    protected array $categoryStationMap = [
        'Bubur' => 'Main',
        'Makanan' => 'Main',
        'Snack' => 'Grill',
        'Gorengan' => 'Grill',
        'Minuman' => 'Drink',
        'Dessert' => 'Dessert',
        'Penutup' => 'Dessert',
    ];

    public function run(): void
    {
        $updated = 0;
        $skipped = 0;

        Menu::query()
            ->whereNull('station')
            ->with('category')
            ->chunkById(100, function ($menus) use (&$updated, &$skipped) {
                foreach ($menus as $menu) {
                    $station = $this->categoryStationMap[$menu->category?->name] ?? null;

                    if ($station === null) {
                        $skipped++;

                        continue;
                    }

                    $menu->update(['station' => $station]);
                    $updated++;
                }
            });

        $this->command?->info("SetStationForExistingMenusSeeder: updated={$updated} skipped={$skipped}");
    }
}
