<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('checklist_executions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('checklist_template_id')->constrained()->cascadeOnDelete();
            $table->foreignId('employee_id')->constrained()->cascadeOnDelete();
            $table->foreignId('outlet_id')->constrained()->cascadeOnDelete();
            $table->date('shift_date');
            $table->timestamp('executed_at');
            $table->timestamp('completed_at')->nullable();
            $table->string('status')->default('in_progress'); // in_progress, completed
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index(['outlet_id', 'shift_date']);
            $table->index(['employee_id', 'shift_date']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('checklist_executions');
    }
};
