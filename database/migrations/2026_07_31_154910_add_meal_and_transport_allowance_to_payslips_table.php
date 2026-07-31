<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('payslips', function (Blueprint $table) {
            $table->decimal('meal_allowance', 15, 2)->default(0)->after('allowances_total');
            $table->decimal('transport_allowance', 15, 2)->default(0)->after('meal_allowance');
        });
    }

    public function down(): void
    {
        Schema::table('payslips', function (Blueprint $table) {
            $table->dropColumn(['meal_allowance', 'transport_allowance']);
        });
    }
};
