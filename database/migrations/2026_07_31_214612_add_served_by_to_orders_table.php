<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->foreignId('served_by')
                ->nullable()
                ->after('discount_approved_by')
                ->constrained('users')
                ->nullOnDelete();

            $table->timestamp('served_at')
                ->nullable()
                ->after('served_by')
                ->index();
        });
    }

    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropForeign(['served_by']);
            $table->dropColumn(['served_by', 'served_at']);
        });
    }
};
