<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class JournalEntry extends Model
{
    use HasFactory;

    protected $fillable = [
        'outlet_id', 'entry_number', 'journal_date', 'reference_type',
        'reference_id', 'description', 'total_debit', 'total_credit',
        'posted_by', 'posted_at', 'is_posted',
    ];

    protected function casts(): array
    {
        return [
            'journal_date' => 'date',
            'total_debit' => 'decimal:2',
            'total_credit' => 'decimal:2',
            'posted_at' => 'datetime',
            'is_posted' => 'boolean',
        ];
    }

    public function outlet(): BelongsTo
    {
        return $this->belongsTo(Outlet::class);
    }

    public function lines(): HasMany
    {
        return $this->hasMany(JournalLine::class);
    }

    public function postedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'posted_by');
    }

    public function reference(): MorphTo
    {
        return $this->morphTo();
    }

    public function isBalanced(): bool
    {
        return $this->total_debit === $this->total_credit;
    }
}
