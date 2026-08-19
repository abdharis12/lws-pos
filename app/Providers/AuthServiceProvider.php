<?php

namespace App\Providers;

use App\Models\ActivityLog;
use App\Models\Attendance;
use App\Models\Bonus;
use App\Models\Deduction;
use App\Models\Employee;
use App\Models\Meja;
use App\Models\Menu;
use App\Models\MenuCategory;
use App\Models\OptionGroup;
use App\Models\OptionItem;
use App\Models\Order;
use App\Models\Outlet;
use App\Models\Payslip;
use App\Models\Payment;
use App\Models\PosSession;
use App\Models\SalaryComponent;
use App\Models\Shift;
use App\Models\TableSession;
use App\Models\ThrSetting;
use App\Models\User;
use App\Policies\ActivityLogPolicy;
use App\Policies\AttendancePolicy;
use App\Policies\BonusPolicy;
use App\Policies\DeductionPolicy;
use App\Policies\EmployeePolicy;
use App\Policies\MejaPolicy;
use App\Policies\MenuCategoryPolicy;
use App\Policies\MenuPolicy;
use App\Policies\OptionGroupPolicy;
use App\Policies\OptionItemPolicy;
use App\Policies\OrderPolicy;
use App\Policies\OutletPolicy;
use App\Policies\OwnerDashboardPolicy;
use App\Policies\PayslipPolicy;
use App\Policies\PaymentPolicy;
use App\Policies\PosSessionPolicy;
use App\Policies\SalaryComponentPolicy;
use App\Policies\ShiftPolicy;
use App\Policies\TableSessionPolicy;
use App\Policies\ThrSettingPolicy;
use Illuminate\Foundation\Support\Providers\AuthServiceProvider as ServiceProvider;
use Illuminate\Support\Facades\Gate;

class AuthServiceProvider extends ServiceProvider
{
    protected $policies = [
        Menu::class => MenuPolicy::class,
        MenuCategory::class => MenuCategoryPolicy::class,
        Meja::class => MejaPolicy::class,
        Order::class => OrderPolicy::class,
        Employee::class => EmployeePolicy::class,
        OptionGroup::class => OptionGroupPolicy::class,
        OptionItem::class => OptionItemPolicy::class,
        SalaryComponent::class => SalaryComponentPolicy::class,
        Bonus::class => BonusPolicy::class,
        Deduction::class => DeductionPolicy::class,
        Payslip::class => PayslipPolicy::class,
        ActivityLog::class => ActivityLogPolicy::class,
        Shift::class => ShiftPolicy::class,
        PosSession::class => PosSessionPolicy::class,
        Outlet::class => OutletPolicy::class,
        ThrSetting::class => ThrSettingPolicy::class,
        Payment::class => PaymentPolicy::class,
        TableSession::class => TableSessionPolicy::class,
        Attendance::class => AttendancePolicy::class,
    ];

    public function boot(): void
    {
        $this->registerPolicies();

        Gate::define('viewOwnerDashboard', [OwnerDashboardPolicy::class, 'view']);

        Gate::define('accessAttendance', function (User $user) {
            return $user->hasAnyRole(['Owner', 'Admin']) || $user->employee()->exists();
        });

        Gate::define('accessWaiterDashboard', function (User $user) {
            return $user->hasAnyRole(['Owner', 'Admin', 'Cashier', 'Waiter']) || $user->employee()->exists();
        });

        Gate::define('accessPos', function (User $user) {
            return $user->hasAnyRole(['Owner', 'Admin', 'Cashier']);
        });

        Gate::define('accessKitchen', function (User $user) {
            return $user->hasAnyRole(['Owner', 'Admin', 'Cashier', 'Kitchen Staff']);
        });

        Gate::define('manageEmployees', function (User $user) {
            return $user->hasAnyRole(['Owner', 'Admin']);
        });

        Gate::define('manageShifts', function (User $user) {
            return $user->hasAnyRole(['Owner', 'Admin']);
        });

        Gate::define('manageTables', function (User $user) {
            return $user->hasAnyRole(['Owner', 'Admin']);
        });

        Gate::define('manageReports', function (User $user) {
            return $user->hasAnyRole(['Owner', 'Admin']);
        });

        Gate::define('manageSalaryComponents', function (User $user) {
            return $user->hasAnyRole(['Owner', 'Admin']);
        });

        Gate::define('manageBonuses', function (User $user) {
            return $user->hasAnyRole(['Owner', 'Admin']);
        });

        Gate::define('manageDeductions', function (User $user) {
            return $user->hasAnyRole(['Owner', 'Admin']);
        });

        Gate::define('managePayslips', function (User $user) {
            return $user->hasAnyRole(['Owner', 'Admin']);
        });

        Gate::define('managePayroll', function (User $user) {
            return $user->hasAnyRole(['Owner', 'Admin']);
        });

        Gate::define('managePayrollSettings', function (User $user) {
            return $user->hasAnyRole(['Owner', 'Admin']);
        });

        Gate::define('viewActivityLogs', function (User $user) {
            return $user->hasAnyRole(['Owner', 'Admin']);
        });

        Gate::define('manageOutletSettings', function (User $user) {
            return $user->hasAnyRole(['Owner', 'Admin']);
        });

        Gate::define('manageMenuCategories', function (User $user) {
            return $user->hasAnyRole(['Owner', 'Admin', 'Cashier', 'Kitchen Staff', 'Waiter']);
        });

        Gate::define('manageMenus', function (User $user) {
            return $user->hasAnyRole(['Owner', 'Admin', 'Cashier', 'Kitchen Staff', 'Waiter']);
        });

        Gate::define('manageOptionGroups', function (User $user) {
            return $user->hasAnyRole(['Owner', 'Admin', 'Cashier', 'Kitchen Staff']);
        });
    }
}
