<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('pos_sessions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('outlet_id')->constrained()->cascadeOnDelete();
            $table->date('session_date');
            $table->decimal('opening_balance', 15, 2)->default(0);
            $table->dateTime('opened_at');
            $table->dateTime('closed_at')->nullable();
            $table->decimal('total_cash', 15, 2)->default(0);
            $table->decimal('total_non_cash', 15, 2)->default(0);
            $table->integer('total_transactions')->default(0);
            $table->string('status')->default('open');
            $table->foreignId('opened_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('closed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('pos_sessions');
    }
};
