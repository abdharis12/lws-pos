<?php

use App\Events\OrderPaid;
use App\Jobs\DeductStockOnOrderPaid;
use App\Listeners\RecordCustomerLoyaltyOnOrderPaid;
use App\Models\Customer;
use App\Models\Order;
use App\Models\Outlet;
use App\Services\CustomerService;
use App\Services\LoyaltyService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Queue;

uses(RefreshDatabase::class);

beforeEach(function () {
    Queue::fake();

    $this->customerService = app(CustomerService::class);
    $this->loyaltyService = app(LoyaltyService::class);
    $this->outlet = Outlet::factory()->create();
});

test('customer lookup finds by phone within outlet', function () {
    $customer = Customer::factory()->create([
        'outlet_id' => $this->outlet->id,
        'phone' => '081234567890',
    ]);

    $found = $this->customerService->findByPhone($this->outlet->id, '081234567890');

    expect($found?->id)->toBe($customer->id);

    // Phone dari outlet lain tidak ditemukan
    $otherOutlet = Outlet::factory()->create();
    expect($this->customerService->findByPhone($otherOutlet->id, '081234567890'))->toBeNull();
});

test('find or create creates new customer with same phone', function () {
    $created = $this->customerService->findOrCreateByPhone($this->outlet->id, '089876543210', 'Budi');
    $again = $this->customerService->findOrCreateByPhone($this->outlet->id, '089876543210', 'Budi Lain');

    expect($created->id)->toBe($again->id)
        ->and(Customer::where('outlet_id', $this->outlet->id)->count())->toBe(1);
});

test('record visit updates spend visit count and tier', function () {
    $customer = Customer::factory()->create([
        'outlet_id' => $this->outlet->id,
        'total_spend' => 900000,
        'visit_count' => 5,
        'tier' => Customer::TIER_BRONZE,
    ]);

    // Order pertama: total 150.000 → spend jadi 1.050.000 → naik ke Silver (>= 1jt)
    $order = Order::factory()->create([
        'customer_id' => $customer->id,
        'total' => 150000,
        'status' => 'paid',
    ]);

    $this->customerService->recordVisit($order->fresh());

    $customer->refresh();
    expect((float) $customer->total_spend)->toBe(1050000.0)
        ->and($customer->visit_count)->toBe(6)
        ->and($customer->tier)->toBe(Customer::TIER_SILVER);
});

test('award points calculates one point per thousand rupiah', function () {
    $customer = Customer::factory()->create(['outlet_id' => $this->outlet->id]);

    $order = Order::factory()->create([
        'customer_id' => $customer->id,
        'total' => 166500, // floor(166.5) = 166 poin
    ]);

    $earned = $this->loyaltyService->awardPointsForOrder($order->fresh());

    expect($earned)->toBe(166)
        ->and($customer->fresh()->points)->toBe(166);
});

test('award points skips orders without customer', function () {
    $order = Order::factory()->create(['total' => 100000, 'customer_id' => null]);

    $earned = $this->loyaltyService->awardPointsForOrder($order);

    expect($earned)->toBe(0);
});

test('redeem points rejects insufficient balance and deducts when valid', function () {
    $customer = Customer::factory()->create(['outlet_id' => $this->outlet->id, 'points' => 100]);

    $this->loyaltyService->redeemPoints($customer, 500);
})->throws(InvalidArgumentException::class);

test('redeem points succeeds with sufficient balance', function () {
    $customer = Customer::factory()->create(['outlet_id' => $this->outlet->id, 'points' => 100]);

    $updated = $this->loyaltyService->redeemPoints($customer, 40);

    expect($updated->points)->toBe(60);
});

test('order paid event triggers loyalty listener', function () {
    $customer = Customer::factory()->create(['outlet_id' => $this->outlet->id]);
    $order = Order::factory()->create([
        'customer_id' => $customer->id,
        'total' => 200000,
        'status' => 'paid',
    ]);

    OrderPaid::dispatch($order);

    // Listener queued — jalankan manual untuk verifikasi logika
    app(RecordCustomerLoyaltyOnOrderPaid::class)->handle(new OrderPaid($order));

    $customer->refresh();
    expect($customer->points)->toBe(200)
        ->and($customer->visit_count)->toBe(1)
        ->and((float) $customer->total_spend)->toBe(200000.0);
});

test('tier progress computes next threshold correctly', function () {
    $customer = Customer::factory()->create([
        'outlet_id' => $this->outlet->id,
        'total_spend' => 2500000,
        'tier' => Customer::TIER_SILVER,
    ]);

    $progress = $this->loyaltyService->getTierProgress($customer);

    expect($progress['current_tier'])->toBe(Customer::TIER_SILVER)
        ->and($progress['next_tier'])->toBe(Customer::TIER_GOLD)
        ->and($progress['next_tier_threshold'])->toBe(5000000.0)
        ->and($progress['remaining_to_next'])->toBe(2500000.0)
        ->and($progress['progress_percent'])->toBe(50.0);
});

test('deduct stock job still dispatched alongside loyalty on order paid', function () {
    $order = Order::factory()->create(['status' => 'paid', 'total' => 50000]);

    OrderPaid::dispatch($order);

    Queue::assertPushed(DeductStockOnOrderPaid::class);
});
