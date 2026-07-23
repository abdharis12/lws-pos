<?php

namespace App\Http\Controllers;

use App\Models\Menu;
use App\Models\MenuCategory;
use App\Models\OptionGroup;
use App\Models\Outlet;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class MenuController extends Controller
{
    public function index(): Response
    {
        $outlet = Outlet::first();
        $menus = Menu::with(['category', 'optionGroups.optionItems'])
            ->whereHas('category', fn ($q) => $q->where('outlet_id', $outlet?->id))
            ->orderBy('name')
            ->get();

        $categories = MenuCategory::where('outlet_id', $outlet?->id)
            ->orderBy('sort_order')
            ->get();

        return Inertia::render('admin/menus/Index', [
            'menus' => $menus,
            'categories' => $categories,
        ]);
    }

    public function create(): Response
    {
        $outlet = Outlet::first();
        $categories = MenuCategory::where('outlet_id', $outlet?->id)->orderBy('sort_order')->get();
        $optionGroups = OptionGroup::where('outlet_id', $outlet?->id)->with('optionItems')->get();

        return Inertia::render('admin/menus/Create', [
            'categories' => $categories,
            'optionGroups' => $optionGroups,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $this->authorize('create', Menu::class);

        $validated = $request->validate([
            'category_id' => 'required|exists:menu_categories,id',
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'price' => 'required|numeric|min:0',
            'photo' => 'nullable|image|max:2048',
            'is_available' => 'boolean',
            'option_group_ids' => 'nullable|array',
            'option_group_ids.*' => 'exists:option_groups,id',
        ]);

        $photoPath = null;
        if ($request->hasFile('photo')) {
            $photoPath = $request->file('photo')->store('menus', 'public');
        }

        $menu = Menu::create([
            'category_id' => $validated['category_id'],
            'name' => $validated['name'],
            'description' => $validated['description'] ?? null,
            'price' => $validated['price'],
            'photo_path' => $photoPath,
            'is_available' => $validated['is_available'] ?? true,
        ]);

        if (! empty($validated['option_group_ids'])) {
            $menu->optionGroups()->sync($validated['option_group_ids']);
        }

        return redirect()->route('admin.menus.index')->with('success', 'Menu berhasil ditambahkan.');
    }

    public function show(Menu $menu): Response
    {
        $menu->load(['category', 'optionGroups.optionItems']);

        return Inertia::render('admin/menus/Show', [
            'menu' => $menu,
        ]);
    }

    public function edit(Menu $menu): Response
    {
        $outlet = Outlet::first();
        $categories = MenuCategory::where('outlet_id', $outlet?->id)->orderBy('sort_order')->get();
        $optionGroups = OptionGroup::where('outlet_id', $outlet?->id)->with('optionItems')->get();

        $menu->load('optionGroups');

        return Inertia::render('admin/menus/Edit', [
            'menu' => $menu,
            'categories' => $categories,
            'optionGroups' => $optionGroups,
        ]);
    }

    public function update(Request $request, Menu $menu): RedirectResponse
    {
        $this->authorize('update', $menu);

        $validated = $request->validate([
            'category_id' => 'required|exists:menu_categories,id',
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'price' => 'required|numeric|min:0',
            'photo' => 'nullable|image|max:2048',
            'is_available' => 'boolean',
            'option_group_ids' => 'nullable|array',
            'option_group_ids.*' => 'exists:option_groups,id',
        ]);

        if ($request->hasFile('photo')) {
            $menu->photo_path = $request->file('photo')->store('menus', 'public');
        }

        $menu->update([
            'category_id' => $validated['category_id'],
            'name' => $validated['name'],
            'description' => $validated['description'] ?? null,
            'price' => $validated['price'],
            'is_available' => $validated['is_available'] ?? true,
        ]);

        if (isset($validated['option_group_ids'])) {
            $menu->optionGroups()->sync($validated['option_group_ids']);
        }

        return redirect()->route('admin.menus.index')->with('success', 'Menu berhasil diperbarui.');
    }

    public function destroy(Menu $menu): RedirectResponse
    {
        $this->authorize('delete', $menu);
        $menu->delete();

        return redirect()->route('admin.menus.index')->with('success', 'Menu berhasil dihapus.');
    }

    public function toggleAvailability(Menu $menu): RedirectResponse
    {
        $this->authorize('toggleAvailability', $menu);
        $menu->update(['is_available' => ! $menu->is_available]);

        return redirect()->back()->with('success', 'Status ketersediaan menu berhasil diubah.');
    }
}
