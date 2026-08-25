<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ChecklistTemplateItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'checklist_template_id', 'title', 'description', 'is_mandatory',
        'requires_photo', 'sort_order',
    ];

    protected function casts(): array
    {
        return [
            'is_mandatory' => 'boolean',
            'requires_photo' => 'boolean',
        ];
    }

    public function checklistTemplate(): BelongsTo
    {
        return $this->belongsTo(ChecklistTemplate::class);
    }

    public function executionItems(): HasMany
    {
        return $this->hasMany(ChecklistExecutionItem::class);
    }
}
