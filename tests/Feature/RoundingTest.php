<?php

use App\Enums\OrderStatus;
use App\Models\Meja;
use App\Models\Menu;
use App\Models\MenuCategory;
use App\Models\Order;
use App\Models\Outlet;
use App\Support\Money;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;

beforeEach(function () {
    $this->outlet = Outlet::factory()->create();
    $this->category = MenuCategory::factory()->create(['outlet_id' => $this->outlet->id, 'is_active' => true]);
    $this->menu = Menu::factory()->create([
        'category_id' => $this->category->id,
        'price' => 24400,
        'is_available' => true,
    ]);
    $this->table = Meja::factory()->create([
        'outlet_id' => $this->outlet->id,
        'table_token' => Str::random(40),
        'status' => 'available',
    ]);
});

test('self-order cash total is rounded up to nearest 500 and rounding_amount is stored', function () {
    $payload = [
        'customer_name' => 'Pelanggan A',
        'items' => [
            ['menu_id' => $this->menu->id, 'qty' => 1, 'notes' => null, 'option_ids' => []],
        ],
    ];

    $response = $this->postJson(route('self-order.pay', $this->table->table_token), $payload + [
        'payment_method' => 'cash',
        'payment_type' => 'cash',
    ]);

    $response->assertOk();
    $json = $response->json();

    $tax = round(24400 * 0.10);
    $rawTotal = 24400.0 + $tax;
    $expectedRounding = Money::roundingAmount($rawTotal);
    $expectedTotal = Money::ceilTo500($rawTotal);

    expect($expectedRounding)->toBeGreaterThan(0.0);

    expect((float) $json['total'])->toEqual($expectedTotal)
        ->and((float) $json['rounding_amount'])->toEqual($expectedRounding)
        ->and((float) $json['total'])->toBeGreaterThanOrEqual($rawTotal);

    $order = Order::where('id', $json['order_id'])->first();
    expect($order)
        ->not->toBeNull()
        ->and((float) $order->total)->toEqual($expectedTotal)
        ->and((float) $order->rounding_amount)->toEqual($expectedRounding)
        ->and($order->status)->toBe(OrderStatus::Pending);
});

test('self-order cash total on exact multiple of 500 has zero rounding', function () {
    $this->menu->update(['price' => 24500]);

    $payload = [
        'customer_name' => 'Pelanggan B',
        'items' => [
            ['menu_id' => $this->menu->id, 'qty' => 1, 'notes' => null, 'option_ids' => []],
        ],
    ];

    $response = $this->postJson(route('self-order.pay', $this->table->table_token), $payload + [
        'payment_method' => 'cash',
        'payment_type' => 'cash',
    ]);

    $response->assertOk();
    $json = $response->json();

    $tax = round(24500 * 0.10);
    $rawTotal = 24500 + $tax;
    $expected = Money::ceilTo500($rawTotal);

    expect((float) $json['total'])->toEqual($expected)
        ->and(((int) $json['total'] % 500))->toBe(0);
});

test('self-order online does not apply rounding, only Midtrans charge on rawBeforeCharge', function () {
    Http::fake([
        'sandbox.midtrans.com/*' => Http::response([
            'transaction_id' => 'txn-test-1',
            'qr_code' => 'data:image/png;base64,fake',
            'transaction_status' => 'pending',
            'payment_type' => 'qris',
        ], 200),
    ]);

    $this->menu->update(['price' => 22000]);

    $payload = [
        'customer_name' => 'Pelanggan C',
        'items' => [
            ['menu_id' => $this->menu->id, 'qty' => 1, 'notes' => null, 'option_ids' => []],
        ],
    ];

    $response = $this->postJson(route('self-order.pay', $this->table->table_token), $payload + [
        'payment_method' => 'online',
        'payment_type' => 'qris',
    ]);

    $response->assertOk();
    $json = $response->json();

    $subtotal = 22000.0;
    $tax = round($subtotal * 0.10);
    $serviceCharge = round($subtotal * 0.05);
    $rawBeforeCharge = $subtotal + $tax + $serviceCharge;
    $expectedMidtransCharge = round($rawBeforeCharge * 2.5 / 100 / 100) * 100;
    $expectedTotal = $rawBeforeCharge + $expectedMidtransCharge;

    expect((float) $json['total'])->toEqual($expectedTotal)
        ->and((float) $json['rounding_amount'])->toEqual(0.0)
        ->and((float) $json['midtrans_charge'])->toEqual($expectedMidtransCharge);

    $order = Order::where('id', $json['order_id'])->first();
    expect($order)
        ->not->toBeNull()
        ->and((float) $order->total)->toEqual($expectedTotal)
        ->and((float) $order->midtrans_charge)->toEqual($expectedMidtransCharge)
        ->and((float) $order->rounding_amount)->toEqual(0.0);
});
