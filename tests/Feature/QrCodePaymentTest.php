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
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;
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

test('self-order manual qris confirmation marks the order as paid', function () {
    QrCode::query()->create([
        'label' => 'QRIS Utama',
        'image_path' => 'qr-codes/qris.png',
        'is_active' => true,
    ]);

    $response = $this->postJson(route('self-order.pay', $this->table->table_token), [
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

    $this->postJson(route('self-order.confirm-qris', [$this->table->table_token, $order]), [
        'access_token' => $response->json('access_token'),
    ])
        ->assertOk()
        ->assertJson(['status' => 'settlement']);

    expect($order->fresh()->status->value)->toBe('paid');
    expect($order->payment->fresh()->status)->toBe('settlement');
});

test('self-order manual qris confirmation rejects a wrong access token', function () {
    QrCode::query()->create([
        'label' => 'QRIS Utama',
        'image_path' => 'qr-codes/qris.png',
        'is_active' => true,
    ]);

    $this->postJson(route('self-order.pay', $this->table->table_token), [
        'customer_name' => 'Pelanggan QR',
        'payment_method' => 'online',
        'payment_type' => 'qris',
        'items' => [
            ['menu_id' => $this->menu->id, 'qty' => 1, 'notes' => null, 'option_ids' => []],
        ],
    ])->assertOk();

    $order = Order::query()->latest('id')->firstOrFail();

    $this->postJson(route('self-order.confirm-qris', [$this->table->table_token, $order]), [
        'access_token' => 'wrong-token',
    ])->assertForbidden();
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
