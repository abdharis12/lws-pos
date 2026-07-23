<?php

use App\Http\Controllers\EmployeeController;
use App\Http\Controllers\KitchenDisplayController;
use App\Http\Controllers\MenuCategoryController;
use App\Http\Controllers\MenuController;
use App\Http\Controllers\MidtransWebhookController;
use App\Http\Controllers\OptionGroupController;
use App\Http\Controllers\OrderController;
use App\Http\Controllers\PosController;
use App\Http\Controllers\SelfOrderController;
use App\Http\Controllers\TableController;
use App\Http\Middleware\VerifyCsrfToken;
use Illuminate\Support\Facades\Route;

Route::inertia('/', 'welcome')->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::inertia('dashboard', 'dashboard')->name('dashboard');

    Route::prefix('admin')->middleware('can:viewAny,App\Models\Menu')->group(function () {
        Route::get('menu-categories', [MenuCategoryController::class, 'index'])->name('admin.menu-categories.index');
        Route::post('menu-categories', [MenuCategoryController::class, 'store'])->name('admin.menu-categories.store');
        Route::put('menu-categories/{menuCategory}', [MenuCategoryController::class, 'update'])->name('admin.menu-categories.update');
        Route::delete('menu-categories/{menuCategory}', [MenuCategoryController::class, 'destroy'])->name('admin.menu-categories.destroy');

        Route::get('menus', [MenuController::class, 'index'])->name('admin.menus.index');
        Route::get('menus/create', [MenuController::class, 'create'])->name('admin.menus.create');
        Route::post('menus', [MenuController::class, 'store'])->name('admin.menus.store');
        Route::get('menus/{menu}', [MenuController::class, 'show'])->name('admin.menus.show');
        Route::get('menus/{menu}/edit', [MenuController::class, 'edit'])->name('admin.menus.edit');
        Route::put('menus/{menu}', [MenuController::class, 'update'])->name('admin.menus.update');
        Route::delete('menus/{menu}', [MenuController::class, 'destroy'])->name('admin.menus.destroy');
        Route::patch('menus/{menu}/toggle-availability', [MenuController::class, 'toggleAvailability'])->name('admin.menus.toggle-availability');

        Route::get('option-groups', [OptionGroupController::class, 'index'])->name('admin.option-groups.index');
        Route::post('option-groups', [OptionGroupController::class, 'store'])->name('admin.option-groups.store');
        Route::put('option-groups/{optionGroup}', [OptionGroupController::class, 'update'])->name('admin.option-groups.update');
        Route::delete('option-groups/{optionGroup}', [OptionGroupController::class, 'destroy'])->name('admin.option-groups.destroy');

        Route::get('tables', [TableController::class, 'index'])->name('admin.tables.index');
        Route::post('tables', [TableController::class, 'store'])->name('admin.tables.store');
        Route::put('tables/{table}', [TableController::class, 'update'])->name('admin.tables.update');
        Route::delete('tables/{table}', [TableController::class, 'destroy'])->name('admin.tables.destroy');
        Route::post('tables/{table}/regenerate-token', [TableController::class, 'regenerateToken'])->name('admin.tables.regenerate-token');

        Route::get('employees', [EmployeeController::class, 'index'])->name('admin.employees.index');
        Route::post('employees', [EmployeeController::class, 'store'])->name('admin.employees.store');
        Route::get('employees/{employee}', [EmployeeController::class, 'show'])->name('admin.employees.show');
        Route::put('employees/{employee}', [EmployeeController::class, 'update'])->name('admin.employees.update');
        Route::delete('employees/{employee}', [EmployeeController::class, 'destroy'])->name('admin.employees.destroy');
    });

    Route::get('pos', [PosController::class, 'index'])->name('pos.index');
    Route::post('pos/orders', [PosController::class, 'store'])->name('pos.orders.store');

    Route::get('kitchen', [KitchenDisplayController::class, 'index'])->name('kitchen.index');
    Route::patch('orders/{order}/status', [OrderController::class, 'updateStatus'])->name('orders.update-status');
});

Route::get('t/{tableToken}', [SelfOrderController::class, 'show'])->name('self-order.show');
Route::post('t/{tableToken}/orders', [SelfOrderController::class, 'store'])->name('self-order.orders.store');

Route::post('webhooks/midtrans/notification', [MidtransWebhookController::class, 'notification'])
    ->withoutMiddleware([VerifyCsrfToken::class])
    ->name('webhooks.midtrans.notification');

require __DIR__.'/settings.php';
