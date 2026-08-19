<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Payment extends Model
{
    use HasFactory;

    protected $fillable = [
        'order_id', 'method', 'gross_amount', 'status', 'midtrans_transaction_id',
    ];

    protected $guarded = [
        'signature_verified_at', 'raw_payload',
    ];

    protected $hidden = [
        'gross_amount', 'midtrans_transaction_id', 'raw_payload',
    ];

    protected function casts(): array
    {
        return [
            'gross_amount' => 'decimal:2',
            'signature_verified_at' => 'datetime',
            'raw_payload' => 'encrypted',
        ];
    }

    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }
}
