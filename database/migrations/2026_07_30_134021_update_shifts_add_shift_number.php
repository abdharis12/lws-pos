<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('shifts', function (Blueprint $table) {
            $table->index('employee_id', 'shifts_employee_id_index');
            $table->dropUnique('shifts_employee_date_unique');
        });

        Schema::table('shifts', function (Blueprint $table) {
            $table->tinyInteger('shift_number')->default(1)->after('employee_id');
            $table->unique(['employee_id', 'shift_date', 'shift_number'], 'shifts_employee_date_shift_unique');
        });
    }

    public function down(): void
    {
        Schema::table('shifts', function (Blueprint $table) {
            $table->dropUnique('shifts_employee_date_shift_unique');
        });

        Schema::table('shifts', function (Blueprint $table) {
            $table->dropColumn('shift_number');
            $table->unique(['employee_id', 'shift_date'], 'shifts_employee_date_unique');
        });

        Schema::table('shifts', function (Blueprint $table) {
            $table->dropIndex('shifts_employee_id_index');
        });
    }
};
