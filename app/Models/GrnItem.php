<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class GrnItem extends Model
{
    use HasFactory;

    protected $table = 'grn_items';

    protected $fillable = [
        'grn_id', 'ingredient_id', 'qty_ordered', 'qty_received', 'unit_cost', 'notes',
    ];

    protected function casts(): array
    {
        return [
            'qty_ordered' => 'decimal:4',
            'qty_received' => 'decimal:4',
            'unit_cost' => 'decimal:4',
        ];
    }

    public function goodsReceivedNote(): BelongsTo
    {
        return $this->belongsTo(GoodsReceivedNote::class, 'grn_id');
    }

    public function ingredient(): BelongsTo
    {
        return $this->belongsTo(Ingredient::class);
    }
}
