<?php

namespace App\Models;

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
        'outlet_id', 'code', 'table_token', 'capacity', 'status',
    ];

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
}
