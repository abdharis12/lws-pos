<?php

namespace App\Http\Controllers;

use App\Models\MenuCategory;
use App\Services\MenuCatalogService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class MenuCategoryController extends Controller
{
    public function index(Request $request): Response
    {
        $this->authorize('viewAny', MenuCategory::class);

        $outletId = $this->outletId();

        $query = MenuCategory::where('outlet_id', $outletId);

        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where('name', 'like', "%{$search}%");
        }

        $categories = $query->orderBy('sort_order')
            ->paginate(10)
            ->withQueryString();

        return Inertia::render('admin/menu-categories/Index', [
            'categories' => $categories,
            'filters' => $request->only(['search']),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $this->authorize('create', MenuCategory::class);

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'icon' => 'nullable|string|max:64',
            'sort_order' => 'nullable|integer|min:0',
        ]);

        $outletId = $this->outletId();

        MenuCategory::create([
            'outlet_id' => $outletId,
            'name' => $validated['name'],
            'icon' => $validated['icon'] ?? null,
            'sort_order' => $validated['sort_order'] ?? 0,
        ]);

        MenuCatalogService::forget($outletId);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Kategori berhasil ditambahkan.']);

        return redirect()->back();
    }

    public function update(Request $request, MenuCategory $menuCategory): RedirectResponse
    {
        $this->authorize('update', $menuCategory);

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'icon' => 'nullable|string|max:64',
            'sort_order' => 'nullable|integer|min:0',
        ]);

        $menuCategory->update($validated);

        MenuCatalogService::forget($this->outletId());

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Kategori berhasil diperbarui.']);

        return redirect()->back();
    }

    public function destroy(MenuCategory $menuCategory): RedirectResponse
    {
        $this->authorize('delete', $menuCategory);
        $menuCategory->delete();

        MenuCatalogService::forget($this->outletId());

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Kategori berhasil dihapus.']);

        return redirect()->back();
    }

    protected function outletId(): ?int
    {
        return auth()->user()?->employee?->outlet_id;
    }
}
