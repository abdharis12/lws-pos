<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('customers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('outlet_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->string('name');
            $table->string('phone', 32)->nullable();
            $table->string('email')->nullable();
            $table->date('birthdate')->nullable();
            $table->string('tier', 20)->default('bronze'); // bronze/silver/gold/platinum
            $table->integer('points')->default(0);
            $table->decimal('total_spend', 15, 2)->default(0);
            $table->integer('visit_count')->default(0);
            $table->text('preferences')->nullable();
            $table->string('allergens')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->unique(['outlet_id', 'phone']);
            $table->index(['outlet_id', 'tier']);
            $table->index(['phone']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('customers');
    }
};
