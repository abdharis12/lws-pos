<?php

namespace Database\Factories;

use App\Models\Order;
use App\Models\Payment;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Payment>
 */
class PaymentFactory extends Factory
{
    public function definition(): array
    {
        return [
            'order_id' => Order::factory(),
            'method' => fake()->randomElement(['cash', 'qris', 'midtrans', 'debit']),
            'midtrans_transaction_id' => fake()->optional()->uuid(),
            'gross_amount' => fake()->randomFloat(2, 15000, 300000),
            'status' => fake()->randomElement(['pending', 'success', 'failed', 'refund']),
            'raw_payload' => [],
        ];
    }
}
