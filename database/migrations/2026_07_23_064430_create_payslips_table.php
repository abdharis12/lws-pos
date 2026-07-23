<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('payslips', function (Blueprint $table) {
            $table->id();
            $table->foreignId('employee_id')->constrained()->cascadeOnDelete();
            $table->string('period', 7);
            $table->decimal('base_salary', 15, 2)->default(0);
            $table->decimal('allowances_total', 15, 2)->default(0);
            $table->decimal('bonus_total', 15, 2)->default(0);
            $table->decimal('overtime_total', 15, 2)->default(0);
            $table->decimal('deduction_total', 15, 2)->default(0);
            $table->decimal('take_home_pay', 15, 2)->default(0);
            $table->string('status')->default('draft');
            $table->dateTime('paid_at')->nullable();
            $table->string('paid_method')->nullable();
            $table->timestamps();

            $table->unique(['employee_id', 'period']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payslips');
    }
};
