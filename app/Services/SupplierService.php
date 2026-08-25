<?php

namespace App\Services;

use App\Models\GrnItem;
use App\Models\Supplier;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Pagination\LengthAwarePaginator;

class SupplierService
{
    public function getAll(int $outletId, array $filters = []): LengthAwarePaginator
    {
        $query = Supplier::where('outlet_id', $outletId)
            ->with(['outlet', 'purchaseOrders', 'accountsPayable'])
            ->orderBy('name');

        if (! empty($filters['search'])) {
            $query->where(function ($q) use ($filters) {
                $q->where('name', 'like', "%{$filters['search']}%")
                    ->orWhere('contact_person', 'like', "%{$filters['search']}%")
                    ->orWhere('phone', 'like', "%{$filters['search']}%");
            });
        }

        if (isset($filters['is_active'])) {
            $query->where('is_active', $filters['is_active']);
        }

        if (! empty($filters['payment_terms'])) {
            $query->where('payment_terms', $filters['payment_terms']);
        }

        return $query->paginate($filters['per_page'] ?? 15);
    }

    public function create(int $outletId, array $data): Supplier
    {
        return Supplier::create([
            'outlet_id' => $outletId,
            'name' => $data['name'],
            'contact_person' => $data['contact_person'] ?? null,
            'phone' => $data['phone'] ?? null,
            'email' => $data['email'] ?? null,
            'address' => $data['address'] ?? null,
            'payment_terms' => $data['payment_terms'] ?? 'cash',
            'lead_time_days' => $data['lead_time_days'] ?? 1,
            'is_active' => $data['is_active'] ?? true,
            'rating' => $data['rating'] ?? null,
            'on_time_delivery_rate' => $data['on_time_delivery_rate'] ?? null,
            'quality_rating' => $data['quality_rating'] ?? null,
        ]);
    }

    public function update(Supplier $supplier, array $data): Supplier
    {
        $supplier->update($data);

        return $supplier->fresh();
    }

    public function delete(Supplier $supplier): bool
    {
        if ($supplier->purchaseOrders()->exists() || $supplier->invoices()->exists()) {
            $supplier->update(['is_active' => false]);

            return false;
        }

        return $supplier->delete();
    }

    public function recalculatePerformance(Supplier $supplier): Supplier
    {
        $supplier->on_time_delivery_rate = $supplier->on_time_performance;

        $completedPos = $supplier->purchaseOrders()
            ->whereIn('status', ['received', 'partial'])
            ->with('grns')
            ->get();

        $totalReceived = 0;
        $totalExpected = 0;
        foreach ($completedPos as $po) {
            $poItems = $po->items;
            $grnItems = GrnItem::whereIn('grn_id', $po->grns->pluck('id'))->get();
            $totalReceived += $grnItems->sum('qty_received');
            $totalExpected += $poItems->sum('qty_ordered');
        }

        if ($totalExpected > 0) {
            $supplier->quality_rating = min(5, round(($totalReceived / $totalExpected) * 5, 2));
        }

        $supplier->rating = $supplier->save() ? round(
            (($supplier->on_time_delivery_rate ?? 0) / 100 * 5 + ($supplier->quality_rating ?? 0)) / 2,
            2
        ) : null;
        $supplier->save();

        return $supplier->fresh();
    }

    public function getActive(int $outletId): Collection
    {
        return Supplier::where('outlet_id', $outletId)
            ->where('is_active', true)
            ->orderBy('name')
            ->get();
    }
}
