<?php

namespace Database\Factories;

use App\Models\Outlet;
use App\Models\PurchaseOrder;
use App\Models\Supplier;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<PurchaseOrder>
 */
class PurchaseOrderFactory extends Factory
{
    public function definition(): array
    {
        return [
            'outlet_id' => Outlet::factory(),
            'supplier_id' => Supplier::factory(),
            'po_number' => 'PO-'.now()->format('ymd').str_pad((string) fake()->unique()->numberBetween(1, 9999), 4, '0', STR_PAD_LEFT),
            'status' => 'draft',
            'order_date' => now()->toDateString(),
            'expected_date' => now()->addDays(3)->toDateString(),
            'total_amount' => 0,
            'notes' => null,
        ];
    }

    public function sent(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'sent',
        ]);
    }
}
