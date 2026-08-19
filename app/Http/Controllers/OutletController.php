<?php

namespace App\Http\Controllers;

use App\Models\Outlet;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class OutletController extends Controller
{
    public function edit(): Response
    {
        $this->authorize('viewAny', Outlet::class);

        $outletId = $this->outletId();
        $outlet = Outlet::findOrFail($outletId);

        return Inertia::render('admin/outlets/Settings', [
            'outlet' => $outlet,
        ]);
    }

    public function update(Request $request): RedirectResponse
    {
        $this->authorize('update', Outlet::class);

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'latitude' => 'required|numeric|between:-90,90',
            'longitude' => 'required|numeric|between:-180,180',
            'geofence_radius_meters' => 'required|integer|min:5|max:1000',
        ]);

        $outletId = $this->outletId();
        $outlet = Outlet::findOrFail($outletId);
        $outlet->update($validated);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Pengaturan outlet berhasil disimpan.']);

        return redirect()->route('admin.outlet.edit');
    }

    protected function outletId(): ?int
    {
        return auth()->user()?->employee?->outlet_id;
    }
}
