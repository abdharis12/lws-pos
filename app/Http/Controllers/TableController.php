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
    public static function availableFloors(): array
    {
        return ['Lantai 1', 'Lantai 2', 'Lantai 3', 'Lantai 4', 'Teras'];
    }

    protected function validateTable(Request $request): array
    {
        return $request->validate([
            'code' => 'required|string|max:20|unique:tables,code,NULL,id,outlet_id,'.Outlet::first()?->id,
            'capacity' => 'required|integer|min:1|max:20',
            'floor' => 'nullable|string|max:50',
        ]);
    }

    protected function createTable(array $validated): Meja
    {
        return Meja::create([
            'outlet_id' => Outlet::first()->id,
            'code' => $validated['code'],
            'table_token' => Str::random(40),
            'capacity' => $validated['capacity'],
            'floor' => ! empty($validated['floor']) ? $validated['floor'] : null,
            'status' => 'available',
        ]);
    }

    protected function pageFor(Meja $table): int
    {
        $position = Meja::where('outlet_id', $table->outlet_id)->where('code', '<=', $table->code)->count();

        return (int) ceil($position / 10);
    }

    public function index(Request $request): Response
    {
        $outlet = Outlet::first();
        $tables = Meja::where('outlet_id', $outlet?->id)
            ->orderBy('code')
            ->when($request->floor, fn ($q, $floor) => $q->where('floor', $floor))
            ->paginate(10)
            ->withQueryString();

        return Inertia::render('admin/tables/Index', [
            'tables' => $tables,
            'floors' => self::availableFloors(),
            'filters' => $request->only(['floor']),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $this->authorize('create', Meja::class);
        $validated = $this->validateTable($request);
        $table = $this->createTable($validated);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Meja berhasil ditambahkan.']);

        return redirect()->route('admin.tables.index', ['page' => $this->pageFor($table)]);
    }

    public function update(Request $request, Meja $table): RedirectResponse
    {
        $this->authorize('update', $table);
        $validated = $request->validate([
            'code' => 'required|string|max:20',
            'capacity' => 'required|integer|min:1|max:20',
            'status' => 'required|in:available,occupied,reserved',
            'floor' => 'nullable|string|max:50',
        ]);

        $table->update([...$validated, 'floor' => ! empty($validated['floor']) ? $validated['floor'] : null]);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Meja berhasil diperbarui.']);

        return redirect()->route('admin.tables.index', ['page' => $this->pageFor($table)]);
    }

    public function destroy(Meja $table): RedirectResponse
    {
        $this->authorize('delete', $table);
        $table->delete();

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Meja berhasil dihapus.']);

        return redirect()->back();
    }

    public function regenerateToken(Meja $table): RedirectResponse
    {
        $this->authorize('regenerateToken', $table);
        $table->update(['table_token' => Str::random(40)]);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Token QR meja berhasil diperbarui.']);

        return redirect()->back();
    }
}
