<?php

use App\Enums\OrderStatus;
use App\Models\Employee;
use App\Models\Meja;
use App\Models\Order;
use App\Models\Outlet;
use App\Models\TableSession;
use App\Models\User;
use Spatie\Permission\Models\Role;

beforeEach(function () {
    Role::firstOrCreate(['name' => 'Owner']);
    Role::firstOrCreate(['name' => 'Admin']);
    Role::firstOrCreate(['name' => 'Cashier']);
    Role::firstOrCreate(['name' => 'Waiter']);

    $this->outlet = Outlet::factory()->create();
    $this->owner = User::factory()->create()->assignRole('Owner');
    $this->admin = User::factory()->create()->assignRole('Admin');

    $this->waiterUser = User::factory()->create()->assignRole('Waiter');
    $this->waiter = Employee::factory()->create([
        'user_id' => $this->waiterUser->id,
        'outlet_id' => $this->outlet->id,
        'position' => 'waiter',
        'is_active' => true,
    ]);

    $this->cashierUser = User::factory()->create()->assignRole('Cashier');
    $this->cashierEmployee = Employee::factory()->create([
        'user_id' => $this->cashierUser->id,
        'outlet_id' => $this->outlet->id,
        'position' => 'kasir',
        'is_active' => true,
    ]);

    $this->table = Meja::factory()->create(['outlet_id' => $this->outlet->id]);
    $this->session = TableSession::factory()->create(['table_id' => $this->table->id]);
});

function createServedOrder(Outlet $outlet, TableSession $session, User $waiter, string $servedAt): Order
{
    return Order::factory()->create([
        'table_session_id' => $session->id,
        'order_type' => 'dine_in',
        'status' => OrderStatus::Completed,
        'served_by' => $waiter->id,
        'served_at' => $servedAt,
    ]);
}

// ─── Page Access ─────────────────────────────────────────────

test('waiter points report requires authentication', function () {
    $this->get(route('admin.reports.waiter-points'))->assertRedirect(route('login'));
});

test('owner and admin can view waiter points report', function () {
    $this->actingAs($this->owner)
        ->get(route('admin.reports.waiter-points'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page->component('admin/reports/WaiterPoints'));

    $this->actingAs($this->admin)
        ->get(route('admin.reports.waiter-points'))
        ->assertOk();
});

test('waiter role cannot view waiter points report', function () {
    $this->actingAs($this->waiterUser)
        ->get(route('admin.reports.waiter-points'))
        ->assertForbidden();
});

// ─── Data & Filtering ────────────────────────────────────────

test('report includes only waiters and counts monthly points', function () {
    createServedOrder($this->outlet, $this->session, $this->waiterUser, now()->format('Y-m-d').' 12:00:00');
    createServedOrder($this->outlet, $this->session, $this->waiterUser, now()->format('Y-m-d').' 14:00:00');

    $this->actingAs($this->owner)
        ->get(route('admin.reports.waiter-points'))
        ->assertInertia(fn ($page) => $page
            ->component('admin/reports/WaiterPoints')
            ->has('summary', 1)
            ->where('summary.0.name', $this->waiterUser->name)
            ->where('summary.0.points', 2)
            ->where('summary.0.rank', 1)
            ->where('totalWaiters', 1)
            ->where('totalPoints', 2)
            ->where('topWaiter', $this->waiterUser->name)
        );
});

test('report excludes non-waiter employees', function () {
    createServedOrder($this->outlet, $this->session, $this->cashierUser, now()->format('Y-m-d').' 12:00:00');

    $this->actingAs($this->owner)
        ->get(route('admin.reports.waiter-points'))
        ->assertInertia(fn ($page) => $page
            ->component('admin/reports/WaiterPoints')
            ->has('summary', 1)
            ->where('summary.0.name', $this->waiterUser->name)
            ->where('summary.0.points', 0)
        );
});

test('report filters points by selected month', function () {
    $currentMonth = today()->format('Y-m');

    $previousMonth = today()->firstOfMonth()->subMonth()->format('Y-m');

    createServedOrder($this->outlet, $this->session, $this->waiterUser, today()->format('Y-m-15').' 12:00:00');
    createServedOrder($this->outlet, $this->session, $this->waiterUser, today()->firstOfMonth()->subMonth()->format('Y-m-20').' 12:00:00');

    $this->actingAs($this->owner)
        ->get(route('admin.reports.waiter-points', ['month' => $currentMonth]))
        ->assertInertia(fn ($page) => $page
            ->where('summary.0.points', 1)
            ->where('totalPoints', 1)
        );

    $this->actingAs($this->owner)
        ->get(route('admin.reports.waiter-points', ['month' => $previousMonth]))
        ->assertInertia(fn ($page) => $page
            ->where('summary.0.points', 1)
            ->where('totalPoints', 1)
        );
});
