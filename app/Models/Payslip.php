<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Payslip extends Model
{
    use HasFactory;

    protected $fillable = [
        'employee_id', 'period', 'base_salary', 'allowances_total',
        'bonus_total', 'overtime_total', 'deduction_total',
        'take_home_pay', 'status', 'paid_at', 'paid_method',
    ];

    protected function casts(): array
    {
        return [
            'base_salary' => 'decimal:2',
            'allowances_total' => 'decimal:2',
            'bonus_total' => 'decimal:2',
            'overtime_total' => 'decimal:2',
            'deduction_total' => 'decimal:2',
            'take_home_pay' => 'decimal:2',
            'paid_at' => 'datetime',
        ];
    }

    public function employee(): BelongsTo
    {
        return $this->belongsTo(Employee::class);
    }
}
