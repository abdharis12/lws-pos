<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class StockTransfer extends Model
{
    use HasFactory;

    public const STATUS_REQUESTED = 'requested';

    public const STATUS_APPROVED = 'approved';

    public const STATUS_SHIPPED = 'shipped';

    public const STATUS_RECEIVED = 'received';

    public const STATUS_CANCELLED = 'cancelled';

    protected $fillable = [
        'outlet_from_id', 'outlet_to_id', 'status', 'notes', 'transfer_number',
        'requested_by', 'approved_by', 'shipped_by', 'received_by',
        'requested_at', 'approved_at', 'shipped_at', 'received_at',
    ];

    protected function casts(): array
    {
        return [
            'requested_at' => 'datetime',
            'approved_at' => 'datetime',
            'shipped_at' => 'datetime',
            'received_at' => 'datetime',
        ];
    }

    public function outletFrom(): BelongsTo
    {
        return $this->belongsTo(Outlet::class, 'outlet_from_id');
    }

    public function outletTo(): BelongsTo
    {
        return $this->belongsTo(Outlet::class, 'outlet_to_id');
    }

    public function items(): HasMany
    {
        return $this->hasMany(StockTransferItem::class);
    }

    public function requestedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'requested_by');
    }

    public function approvedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    public function shippedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'shipped_by');
    }

    public function receivedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'received_by');
    }

    public function canApprove(): bool
    {
        return $this->status === self::STATUS_REQUESTED;
    }

    public function canShip(): bool
    {
        return $this->status === self::STATUS_APPROVED;
    }

    public function canReceive(): bool
    {
        return $this->status === self::STATUS_SHIPPED;
    }
}
