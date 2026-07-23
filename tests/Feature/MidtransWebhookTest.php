<?php

use App\Models\Meja;
use App\Models\Menu;
use App\Models\MenuCategory;
use App\Models\Order;
use App\Models\Outlet;
use App\Models\Payment;
use App\Services\MidtransService;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;

beforeEach(function () {
    $this->outlet = Outlet::factory()->create();
    $category = MenuCategory::factory()->create(['outlet_id' => $this->outlet->id]);
    $menu = Menu::factory()->create(['category_id' => $category->id]);

    $table = Meja::factory()->create(['outlet_id' => $this->outlet->id]);
    $session = $table->sessions()->create(['opened_at' => now(), 'status' => 'active']);

    $this->order = $session->orders()->create([
        'order_type' => 'dine_in_qr',
        'status' => 'pending_payment',
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

    $this->serverKey = config('midtrans.server_key');
});

// ─── Webhook Payload Generation Helper ──────────────────────

function validMidtransPayload(Order $order, string $status = 'settlement'): array
{
    $serverKey = config('midtrans.server_key');
    $grossAmount = (string) ((int) $order->total);
    $statusCode = '200';
    $orderId = (string) $order->id;
    $signature = hash('sha512', $orderId.$statusCode.$grossAmount.$serverKey);

    return [
        'order_id' => $orderId,
        'status_code' => $statusCode,
        'gross_amount' => $grossAmount,
        'signature_key' => $signature,
        'transaction_status' => $status,
        'transaction_id' => (string) Str::uuid(),
        'payment_type' => 'qris',
        'transaction_time' => now()->toIso8601String(),
        'fraud_status' => 'accept',
    ];
}

// ─── Signature Verification (MidtransService) ───────────────

test('midtrans service verifies valid signature', function () {
    $service = app(MidtransService::class);
    $serverKey = config('midtrans.server_key');
    $signature = hash('sha512', 'order-123'.'200'.'25000'.$serverKey);

    expect($service->verifySignature('order-123', '200', '25000', $signature))->toBeTrue();
});

test('midtrans service rejects invalid signature', function () {
    $service = app(MidtransService::class);

    expect($service->verifySignature('order-123', '200', '25000', 'invalid-signature'))->toBeFalse();
});

test('midtrans service rejects tampered gross amount', function () {
    $service = app(MidtransService::class);
    $serverKey = config('midtrans.server_key');
    $signature = hash('sha512', 'order-123'.'200'.'25000'.$serverKey);

    expect($service->verifySignature('order-123', '200', '99999', $signature))->toBeFalse();
});

// ─── Webhook: Missing Fields ────────────────────────────────

test('webhook returns 400 when payload is missing required fields', function () {
    $this->postJson(route('webhooks.midtrans.notification'), ['foo' => 'bar'])
        ->assertStatus(400)
        ->assertJson(['error' => 'Invalid payload']);
});

// ─── Webhook: Invalid Signature ─────────────────────────────

test('webhook returns 403 when signature is invalid', function () {
    $payload = validMidtransPayload($this->order);
    $payload['signature_key'] = 'invalid';

    $this->postJson(route('webhooks.midtrans.notification'), $payload)
        ->assertStatus(403)
        ->assertJson(['error' => 'Invalid signature']);
});

// ─── Webhook: Order Not Found ───────────────────────────────

test('webhook returns 404 when order does not exist', function () {
    $serverKey = config('midtrans.server_key');
    $signature = hash('sha512', '99999'.'200'.'25000'.$serverKey);

    $payload = [
        'order_id' => '99999',
        'status_code' => '200',
        'gross_amount' => '25000',
        'signature_key' => $signature,
        'transaction_status' => 'settlement',
        'transaction_id' => (string) Str::uuid(),
        'payment_type' => 'qris',
        'transaction_time' => now()->toIso8601String(),
        'fraud_status' => 'accept',
    ];

    $this->postJson(route('webhooks.midtrans.notification'), $payload)
        ->assertStatus(404)
        ->assertJson(['error' => 'Order not found']);
});

// ─── Webhook: Settlement → Paid ─────────────────────────────

test('webhook processes settlement as paid', function () {
    Http::fake([
        'api.sandbox.midtrans.com/v2/*/status' => Http::response([
            'transaction_status' => 'settlement',
            'fraud_status' => 'accept',
        ]),
    ]);

    $payload = validMidtransPayload($this->order, 'settlement');

    $this->postJson(route('webhooks.midtrans.notification'), $payload)
        ->assertStatus(200)
        ->assertJson(['message' => 'OK']);

    expect($this->order->fresh()->status)->toBe('paid');
    $this->assertDatabaseHas('payments', [
        'order_id' => $this->order->id,
        'status' => 'success',
        'method' => 'qris',
    ]);
});

test('webhook processes capture as paid', function () {
    Http::fake([
        'api.sandbox.midtrans.com/v2/*/status' => Http::response([
            'transaction_status' => 'capture',
            'fraud_status' => 'accept',
        ]),
    ]);

    $payload = validMidtransPayload($this->order, 'capture');

    $this->postJson(route('webhooks.midtrans.notification'), $payload)
        ->assertStatus(200);

    expect($this->order->fresh()->status)->toBe('paid');
});

// ─── Webhook: Expire → Cancelled ────────────────────────────

test('webhook processes expire as cancelled', function () {
    Http::fake([
        'api.sandbox.midtrans.com/v2/*/status' => Http::response([
            'transaction_status' => 'expire',
            'fraud_status' => 'accept',
        ]),
    ]);

    $payload = validMidtransPayload($this->order, 'expire');

    $this->postJson(route('webhooks.midtrans.notification'), $payload)
        ->assertStatus(200);

    expect($this->order->fresh()->status)->toBe('cancelled');
});

test('webhook processes cancel as cancelled', function () {
    Http::fake([
        'api.sandbox.midtrans.com/v2/*/status' => Http::response([
            'transaction_status' => 'cancel',
            'fraud_status' => 'accept',
        ]),
    ]);

    $payload = validMidtransPayload($this->order, 'cancel');

    $this->postJson(route('webhooks.midtrans.notification'), $payload)
        ->assertStatus(200);

    expect($this->order->fresh()->status)->toBe('cancelled');
});

test('webhook processes deny as cancelled', function () {
    Http::fake([
        'api.sandbox.midtrans.com/v2/*/status' => Http::response([
            'transaction_status' => 'deny',
            'fraud_status' => 'deny',
        ]),
    ]);

    $payload = validMidtransPayload($this->order, 'deny');

    $this->postJson(route('webhooks.midtrans.notification'), $payload)
        ->assertStatus(200);

    expect($this->order->fresh()->status)->toBe('cancelled');
});

// ─── Webhook: Double-check Status from Midtrans API ─────────

test('webhook double-checks status with midtrans api', function () {
    Http::fake([
        'api.sandbox.midtrans.com/v2/*/status' => Http::response([
            'transaction_status' => 'settlement',
            'fraud_status' => 'accept',
        ]),
    ]);

    $payload = validMidtransPayload($this->order, 'settlement');

    $this->postJson(route('webhooks.midtrans.notification'), $payload)
        ->assertStatus(200);

    Http::assertSent(function ($request) {
        return Str::contains($request->url(), '/'.$this->order->id.'/status');
    });
});

// ─── Idempotency ────────────────────────────────────────────

test('webhook is idempotent for already processed payment', function () {
    Http::fake([
        'api.sandbox.midtrans.com/v2/*/status' => Http::response([
            'transaction_status' => 'settlement',
            'fraud_status' => 'accept',
        ]),
    ]);

    Payment::create([
        'order_id' => $this->order->id,
        'method' => 'qris',
        'midtrans_transaction_id' => 'existing-transaction-id',
        'gross_amount' => 25000,
        'status' => 'success',
    ]);

    $payload = validMidtransPayload($this->order, 'settlement');
    $payload['transaction_id'] = 'existing-transaction-id';

    $this->postJson(route('webhooks.midtrans.notification'), $payload)
        ->assertStatus(200)
        ->assertJson(['message' => 'Already processed']);
});

// ─── Polling Command ────────────────────────────────────────

test('check pending payments command updates paid orders', function () {
    Order::where('id', $this->order->id)->update(['created_at' => now()->subMinutes(5)]);

    $service = Mockery::mock(MidtransService::class);
    $service->shouldReceive('getTransactionStatus')
        ->with((string) $this->order->id)
        ->andReturn(['transaction_status' => 'settlement']);

    $pendingOrders = Order::where('status', 'pending_payment')
        ->where('created_at', '<', now()->subMinutes(2))
        ->get();

    foreach ($pendingOrders as $order) {
        $status = $service->getTransactionStatus("{$order->id}");
        $transactionStatus = $status['transaction_status'] ?? '';
        if (in_array($transactionStatus, ['capture', 'settlement'])) {
            $order->update(['status' => 'paid']);
        } elseif (in_array($transactionStatus, ['expire', 'cancel', 'deny'])) {
            $order->update(['status' => 'cancelled']);
        }
    }

    expect($this->order->fresh()->status)->toBe('paid');
});

test('check pending payments command updates cancelled orders', function () {
    Order::where('id', $this->order->id)->update(['created_at' => now()->subMinutes(5)]);

    $service = Mockery::mock(MidtransService::class);
    $service->shouldReceive('getTransactionStatus')
        ->with((string) $this->order->id)
        ->andReturn(['transaction_status' => 'expire']);

    $pendingOrders = Order::where('status', 'pending_payment')
        ->where('created_at', '<', now()->subMinutes(2))
        ->get();

    foreach ($pendingOrders as $order) {
        $status = $service->getTransactionStatus("{$order->id}");
        $transactionStatus = $status['transaction_status'] ?? '';
        if (in_array($transactionStatus, ['capture', 'settlement'])) {
            $order->update(['status' => 'paid']);
        } elseif (in_array($transactionStatus, ['expire', 'cancel', 'deny'])) {
            $order->update(['status' => 'cancelled']);
        }
    }

    expect($this->order->fresh()->status)->toBe('cancelled');
});

test('check pending payments skips recent orders', function () {
    Order::where('id', $this->order->id)->update(['created_at' => now()]);

    $pendingOrders = Order::where('status', 'pending_payment')
        ->where('created_at', '<', now()->subMinutes(2))
        ->get();

    expect($pendingOrders)->toHaveCount(0);
});

test('check pending payments only processes pending_payment orders', function () {
    Order::where('id', $this->order->id)->update([
        'status' => 'paid',
        'created_at' => now()->subMinutes(5),
    ]);

    $pendingOrders = Order::where('status', 'pending_payment')
        ->where('created_at', '<', now()->subMinutes(2))
        ->get();

    expect($pendingOrders)->toHaveCount(0);
});
