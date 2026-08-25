<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ChecklistExecutionItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'checklist_execution_id', 'checklist_template_item_id', 'is_done',
        'photo_path', 'notes',
    ];

    protected function casts(): array
    {
        return [
            'is_done' => 'boolean',
        ];
    }

    public function checklistExecution(): BelongsTo
    {
        return $this->belongsTo(ChecklistExecution::class);
    }

    public function checklistTemplateItem(): BelongsTo
    {
        return $this->belongsTo(ChecklistTemplateItem::class);
    }
}
