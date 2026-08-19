<?php

namespace App\Http\Controllers;

use App\Events\MenuAvailabilityChanged;
use App\Models\Menu;
use App\Models\MenuCategory;
use App\Models\OptionGroup;
use App\Models\Outlet;
use App\Models\User;
use App\Services\ActivityLogService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
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
        $this->authorize('viewAny', Menu::class);

        $outlet = Outlet::first();
        $categories = $this->categories($this->outletId());
        $menus = Menu::with(['category', 'optionGroups.optionItems'])
            ->whereHas('category', fn ($q) => $q->where('outlet_id', $this->outletId()))
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
        $this->authorize('create', Menu::class);

        return Inertia::render('admin/menus/Create', [
            'categories' => $this->categories($this->outletId()),
            'optionGroups' => $this->optionGroups($this->outletId()),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $this->authorize('create', Menu::class);
        $validated = $this->validateMenu($request);
        $photoPath = $this->storePhoto($request);

        $menu = Menu::create($this->menuPayload($validated, $photoPath));
        $this->syncOptionGroups($menu, $validated);
        $this->menuChanged($request->user(), $menu, 'menu.created', "Menu {$menu->name} ditambahkan seharga Rp{$menu->price}", $validated);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Menu berhasil ditambahkan.']);

        return redirect()->route('admin.menus.index');
    }

    public function show(Menu $menu): Response
    {
        $this->authorize('view', $menu);

        $menu->load(['category', 'optionGroups.optionItems']);

        return Inertia::render('admin/menus/Show', ['menu' => $menu]);
    }

    public function edit(Menu $menu): Response
    {
        $this->authorize('view', $menu);

        $menu->load('optionGroups');

        return Inertia::render('admin/menus/Edit', [
            'menu' => $menu,
            'categories' => $this->categories($this->outletId()),
            'optionGroups' => $this->optionGroups($this->outletId()),
        ]);
    }

    public function update(Request $request, Menu $menu): RedirectResponse
    {
        $this->authorize('update', $menu);
        $validated = $this->validateMenu($request);

        if ($request->hasFile('photo')) {
            $menu->photo_path = $request->file('photo')->store('menus', 'public');
        }

        $menu->update($this->menuPayload($validated, $menu->photo_path));
        if (isset($validated['option_group_ids'])) {
            $menu->optionGroups()->sync($validated['option_group_ids']);
        }

        $this->menuChanged($request->user(), $menu, 'menu.updated', "Menu {$menu->name} diperbarui", $validated);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Menu berhasil diperbarui.']);

        return redirect()->route('admin.menus.index');
    }

    public function destroy(Request $request, Menu $menu): RedirectResponse
    {
        $this->authorize('delete', $menu);
        $this->menuChanged($request->user(), $menu, 'menu.deleted', "Menu {$menu->name} dihapus");
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

    // ── Helpers ─────────────────────────────────────────────────────────────

    protected function outletId(): ?int
    {
        return auth()->user()?->employee?->outlet_id;
    }

    protected function categories(?int $outletId): Collection
    {
        return MenuCategory::where('outlet_id', $outletId)->orderBy('sort_order')->get();
    }

    protected function optionGroups(?int $outletId): Collection
    {
        return OptionGroup::where('outlet_id', $outletId)->with('optionItems')->get();
    }

    protected function validateMenu(Request $request): array
    {
        return $request->validate([
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
    }

    protected function storePhoto(Request $request): ?string
    {
        return $request->hasFile('photo') ? $request->file('photo')->store('menus', 'public') : null;
    }

    protected function menuPayload(array $validated, ?string $photoPath): array
    {
        return [
            'category_id' => $validated['category_id'],
            'name' => $validated['name'],
            'description' => $validated['description'] ?? null,
            'price' => $validated['price'],
            'photo_path' => $photoPath,
            'is_available' => $validated['is_available'] ?? true,
            'station' => $validated['station'] ?? null,
        ];
    }

    protected function syncOptionGroups(Menu $menu, array $validated): void
    {
        if (! empty($validated['option_group_ids'])) {
            $menu->optionGroups()->sync($validated['option_group_ids']);
        }
    }

    protected function menuChanged(User $user, Menu $menu, string $action, string $desc, ?array $context = null): void
    {
        $this->clearMenuCache($menu);
        MenuAvailabilityChanged::dispatch($menu->fresh(), $menu->is_available);

        $this->activityLog->log($user, $action, Menu::class, $menu->id, $desc, $context ?? []);
    }

    protected function clearMenuCache(Menu $menu): void
    {
        $outletId = $menu->category?->outlet_id;
        if ($outletId) {
            Cache::forget("menu_categories_outlet_{$outletId}");
        }
    }
}
