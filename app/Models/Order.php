<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Order extends Model
{
    use HasFactory;

    protected $fillable = [
        'table_session_id', 'created_by', 'order_type', 'status',
        'subtotal', 'tax', 'service_charge', 'midtrans_charge', 'discount', 'discount_type',
        'discount_value', 'discount_approved_by', 'total', 'notes', 'customer_name',
        'grouped_tables',
    ];

    protected function casts(): array
    {
        return [
            'subtotal' => 'decimal:2',
            'tax' => 'decimal:2',
            'service_charge' => 'decimal:2',
            'midtrans_charge' => 'decimal:2',
            'discount' => 'decimal:2',
            'discount_value' => 'decimal:2',
            'total' => 'decimal:2',
            'grouped_tables' => 'array',
        ];
    }

    public function tableSession(): BelongsTo
    {
        return $this->belongsTo(TableSession::class);
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function discountApprovedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'discount_approved_by');
    }

    public function items(): HasMany
    {
        return $this->hasMany(OrderItem::class);
    }

    public function payment(): HasOne
    {
        return $this->hasOne(Payment::class);
    }
}
