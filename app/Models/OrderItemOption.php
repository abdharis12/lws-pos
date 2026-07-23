<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class OrderItemOption extends Model
{
    use HasFactory;

    protected $fillable = [
        'order_item_id', 'option_item_id', 'price_adjustment',
    ];

    protected function casts(): array
    {
        return [
            'price_adjustment' => 'decimal:2',
        ];
    }

    public function orderItem(): BelongsTo
    {
        return $this->belongsTo(OrderItem::class);
    }

    public function optionItem(): BelongsTo
    {
        return $this->belongsTo(OptionItem::class);
    }
}
