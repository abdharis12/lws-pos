<?php

namespace Database\Factories;

use App\Models\Order;
use App\Models\TableSession;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Order>
 */
class OrderFactory extends Factory
{
    public function definition(): array
    {
        $subtotal = fake()->randomFloat(2, 15000, 200000);
        $tax = round($subtotal * 0.11, 2);
        $total = $subtotal + $tax;

        return [
            'table_session_id' => TableSession::factory(),
            'created_by' => User::factory(),
            'order_type' => fake()->randomElement(['dine_in', 'takeaway', 'delivery']),
            'status' => fake()->randomElement(['pending', 'processed', 'completed', 'cancelled']),
            'subtotal' => $subtotal,
            'tax' => $tax,
            'discount' => 0,
            'total' => $total,
            'notes' => fake()->optional()->sentence(),
        ];
    }
}
