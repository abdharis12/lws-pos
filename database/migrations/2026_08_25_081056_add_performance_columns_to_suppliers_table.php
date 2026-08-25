<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('suppliers', function (Blueprint $table) {
            $table->decimal('rating', 5, 2)->nullable()->after('lead_time_days');
            $table->decimal('on_time_delivery_rate', 5, 2)->nullable()->after('rating');
            $table->decimal('quality_rating', 5, 2)->nullable()->after('on_time_delivery_rate');
        });
    }

    public function down(): void
    {
        Schema::table('suppliers', function (Blueprint $table) {
            $table->dropColumn(['rating', 'on_time_delivery_rate', 'quality_rating']);
        });
    }
};
