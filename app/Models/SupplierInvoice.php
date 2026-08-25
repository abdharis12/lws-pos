<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class SupplierInvoice extends Model
{
    use HasFactory;

    public const STATUS_PENDING = 'pending';

    public const STATUS_MATCHED = 'matched';

    public const STATUS_PARTIALLY_PAID = 'partial';

    public const STATUS_PAID = 'paid';

    public const STATUS_DISPUTED = 'disputed';

    public const STATUS_CANCELLED = 'cancelled';

    protected $fillable = [
        'outlet_id', 'supplier_id', 'po_id', 'grn_id', 'invoice_number',
        'invoice_date', 'due_date', 'total_amount', 'tax_amount', 'status',
        'payment_terms', 'notes', 'created_by', 'paid_at', 'paid_by',
    ];

    protected function casts(): array
    {
        return [
            'invoice_date' => 'date',
            'due_date' => 'date',
            'total_amount' => 'decimal:2',
            'tax_amount' => 'decimal:2',
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

    public function purchaseOrder(): BelongsTo
    {
        return $this->belongsTo(PurchaseOrder::class, 'po_id');
    }

    public function goodsReceivedNote(): BelongsTo
    {
        return $this->belongsTo(GoodsReceivedNote::class, 'grn_id');
    }

    public function items(): HasMany
    {
        return $this->hasMany(SupplierInvoiceItem::class);
    }

    public function accountsPayable(): HasMany
    {
        return $this->hasMany(AccountsPayable::class);
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function paidBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'paid_by');
    }

    public function isPending(): bool
    {
        return $this->status === self::STATUS_PENDING;
    }

    public function isMatched(): bool
    {
        return in_array($this->status, [self::STATUS_MATCHED, self::STATUS_PARTIALLY_PAID, self::STATUS_PAID]);
    }

    public function isPaid(): bool
    {
        return $this->status === self::STATUS_PAID;
    }

    public function isOverdue(): bool
    {
        return $this->due_date?->isPast() && ! $this->isPaid();
    }
}
