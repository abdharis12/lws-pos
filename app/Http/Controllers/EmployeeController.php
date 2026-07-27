<?php

namespace App\Http\Controllers;

use App\Models\ActivityLog;
use App\Models\Employee;
use App\Models\Outlet;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Inertia\Inertia;
use Inertia\Response;
use Spatie\Permission\Models\Role;

class EmployeeController extends Controller
{
    public function index(Request $request): Response
    {
        $outlet = Outlet::first();

        $query = Employee::with('user')
            ->where('outlet_id', $outlet?->id);

        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->whereHas('user', function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%");
            })->orWhere('position', 'like', "%{$search}%");
        }

        $employees = $query->orderBy('created_at', 'desc')
            ->paginate(10)
            ->withQueryString();

        $employees->getCollection()->transform(function ($employee) {
            $employee->role = $employee->user->roles->pluck('name')->first();

            return $employee;
        });

        $roles = Role::all()->pluck('name');

        return Inertia::render('admin/employees/Index', [
            'employees' => $employees,
            'roles' => $roles,
            'filters' => $request->only(['search']),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'password' => 'required|string|min:8',
            'phone' => 'nullable|string|max:20',
            'position' => 'required|string|max:255',
            'role' => 'required|string|exists:roles,name',
            'join_date' => 'required|date',
            'base_salary' => 'required|numeric|min:0',
            'salary_type' => 'required|in:monthly,daily',
        ]);

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'email_verified_at' => now(),
        ]);

        $user->assignRole($validated['role']);

        $outlet = Outlet::first();

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

        return redirect()->back()->with('toast', ['type' => 'success', 'message' => 'Karyawan berhasil ditambahkan.']);
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
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email,'.$employee->user_id,
            'phone' => 'nullable|string|max:20',
            'position' => 'required|string|max:255',
            'role' => 'required|string|exists:roles,name',
            'is_active' => 'boolean',
            'join_date' => 'required|date',
            'base_salary' => 'required|numeric|min:0',
            'salary_type' => 'required|in:monthly,daily',
        ]);

        $employee->user->update([
            'name' => $validated['name'],
            'email' => $validated['email'],
        ]);

        $employee->user->syncRoles([$validated['role']]);

        $employee->update([
            'phone' => $validated['phone'],
            'position' => $validated['position'],
            'is_active' => $validated['is_active'] ?? $employee->is_active,
            'join_date' => $validated['join_date'],
            'base_salary' => $validated['base_salary'],
            'salary_type' => $validated['salary_type'],
        ]);

        return redirect()->back()->with('toast', ['type' => 'success', 'message' => 'Karyawan berhasil diperbarui.']);
    }

    public function destroy(Request $request, Employee $employee): RedirectResponse
    {
        $user = $employee->user;

        ActivityLog::create([
            'user_id' => $request->user()->id,
            'action' => 'employee_deleted',
            'subject_type' => Employee::class,
            'subject_id' => $employee->id,
            'description' => "Karyawan {$user->name} ({$employee->position}) dihapus",
            'metadata' => [
                'employee_name' => $user->name,
                'position' => $employee->position,
                'deleted_user_id' => $user->id,
            ],
        ]);

        $employee->delete();
        $user->delete();

        return redirect()->back()->with('toast', ['type' => 'success', 'message' => 'Karyawan berhasil dihapus.']);
    }
}
