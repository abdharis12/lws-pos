<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('attendances', function (Blueprint $table) {
            $table->id();
            $table->foreignId('employee_id')->constrained()->cascadeOnDelete();
            $table->dateTime('clock_in_at');
            $table->dateTime('clock_out_at')->nullable();
            $table->string('photo_path_in')->nullable();
            $table->string('photo_path_out')->nullable();
            $table->decimal('latitude_in', 10, 7)->nullable();
            $table->decimal('longitude_in', 10, 7)->nullable();
            $table->decimal('latitude_out', 10, 7)->nullable();
            $table->decimal('longitude_out', 10, 7)->nullable();
            $table->string('status')->default('present');
            $table->timestamps();

            $table->index(['employee_id', 'clock_in_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('attendances');
    }
};
