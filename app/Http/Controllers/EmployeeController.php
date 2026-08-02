<?php

namespace App\Http\Controllers;

use App\Models\Employee;
use App\Models\Outlet;
use App\Models\User;
use App\Services\ActivityLogService;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Inertia\Inertia;
use Inertia\Response;
use Spatie\Permission\Models\Role;

class EmployeeController extends Controller
{
    public function __construct(
        private readonly ActivityLogService $activityLog,
    ) {}

    public function index(Request $request): Response
    {
        $outlet = Outlet::first();
        $query = $this->applySearch(Employee::with('user')->where('outlet_id', $outlet?->id), $request);

        $employees = $query->orderBy('created_at', 'desc')->paginate(10)->withQueryString();
        $this->attachRoles($employees);
        $roles = Role::all()->pluck('name');

        return Inertia::render('admin/employees/Index', [
            'employees' => $employees,
            'roles' => $roles,
            'filters' => $request->only(['search']),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $this->validateData($request);
        $user = $this->storeUser($validated);
        $outlet = Outlet::first();

        $this->storeEmployee($validated, $user, $outlet);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Karyawan berhasil ditambahkan.']);

        return redirect()->back();
    }

    public function show(Employee $employee): Response
    {
        $employee->load('user');
        $employee->role = $employee->user->roles->pluck('name')->first();

        return Inertia::render('admin/employees/Show', [
            'employee' => $employee,
        ]);
    }

    public function update(Request $request, Employee $employee): RedirectResponse
    {
        $validated = $this->validateData($request, $employee);

        $employee->user->update([
            'name' => $validated['name'],
            'email' => $validated['email'],
        ]);
        $employee->user->syncRoles([$validated['role']]);
        $this->updateEmployee($validated, $employee);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Karyawan berhasil diperbarui.']);

        return redirect()->back();
    }

    public function destroy(Request $request, Employee $employee): RedirectResponse
    {
        $user = $employee->user;

        $this->activityLog->log(
            $request->user(), 'employee_deleted',
            Employee::class, $employee->id,
            "Karyawan {$user->name} ({$employee->position}) dihapus",
            [
                'employee_name' => $user->name,
                'position' => $employee->position,
                'deleted_user_id' => $user->id,
            ],
        );

        $employee->delete();
        $user->delete();

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Karyawan berhasil dihapus.']);

        return redirect()->back();
    }

    protected function applySearch(Builder $query, Request $request): Builder
    {
        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->whereHas('user', function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%");
            })->orWhere('position', 'like', "%{$search}%");
        }

        return $query;
    }

    protected function attachRoles(LengthAwarePaginator $employees): void
    {
        $employees->getCollection()->transform(function ($employee) {
            $employee->role = $employee->user->roles->pluck('name')->first();

            return $employee;
        });
    }

    protected function validateData(Request $request, ?Employee $employee = null): array
    {
        $emailRule = $employee ? 'required|email|unique:users,email,'.$employee->user_id : 'required|email|unique:users,email';
        $rules = [
            'name' => 'required|string|max:255',
            'email' => $emailRule,
            'phone' => 'nullable|string|max:20',
            'position' => 'required|string|max:255',
            'role' => 'required|string|exists:roles,name',
            'join_date' => 'required|date',
            'base_salary' => 'required|numeric|min:0',
            'salary_type' => 'required|in:monthly,daily',
        ];

        if (! $employee) {
            $rules['password'] = 'required|string|min:8';
        } else {
            $rules['is_active'] = 'boolean';
        }

        return $request->validate($rules);
    }

    protected function storeUser(array $validated): User
    {
        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'email_verified_at' => now(),
        ]);

        $user->assignRole($validated['role']);

        return $user;
    }

    protected function storeEmployee(array $validated, User $user, Outlet $outlet): void
    {
        Employee::create([
            'user_id' => $user->id,
            'outlet_id' => $outlet->id,
            'phone' => $validated['phone'],
            'position' => $validated['position'],
            'join_date' => $validated['join_date'],
            'base_salary' => $validated['base_salary'],
            'salary_type' => $validated['salary_type'],
            'is_active' => true,
        ]);
    }

    protected function updateEmployee(array $validated, Employee $employee): void
    {
        $employee->update([
            'phone' => $validated['phone'],
            'position' => $validated['position'],
            'is_active' => $validated['is_active'] ?? $employee->is_active,
            'join_date' => $validated['join_date'],
            'base_salary' => $validated['base_salary'],
            'salary_type' => $validated['salary_type'],
        ]);
    }
}
