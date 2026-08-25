<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('stock_transfer_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('stock_transfer_id')->constrained()->cascadeOnDelete();
            $table->foreignId('ingredient_id')->constrained()->cascadeOnDelete();
            $table->decimal('qty_requested', 15, 4);
            $table->decimal('qty_shipped', 15, 4)->default(0);
            $table->decimal('qty_received', 15, 4)->default(0);
            $table->decimal('unit_cost', 15, 4);
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index(['stock_transfer_id', 'ingredient_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('stock_transfer_items');
    }
};
