<?php

use App\Models\Menu;
use App\Models\MenuCategory;
use App\Models\OptionGroup;
use App\Models\Outlet;
use App\Models\User;
use Spatie\Permission\Models\Role;

beforeEach(function () {
    Role::firstOrCreate(['name' => 'Owner']);
    Role::firstOrCreate(['name' => 'Admin']);
    Role::firstOrCreate(['name' => 'Cashier']);
    Role::firstOrCreate(['name' => 'Kitchen Staff']);
    Role::firstOrCreate(['name' => 'Waiter']);

    $this->outlet = Outlet::factory()->create();
});

// ─── Menu Categories ────────────────────────────────────────

test('menu categories list requires authentication', function () {
    $this->get(route('admin.menu-categories.index'))->assertRedirect(route('login'));
});

test('owner can view menu categories', function () {
    $owner = User::factory()->create()->assignRole('Owner');
    MenuCategory::factory()->create(['outlet_id' => $this->outlet->id]);

    $this->actingAs($owner)
        ->get(route('admin.menu-categories.index'))
        ->assertOk();
});

test('owner can create menu category', function () {
    $owner = User::factory()->create()->assignRole('Owner');

    $this->actingAs($owner)->post(route('admin.menu-categories.store'), [
        'name' => 'Makanan Baru',
        'sort_order' => 5,
    ])->assertRedirect();

    $this->assertDatabaseHas('menu_categories', [
        'name' => 'Makanan Baru',
        'outlet_id' => $this->outlet->id,
    ]);
});

test('owner can update menu category', function () {
    $owner = User::factory()->create()->assignRole('Owner');
    $category = MenuCategory::factory()->create(['outlet_id' => $this->outlet->id]);

    $this->actingAs($owner)->put(route('admin.menu-categories.update', $category), [
        'name' => 'Minuman Segar',
        'sort_order' => 3,
    ])->assertRedirect();

    expect($category->fresh()->name)->toBe('Minuman Segar');
});

test('owner can delete menu category', function () {
    $owner = User::factory()->create()->assignRole('Owner');
    $category = MenuCategory::factory()->create(['outlet_id' => $this->outlet->id]);

    $this->actingAs($owner)
        ->delete(route('admin.menu-categories.destroy', $category))
        ->assertRedirect();

    $this->assertDatabaseMissing('menu_categories', ['id' => $category->id]);
});

test('waiter cannot create menu category', function () {
    $waiter = User::factory()->create()->assignRole('Waiter');

    $this->actingAs($waiter)
        ->post(route('admin.menu-categories.store'), ['name' => 'Hack'])
        ->assertForbidden();
});

// ─── Menu CRUD ──────────────────────────────────────────────

test('owner can view menu list', function () {
    $owner = User::factory()->create()->assignRole('Owner');
    Menu::factory()->create();

    $this->actingAs($owner)
        ->get(route('admin.menus.index'))
        ->assertOk();
});

test('owner can view menu create page', function () {
    $owner = User::factory()->create()->assignRole('Owner');

    $this->actingAs($owner)
        ->get(route('admin.menus.create'))
        ->assertOk();
});

test('owner can create menu', function () {
    $owner = User::factory()->create()->assignRole('Owner');
    $category = MenuCategory::factory()->create(['outlet_id' => $this->outlet->id]);

    $this->actingAs($owner)->post(route('admin.menus.store'), [
        'category_id' => $category->id,
        'name' => 'Bubur Ayam Spesial',
        'price' => 25000,
        'description' => 'Bubur ayam dengan topping spesial',
        'is_available' => true,
    ])->assertRedirect(route('admin.menus.index'));

    $this->assertDatabaseHas('menus', [
        'name' => 'Bubur Ayam Spesial',
        'price' => 25000.00,
    ]);
});

test('menu price validation rejects negative price', function () {
    $owner = User::factory()->create()->assignRole('Owner');
    $category = MenuCategory::factory()->create(['outlet_id' => $this->outlet->id]);

    $this->actingAs($owner)
        ->post(route('admin.menus.store'), [
            'category_id' => $category->id,
            'name' => 'Menu Gratis',
            'price' => -1000,
        ])->assertSessionHasErrors('price');
});

test('owner can update menu', function () {
    $owner = User::factory()->create()->assignRole('Owner');
    $menu = Menu::factory()->create();

    $this->actingAs($owner)->put(route('admin.menus.update', $menu), [
        'category_id' => $menu->category_id,
        'name' => 'Bubur Ayam Spesial Update',
        'price' => 30000,
        'is_available' => true,
    ])->assertRedirect(route('admin.menus.index'));

    expect($menu->fresh()->name)->toBe('Bubur Ayam Spesial Update');
});

test('owner can delete menu', function () {
    $owner = User::factory()->create()->assignRole('Owner');
    $menu = Menu::factory()->create();

    $this->actingAs($owner)
        ->delete(route('admin.menus.destroy', $menu))
        ->assertRedirect(route('admin.menus.index'));

    $this->assertDatabaseMissing('menus', ['id' => $menu->id]);
});

test('admin cannot delete menu', function () {
    $admin = User::factory()->create()->assignRole('Admin');
    $menu = Menu::factory()->create();

    $this->actingAs($admin)
        ->delete(route('admin.menus.destroy', $menu))
        ->assertForbidden();
});

test('menu can toggle availability', function () {
    $owner = User::factory()->create()->assignRole('Owner');
    $menu = Menu::factory()->create(['is_available' => true]);

    $this->actingAs($owner)
        ->patch(route('admin.menus.toggle-availability', $menu))
        ->assertRedirect();

    expect($menu->fresh()->is_available)->toBeFalse();
});

test('owner can view menu detail', function () {
    $owner = User::factory()->create()->assignRole('Owner');
    $menu = Menu::factory()->create();

    $this->actingAs($owner)
        ->get(route('admin.menus.show', $menu))
        ->assertOk()
        ->assertInertia(fn ($page) => $page->component('admin/menus/Show'));
});

test('cashier can view menu list', function () {
    $cashier = User::factory()->create()->assignRole('Cashier');

    $this->actingAs($cashier)
        ->get(route('admin.menus.index'))
        ->assertOk();
});

test('cashier can toggle availability', function () {
    $cashier = User::factory()->create()->assignRole('Cashier');
    $menu = Menu::factory()->create(['is_available' => true]);

    $this->actingAs($cashier)
        ->patch(route('admin.menus.toggle-availability', $menu))
        ->assertRedirect();

    expect($menu->fresh()->is_available)->toBeFalse();
});

// ─── Menu with Option Groups (mapping) ──────────────────────

test('owner can create menu with option groups', function () {
    $owner = User::factory()->create()->assignRole('Owner');
    $category = MenuCategory::factory()->create(['outlet_id' => $this->outlet->id]);
    $optionGroup = OptionGroup::factory()->create(['outlet_id' => $this->outlet->id]);

    $this->actingAs($owner)->post(route('admin.menus.store'), [
        'category_id' => $category->id,
        'name' => 'Bubur Cakwe',
        'price' => 25000,
        'is_available' => true,
        'option_group_ids' => [$optionGroup->id],
    ])->assertRedirect(route('admin.menus.index'));

    $menu = Menu::where('name', 'Bubur Cakwe')->first();
    expect($menu->optionGroups->pluck('id')->toArray())->toContain($optionGroup->id);
});

test('menu edit page shows option groups', function () {
    $owner = User::factory()->create()->assignRole('Owner');
    $menu = Menu::factory()->create();
    $optionGroup = OptionGroup::factory()->create(['outlet_id' => $this->outlet->id]);
    $menu->optionGroups()->sync([$optionGroup->id]);

    $this->actingAs($owner)
        ->get(route('admin.menus.edit', $menu))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('admin/menus/Edit')
            ->has('optionGroups')
        );
});

// ─── Option Groups ──────────────────────────────────────────

test('owner can view option groups', function () {
    $owner = User::factory()->create()->assignRole('Owner');
    OptionGroup::factory()->create(['outlet_id' => $this->outlet->id]);

    $this->actingAs($owner)
        ->get(route('admin.option-groups.index'))
        ->assertOk();
});

test('owner can create option group with items', function () {
    $owner = User::factory()->create()->assignRole('Owner');

    $this->actingAs($owner)->post(route('admin.option-groups.store'), [
        'name' => 'Level Pedas',
        'selection_type' => 'single',
        'is_required' => true,
        'min_select' => 1,
        'max_select' => 1,
        'items' => [
            ['name' => 'Tidak Pedas', 'price_adjustment' => 0, 'is_available' => true, 'sort_order' => 1],
            ['name' => 'Pedas Level 1', 'price_adjustment' => 0, 'is_available' => true, 'sort_order' => 2],
        ],
    ])->assertRedirect();

    $group = OptionGroup::where('name', 'Level Pedas')->first();
    expect($group)->not->toBeNull();
    expect($group->optionItems)->toHaveCount(2);
});

test('owner can update option group', function () {
    $owner = User::factory()->create()->assignRole('Owner');
    $group = OptionGroup::factory()->create(['outlet_id' => $this->outlet->id, 'name' => 'Level Pedas']);

    $this->actingAs($owner)->put(route('admin.option-groups.update', $group), [
        'name' => 'Level Pedas Update',
        'selection_type' => 'single',
        'is_required' => false,
        'min_select' => 0,
        'max_select' => 1,
    ])->assertRedirect();

    expect($group->fresh()->name)->toBe('Level Pedas Update');
});

test('owner can delete option group', function () {
    $owner = User::factory()->create()->assignRole('Owner');
    $group = OptionGroup::factory()->create(['outlet_id' => $this->outlet->id]);

    $this->actingAs($owner)
        ->delete(route('admin.option-groups.destroy', $group))
        ->assertRedirect();

    $this->assertDatabaseMissing('option_groups', ['id' => $group->id]);
});

test('waiter cannot create option group', function () {
    $waiter = User::factory()->create()->assignRole('Waiter');

    $this->actingAs($waiter)
        ->post(route('admin.option-groups.store'), ['name' => 'Hack', 'selection_type' => 'single'])
        ->assertForbidden();
});

test('option group validation requires selection_type', function () {
    $owner = User::factory()->create()->assignRole('Owner');

    $this->actingAs($owner)
        ->post(route('admin.option-groups.store'), ['name' => 'Invalid'])
        ->assertSessionHasErrors('selection_type');
});
