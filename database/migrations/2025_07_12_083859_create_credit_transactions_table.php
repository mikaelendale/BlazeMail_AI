<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('credit_transactions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->enum('type', [
                'signup_bonus',
                'referral_bonus',
                'subscription_bonus',
                'subscription_refill',
                'plan_swap_bonus',
                'free_refill',
                'ai_usage',
                'email_generation',
                'ai_rewrite',
                'manual_adjustment',
                'refund',
                'expiration',
                'promotional'
            ]);
            $table->integer('amount'); // Positive for earned, negative for used
            $table->string('description')->nullable();
            $table->json('metadata')->nullable();
            $table->timestamp('expires_at')->nullable();
            $table->boolean('expired')->default(false);
            $table->string('batch_id')->nullable();
            $table->foreignId('reversal_transaction_id')->nullable()->constrained('credit_transactions');
            $table->string('reference_id')->nullable(); // For external references
            $table->timestamps();

            // Indexes for performance
            $table->index(['user_id', 'created_at']);
            $table->index(['type', 'created_at']);
            $table->index('expires_at');
            $table->index('batch_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('credit_transactions');
    }
};
