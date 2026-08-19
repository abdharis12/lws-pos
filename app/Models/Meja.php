<?php

namespace App\Models;

use App\Enums\TableStatus;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

class Meja extends Model
{
    use HasFactory;

    protected $table = 'tables';

    protected $fillable = [
        'outlet_id', 'code', 'capacity', 'floor', 'status', 'locked_by',
    ];

    protected $guarded = ['table_token'];

    protected static function booted(): void
    {
        static::creating(function (Meja $table) {
            if (empty($table->table_token)) {
                $table->table_token = Str::random(40);
            }
        });
    }

    public function outlet(): BelongsTo
    {
        return $this->belongsTo(Outlet::class);
    }

    public function sessions(): HasMany
    {
        return $this->hasMany(TableSession::class, 'table_id');
    }

    protected function casts(): array
    {
        return [
            'capacity' => 'integer',
            'status' => TableStatus::class,
        ];
    }

    public function lockedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'locked_by');
    }
}
