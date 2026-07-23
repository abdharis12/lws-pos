<?php

namespace Database\Factories;

use App\Models\Menu;
use App\Models\Order;
use App\Models\OrderItem;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<OrderItem>
 */
class OrderItemFactory extends Factory
{
    public function definition(): array
    {
        $qty = fake()->numberBetween(1, 5);
        $basePrice = fake()->randomFloat(2, 5000, 50000);

        return [
            'order_id' => Order::factory(),
            'menu_id' => Menu::factory(),
            'qty' => $qty,
            'base_price' => $basePrice,
            'total_price' => $qty * $basePrice,
            'notes' => fake()->optional()->sentence(),
        ];
    }
}
