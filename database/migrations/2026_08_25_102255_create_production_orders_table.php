<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('production_orders', function (Blueprint $table) {
            $table->id();
            $table->string('batch_number')->unique();
            $table->foreignId('central_outlet_id')->constrained('outlets')->cascadeOnDelete();
            $table->foreignId('target_outlet_id')->nullable()->constrained('outlets')->nullOnDelete();
            $table->foreignId('menu_id')->constrained()->cascadeOnDelete();
            $table->decimal('qty_to_produce', 15, 4);
            $table->decimal('qty_produced', 15, 4)->default(0);
            $table->decimal('cost_per_unit', 15, 4);
            $table->decimal('total_cost', 15, 2);
            $table->string('status')->default('planned'); // planned, in_progress, completed, distributed
            $table->text('notes')->nullable();
            $table->timestamp('produced_at')->nullable();
            $table->timestamp('distributed_at')->nullable();
            $table->foreignId('produced_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index(['central_outlet_id', 'status']);
            $table->index(['target_outlet_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('production_orders');
    }
};
