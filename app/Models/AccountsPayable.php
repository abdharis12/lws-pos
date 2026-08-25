<?php

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AccountsPayable extends Model
{
    use HasFactory;

    public const STATUS_UNPAID = 'unpaid';

    public const STATUS_PARTIAL = 'partial';

    public const STATUS_PAID = 'paid';

    public const STATUS_OVERDUE = 'overdue';

    protected $fillable = [
        'outlet_id', 'supplier_id', 'supplier_invoice_id',
        'amount_due', 'amount_paid', 'balance', 'due_date',
        'status', 'payment_method', 'reference_number', 'paid_at', 'paid_by', 'notes',
    ];

    protected function casts(): array
    {
        return [
            'amount_due' => 'decimal:2',
            'amount_paid' => 'decimal:2',
            'balance' => 'decimal:2',
            'due_date' => 'date',
            'paid_at' => 'datetime',
        ];
    }

    public function outlet(): BelongsTo
    {
        return $this->belongsTo(Outlet::class);
    }

    public function supplier(): BelongsTo
    {
        return $this->belongsTo(Supplier::class);
    }

    public function supplierInvoice(): BelongsTo
    {
        return $this->belongsTo(SupplierInvoice::class);
    }

    public function paidBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'paid_by');
    }

    public function daysOverdue(): int
    {
        if ($this->isPaid() || ! $this->due_date) {
            return 0;
        }

        return max(0, (int) Carbon::now()->startOfDay()->diffInDays($this->due_date, false) * -1);
    }

    public function isPaid(): bool
    {
        return $this->status === self::STATUS_PAID;
    }

    public function isOverdue(): bool
    {
        return $this->status === self::STATUS_OVERDUE || ($this->due_date?->isPast() && ! $this->isPaid());
    }

    public function agingBucket(): string
    {
        $days = $this->daysOverdue();

        if ($this->isPaid()) {
            return 'paid';
        }
        if ($days <= 0) {
            return 'current';
        }
        if ($days <= 30) {
            return '1-30';
        }
        if ($days <= 60) {
            return '31-60';
        }
        if ($days <= 90) {
            return '61-90';
        }

        return '90+';
    }
}
