<?php

namespace Database\Factories;

use App\Models\Outlet;
use App\Models\Promo;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Promo>
 */
class PromoFactory extends Factory
{
    public function definition(): array
    {
        return [
            'outlet_id' => Outlet::factory(),
            'code' => strtoupper(fake()->unique()->lexify('PROMO????')),
            'name' => fake()->sentence(3),
            'type' => Promo::TYPE_PERCENT,
            'value' => 10,
            'min_spend' => 50000,
            'max_discount' => 100000,
            'valid_from' => now()->subDay()->toDateString(),
            'valid_to' => now()->addMonth()->toDateString(),
            'usage_limit' => null,
            'usage_count' => 0,
            'usage_limit_per_customer' => 1,
            'channel' => Promo::CHANNEL_ALL,
            'is_active' => true,
        ];
    }

    public function nominal(float $value = 25000): static
    {
        return $this->state(fn (array $attributes) => [
            'type' => Promo::TYPE_NOMINAL,
            'value' => $value,
        ]);
    }

    public function expired(): static
    {
        return $this->state(fn (array $attributes) => [
            'valid_from' => now()->subDays(30)->toDateString(),
            'valid_to' => now()->subDay()->toDateString(),
        ]);
    }
}
