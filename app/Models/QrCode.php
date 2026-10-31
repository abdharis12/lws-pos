<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class QrCode extends Model
{
    use HasFactory;

    protected $fillable = [
        'label', 'image_path', 'is_active',
    ];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
        ];
    }

    public function scopeActive(Builder $query): Builder
    {
        return $query->where('is_active', true);
    }

    public static function activeQr(): ?self
    {
        return static::query()->active()->latest('id')->first();
    }

    public function getImageUrlAttribute(): ?string
    {
        return $this->image_path
            ? '/storage/'.ltrim($this->image_path, '/')
            : null;
    }

    public function activate(): void
    {
        static::query()->whereKeyNot($this->getKey())->update(['is_active' => false]);

        $this->update(['is_active' => true]);
    }
}
