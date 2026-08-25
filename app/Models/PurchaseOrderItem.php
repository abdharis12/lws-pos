<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PurchaseOrderItem extends Model
{
    use HasFactory;

    protected $table = 'purchase_order_items';

    protected $fillable = [
        'po_id', 'ingredient_id', 'qty_ordered', 'qty_received', 'unit_cost',
    ];

    protected function casts(): array
    {
        return [
            'qty_ordered' => 'decimal:4',
            'qty_received' => 'decimal:4',
            'unit_cost' => 'decimal:4',
        ];
    }

    public function purchaseOrder(): BelongsTo
    {
        return $this->belongsTo(PurchaseOrder::class, 'po_id');
    }

    public function ingredient(): BelongsTo
    {
        return $this->belongsTo(Ingredient::class);
    }

    public function getQtyPendingAttribute(): float
    {
        return $this->qty_ordered - $this->qty_received;
    }

    public function isFullyReceived(): bool
    {
        return $this->qty_received >= $this->qty_ordered;
    }
}
