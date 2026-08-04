<?php

use App\Http\Controllers\ActivityLogController;
use App\Http\Controllers\AttendanceController;
use App\Http\Controllers\BonusController;
use App\Http\Controllers\DeductionController;
use App\Http\Controllers\EmployeeController;
use App\Http\Controllers\KitchenDisplayController;
use App\Http\Controllers\MenuCategoryController;
use App\Http\Controllers\MenuController;
use App\Http\Controllers\MidtransWebhookController;
use App\Http\Controllers\OptionGroupController;
use App\Http\Controllers\OrderController;
use App\Http\Controllers\OutletController;
use App\Http\Controllers\OwnerDashboardController;
use App\Http\Controllers\PayrollController;
use App\Http\Controllers\PayrollSettingController;
use App\Http\Controllers\PayslipController;
use App\Http\Controllers\PdfController;
use App\Http\Controllers\PosController;
use App\Http\Controllers\PosSessionController;
use App\Http\Controllers\ReportController;
use App\Http\Controllers\SalaryComponentController;
use App\Http\Controllers\SelfOrderController;
use App\Http\Controllers\ShiftController;
use App\Http\Controllers\TableController;
use App\Http\Controllers\WaiterController;
use App\Http\Middleware\VerifyCsrfToken;
use App\Http\Middleware\VerifyMidtransIp;
use Illuminate\Support\Facades\Route;

Route::inertia('/', 'welcome')->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::inertia('dashboard', 'dashboard')->name('dashboard');

    Route::middleware('can:accessAttendance')->group(function () {
        Route::get('attendance', [AttendanceController::class, 'index'])->name('attendance.index');
        Route::post('attendance/clock-in', [AttendanceController::class, 'clockIn'])->name('attendance.clock-in');
        Route::post('attendance/clock-out', [AttendanceController::class, 'clockOut'])->name('attendance.clock-out');
        Route::get('attendance/recap', [AttendanceController::class, 'recap'])->name('attendance.recap');
    });

    Route::prefix('admin')->middleware('can:viewAny,App\Models\Employee')->group(function () {

        Route::get('shifts', [ShiftController::class, 'index'])->name('admin.shifts.index');
        Route::post('shifts', [ShiftController::class, 'store'])->name('admin.shifts.store');
        Route::post('shifts/bulk', [ShiftController::class, 'bulkStore'])->name('admin.shifts.bulk-store');
        Route::put('shifts/{shift}', [ShiftController::class, 'update'])->name('admin.shifts.update');
        Route::delete('shifts/{shift}', [ShiftController::class, 'destroy'])->name('admin.shifts.destroy');
        Route::get('tables', [TableController::class, 'index'])->name('admin.tables.index');
        Route::post('tables', [TableController::class, 'store'])->name('admin.tables.store');
        Route::put('tables/{table}', [TableController::class, 'update'])->name('admin.tables.update');
        Route::delete('tables/{table}', [TableController::class, 'destroy'])->name('admin.tables.destroy');
        Route::post('tables/{table}/regenerate-token', [TableController::class, 'regenerateToken'])->middleware('throttle:5,1')->name('admin.tables.regenerate-token');

        Route::get('employees', [EmployeeController::class, 'index'])->name('admin.employees.index');
        Route::post('employees', [EmployeeController::class, 'store'])->name('admin.employees.store');
        Route::get('employees/{employee}', [EmployeeController::class, 'show'])->name('admin.employees.show');
        Route::put('employees/{employee}', [EmployeeController::class, 'update'])->name('admin.employees.update');
        Route::delete('employees/{employee}', [EmployeeController::class, 'destroy'])->name('admin.employees.destroy');

        Route::get('reports', [ReportController::class, 'index'])->name('admin.reports.index');
        Route::get('reports/top-menus', [ReportController::class, 'topMenus'])->name('admin.reports.top-menus');
        Route::get('reports/reconciliation', [ReportController::class, 'reconciliation'])->name('admin.reports.reconciliation');
        Route::get('reports/attendance', [ReportController::class, 'attendance'])->name('admin.reports.attendance');
        Route::get('reports/overtime', [ReportController::class, 'overtime'])->name('admin.reports.overtime');
        Route::get('reports/waiter-points', [ReportController::class, 'waiterPoints'])->name('admin.reports.waiter-points');
        Route::get('reports/export', [ReportController::class, 'exportSales'])->name('admin.reports.export');

        Route::get('salary-components', [SalaryComponentController::class, 'index'])->name('admin.salary-components.index');
        Route::post('salary-components', [SalaryComponentController::class, 'store'])->name('admin.salary-components.store');
        Route::put('salary-components/{salaryComponent}', [SalaryComponentController::class, 'update'])->name('admin.salary-components.update');
        Route::delete('salary-components/{salaryComponent}', [SalaryComponentController::class, 'destroy'])->name('admin.salary-components.destroy');

        Route::get('bonuses', [BonusController::class, 'index'])->name('admin.bonuses.index');
        Route::post('bonuses', [BonusController::class, 'store'])->name('admin.bonuses.store');
        Route::put('bonuses/{bonus}', [BonusController::class, 'update'])->name('admin.bonuses.update');
        Route::delete('bonuses/{bonus}', [BonusController::class, 'destroy'])->name('admin.bonuses.destroy');

        Route::get('deductions', [DeductionController::class, 'index'])->name('admin.deductions.index');
        Route::post('deductions', [DeductionController::class, 'store'])->name('admin.deductions.store');
        Route::put('deductions/{deduction}', [DeductionController::class, 'update'])->name('admin.deductions.update');
        Route::delete('deductions/{deduction}', [DeductionController::class, 'destroy'])->name('admin.deductions.destroy');

        Route::get('payslips', [PayslipController::class, 'index'])->name('admin.payslips.index');
        Route::get('payslips/{payslip}', [PayslipController::class, 'show'])->name('admin.payslips.show');
        Route::post('payslips/generate', [PayslipController::class, 'generate'])->name('admin.payslips.generate');
        Route::post('payslips/generate-single/{employee}', [PayslipController::class, 'generateSingle'])->name('admin.payslips.generate-single');
        Route::post('payslips/{payslip}/approve', [PayslipController::class, 'approve'])->name('admin.payslips.approve');
        Route::post('payslips/{payslip}/mark-paid', [PayslipController::class, 'markPaid'])->name('admin.payslips.mark-paid');

        Route::get('payroll/report', [PayrollController::class, 'index'])->name('admin.payroll.report');
        Route::get('payroll/export', [PayrollController::class, 'export'])->name('admin.payroll.export');

        Route::get('payroll/settings', [PayrollSettingController::class, 'index'])->name('admin.payroll.settings');
        Route::post('payroll/thr', [PayrollSettingController::class, 'storeThr'])->name('admin.payroll.thr.store');
        Route::put('payroll/thr/{thrSetting}', [PayrollSettingController::class, 'updateThr'])->name('admin.payroll.thr.update');
        Route::delete('payroll/thr/{thrSetting}', [PayrollSettingController::class, 'destroyThr'])->name('admin.payroll.thr.destroy');

        Route::get('activity-logs', [ActivityLogController::class, 'index'])->name('admin.activity-logs.index');

        Route::get('outlet-settings', [OutletController::class, 'edit'])->name('admin.outlet.edit');
        Route::put('outlet-settings', [OutletController::class, 'update'])->name('admin.outlet.update');
    });

    Route::prefix('admin')->middleware('can:viewAny,App\Models\MenuCategory')->group(function () {
        Route::get('menu-categories', [MenuCategoryController::class, 'index'])->name('admin.menu-categories.index');
        Route::post('menu-categories', [MenuCategoryController::class, 'store'])->name('admin.menu-categories.store');
        Route::put('menu-categories/{menuCategory}', [MenuCategoryController::class, 'update'])->name('admin.menu-categories.update');
        Route::delete('menu-categories/{menuCategory}', [MenuCategoryController::class, 'destroy'])->name('admin.menu-categories.destroy');
    });

    Route::prefix('admin')->middleware('can:viewAny,App\Models\Menu')->group(function () {
        Route::get('menus', [MenuController::class, 'index'])->name('admin.menus.index');
        Route::get('menus/create', [MenuController::class, 'create'])->name('admin.menus.create');
        Route::post('menus', [MenuController::class, 'store'])->name('admin.menus.store');
        Route::get('menus/{menu}', [MenuController::class, 'show'])->name('admin.menus.show');
        Route::get('menus/{menu}/edit', [MenuController::class, 'edit'])->name('admin.menus.edit');
        Route::put('menus/{menu}', [MenuController::class, 'update'])->name('admin.menus.update');
        Route::delete('menus/{menu}', [MenuController::class, 'destroy'])->name('admin.menus.destroy');
        Route::patch('menus/{menu}/toggle-availability', [MenuController::class, 'toggleAvailability'])->name('admin.menus.toggle-availability');
    });

    Route::prefix('admin')->middleware('can:viewAny,App\Models\OptionGroup')->group(function () {
        Route::get('option-groups', [OptionGroupController::class, 'index'])->name('admin.option-groups.index');
        Route::post('option-groups', [OptionGroupController::class, 'store'])->name('admin.option-groups.store');
        Route::put('option-groups/{optionGroup}', [OptionGroupController::class, 'update'])->name('admin.option-groups.update');
        Route::delete('option-groups/{optionGroup}', [OptionGroupController::class, 'destroy'])->name('admin.option-groups.destroy');
    });

    Route::get('owner/dashboard', [OwnerDashboardController::class, 'index'])->name('owner.dashboard')->middleware('can:viewOwnerDashboard');

    Route::get('pos', [PosController::class, 'index'])->name('pos.index');
    Route::get('pos/history', [PosController::class, 'history'])->name('pos.history');
    Route::get('pos/tables', [PosController::class, 'tables'])->name('pos.tables');
    Route::post('pos/orders', [PosController::class, 'store'])->name('pos.orders.store');
    Route::put('pos/orders/{order}/confirm-pay', [PosController::class, 'confirmPay'])->name('pos.orders.confirm-pay');
    Route::put('pos/orders/{order}/items', [PosController::class, 'updateItems'])->name('pos.orders.update-items');
    Route::delete('pos/orders/{order}', [PosController::class, 'destroyPending'])->name('pos.orders.destroy-pending');
    Route::post('pos/orders/initiate-payment', [PosController::class, 'initiatePayment'])->name('pos.orders.initiate-payment');
    Route::get('pos/orders/{order}/qris-status', [PosController::class, 'qrisStatus'])->name('pos.orders.qris-status');
    Route::post('pos/tables/{table}/release', [PosController::class, 'releaseTable'])->name('pos.tables.release');
    Route::post('pos/tables/{table}/move/{target}', [PosController::class, 'moveTable'])->name('pos.tables.move');
    Route::post('pos/tables/{table}/merge/{target}', [PosController::class, 'mergeTable'])->name('pos.tables.merge');
    Route::post('pos/tables/{table}/lock', [PosController::class, 'lockTable'])->name('pos.tables.lock');
    Route::post('pos/tables/{table}/unlock', [PosController::class, 'unlockTable'])->name('pos.tables.unlock');
    Route::post('pos/verify-approval', [PosController::class, 'verifyApproval'])->middleware('throttle:5,1')->name('pos.verify-approval');

    Route::get('pos/sessions', [PosSessionController::class, 'index'])->name('pos.sessions.index');
    Route::post('pos/sessions', [PosSessionController::class, 'store'])->name('pos.sessions.store');
    Route::get('pos/sessions/{posSession}', [PosSessionController::class, 'show'])->name('pos.sessions.show');
    Route::post('pos/sessions/{posSession}/close', [PosSessionController::class, 'close'])->name('pos.sessions.close');

    Route::get('kitchen', [KitchenDisplayController::class, 'index'])->name('kitchen.index');
    Route::patch('orders/{order}/status', [OrderController::class, 'updateStatus'])->name('orders.update-status');

    Route::get('waiter/ready', [WaiterController::class, 'index'])
        ->middleware('can:accessWaiterDashboard')
        ->name('waiter.ready');
    Route::patch('orders/{order}/serve', [WaiterController::class, 'serve'])
        ->middleware('can:serve,order')
        ->name('orders.serve');

    Route::get('payslips/{payslip}/pdf', [PdfController::class, 'payslip'])->name('payslips.pdf');
});

Route::get('t/{tableToken}', [SelfOrderController::class, 'show'])->name('self-order.show');
Route::get('t/{tableToken}/orders/{order}/status', [SelfOrderController::class, 'orderStatus'])->name('self-order.status');
Route::get('t/{tableToken}/orders/{order}/poll-status', [SelfOrderController::class, 'pollStatus'])->name('self-order.poll-status');
Route::post('t/{tableToken}/orders', [SelfOrderController::class, 'store'])
    ->middleware('throttle:5,1')
    ->name('self-order.orders.store');
Route::post('t/{tableToken}/pay', [SelfOrderController::class, 'pay'])->middleware('throttle:5,1')->name('self-order.pay');
Route::get('t/{tableToken}/orders/{order}/payment-status', [SelfOrderController::class, 'paymentStatus'])->name('self-order.payment-status');

Route::post('webhooks/midtrans/notification', [MidtransWebhookController::class, 'notification'])
    ->withoutMiddleware([VerifyCsrfToken::class])
    ->middleware(['throttle:20,1', VerifyMidtransIp::class])
    ->name('webhooks.midtrans.notification');

Route::inertia('offline', 'welcome')->name('offline');

require __DIR__.'/settings.php';
