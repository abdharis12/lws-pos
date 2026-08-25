<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->foreignId('customer_id')->nullable()->constrained()->nullOnDelete()->after('customer_name');
            $table->foreignId('promo_id')->nullable()->constrained()->nullOnDelete()->after('customer_id');
            $table->decimal('promo_discount', 15, 2)->default(0)->after('promo_id');
        });
    }

    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropConstrainedForeignId('customer_id');
            $table->dropConstrainedForeignId('promo_id');
            $table->dropColumn('promo_discount');
        });
    }
};
