<?php

namespace App\Models;

use App\Enums\OrderStatus;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Order extends Model
{
    use HasFactory;

    protected $hidden = ['access_token'];

    protected $fillable = [
        'table_session_id', 'pos_session_id', 'order_type', 'status',
        'customer_name', 'grouped_tables', 'notes',
        // Financial fields - set by trusted services only (PosOrderService, SelfOrderService)
        'subtotal', 'tax', 'service_charge', 'midtrans_charge', 'rounding_amount',
        'discount', 'discount_type', 'discount_value', 'total',
        'discount_approved_by',
        'served_by', 'served_at',
    ];

    protected $guarded = [
        'created_by', 'access_token',
    ];

    protected function casts(): array
    {
        return [
            'subtotal' => 'decimal:2',
            'tax' => 'decimal:2',
            'service_charge' => 'decimal:2',
            'midtrans_charge' => 'decimal:2',
            'rounding_amount' => 'decimal:2',
            'discount' => 'decimal:2',
            'discount_value' => 'decimal:2',
            'total' => 'decimal:2',
            'served_at' => 'datetime',
            'grouped_tables' => 'array',
            'status' => OrderStatus::class,
        ];
    }

    public function tableSession(): BelongsTo
    {
        return $this->belongsTo(TableSession::class);
    }

    public function posSession(): BelongsTo
    {
        return $this->belongsTo(PosSession::class);
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function discountApprovedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'discount_approved_by');
    }

    public function servedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'served_by');
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
