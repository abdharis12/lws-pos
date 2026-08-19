<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Add performance indexes for the most frequent query patterns.
     */
    public function up(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->index(['status', 'created_at'], 'orders_status_created_at_index');
            $table->index(['status', 'served_at'], 'orders_status_served_at_index');
        });

        Schema::table('activity_logs', function (Blueprint $table) {
            $table->index('created_at', 'activity_logs_created_at_index');
        });

        Schema::table('table_sessions', function (Blueprint $table) {
            $table->index(['table_id', 'status'], 'table_sessions_table_id_status_index');
        });

        Schema::table('payslips', function (Blueprint $table) {
            $table->index(['period', 'created_at'], 'payslips_period_created_at_index');
        });

        Schema::table('payments', function (Blueprint $table) {
            $table->index('created_at', 'payments_created_at_index');
        });

        Schema::table('attendances', function (Blueprint $table) {
            $table->index('clock_in_at', 'attendances_clock_in_at_index');
        });

        Schema::table('shifts', function (Blueprint $table) {
            $table->index('shift_date', 'shifts_shift_date_index');
        });

        Schema::table('pos_sessions', function (Blueprint $table) {
            $table->index(['outlet_id', 'session_date', 'status'], 'pos_sessions_outlet_date_status_index');
        });

        Schema::table('bonuses', function (Blueprint $table) {
            $table->index(['employee_id', 'period'], 'bonuses_employee_id_period_index');
        });

        Schema::table('deductions', function (Blueprint $table) {
            $table->index(['employee_id', 'period'], 'deductions_employee_id_period_index');
        });

        Schema::table('order_items', function (Blueprint $table) {
            $table->index('status', 'order_items_status_index');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropIndex('orders_status_created_at_index');
            $table->dropIndex('orders_status_served_at_index');
        });

        Schema::table('activity_logs', function (Blueprint $table) {
            $table->dropIndex('activity_logs_created_at_index');
        });

        Schema::table('table_sessions', function (Blueprint $table) {
            $table->dropIndex('table_sessions_table_id_status_index');
        });

        Schema::table('payslips', function (Blueprint $table) {
            $table->dropIndex('payslips_period_created_at_index');
        });

        Schema::table('payments', function (Blueprint $table) {
            $table->dropIndex('payments_created_at_index');
        });

        Schema::table('attendances', function (Blueprint $table) {
            $table->dropIndex('attendances_clock_in_at_index');
        });

        Schema::table('shifts', function (Blueprint $table) {
            $table->dropIndex('shifts_shift_date_index');
        });

        Schema::table('pos_sessions', function (Blueprint $table) {
            $table->dropIndex('pos_sessions_outlet_date_status_index');
        });

        Schema::table('bonuses', function (Blueprint $table) {
            $table->dropIndex('bonuses_employee_id_period_index');
        });

        Schema::table('deductions', function (Blueprint $table) {
            $table->dropIndex('deductions_employee_id_period_index');
        });

        Schema::table('order_items', function (Blueprint $table) {
            $table->dropIndex('order_items_status_index');
        });
    }
};
