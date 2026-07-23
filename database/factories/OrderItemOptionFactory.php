<?php

namespace Database\Factories;

use App\Models\OptionItem;
use App\Models\OrderItem;
use App\Models\OrderItemOption;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<OrderItemOption>
 */
class OrderItemOptionFactory extends Factory
{
    public function definition(): array
    {
        return [
            'order_item_id' => OrderItem::factory(),
            'option_item_id' => OptionItem::factory(),
            'price_adjustment' => fake()->randomFloat(2, 0, 10000),
        ];
    }
}
