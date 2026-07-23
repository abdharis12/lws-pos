<?php

namespace Database\Seeders;

use App\Models\Employee;
use App\Models\Meja;
use App\Models\Menu;
use App\Models\MenuCategory;
use App\Models\OptionGroup;
use App\Models\OptionItem;
use App\Models\Outlet;
use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Spatie\Permission\Models\Role;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    public function run(): void
    {
        $roles = ['Owner', 'Admin', 'Cashier', 'Kitchen Staff', 'Waiter'];

        foreach ($roles as $role) {
            Role::firstOrCreate(['name' => $role]);
        }

        $outlet = Outlet::create([
            'name' => "LW's by Bubur Kang LW",
            'address' => 'Jl. Angkatan 45 Palembang, Sumatera Selatan',
            'phone' => '021-12345678',
            'code' => 'BK01',
            'is_active' => true,
        ]);

        $adminUser = User::create([
            'name' => 'Admin Bubur Kang LW',
            'email' => 'admin@buburkanglw.com',
            'password' => Hash::make('password'),
            'email_verified_at' => now(),
        ]);
        $adminUser->assignRole('Owner');

        Employee::create([
            'user_id' => $adminUser->id,
            'outlet_id' => $outlet->id,
            'phone' => '081234567890',
            'position' => 'admin',
            'join_date' => now()->subYear(),
            'base_salary' => 7500000,
            'salary_type' => 'monthly',
            'is_active' => true,
        ]);

        $employeeUsers = [];
        $employeeData = [
            ['name' => 'Kasir Budi', 'email' => 'kasir@buburkanglw.com', 'position' => 'kasir', 'role' => 'Cashier', 'salary' => 4500000],
            ['name' => 'Koki Ahmad', 'email' => 'koki@buburkanglw.com', 'position' => 'dapur', 'role' => 'Kitchen Staff', 'salary' => 5000000],
            ['name' => 'Waiter Siti', 'email' => 'waiter@buburkanglw.com', 'position' => 'waiter', 'role' => 'Waiter', 'salary' => 4000000],
            ['name' => 'Manager Dewi', 'email' => 'manager@buburkanglw.com', 'position' => 'admin', 'role' => 'Admin', 'salary' => 6500000],
        ];

        foreach ($employeeData as $data) {
            $user = User::create([
                'name' => $data['name'],
                'email' => $data['email'],
                'password' => Hash::make('password'),
                'email_verified_at' => now(),
            ]);
            $user->assignRole($data['role']);

            $employee = Employee::create([
                'user_id' => $user->id,
                'outlet_id' => $outlet->id,
                'phone' => fake()->phoneNumber(),
                'position' => $data['position'],
                'join_date' => now()->subMonths(fake()->numberBetween(3, 12)),
                'base_salary' => $data['salary'],
                'salary_type' => 'monthly',
                'is_active' => true,
            ]);

            $employeeUsers[] = $employee;
        }

        $categories = [
            ['name' => 'Bubur', 'sort_order' => 1],
            ['name' => 'Makanan', 'sort_order' => 2],
            ['name' => 'Minuman', 'sort_order' => 3],
            ['name' => 'Snack', 'sort_order' => 4],
        ];

        foreach ($categories as $cat) {
            MenuCategory::create([
                'outlet_id' => $outlet->id,
                'name' => $cat['name'],
                'sort_order' => $cat['sort_order'],
                'is_active' => true,
            ]);
        }

        $menuItems = [
            ['category' => 'Bubur', 'name' => 'Bubur Ayam Spesial', 'price' => 25000],
            ['category' => 'Bubur', 'name' => 'Bubur Ayam Cakwe', 'price' => 22000],
            ['category' => 'Bubur', 'name' => 'Bubur Ayam Telur', 'price' => 20000],
            ['category' => 'Bubur', 'name' => 'Bubur Ketan Hitam', 'price' => 18000],
            ['category' => 'Bubur', 'name' => 'Bubur Sumsum', 'price' => 15000],
            ['category' => 'Makanan', 'name' => 'Nasi Goreng', 'price' => 28000],
            ['category' => 'Makanan', 'name' => 'Mie Goreng', 'price' => 25000],
            ['category' => 'Makanan', 'name' => 'Mie Ayam', 'price' => 22000],
            ['category' => 'Minuman', 'name' => 'Es Teh Manis', 'price' => 5000],
            ['category' => 'Minuman', 'name' => 'Es Jeruk', 'price' => 7000],
            ['category' => 'Minuman', 'name' => 'Teh Hangat', 'price' => 4000],
            ['category' => 'Minuman', 'name' => 'Kopi Susu', 'price' => 12000],
            ['category' => 'Minuman', 'name' => 'Air Mineral', 'price' => 3000],
            ['category' => 'Snack', 'name' => 'Pisang Goreng', 'price' => 10000],
            ['category' => 'Snack', 'name' => 'Tahu Goreng', 'price' => 8000],
            ['category' => 'Snack', 'name' => 'Tempe Goreng', 'price' => 8000],
        ];

        foreach ($menuItems as $item) {
            $category = MenuCategory::where('name', $item['category'])->where('outlet_id', $outlet->id)->first();

            Menu::create([
                'category_id' => $category->id,
                'name' => $item['name'],
                'description' => $item['name'].' lezat khas Bubur Kang Lw',
                'price' => $item['price'],
                'photo_path' => null,
                'is_available' => true,
            ]);
        }

        $optionGroups = [
            [
                'name' => 'Level Pedas',
                'selection_type' => 'single',
                'is_required' => true,
                'min_select' => 1,
                'max_select' => 1,
            ],
            [
                'name' => 'Topping',
                'selection_type' => 'multiple',
                'is_required' => false,
                'min_select' => 0,
                'max_select' => 3,
            ],
            [
                'name' => 'Ukuran',
                'selection_type' => 'single',
                'is_required' => true,
                'min_select' => 1,
                'max_select' => 1,
            ],
        ];

        foreach ($optionGroups as $group) {
            OptionGroup::create([
                'outlet_id' => $outlet->id,
                'name' => $group['name'],
                'selection_type' => $group['selection_type'],
                'is_required' => $group['is_required'],
                'min_select' => $group['min_select'],
                'max_select' => $group['max_select'],
                'is_active' => true,
            ]);
        }

        $optionItems = [
            ['group' => 'Level Pedas', 'items' => [
                ['name' => 'Tidak Pedas', 'price' => 0, 'sort' => 1],
                ['name' => 'Pedas Level 1', 'price' => 0, 'sort' => 2],
                ['name' => 'Pedas Level 2', 'price' => 0, 'sort' => 3],
                ['name' => 'Pedas Level 3', 'price' => 0, 'sort' => 4],
            ]],
            ['group' => 'Topping', 'items' => [
                ['name' => 'Cakwe', 'price' => 5000, 'sort' => 1],
                ['name' => 'Telur', 'price' => 4000, 'sort' => 2],
                ['name' => 'Suwiran Ayam', 'price' => 8000, 'sort' => 3],
                ['name' => 'Kacang Kedelai', 'price' => 3000, 'sort' => 4],
            ]],
            ['group' => 'Ukuran', 'items' => [
                ['name' => 'Kecil', 'price' => 0, 'sort' => 1],
                ['name' => 'Sedang', 'price' => 3000, 'sort' => 2],
                ['name' => 'Besar', 'price' => 6000, 'sort' => 3],
            ]],
        ];

        foreach ($optionItems as $groupData) {
            $group = OptionGroup::where('name', $groupData['group'])->where('outlet_id', $outlet->id)->first();

            foreach ($groupData['items'] as $item) {
                OptionItem::create([
                    'option_group_id' => $group->id,
                    'name' => $item['name'],
                    'price_adjustment' => $item['price'],
                    'is_available' => true,
                    'sort_order' => $item['sort'],
                ]);
            }
        }

        $tables = [
            ['code' => 'T01', 'capacity' => 2],
            ['code' => 'T02', 'capacity' => 2],
            ['code' => 'T03', 'capacity' => 4],
            ['code' => 'T04', 'capacity' => 4],
            ['code' => 'T05', 'capacity' => 6],
            ['code' => 'T06', 'capacity' => 6],
            ['code' => 'T07', 'capacity' => 8],
            ['code' => 'T08', 'capacity' => 8],
            ['code' => 'VIP1', 'capacity' => 6],
            ['code' => 'VIP2', 'capacity' => 6],
        ];

        foreach ($tables as $table) {
            Meja::create([
                'outlet_id' => $outlet->id,
                'code' => $table['code'],
                'table_token' => Str::random(40),
                'capacity' => $table['capacity'],
                'status' => 'available',
            ]);
        }
    }
}
