<?php

namespace Database\Factories;

use App\Models\Menu;
use App\Models\MenuCategory;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Menu>
 */
class MenuFactory extends Factory
{
    private static array $menus = [
        'Bubur Ayam Spesial', 'Bubur Ayam Cakwe', 'Bubur Ayam Telur',
        'Bubur Ketan Hitam', 'Bubur Sumsum', 'Nasi Goreng', 'Mie Goreng',
        'Es Teh Manis', 'Es Jeruk', 'Teh Hangat', 'Kopi Susu', 'Air Mineral',
    ];

    public function definition(): array
    {
        return [
            'category_id' => MenuCategory::factory(),
            'name' => fake()->unique()->randomElement(self::$menus),
            'description' => fake()->sentence(),
            'price' => fake()->randomFloat(2, 3000, 50000),
            'photo_path' => null,
            'is_available' => true,
        ];
    }
}
