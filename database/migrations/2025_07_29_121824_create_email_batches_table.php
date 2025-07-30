<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations - EMAIL BATCH TRACKING TABLE
     */
    public function up(): void
    {
        Schema::create('email_batches', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->foreignId('email_account_id')->constrained()->onDelete('cascade');

            // Campaign and batch identification
            $table->string('campaign_id')->index(); // Groups batches together
            $table->integer('batch_number'); // 1, 2, 3, etc.
            $table->integer('total_batches'); // Total batches in campaign

            // Batch content
            $table->json('recipients'); // Array of recipient data
            $table->json('email_template'); // Email subject, body, etc.
            $table->json('settings')->nullable(); // Sender settings, tracking, etc.

            // Batch status and timing
            $table->enum('status', [
                'pending',
                'processing',
                'completed',
                'completed_with_errors',
                'failed',
                'cancelled'
            ])->default('pending')->index();

            $table->timestamp('scheduled_at')->index(); // When to process this batch
            $table->timestamp('started_at')->nullable(); // When processing started
            $table->timestamp('completed_at')->nullable(); // When processing finished

            // Batch metrics
            $table->integer('batch_size'); // Number of recipients in this batch
            $table->integer('sent_count')->default(0); // Successfully sent emails
            $table->integer('error_count')->default(0); // Failed emails
            $table->json('errors')->nullable(); // Array of error details

            // Additional metadata
            $table->json('metadata')->nullable(); // Campaign info, settings, etc.

            $table->timestamps();

            // Indexes for performance
            $table->index(['campaign_id', 'batch_number']);
            $table->index(['user_id', 'status', 'scheduled_at']);
            $table->index(['email_account_id', 'status']);
            $table->index(['status', 'scheduled_at']); // For job processing
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('email_batches');
    }
};
