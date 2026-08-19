<?php

namespace App\Http\Controllers;

use App\Models\OptionGroup;
use App\Models\Outlet;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class OptionGroupController extends Controller
{
    public function index(Request $request): Response
    {
        $this->authorize('viewAny', OptionGroup::class);

        $groups = OptionGroup::where('outlet_id', $this->outletId())
            ->with('optionItems')
            ->orderBy('name')
            ->when($request->search, fn ($q, $search) => $q->where('name', 'like', "%{$search}%"))
            ->paginate(10)
            ->withQueryString();

        return Inertia::render('admin/option-groups/Index', [
            'groups' => $groups,
            'filters' => $request->only(['search']),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $this->authorize('create', OptionGroup::class);
        $validated = $this->validateGroup($request);

        $group = OptionGroup::create($this->groupPayload($validated));
        $this->syncItems($group, $validated['items'] ?? null);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Grup opsi berhasil ditambahkan.']);

        return redirect()->back();
    }

    public function update(Request $request, OptionGroup $optionGroup): RedirectResponse
    {
        $this->authorize('update', $optionGroup);
        $validated = $this->validateGroup($request);

        $optionGroup->update($this->groupPayload($validated));

        if (array_key_exists('items', $validated)) {
            $optionGroup->optionItems()->delete();
            $this->syncItems($optionGroup, $validated['items'] ?? null);
        }

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Grup opsi berhasil diperbarui.']);

        return redirect()->back();
    }

    public function destroy(OptionGroup $optionGroup): RedirectResponse
    {
        $this->authorize('delete', $optionGroup);
        $optionGroup->delete();

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Grup opsi berhasil dihapus.']);

        return redirect()->back();
    }

    // ── Helpers ─────────────────────────────────────────────────────────────

    protected function outletId(): ?int
    {
        return auth()->user()?->employee?->outlet_id;
    }

    protected function validateGroup(Request $request): array
    {
        return $request->validate([
            'name' => 'required|string|max:255',
            'selection_type' => 'required|in:single,multiple',
            'is_required' => 'boolean',
            'min_select' => 'nullable|integer|min:0',
            'max_select' => 'nullable|integer|min:0',
            'items' => 'nullable|array',
            'items.*.name' => 'required_with:items|string|max:255',
            'items.*.price_adjustment' => 'required_with:items|numeric|min:0',
            'items.*.is_available' => 'boolean',
            'items.*.sort_order' => 'nullable|integer|min:0',
        ]);
    }

    protected function groupPayload(array $validated): array
    {
        return [
            'outlet_id' => $this->outletId(),
            'name' => $validated['name'],
            'selection_type' => $validated['selection_type'],
            'is_required' => $validated['is_required'] ?? false,
            'min_select' => $validated['min_select'] ?? 0,
            'max_select' => $validated['max_select'] ?? 0,
        ];
    }

    protected function syncItems(OptionGroup $group, ?array $items): void
    {
        if (! empty($items)) {
            $group->optionItems()->createMany(
                collect($items)->map(fn (array $item) => [
                    'name' => $item['name'],
                    'price_adjustment' => $item['price_adjustment'],
                    'is_available' => $item['is_available'] ?? true,
                    'sort_order' => $item['sort_order'] ?? 0,
                ])->all(),
            );
        }
    }
}
