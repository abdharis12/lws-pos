<?php

namespace App\Http\Controllers;

use App\Events\MenuAvailabilityChanged;
use App\Models\Menu;
use App\Models\MenuCategory;
use App\Models\OptionGroup;
use App\Models\Outlet;
use App\Services\ActivityLogService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Inertia\Inertia;
use Inertia\Response;

class MenuController extends Controller
{
    public function __construct(
        private readonly ActivityLogService $activityLog,
    ) {}

    public function index(Request $request): Response
    {
        $outlet = Outlet::first();
        $cacheKey = "menu_categories_outlet_{$outlet?->id}";

        $categories = Cache::remember($cacheKey, 3600, fn () => MenuCategory::where('outlet_id', $outlet?->id)
            ->orderBy('sort_order')
            ->get()
        );

        $menus = Menu::with(['category', 'optionGroups.optionItems'])
            ->whereHas('category', fn ($q) => $q->where('outlet_id', $outlet?->id))
            ->orderBy('name')
            ->when($request->search, fn ($q, $search) => $q->where('name', 'like', "%{$search}%"))
            ->when($request->category_id, fn ($q, $categoryId) => $q->where('category_id', $categoryId))
            ->paginate(10)
            ->withQueryString();

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
            'station' => 'nullable|string|max:100',
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
            'station' => $validated['station'] ?? null,
        ]);

        if (! empty($validated['option_group_ids'])) {
            $menu->optionGroups()->sync($validated['option_group_ids']);
        }

        $this->clearMenuCache($menu);
        MenuAvailabilityChanged::dispatch($menu, $menu->is_available);

        $this->activityLog->log(
            $request->user(), 'menu.created',
            Menu::class, $menu->id,
            "Menu {$menu->name} ditambahkan seharga Rp{$menu->price}",
            $validated,
        );

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Menu berhasil ditambahkan.']);

        return redirect()->route('admin.menus.index');
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
            'station' => 'nullable|string|max:100',
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
            'station' => $validated['station'] ?? null,
        ]);

        if (isset($validated['option_group_ids'])) {
            $menu->optionGroups()->sync($validated['option_group_ids']);
        }

        $this->clearMenuCache($menu);
        MenuAvailabilityChanged::dispatch($menu, $menu->is_available);

        $this->activityLog->log(
            $request->user(), 'menu.updated',
            Menu::class, $menu->id,
            "Menu {$menu->name} diperbarui",
            $validated,
        );

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Menu berhasil diperbarui.']);

        return redirect()->route('admin.menus.index');
    }

    public function destroy(Request $request, Menu $menu): RedirectResponse
    {
        $this->authorize('delete', $menu);

        $this->clearMenuCache($menu);
        MenuAvailabilityChanged::dispatch($menu, false);

        $this->activityLog->log(
            $request->user(), 'menu.deleted',
            Menu::class, $menu->id,
            "Menu {$menu->name} dihapus",
        );

        $menu->delete();

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Menu berhasil dihapus.']);

        return redirect()->route('admin.menus.index');
    }

    public function toggleAvailability(Request $request, Menu $menu): RedirectResponse
    {
        $this->authorize('toggleAvailability', $menu);
        $newAvailability = ! $menu->is_available;
        $menu->update(['is_available' => $newAvailability]);

        $this->clearMenuCache($menu);
        MenuAvailabilityChanged::dispatch($menu->fresh(), $newAvailability);

        $this->activityLog->log(
            $request->user(),
            $newAvailability ? 'menu.enabled' : 'menu.disabled',
            Menu::class, $menu->id,
            ($newAvailability ? 'Mengaktifkan' : 'Menonaktifkan')." menu {$menu->name}",
        );

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Status ketersediaan menu berhasil diubah.']);

        return redirect()->back();
    }

    private function clearMenuCache(Menu $menu): void
    {
        $outletId = $menu->category?->outlet_id;
        if ($outletId) {
            Cache::forget("menu_categories_outlet_{$outletId}");
        }
    }
}
