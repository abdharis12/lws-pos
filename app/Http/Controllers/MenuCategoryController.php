<?php

namespace App\Http\Controllers;

use App\Models\MenuCategory;
use App\Models\Outlet;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class MenuCategoryController extends Controller
{
    public function index(): Response
    {
        $outlet = Outlet::first();
        $categories = MenuCategory::where('outlet_id', $outlet?->id)
            ->orderBy('sort_order')
            ->get();

        return Inertia::render('admin/menu-categories/Index', [
            'categories' => $categories,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $this->authorize('create', MenuCategory::class);

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'sort_order' => 'nullable|integer|min:0',
        ]);

        $outlet = Outlet::first();

        MenuCategory::create([
            'outlet_id' => $outlet->id,
            'name' => $validated['name'],
            'sort_order' => $validated['sort_order'] ?? 0,
        ]);

        return redirect()->back()->with('success', 'Kategori berhasil ditambahkan.');
    }

    public function update(Request $request, MenuCategory $menuCategory): RedirectResponse
    {
        $this->authorize('update', $menuCategory);

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'sort_order' => 'nullable|integer|min:0',
        ]);

        $menuCategory->update($validated);

        return redirect()->back()->with('success', 'Kategori berhasil diperbarui.');
    }

    public function destroy(MenuCategory $menuCategory): RedirectResponse
    {
        $this->authorize('delete', $menuCategory);
        $menuCategory->delete();

        return redirect()->back()->with('success', 'Kategori berhasil dihapus.');
    }
}
