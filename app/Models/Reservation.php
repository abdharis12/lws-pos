<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Reservation extends Model
{
    use HasFactory;

    public const STATUS_PENDING = 'pending';

    public const STATUS_CONFIRMED = 'confirmed';

    public const STATUS_SEATED = 'seated';

    public const STATUS_COMPLETED = 'completed';

    public const STATUS_CANCELLED = 'cancelled';

    public const STATUS_NO_SHOW = 'no_show';

    public const SOURCE_WALKIN = 'walkin';

    public const SOURCE_PHONE = 'phone';

    public const SOURCE_WA = 'wa';

    public const SOURCE_ONLINE = 'online';

    protected $fillable = [
        'outlet_id', 'table_id', 'customer_name', 'customer_phone',
        'customer_email', 'reservation_time', 'party_size', 'deposit_amount',
        'deposit_paid', 'status', 'source', 'notes', 'created_by',
    ];

    protected function casts(): array
    {
        return [
            'reservation_time' => 'datetime',
            'deposit_amount' => 'decimal:2',
            'deposit_paid' => 'boolean',
        ];
    }

    public function outlet(): BelongsTo
    {
        return $this->belongsTo(Outlet::class);
    }

    public function table(): BelongsTo
    {
        return $this->belongsTo(Table::class);
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
