<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('reservations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('outlet_id')->constrained()->cascadeOnDelete();
            $table->foreignId('table_id')->nullable()->constrained()->nullOnDelete();
            $table->string('customer_name');
            $table->string('customer_phone')->nullable();
            $table->string('customer_email')->nullable();
            $table->timestamp('reservation_time');
            $table->integer('party_size');
            $table->decimal('deposit_amount', 15, 2)->default(0);
            $table->boolean('deposit_paid')->default(false);
            $table->string('status')->default('pending'); // pending, confirmed, seated, completed, cancelled, no_show
            $table->string('source')->default('walkin'); // walkin, phone, wa, online
            $table->text('notes')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index(['outlet_id', 'status']);
            $table->index(['outlet_id', 'reservation_time']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('reservations');
    }
};
