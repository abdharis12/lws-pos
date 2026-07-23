<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SalaryComponent extends Model
{
    use HasFactory;

    protected $fillable = [
        'employee_id', 'base_salary', 'salary_type',
        'meal_allowance', 'transport_allowance', 'overtime_rate_per_hour',
    ];

    protected function casts(): array
    {
        return [
            'base_salary' => 'decimal:2',
            'meal_allowance' => 'decimal:2',
            'transport_allowance' => 'decimal:2',
            'overtime_rate_per_hour' => 'decimal:2',
        ];
    }

    public function employee(): BelongsTo
    {
        return $this->belongsTo(Employee::class);
    }
}
