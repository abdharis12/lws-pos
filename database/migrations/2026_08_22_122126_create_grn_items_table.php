<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('grn_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('grn_id')->constrained('goods_received_notes')->cascadeOnDelete();
            $table->foreignId('ingredient_id')->constrained()->cascadeOnDelete();
            $table->decimal('qty_ordered', 15, 4);
            $table->decimal('qty_received', 15, 4);
            $table->decimal('unit_cost', 15, 4);
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index('ingredient_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('grn_items');
    }
};
