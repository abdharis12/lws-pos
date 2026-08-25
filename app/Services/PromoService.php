<?php

namespace App\Services;

use App\Models\Customer;
use App\Models\Order;
use App\Models\Promo;
use App\Models\PromoUsage;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;

class PromoService
{
    public function getAll(int $outletId, array $filters = []): LengthAwarePaginator
    {
        $query = Promo::where('outlet_id', $outletId)
            ->orderByDesc('created_at');

        if (! empty($filters['search'])) {
            $query->where(function ($q) use ($filters) {
                $q->where('code', 'like', "%{$filters['search']}%")
                    ->orWhere('name', 'like', "%{$filters['search']}%");
            });
        }

        if (isset($filters['is_active'])) {
            $query->where('is_active', $filters['is_active']);
        }

        return $query->paginate($filters['per_page'] ?? 15);
    }

    public function create(int $outletId, array $data): Promo
    {
        return Promo::create([
            ...$data,
            'outlet_id' => $outletId,
            'usage_count' => 0,
            'is_active' => $data['is_active'] ?? true,
        ]);
    }

    public function update(Promo $promo, array $data): Promo
    {
        $promo->update($data);

        return $promo->fresh();
    }

    public function toggleActive(Promo $promo): Promo
    {
        $promo->update(['is_active' => ! $promo->is_active]);

        return $promo->fresh();
    }

    /**
     * Validate a promo code for an order amount. Returns [promo, discount] or throws.
     *
     * @return array{0: Promo, 1: float}
     */
    public function validate(int $outletId, string $code, float $orderAmount, ?Customer $customer = null, string $channel = 'pos'): array
    {
        /** @var Promo|null $promo */
        $promo = Promo::where('outlet_id', $outletId)->where('code', $code)->first();

        if (! $promo) {
            throw new \InvalidArgumentException('Kode promo tidak ditemukan.');
        }

        if (! $promo->isValid($channel)) {
            throw new \InvalidArgumentException('Promo tidak berlaku (kedaluwarsa / habis kuota / channel salah).');
        }

        if ($orderAmount < (float) $promo->min_spend) {
            throw new \InvalidArgumentException('Minimal belanja Rp '.number_format((float) $promo->min_spend, 0, ',', '.').' untuk promo ini.');
        }

        if ($customer) {
            $usedCount = PromoUsage::where('promo_id', $promo->id)
                ->where('customer_id', $customer->id)
                ->count();

            if ($usedCount >= $promo->usage_limit_per_customer) {
                throw new \InvalidArgumentException('Anda sudah menggunakan promo ini sebatas maksimal.');
            }
        }

        $discount = $promo->calculateDiscount($orderAmount);

        if ($discount <= 0) {
            throw new \InvalidArgumentException('Promo tidak menghasilkan diskon untuk transaksi ini.');
        }

        return [$promo, $discount];
    }

    public function applyToOrder(Promo $promo, Order $order, ?Customer $customer = null): Order
    {
        return DB::transaction(function () use ($promo, $order, $customer) {
            /** @var Promo $locked */
            $locked = Promo::lockForUpdate()->findOrFail($promo->id);

            $discount = min((float) $locked->calculateDiscount((float) $order->subtotal), (float) $order->total);

            $order->update([
                'promo_id' => $locked->id,
                'promo_discount' => $discount,
                'discount_type' => 'promo',
                'discount_value' => $discount,
                // total is recalculated by POS flow; keep consistent here for direct apply
                'total' => max(0, (float) $order->subtotal + (float) $order->tax + (float) $order->service_charge - $discount - (float) $order->discount),
            ]);

            PromoUsage::create([
                'promo_id' => $locked->id,
                'customer_id' => $customer?->id ?? $order->customer_id,
                'order_id' => $order->id,
                'discount_amount' => $discount,
                'used_at' => now(),
            ]);

            $locked->increment('usage_count');

            return $order->fresh();
        });
    }

    public function getActivePromos(int $outletId, ?string $channel = null): Collection
    {
        $query = Promo::where('outlet_id', $outletId)
            ->where('is_active', true)
            ->whereDate('valid_from', '<=', now())
            ->whereDate('valid_to', '>=', now());

        if ($channel !== null && $channel !== Promo::CHANNEL_ALL) {
            $query->whereIn('channel', [Promo::CHANNEL_ALL, $channel]);
        }

        return $query->get();
    }
}
