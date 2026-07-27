<?php

namespace App\Http\Controllers;

use App\Events\MenuAvailabilityChanged;
use App\Models\ActivityLog;
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
    public function index(Request $request): Response
    {
        $outlet = Outlet::first();

        $menus = Menu::with(['category', 'optionGroups.optionItems'])
            ->whereHas('category', fn ($q) => $q->where('outlet_id', $outlet?->id))
            ->orderBy('name')
            ->when($request->search, fn ($q, $search) => $q->where('name', 'like', "%{$search}%"))
            ->when($request->category_id, fn ($q, $categoryId) => $q->where('category_id', $categoryId))
            ->paginate(10)
            ->withQueryString();

        $categories = MenuCategory::where('outlet_id', $outlet?->id)
            ->orderBy('sort_order')
            ->get();

        return Inertia::render('admin/menus/Index', [
            'menus' => $menus,
            'categories' => $categories,
            'filters' => $request->only(['search', 'category_id']),
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

        MenuAvailabilityChanged::dispatch($menu, $menu->is_available);

        ActivityLog::create([
            'user_id' => $request->user()->id,
            'action' => 'menu.created',
            'subject_type' => Menu::class,
            'subject_id' => $menu->id,
            'description' => "Menu {$menu->name} ditambahkan seharga Rp{$menu->price}",
            'metadata' => $validated,
        ]);

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

        MenuAvailabilityChanged::dispatch($menu, $menu->is_available);

        ActivityLog::create([
            'user_id' => $request->user()->id,
            'action' => 'menu.updated',
            'subject_type' => Menu::class,
            'subject_id' => $menu->id,
            'description' => "Menu {$menu->name} diperbarui",
            'metadata' => $validated,
        ]);

        return redirect()->route('admin.menus.index')->with('success', 'Menu berhasil diperbarui.');
    }

    public function destroy(Request $request, Menu $menu): RedirectResponse
    {
        $this->authorize('delete', $menu);
        MenuAvailabilityChanged::dispatch($menu, false);

        ActivityLog::create([
            'user_id' => $request->user()->id,
            'action' => 'menu.deleted',
            'subject_type' => Menu::class,
            'subject_id' => $menu->id,
            'description' => "Menu {$menu->name} dihapus",
        ]);

        $menu->delete();

        return redirect()->route('admin.menus.index')->with('success', 'Menu berhasil dihapus.');
    }

    public function toggleAvailability(Request $request, Menu $menu): RedirectResponse
    {
        $this->authorize('toggleAvailability', $menu);
        $newAvailability = ! $menu->is_available;
        $menu->update(['is_available' => $newAvailability]);
        MenuAvailabilityChanged::dispatch($menu->fresh(), $newAvailability);

        ActivityLog::create([
            'user_id' => $request->user()->id,
            'action' => $newAvailability ? 'menu.enabled' : 'menu.disabled',
            'subject_type' => Menu::class,
            'subject_id' => $menu->id,
            'description' => ($newAvailability ? 'Mengaktifkan' : 'Menonaktifkan')." menu {$menu->name}",
        ]);

        return redirect()->back()->with('success', 'Status ketersediaan menu berhasil diubah.');
    }
}
