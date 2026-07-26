<?php

namespace App\Http\Controllers;

use App\Models\Outlet;
use App\Models\ThrSetting;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PayrollSettingController extends Controller
{
    public function index(): Response
    {
        $outlet = Outlet::first();
        $thrSettings = ThrSetting::where('outlet_id', $outlet?->id)->get();

        return Inertia::render('admin/payroll/Settings', [
            'thrSettings' => $thrSettings,
        ]);
    }

    public function storeThr(Request $request): RedirectResponse
    {
        $outlet = Outlet::first();

        $validated = $request->validate([
            'calculation_type' => 'required|in:flat,percentage,tenure_ratio',
            'value' => 'required|numeric|min:0',
            'notes' => 'nullable|string|max:500',
        ]);

        ThrSetting::create([
            ...$validated,
            'outlet_id' => $outlet->id,
            'is_active' => true,
        ]);

        return redirect()->back()->with('success', 'Pengaturan THR berhasil disimpan.');
    }

    public function updateThr(Request $request, ThrSetting $thrSetting): RedirectResponse
    {
        $validated = $request->validate([
            'calculation_type' => 'required|in:flat,percentage,tenure_ratio',
            'value' => 'required|numeric|min:0',
            'is_active' => 'boolean',
            'notes' => 'nullable|string|max:500',
        ]);

        $thrSetting->update($validated);

        return redirect()->back()->with('success', 'Pengaturan THR berhasil diperbarui.');
    }

    public function destroyThr(ThrSetting $thrSetting): RedirectResponse
    {
        $thrSetting->delete();

        return redirect()->back()->with('success', 'Pengaturan THR berhasil dihapus.');
    }
}
