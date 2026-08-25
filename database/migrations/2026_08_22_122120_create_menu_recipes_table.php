<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('menu_recipes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('menu_id')->constrained()->cascadeOnDelete();
            $table->foreignId('ingredient_id')->constrained()->cascadeOnDelete();
            $table->decimal('quantity_per_portion', 15, 4);
            $table->string('unit');
            $table->decimal('yield_percentage', 5, 2)->default(100.00);
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->unique(['menu_id', 'ingredient_id']);
            $table->index('ingredient_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('menu_recipes');
    }
};
