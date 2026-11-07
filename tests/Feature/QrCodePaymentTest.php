<?php

use App\Models\Employee;
use App\Models\Meja;
use App\Models\Menu;
use App\Models\MenuCategory;
use App\Models\Order;
use App\Models\Outlet;
use App\Models\QrCode;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Spatie\Permission\Models\Role;

beforeEach(function () {
    Role::firstOrCreate(['name' => 'Owner']);
    Role::firstOrCreate(['name' => 'Admin']);
    Role::firstOrCreate(['name' => 'Cashier']);

    Storage::fake('public');

    $this->outlet = Outlet::factory()->create();
    $this->category = MenuCategory::factory()->create([
        'outlet_id' => $this->outlet->id,
        'is_active' => true,
    ]);
    $this->menu = Menu::factory()->create([
        'category_id' => $this->category->id,
        'price' => 25000,
        'is_available' => true,
    ]);
    $this->table = Meja::factory()->create([
        'outlet_id' => $this->outlet->id,
        'status' => 'available',
    ]);

    $this->cashier = User::factory()->create()->assignRole('Cashier');
    Employee::factory()->create(['user_id' => $this->cashier->id, 'outlet_id' => $this->outlet->id]);

    $this->admin = User::factory()->create()->assignRole('Admin');
    Employee::factory()->create(['user_id' => $this->admin->id, 'outlet_id' => $this->outlet->id]);
});

test('admin can view the qr code management page', function () {
    $this->actingAs($this->admin)
        ->get(route('admin.qr-codes.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page->component('admin/qr-codes/Index'));
});

test('admin can upload a qr code and it becomes active', function () {
    $this->actingAs($this->admin)
        ->post(route('admin.qr-codes.store'), [
            'label' => 'QRIS Utama',
            'image' => UploadedFile::fake()->image('qris.png'),
        ])
        ->assertRedirect(route('admin.qr-codes.index'));

    $qrCode = QrCode::query()->firstOrFail();

    expect($qrCode->is_active)->toBeTrue();
    expect($qrCode->label)->toBe('QRIS Utama');
    Storage::disk('public')->assertExists($qrCode->image_path);
});

test('cashier cannot manage qr codes', function () {
    $this->actingAs($this->cashier)
        ->get(route('admin.qr-codes.index'))
        ->assertForbidden();
});

test('qris payment uses the stored qr code instead of midtrans', function () {
    Http::fake();
    Http::preventStrayRequests();

    QrCode::query()->create([
        'label' => 'QRIS Utama',
        'image_path' => 'qr-codes/qris.png',
        'is_active' => true,
    ]);

    $response = $this->actingAs($this->cashier)
        ->postJson(route('pos.orders.initiate-payment'), [
            'table_id' => $this->table->id,
            'items' => [
                ['menu_id' => $this->menu->id, 'qty' => 1, 'notes' => null, 'option_ids' => []],
            ],
            'payment_type' => 'qris',
            'order_type' => 'dine_in',
        ])
        ->assertOk()
        ->assertJson(['manual_qr' => true, 'payment_type' => 'qris']);

    expect($response->json('qr_code'))->toBe('/storage/qr-codes/qris.png');
    expect((float) $response->json('midtrans_charge'))->toBe(0.0);
    Http::assertNothingSent();

    $this->assertDatabaseHas('payments', [
        'method' => 'qris',
        'status' => 'pending',
    ]);
});

test('confirming a manual qris payment marks the order as paid', function () {
    QrCode::query()->create([
        'label' => 'QRIS Utama',
        'image_path' => 'qr-codes/qris.png',
        'is_active' => true,
    ]);

    $this->actingAs($this->cashier)
        ->postJson(route('pos.orders.initiate-payment'), [
            'table_id' => $this->table->id,
            'items' => [
                ['menu_id' => $this->menu->id, 'qty' => 1, 'notes' => null, 'option_ids' => []],
            ],
            'payment_type' => 'qris',
            'order_type' => 'dine_in',
        ])
        ->assertOk();

    $order = Order::query()->latest('id')->firstOrFail();

    $this->actingAs($this->cashier)
        ->postJson(route('pos.orders.confirm-qris', $order))
        ->assertOk()
        ->assertJson(['status' => 'settlement']);

    expect($order->fresh()->status->value)->toBe('paid');
    expect($order->payment->fresh()->status)->toBe('settlement');
});

test('self-order qris payment uses the stored qr code instead of midtrans', function () {
    Http::fake();
    Http::preventStrayRequests();

    QrCode::query()->create([
        'label' => 'QRIS Utama',
        'image_path' => 'qr-codes/qris.png',
        'is_active' => true,
    ]);

    $response = $this->postJson(route('self-order.pay', $this->table->table_token), [
        'idempotency_key' => (string) Str::uuid(),
        'customer_name' => 'Pelanggan QR',
        'payment_method' => 'online',
        'payment_type' => 'qris',
        'items' => [
            ['menu_id' => $this->menu->id, 'qty' => 1, 'notes' => null, 'option_ids' => []],
        ],
    ])
        ->assertOk()
        ->assertJson(['manual_qr' => true, 'payment_type' => 'qris']);

    expect($response->json('qr_code'))->toBe('/storage/qr-codes/qris.png');
    Http::assertNothingSent();

    $this->assertDatabaseHas('payments', [
        'method' => 'qris',
        'status' => 'pending',
    ]);
});

test('self-order customer cannot mark a manual qris order as paid', function () {
    QrCode::query()->create([
        'label' => 'QRIS Utama',
        'image_path' => 'qr-codes/qris.png',
        'is_active' => true,
    ]);

    $response = $this->postJson(route('self-order.pay', $this->table->table_token), [
        'idempotency_key' => (string) Str::uuid(),
        'customer_name' => 'Pelanggan QR',
        'payment_method' => 'online',
        'payment_type' => 'qris',
        'items' => [
            ['menu_id' => $this->menu->id, 'qty' => 1, 'notes' => null, 'option_ids' => []],
        ],
    ])->assertOk();

    $order = Order::query()->latest('id')->firstOrFail();

    expect($response->json('access_token'))->not->toBeNull();
    expect($order->access_token)->not->toBeNull();
    expect($order->status->value)->toBe('pending_payment');
    expect($order->tableSession?->table_id)->toBe($this->table->id);

    $this->postJson("/t/{$this->table->table_token}/orders/{$order->id}/confirm-qris", [
        'access_token' => $response->json('access_token'),
    ])->assertNotFound();

    expect($order->fresh()->status->value)->toBe('pending_payment');
    expect($order->payment->fresh()->status)->toBe('pending');

    $this->actingAs($this->cashier)
        ->postJson(route('pos.orders.confirm-qris', $order))
        ->assertOk()
        ->assertJson(['status' => 'settlement']);

    expect($order->fresh()->status->value)->toBe('paid');
    expect($order->payment->fresh()->status)->toBe('settlement');
});

test('repeating a self-order qris request with the same idempotency key reuses its order and payment', function () {
    QrCode::query()->create([
        'label' => 'QRIS Utama',
        'image_path' => 'qr-codes/qris.png',
        'is_active' => true,
    ]);

    $payload = [
        'idempotency_key' => (string) Str::uuid(),
        'customer_name' => 'Pelanggan QR',
        'payment_method' => 'online',
        'payment_type' => 'qris',
        'items' => [
            ['menu_id' => $this->menu->id, 'qty' => 1, 'notes' => null, 'option_ids' => []],
        ],
    ];

    $firstResponse = $this->postJson(route('self-order.pay', $this->table->table_token), $payload)->assertOk();
    $secondResponse = $this->postJson(route('self-order.pay', $this->table->table_token), $payload)->assertOk();

    expect($secondResponse->json('order_id'))->toBe($firstResponse->json('order_id'));
    expect(Order::query()->where('idempotency_key', $payload['idempotency_key'])->count())->toBe(1);
    expect(DB::table('payments')->where('order_id', $firstResponse->json('order_id'))->count())->toBe(1);
});

test('self-order rejects reuse of an idempotency key for a changed cart', function () {
    QrCode::query()->create([
        'label' => 'QRIS Utama',
        'image_path' => 'qr-codes/qris.png',
        'is_active' => true,
    ]);

    $payload = [
        'idempotency_key' => (string) Str::uuid(),
        'customer_name' => 'Pelanggan QR',
        'payment_method' => 'online',
        'payment_type' => 'qris',
        'items' => [
            ['menu_id' => $this->menu->id, 'qty' => 1, 'notes' => null, 'option_ids' => []],
        ],
    ];

    $this->postJson(route('self-order.pay', $this->table->table_token), $payload)->assertOk();
    $payload['items'][0]['qty'] = 2;

    $this->postJson(route('self-order.pay', $this->table->table_token), $payload)
        ->assertStatus(409);

    expect(Order::query()->where('idempotency_key', $payload['idempotency_key'])->count())->toBe(1);
});

test('expired self-order qris payments are cancelled and release an idle table', function () {
    QrCode::query()->create([
        'label' => 'QRIS Utama',
        'image_path' => 'qr-codes/qris.png',
        'is_active' => true,
    ]);

    $response = $this->postJson(route('self-order.pay', $this->table->table_token), [
        'idempotency_key' => (string) Str::uuid(),
        'customer_name' => 'Pelanggan QR',
        'payment_method' => 'online',
        'payment_type' => 'qris',
        'items' => [
            ['menu_id' => $this->menu->id, 'qty' => 1, 'notes' => null, 'option_ids' => []],
        ],
    ])->assertOk();

    $order = Order::query()->findOrFail($response->json('order_id'));
    $this->travelTo($order->payment_expires_at->addMinute());

    $this->artisan('app:expire-self-order-payments')->assertSuccessful();

    expect($order->fresh()->status->value)->toBe('cancelled');
    expect($order->payment->fresh()->status)->toBe('failed');
    expect($this->table->fresh()->status->value)->toBe('available');
});

test('qris payment requires a stored qr code', function () {
    Http::fake();

    $this->actingAs($this->cashier)
        ->postJson(route('pos.orders.initiate-payment'), [
            'table_id' => $this->table->id,
            'items' => [
                ['menu_id' => $this->menu->id, 'qty' => 1, 'notes' => null, 'option_ids' => []],
            ],
            'payment_type' => 'qris',
            'order_type' => 'dine_in',
        ])
        ->assertStatus(422)
        ->assertJson(['message' => 'QRIS belum dikonfigurasi. Unggah QR pembayaran di menu QR Pembayaran.']);

    Http::assertNothingSent();
});
