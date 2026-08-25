<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ProductionOrder extends Model
{
    use HasFactory;

    public const STATUS_PLANNED = 'planned';

    public const STATUS_IN_PROGRESS = 'in_progress';

    public const STATUS_COMPLETED = 'completed';

    public const STATUS_DISTRIBUTED = 'distributed';

    protected $fillable = [
        'batch_number', 'central_outlet_id', 'target_outlet_id', 'menu_id',
        'qty_to_produce', 'qty_produced', 'cost_per_unit', 'total_cost',
        'status', 'notes', 'produced_at', 'distributed_at', 'produced_by',
    ];

    protected function casts(): array
    {
        return [
            'produced_at' => 'datetime',
            'distributed_at' => 'datetime',
            'qty_to_produce' => 'decimal:4',
            'qty_produced' => 'decimal:4',
            'cost_per_unit' => 'decimal:4',
            'total_cost' => 'decimal:2',
        ];
    }

    public function centralOutlet(): BelongsTo
    {
        return $this->belongsTo(Outlet::class, 'central_outlet_id');
    }

    public function targetOutlet(): BelongsTo
    {
        return $this->belongsTo(Outlet::class, 'target_outlet_id');
    }

    public function menu(): BelongsTo
    {
        return $this->belongsTo(Menu::class);
    }

    public function producedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'produced_by');
    }
}
