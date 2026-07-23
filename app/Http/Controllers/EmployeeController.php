<?php

namespace App\Http\Controllers;

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
    public function index(): Response
    {
        $outlet = Outlet::first();
        $employees = Employee::with('user')
            ->where('outlet_id', $outlet?->id)
            ->orderBy('created_at', 'desc')
            ->get();

        $roles = Role::all()->pluck('name');

        return Inertia::render('admin/employees/Index', [
            'employees' => $employees,
            'roles' => $roles,
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

        return redirect()->back()->with('success', 'Karyawan berhasil ditambahkan.');
    }

    public function show(Employee $employee): Response
    {
        $employee->load('user');

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
            'base_salary' => $validated['base_salary'],
            'salary_type' => $validated['salary_type'],
        ]);

        return redirect()->back()->with('success', 'Karyawan berhasil diperbarui.');
    }

    public function destroy(Employee $employee): RedirectResponse
    {
        $user = $employee->user;
        $employee->delete();
        $user->delete();

        return redirect()->back()->with('success', 'Karyawan berhasil dihapus.');
    }
}
