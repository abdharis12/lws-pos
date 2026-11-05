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
        // 1. Ambil password dari .env atau generate acak jika tidak diset
        $defaultPassword = env('SEEDER_DEFAULT_PASSWORD', Str::random(12));
        $adminPassword = env('SEEDER_ADMIN_DEFAULT_PASSWORD', Str::random(12));

        $roles = ['Owner', 'Admin', 'Cashier', 'Kitchen Staff', 'Waiter'];

        foreach ($roles as $role) {
            Role::firstOrCreate(['name' => $role]);
        }

        $outlet = Outlet::create([
            'name' => "LW's by Bubur Kang LW",
            'address' => 'Jl. Angkatan 45 Palembang, Sumatera Selatan',
            'phone' => '082175686871',
            'code' => 'LWS01',
            'is_active' => true,
        ]);

        // Buat Admin User
        $adminUser = User::create([
            'name' => "Admin LW's by Bubur Kang LW",
            'email' => 'admin@lws.my.id',
            'password' => Hash::make($adminPassword),
            'email_verified_at' => now(),
        ]);
        $adminUser->assignRole('Owner');

        Employee::create([
            'user_id' => $adminUser->id,
            'outlet_id' => $outlet->id,
            'phone' => '082175686871',
            'position' => 'admin',
            'join_date' => now()->subYear(),
            'base_salary' => 7500000,
            'salary_type' => 'monthly',
            'is_active' => true,
        ]);

        // Buat Karyawan Lainnya
        $employeeData = [
            ['name' => 'Dwi', 'email' => 'cashier@lws.my.id', 'position' => 'Kasir', 'role' => 'Cashier', 'salary' => 1500000],
            ['name' => 'Aziz', 'email' => 'aziz@lws.my.id', 'position' => 'Dapur', 'role' => 'Kitchen Staff', 'salary' => 1500000],
            ['name' => 'Riza', 'email' => 'riza@lws.my.id', 'position' => 'Waiter', 'role' => 'Waiter', 'salary' => 1500000],
            ['name' => 'Arif', 'email' => 'arif@lws.my.id', 'position' => 'Waiter', 'role' => 'Waiter', 'salary' => 1500000],
            ['name' => 'Taufik', 'email' => 'taufik@lws.my.id', 'position' => 'Dapur', 'role' => 'Kitchen Staff', 'salary' => 1500000],
            ['name' => 'Jenny', 'email' => 'jenny@lws.my.id', 'position' => 'Waiter', 'role' => 'Waiter', 'salary' => 1500000],
            ['name' => 'Putri', 'email' => 'putri@lws.my.id', 'position' => 'Waiter', 'role' => 'Waiter', 'salary' => 1500000],
            ['name' => 'Mey', 'email' => 'mey@lws.my.id', 'position' => 'Waiter', 'role' => 'Waiter', 'salary' => 1500000],
        ];

        foreach ($employeeData as $data) {
            $user = User::create([
                'name' => $data['name'],
                'email' => $data['email'],
                'password' => Hash::make($defaultPassword),
                'email_verified_at' => now(),
            ]);
            $user->assignRole($data['role']);

            Employee::create([
                'user_id' => $user->id,
                'outlet_id' => $outlet->id,
                'phone' => fake()->phoneNumber(),
                'position' => $data['position'],
                'join_date' => now()->subMonths(fake()->numberBetween(3, 12)),
                'base_salary' => $data['salary'],
                'salary_type' => 'monthly',
                'is_active' => true,
            ]);
        }

        // Tampilkan info password ke Terminal CLI
        $this->command->info('');
        $this->command->warn('==================================================');
        $this->command->info(" SEEDING BERHASIL!");
        $this->command->info(" Password Default Akun: {$defaultPassword}");
        $this->command->warn('==================================================');
        $this->command->info('');

        // Seeder Kategori, Menu, Option, Meja tetap sama...
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
            ['category' => 'Bubur', 'name' => 'Bubur Ayam Spesial', 'price' => 20000],
            ['category' => 'Bubur', 'name' => 'Bubur Ayam Original', 'price' => 15000],
            ['category' => 'Bubur', 'name' => 'Bubur Daging', 'price' => 32000],
            ['category' => 'Bubur', 'name' => 'Bubur Ikan', 'price' => 23000],
            ['category' => 'Bubur', 'name' => 'Bubur Jamur', 'price' => 25000],
            ['category' => 'Bubur', 'name' => 'Bubur Manado', 'price' => 32000],

            ['category' => 'Makanan', 'name' => 'Coto Makassar', 'price' => 38000],
            ['category' => 'Makanan', 'name' => 'Lontong Sayur', 'price' => 28000],
            ['category' => 'Makanan', 'name' => 'Nasi Kuning Kang LW', 'price' => 29000],
            ['category' => 'Makanan', 'name' => 'Nasi Rames LW (Ayam Panggang)', 'price' => 34000],
            ['category' => 'Makanan', 'name' => 'Nasi Rames LW (Ikan Cakalang)', 'price' => 30000],

            ['category' => 'Minuman', 'name' => 'Air Mineral', 'price' => 6000],
            ['category' => 'Minuman', 'name' => 'Air Putih Hangat', 'price' => 3000],
            ['category' => 'Minuman', 'name' => 'Coffe Latte', 'price' => 22000],
            ['category' => 'Minuman', 'name' => 'Es Kosong', 'price' => 3000],
            ['category' => 'Minuman', 'name' => 'Es Teh Manis', 'price' => 12000],
            ['category' => 'Minuman', 'name' => 'Fruit Punch', 'price' => 23000],
            ['category' => 'Minuman', 'name' => 'Manggo Matcha', 'price' => 25000],
            ['category' => 'Minuman', 'name' => 'Matcha Latte', 'price' => 23000],
            ['category' => 'Minuman', 'name' => 'Refresher Coconut', 'price' => 21000],
            ['category' => 'Minuman', 'name' => 'Sunrise', 'price' => 20000],

            ['category' => 'Snack', 'name' => 'Bakwan Goreng', 'price' => 12000],
            ['category' => 'Snack', 'name' => 'Brown Sugar Pudding', 'price' => 15000],
            ['category' => 'Snack', 'name' => 'Cendol', 'price' => 20000],
            ['category' => 'Snack', 'name' => 'Cheese Cake', 'price' => 35000],
            ['category' => 'Snack', 'name' => 'Fruit Pudding', 'price' => 15000],
            ['category' => 'Snack', 'name' => 'Kue Jagung', 'price' => 10000],
            ['category' => 'Snack', 'name' => 'Lalampa', 'price' => 12000],
            ['category' => 'Snack', 'name' => 'Lumpia Goreng', 'price' => 15000],
            ['category' => 'Snack', 'name' => 'Manisan Buah Potong', 'price' => 20000],
            ['category' => 'Snack', 'name' => 'Pie Buah', 'price' => 22000],
        ];

        foreach ($menuItems as $item) {
            $category = MenuCategory::where('name', $item['category'])->where('outlet_id', $outlet->id)->first();

            Menu::create([
                'category_id' => $category->id,
                'name' => $item['name'],
                'description' => $item['name'] . ' lezat khas LWs by Bubur Kang Lw',
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
                ['name' => 'Daging', 'price' => 10000, 'sort' => 1],
                ['name' => 'Telur', 'price' => 5000, 'sort' => 2],
                ['name' => 'Suwiran Ayam', 'price' => 10000, 'sort' => 3],
                ['name' => 'Ikan', 'price' => 10000, 'sort' => 4],
            ]],
            ['group' => 'Ukuran', 'items' => [
                ['name' => 'Kecil', 'price' => 0, 'sort' => 1],
                ['name' => 'Sedang', 'price' => 2000, 'sort' => 2],
                ['name' => 'Besar', 'price' => 4000, 'sort' => 3],
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
            ['code' => 'L1-01', 'capacity' => 3, 'floor' => 'Lantai 1'],
            ['code' => 'L1-02', 'capacity' => 3, 'floor' => 'Lantai 1'],
            ['code' => 'L1-03', 'capacity' => 2, 'floor' => 'Lantai 1'],
            ['code' => 'L1-04', 'capacity' => 2, 'floor' => 'Lantai 1'],
            ['code' => 'L1-05', 'capacity' => 2, 'floor' => 'Lantai 1'],
            ['code' => 'BAR-01', 'capacity' => 1, 'floor' => 'Lantai 1'],
            ['code' => 'BAR-02', 'capacity' => 1, 'floor' => 'Lantai 1'],
            ['code' => 'BAR-03', 'capacity' => 1, 'floor' => 'Lantai 1'],
            ['code' => 'BAR-04', 'capacity' => 1, 'floor' => 'Lantai 1'],
            ['code' => 'BAR-05', 'capacity' => 1, 'floor' => 'Lantai 1'],
            ['code' => 'L2-01', 'capacity' => 4, 'floor' => 'Lantai 2'],
            ['code' => 'L2-02', 'capacity' => 4, 'floor' => 'Lantai 2'],
            ['code' => 'VIP-01', 'capacity' => 6, 'floor' => 'VIP Room'],
            ['code' => 'VIP-02', 'capacity' => 6, 'floor' => 'VIP Room'],
            ['code' => 'TR-01', 'capacity' => 4, 'floor' => 'Teras'],
            ['code' => 'TR-02', 'capacity' => 6, 'floor' => 'Teras'],
        ];

        foreach ($tables as $table) {
            Meja::create([
                'outlet_id' => $outlet->id,
                'code' => $table['code'],
                'table_token' => Str::random(40),
                'capacity' => $table['capacity'],
                'floor' => $table['floor'],
                'status' => 'available',
            ]);
        }

        $this->call(SetStationForExistingMenusSeeder::class);
    }
}
