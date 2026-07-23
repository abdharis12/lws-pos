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
    public function index(): Response
    {
        $outlet = Outlet::first();
        $groups = OptionGroup::where('outlet_id', $outlet?->id)
            ->with('optionItems')
            ->orderBy('name')
            ->get();

        return Inertia::render('admin/option-groups/Index', [
            'groups' => $groups,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $this->authorize('create', OptionGroup::class);

        $validated = $request->validate([
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

        $outlet = Outlet::first();

        $group = OptionGroup::create([
            'outlet_id' => $outlet->id,
            'name' => $validated['name'],
            'selection_type' => $validated['selection_type'],
            'is_required' => $validated['is_required'] ?? false,
            'min_select' => $validated['min_select'] ?? 0,
            'max_select' => $validated['max_select'] ?? 0,
        ]);

        if (! empty($validated['items'])) {
            foreach ($validated['items'] as $item) {
                $group->optionItems()->create([
                    'name' => $item['name'],
                    'price_adjustment' => $item['price_adjustment'],
                    'is_available' => $item['is_available'] ?? true,
                    'sort_order' => $item['sort_order'] ?? 0,
                ]);
            }
        }

        return redirect()->back()->with('success', 'Grup opsi berhasil ditambahkan.');
    }

    public function update(Request $request, OptionGroup $optionGroup): RedirectResponse
    {
        $this->authorize('update', $optionGroup);

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'selection_type' => 'required|in:single,multiple',
            'is_required' => 'boolean',
            'min_select' => 'nullable|integer|min:0',
            'max_select' => 'nullable|integer|min:0',
        ]);

        $optionGroup->update($validated);

        return redirect()->back()->with('success', 'Grup opsi berhasil diperbarui.');
    }

    public function destroy(OptionGroup $optionGroup): RedirectResponse
    {
        $this->authorize('delete', $optionGroup);
        $optionGroup->delete();

        return redirect()->back()->with('success', 'Grup opsi berhasil dihapus.');
    }
}
