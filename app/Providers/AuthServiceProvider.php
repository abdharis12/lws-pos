<?php

namespace App\Providers;

use App\Models\Employee;
use App\Models\Meja;
use App\Models\Menu;
use App\Models\MenuCategory;
use App\Models\OptionGroup;
use App\Models\OptionItem;
use App\Models\Order;
use App\Policies\EmployeePolicy;
use App\Policies\MejaPolicy;
use App\Policies\MenuCategoryPolicy;
use App\Policies\MenuPolicy;
use App\Policies\OptionGroupPolicy;
use App\Policies\OptionItemPolicy;
use App\Policies\OrderPolicy;
use Illuminate\Foundation\Support\Providers\AuthServiceProvider as ServiceProvider;

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
    ];

    public function boot(): void
    {
        $this->registerPolicies();
    }
}
