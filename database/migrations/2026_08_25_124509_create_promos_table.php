<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('promos', function (Blueprint $table) {
            $table->id();
            $table->foreignId('outlet_id')->constrained()->cascadeOnDelete();
            $table->string('code', 64)->unique();
            $table->string('name');
            $table->string('type'); // percent / nominal / buy_x_get_y
            $table->decimal('value', 15, 2); // percent (1-100) or nominal amount
            $table->decimal('min_spend', 15, 2)->default(0);
            $table->decimal('max_discount', 15, 2)->nullable();
            $table->date('valid_from');
            $table->date('valid_to');
            $table->integer('usage_limit')->nullable(); // null = unlimited
            $table->integer('usage_count')->default(0);
            $table->integer('usage_limit_per_customer')->default(1);
            $table->string('channel')->default('all'); // all/pos/self_order
            $table->text('description')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->index(['outlet_id', 'is_active']);
            $table->index(['code']);
            $table->index(['valid_from', 'valid_to']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('promos');
    }
};
