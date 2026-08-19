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
        $this->authorize('viewAny', ThrSetting::class);

        $outletId = $this->outletId();
        $thrSettings = ThrSetting::where('outlet_id', $outletId)->get();

        return Inertia::render('admin/payroll/Settings', [
            'thrSettings' => $thrSettings,
        ]);
    }

    public function storeThr(Request $request): RedirectResponse
    {
        $this->authorize('create', ThrSetting::class);

        $outletId = $this->outletId();

        $validated = $request->validate([
            'calculation_type' => 'required|in:flat,percentage,tenure_ratio',
            'value' => 'required|numeric|min:0',
            'notes' => 'nullable|string|max:500',
        ]);

        ThrSetting::create([
            ...$validated,
            'outlet_id' => $outletId,
            'is_active' => true,
        ]);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Pengaturan THR berhasil disimpan.']);

        return redirect()->back();
    }

    public function updateThr(Request $request, ThrSetting $thrSetting): RedirectResponse
    {
        $this->authorize('update', $thrSetting);

        $validated = $request->validate([
            'calculation_type' => 'required|in:flat,percentage,tenure_ratio',
            'value' => 'required|numeric|min:0',
            'is_active' => 'boolean',
            'notes' => 'nullable|string|max:500',
        ]);

        $thrSetting->update($validated);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Pengaturan THR berhasil diperbarui.']);

        return redirect()->back();
    }

    public function destroyThr(ThrSetting $thrSetting): RedirectResponse
    {
        $this->authorize('delete', $thrSetting);

        $thrSetting->delete();

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Pengaturan THR berhasil dihapus.']);

        return redirect()->back();
    }

    protected function outletId(): ?int
    {
        return auth()->user()?->employee?->outlet_id;
    }
}
