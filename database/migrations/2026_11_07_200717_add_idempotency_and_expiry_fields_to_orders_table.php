<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->string('idempotency_key', 64)->nullable()->unique();
            $table->string('idempotency_payload_hash', 64)->nullable();
            $table->dateTime('payment_expires_at')->nullable();
            $table->string('payment_qr_code_path')->nullable();
            $table->index(['status', 'payment_expires_at'], 'orders_status_payment_expires_at_index');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropIndex('orders_status_payment_expires_at_index');
            $table->dropUnique(['idempotency_key']);
            $table->dropColumn([
                'idempotency_key',
                'idempotency_payload_hash',
                'payment_expires_at',
                'payment_qr_code_path',
            ]);
        });
    }
};
