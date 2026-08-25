<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ChecklistTemplate extends Model
{
    use HasFactory;

    public const TYPE_OPENING = 'opening';

    public const TYPE_CLOSING = 'closing';

    protected $fillable = [
        'outlet_id', 'name', 'type', 'description', 'is_active',
    ];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
        ];
    }

    public function outlet(): BelongsTo
    {
        return $this->belongsTo(Outlet::class);
    }

    public function items(): HasMany
    {
        return $this->hasMany(ChecklistTemplateItem::class);
    }

    public function executions(): HasMany
    {
        return $this->hasMany(ChecklistExecution::class);
    }
}
