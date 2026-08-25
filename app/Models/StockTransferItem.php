<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StockTransferItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'stock_transfer_id', 'ingredient_id', 'qty_requested', 'qty_shipped',
        'qty_received', 'unit_cost', 'notes',
    ];

    protected function casts(): array
    {
        return [
            'qty_requested' => 'decimal:4',
            'qty_shipped' => 'decimal:4',
            'qty_received' => 'decimal:4',
            'unit_cost' => 'decimal:4',
        ];
    }

    public function stockTransfer(): BelongsTo
    {
        return $this->belongsTo(StockTransfer::class);
    }

    public function ingredient(): BelongsTo
    {
        return $this->belongsTo(Ingredient::class);
    }
}
