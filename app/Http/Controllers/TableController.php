<?php

namespace App\Http\Controllers;

use App\Models\Meja;
use App\Models\Outlet;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class TableController extends Controller
{
    public function index(): Response
    {
        $outlet = Outlet::first();
        $tables = Meja::where('outlet_id', $outlet?->id)->orderBy('code')->get();

        return Inertia::render('admin/tables/Index', [
            'tables' => $tables,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $this->authorize('create', Meja::class);

        $validated = $request->validate([
            'code' => 'required|string|max:20|unique:tables,code,NULL,id,outlet_id,'.Outlet::first()?->id,
            'capacity' => 'required|integer|min:1|max:20',
        ]);

        $outlet = Outlet::first();

        Meja::create([
            'outlet_id' => $outlet->id,
            'code' => $validated['code'],
            'table_token' => Str::random(40),
            'capacity' => $validated['capacity'],
            'status' => 'available',
        ]);

        return redirect()->back()->with('success', 'Meja berhasil ditambahkan.');
    }

    public function update(Request $request, Meja $table): RedirectResponse
    {
        $this->authorize('update', $table);

        $validated = $request->validate([
            'code' => 'required|string|max:20',
            'capacity' => 'required|integer|min:1|max:20',
            'status' => 'required|in:available,occupied,reserved',
        ]);

        $table->update($validated);

        return redirect()->back()->with('success', 'Meja berhasil diperbarui.');
    }

    public function destroy(Meja $table): RedirectResponse
    {
        $this->authorize('delete', $table);
        $table->delete();

        return redirect()->back()->with('success', 'Meja berhasil dihapus.');
    }

    public function regenerateToken(Meja $table): RedirectResponse
    {
        $this->authorize('regenerateToken', $table);
        $table->update(['table_token' => Str::random(40)]);

        return redirect()->back()->with('success', 'Token QR meja berhasil diperbarui.');
    }
}
