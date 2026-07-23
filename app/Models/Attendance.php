<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Attendance extends Model
{
    use HasFactory;

    protected $fillable = [
        'employee_id', 'clock_in_at', 'clock_out_at',
        'photo_path_in', 'photo_path_out',
        'latitude_in', 'longitude_in', 'latitude_out', 'longitude_out',
        'status',
    ];

    protected function casts(): array
    {
        return [
            'clock_in_at' => 'datetime',
            'clock_out_at' => 'datetime',
            'latitude_in' => 'decimal:7',
            'longitude_in' => 'decimal:7',
            'latitude_out' => 'decimal:7',
            'longitude_out' => 'decimal:7',
        ];
    }

    public function employee(): BelongsTo
    {
        return $this->belongsTo(Employee::class);
    }
}
