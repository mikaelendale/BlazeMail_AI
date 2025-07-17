<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('campaign_executions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('campaign_id')->constrained()->onDelete('cascade');
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->json('recipient_data'); // Store recipient info
            $table->enum('status', ['pending', 'processing', 'completed', 'failed'])->default('pending');
            $table->timestamp('scheduled_at');
            $table->timestamp('executed_at')->nullable();
            $table->json('execution_log')->nullable(); // Store execution details
            $table->timestamps();

            // Indexes for performance
            $table->index(['status', 'scheduled_at']);
            $table->index(['campaign_id', 'status']);
            $table->index(['user_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('campaign_executions');
    }
};
