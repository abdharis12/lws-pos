<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Supplier extends Model
{
    use HasFactory;

    protected $fillable = [
        'outlet_id', 'name', 'contact_person', 'phone', 'email', 'address',
        'payment_terms', 'lead_time_days', 'is_active', 'rating',
        'on_time_delivery_rate', 'quality_rating',
    ];

    protected function casts(): array
    {
        return [
            'lead_time_days' => 'integer',
            'is_active' => 'boolean',
            'rating' => 'decimal:2',
            'on_time_delivery_rate' => 'decimal:2',
            'quality_rating' => 'decimal:2',
        ];
    }

    public function outlet(): BelongsTo
    {
        return $this->belongsTo(Outlet::class);
    }

    public function purchaseOrders(): HasMany
    {
        return $this->hasMany(PurchaseOrder::class);
    }

    public function invoices(): HasMany
    {
        return $this->hasMany(SupplierInvoice::class);
    }

    public function accountsPayable(): HasMany
    {
        return $this->hasMany(AccountsPayable::class);
    }

    public function getTotalPurchasedAttribute(): float
    {
        return (float) $this->purchaseOrders()
            ->whereIn('status', ['received', 'partial'])
            ->sum('total_amount');
    }

    public function getOutstandingBalanceAttribute(): float
    {
        return (float) $this->accountsPayable()
            ->whereIn('status', [AccountsPayable::STATUS_UNPAID, AccountsPayable::STATUS_PARTIAL, AccountsPayable::STATUS_OVERDUE])
            ->sum('balance');
    }

    public function getOnTimePerformanceAttribute(): float
    {
        $completedPos = $this->purchaseOrders()
            ->whereIn('status', ['received', 'partial'])
            ->get();

        if ($completedPos->isEmpty()) {
            return 100.0;
        }

        $onTime = $completedPos->filter(function ($po) {
            if (! $po->expected_date || ! $po->grns->isEmpty()) {
                $lastGrn = $po->grns->sortByDesc('received_date')->first();

                return $lastGrn && $lastGrn->received_date->lte($po->expected_date);
            }

            return false;
        })->count();

        return ($onTime / $completedPos->count()) * 100;
    }
}
