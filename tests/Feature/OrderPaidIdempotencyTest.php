<?php

use App\Enums\OrderStatus;
use App\Events\OrderPaid;
use App\Http\Controllers\SelfOrderController;
use App\Models\Meja;
use App\Models\Menu;
use App\Models\MenuCategory;
use App\Models\Order;
use App\Models\Outlet;
use App\Models\TableSession;
use App\Services\MidtransService;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;

beforeEach(function () {
    $this->outlet = Outlet::factory()->create();
    $category = MenuCategory::factory()->create(['outlet_id' => $this->outlet->id]);
    $menu = Menu::factory()->create(['category_id' => $category->id]);

    $this->table = Meja::factory()->create(['outlet_id' => $this->outlet->id]);
    $this->session = TableSession::factory()->create([
        'table_id' => $this->table->id,
        'status' => 'active',
    ]);

    $this->order = Order::factory()->create([
        'table_session_id' => $this->session->id,
        'order_type' => 'dine_in_qr',
        'status' => OrderStatus::PendingPayment,
        'subtotal' => 25000,
        'tax' => 0,
        'discount' => 0,
        'total' => 25000,
    ]);

    $this->order->items()->create([
        'menu_id' => $menu->id,
        'qty' => 1,
        'base_price' => 25000,
        'total_price' => 25000,
    ]);

    $this->order->payment()->create([
        'method' => 'qris',
        'gross_amount' => 25000,
        'status' => 'pending',
    ]);
});

function orderPaidPayload(Order $order, string $status = 'settlement'): array
{
    $serverKey = config('midtrans.server_key');
    $grossAmount = (string) ((int) $order->total);
    $signature = hash('sha512', (string) $order->id.'200'.$grossAmount.$serverKey);

    return [
        'order_id' => (string) $order->id,
        'status_code' => '200',
        'gross_amount' => $grossAmount,
        'signature_key' => $signature,
        'transaction_status' => $status,
        'transaction_id' => (string) Str::uuid(),
        'payment_type' => 'qris',
        'transaction_time' => now()->toIso8601String(),
        'fraud_status' => 'accept',
    ];
}

// ─── Self-Order paymentStatus ────────────────────────────────

test('paymentStatus broadcasts OrderPaid only on first settlement', function () {
    $midtrans = Mockery::mock(MidtransService::class);
    $midtrans->shouldReceive('getTransactionStatus')
        ->with((string) $this->order->id)
        ->andReturn(['transaction_status' => 'settlement']);

    $controller = app(SelfOrderController::class);

    Event::fake([OrderPaid::class]);
    $controller->paymentStatus($this->order, $midtrans);

    expect($this->order->fresh()->status)->toBe(OrderStatus::Paid);
    Event::assertDispatched(OrderPaid::class);

    Event::fake([OrderPaid::class]);
    $controller->paymentStatus($this->order->fresh(), $midtrans);

    Event::assertNotDispatched(OrderPaid::class);
});

// ─── Midtrans Webhook ────────────────────────────────────────

test('webhook broadcasts OrderPaid once and not again for already paid order', function () {
    Http::fake([
        'api.sandbox.midtrans.com/v2/*/status' => Http::response([
            'transaction_status' => 'settlement',
            'fraud_status' => 'accept',
        ]),
    ]);

    $payload = orderPaidPayload($this->order, 'settlement');

    Event::fake([OrderPaid::class]);
    $this->postJson(route('webhooks.midtrans.notification'), $payload)
        ->assertStatus(200);

    expect($this->order->fresh()->status)->toBe(OrderStatus::Paid);
    Event::assertDispatched(OrderPaid::class);

    Event::fake([OrderPaid::class]);
    $this->postJson(route('webhooks.midtrans.notification'), $payload)
        ->assertStatus(200);

    Event::assertNotDispatched(OrderPaid::class);
});
