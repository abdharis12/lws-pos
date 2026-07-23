<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Shift extends Model
{
    use HasFactory;

    protected $fillable = [
        'employee_id', 'shift_date', 'start_time', 'end_time',
    ];

    protected function casts(): array
    {
        return [
            'shift_date' => 'date',
            'start_time' => 'string',
            'end_time' => 'string',
        ];
    }

    public function employee(): BelongsTo
    {
        return $this->belongsTo(Employee::class);
    }
}
