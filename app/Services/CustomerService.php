<?php

namespace App\Services;

use App\Models\Customer;
use App\Models\Order;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;

class CustomerService
{
    public function getAll(int $outletId, array $filters = []): LengthAwarePaginator
    {
        $query = Customer::where('outlet_id', $outletId)
            ->orderBy('name');

        if (! empty($filters['search'])) {
            $term = "%{$filters['search']}%";
            $query->where(function ($q) use ($term) {
                $q->where('name', 'like', $term)
                    ->orWhere('phone', 'like', $term)
                    ->orWhere('email', 'like', $term);
            });
        }

        if (! empty($filters['tier'])) {
            $query->where('tier', $filters['tier']);
        }

        if (isset($filters['is_active'])) {
            $query->where('is_active', $filters['is_active']);
        }

        return $query->paginate($filters['per_page'] ?? 15);
    }

    public function create(int $outletId, array $data): Customer
    {
        return DB::transaction(function () use ($outletId, $data) {
            return Customer::create([
                'outlet_id' => $outletId,
                'user_id' => $data['user_id'] ?? null,
                'name' => $data['name'],
                'phone' => $data['phone'] ?? null,
                'email' => $data['email'] ?? null,
                'birthdate' => $data['birthdate'] ?? null,
                'preferences' => $data['preferences'] ?? null,
                'allergens' => $data['allergens'] ?? null,
                'is_active' => true,
            ]);
        });
    }

    public function update(Customer $customer, array $data): Customer
    {
        $customer->update($data);

        return $customer->fresh();
    }

    public function delete(Customer $customer): bool
    {
        if ($customer->orders()->exists()) {
            $customer->update(['is_active' => false]);

            return false;
        }

        return $customer->delete();
    }

    /**
     * Lookup customer by phone for POS. Creates a new one when not found and requested.
     */
    public function findByPhone(int $outletId, string $phone): ?Customer
    {
        return Customer::where('outlet_id', $outletId)
            ->where('phone', $phone)
            ->first();
    }

    public function findOrCreateByPhone(int $outletId, string $phone, string $name): Customer
    {
        return Customer::firstOrCreate(
            ['outlet_id' => $outletId, 'phone' => $phone],
            ['name' => $name]
        );
    }

    public function attachToOrder(Customer $customer, Order $order): Order
    {
        $order->update(['customer_id' => $customer->id]);

        return $order->fresh();
    }

    /**
     * Record a paid order against the customer: spend + visit + tier refresh.
     */
    public function recordVisit(Order $order): void
    {
        if (! $order->customer_id) {
            return;
        }

        DB::transaction(function () use ($order) {
            /** @var Customer|null $customer */
            $customer = Customer::lockForUpdate()->find($order->customer_id);
            if (! $customer) {
                return;
            }

            $newSpend = (float) $customer->total_spend + (float) $order->total;

            $customer->update([
                'total_spend' => $newSpend,
                'visit_count' => $customer->visit_count + 1,
                'tier' => $customer->calculateTier($newSpend),
            ]);
        });
    }

    public function getTopCustomers(int $outletId, int $limit = 10): Collection
    {
        return Customer::where('outlet_id', $outletId)
            ->where('is_active', true)
            ->orderByDesc('total_spend')
            ->limit($limit)
            ->get();
    }
}
