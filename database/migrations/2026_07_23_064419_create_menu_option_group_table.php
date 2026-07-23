<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('menu_option_group', function (Blueprint $table) {
            $table->foreignId('menu_id')->constrained()->cascadeOnDelete();
            $table->foreignId('option_group_id')->constrained()->cascadeOnDelete();
            $table->primary(['menu_id', 'option_group_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('menu_option_group');
    }
};
