<?php

use App\Models\Customer;
use App\Models\Order;
use App\Models\Outlet;
use App\Models\Promo;
use App\Models\PromoUsage;
use App\Services\PromoService;

beforeEach(function () {
    $this->service = app(PromoService::class);
    $this->outlet = Outlet::factory()->create();
});

test('promo validation rejects unknown code', function () {
    $this->service->validate($this->outlet->id, 'NOTEXIST', 100000);
})->throws(InvalidArgumentException::class, 'Kode promo tidak ditemukan.');

test('promo validation rejects expired promo', function () {
    $promo = Promo::factory()->expired()->create(['outlet_id' => $this->outlet->id]);

    $this->service->validate($this->outlet->id, $promo->code, 100000);
})->throws(InvalidArgumentException::class);

test('promo validation rejects inactive promo', function () {
    $promo = Promo::factory()->create(['outlet_id' => $this->outlet->id, 'is_active' => false]);

    $this->service->validate($this->outlet->id, $promo->code, 100000);
})->throws(InvalidArgumentException::class);

test('promo validation enforces min spend', function () {
    $promo = Promo::factory()->create([
        'outlet_id' => $this->outlet->id,
        'type' => 'percent',
        'value' => 10,
        'min_spend' => 50000,
    ]);

    [$returned, $discount] = $this->service->validate($this->outlet->id, $promo->code, 60000);
    expect($discount)->toBe(6000.0);

    $this->service->validate($this->outlet->id, $promo->code, 30000);
})->throws(InvalidArgumentException::class, 'Minimal belanja');

test('percent promo discount respects max discount cap', function () {
    $promo = Promo::factory()->create([
        'outlet_id' => $this->outlet->id,
        'type' => 'percent',
        'value' => 50,
        'max_discount' => 20000,
        'min_spend' => 0,
    ]);

    // 50% dari 100.000 = 50.000 → dibatasi max 20.000
    [, $discount] = $this->service->validate($this->outlet->id, $promo->code, 100000);
    expect($discount)->toBe(20000.0);
});

test('promo channel restriction blocks mismatched channel', function () {
    $promo = Promo::factory()->create([
        'outlet_id' => $this->outlet->id,
        'channel' => Promo::CHANNEL_POS,
    ]);

    // Valid di POS
    [, $discount] = $this->service->validate($this->outlet->id, $promo->code, 100000, null, 'pos');
    expect($discount)->toBeGreaterThan(0);

    // Ditolak di self_order
    $this->service->validate($this->outlet->id, $promo->code, 100000, null, 'self_order');
})->throws(InvalidArgumentException::class);

test('usage limit per customer is enforced', function () {
    $customer = Customer::factory()->create(['outlet_id' => $this->outlet->id]);
    $promo = Promo::factory()->create([
        'outlet_id' => $this->outlet->id,
        'usage_limit_per_customer' => 1,
    ]);

    PromoUsage::create([
        'promo_id' => $promo->id,
        'customer_id' => $customer->id,
        'order_id' => Order::factory()->create()->id,
        'discount_amount' => 5000,
        'used_at' => now(),
    ]);

    $this->service->validate($this->outlet->id, $promo->code, 100000, $customer, 'pos');
})->throws(InvalidArgumentException::class, 'maksimal');

test('applyToOrder records usage and increments count', function () {
    $promo = Promo::factory()->nominal(25000)->create([
        'outlet_id' => $this->outlet->id,
        'min_spend' => 0,
    ]);

    $order = Order::factory()->create([
        'subtotal' => 150000,
        'tax' => 16500,
        'discount' => 0,
        'total' => 166500,
    ]);

    $updated = $this->service->applyToOrder($promo->fresh(), $order);

    expect((float) $updated->promo_discount)->toBe(25000.0)
        ->and($promo->fresh()->usage_count)->toBe(1)
        ->and(PromoUsage::where('promo_id', $promo->id)->where('order_id', $order->id)->count())->toBe(1)
        // total = subtotal + tax + service - promo_discount - discount
        ->and((float) $updated->total)->toBe(141500.0);
});

test('applyToOrder prevents exceeding global usage limit under concurrency', function () {
    $promo = Promo::factory()->nominal(10000)->create([
        'outlet_id' => $this->outlet->id,
        'min_spend' => 0,
        'usage_limit' => 2,
    ]);

    foreach ([1, 2] as $i) {
        $order = Order::factory()->create(['subtotal' => 100000, 'tax' => 11000, 'total' => 111000]);
        $this->service->applyToOrder($promo->fresh(), $order);
    }

    expect($promo->fresh()->usage_count)->toBe(2)
        ->and($promo->fresh()->isValid())->toBeFalse();
});

test('active promos filter by channel includes all-channel promos', function () {
    Promo::factory()->create([
        'outlet_id' => $this->outlet->id,
        'channel' => Promo::CHANNEL_ALL,
    ]);
    Promo::factory()->create([
        'outlet_id' => $this->outlet->id,
        'channel' => Promo::CHANNEL_SELF_ORDER,
    ]);
    Promo::factory()->expired()->create(['outlet_id' => $this->outlet->id]);

    $posPromos = $this->service->getActivePromos($this->outlet->id, 'pos');
    $selfOrderPromos = $this->service->getActivePromos($this->outlet->id, 'self_order');

    expect($posPromos)->toHaveCount(1)
        ->and($selfOrderPromos)->toHaveCount(2);
});
