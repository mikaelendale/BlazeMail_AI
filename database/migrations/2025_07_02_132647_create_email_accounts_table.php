<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * NUCLEAR EMAIL ACCOUNTS TABLE - MAXIMUM SECURITY & PERFORMANCE
     */
    public function up(): void
    {
        Schema::create('email_accounts', function (Blueprint $table) {
            $table->id();

            // User relationship with CASCADE delete for security
            $table->foreignId('user_id')->constrained()->onDelete('cascade');

            // Basic account information
            $table->string('email')->index(); // Indexed for performance
            $table->enum('provider', ['gmail', 'imap', 'outlook', 'yahoo']);
            $table->enum('status', ['active', 'warming', 'paused', 'error', 'pending', 'suspended'])->default('pending');
            $table->boolean('is_connected')->default(false)->index();
            $table->boolean('is_verified')->default(false); // Email verification status

            // ENCRYPTED credentials (AES-256 encryption)
            $table->text('encrypted_password')->nullable(); // For IMAP
            $table->text('encrypted_access_token')->nullable(); // OAuth access token
            $table->text('encrypted_refresh_token')->nullable(); // OAuth refresh token
            $table->text('encrypted_app_password')->nullable(); // Gmail app password

            // ENCRYPTED server settings
            $table->text('encrypted_imap_host')->nullable();
            $table->integer('imap_port')->nullable();
            $table->text('encrypted_smtp_host')->nullable();
            $table->integer('smtp_port')->nullable();
            $table->enum('encryption_type', ['tls', 'ssl', 'none'])->default('tls');

            // OAuth specific fields
            $table->string('oauth_provider_id')->nullable()->index();
            $table->timestamp('token_expires_at')->nullable();
            $table->json('oauth_scopes')->nullable(); // Store granted scopes

            // Sending limits and tracking
            $table->integer('daily_limit')->default(50);
            $table->integer('hourly_limit')->default(10);
            $table->integer('daily_sent')->default(0);
            $table->integer('hourly_sent')->default(0);
            $table->date('daily_sent_date')->nullable();
            $table->timestamp('hourly_sent_reset')->nullable();

            // Warmup system
            $table->integer('warmup_progress')->default(0); // 0-100%
            $table->integer('warmup_day')->default(1); // Current warmup day
            $table->integer('warmup_emails_today')->default(0);
            $table->json('warmup_schedule')->nullable(); // Custom warmup schedule
            $table->enum('reputation', ['excellent', 'good', 'fair', 'poor', 'unknown'])->default('unknown');

            // Health monitoring
            $table->integer('bounce_rate')->default(0); // Percentage
            $table->integer('complaint_rate')->default(0); // Percentage
            $table->integer('success_rate')->default(100); // Percentage
            $table->timestamp('last_activity')->nullable();
            $table->timestamp('last_sync')->nullable();
            $table->timestamp('last_health_check')->nullable();

            // Error tracking
            $table->text('last_error')->nullable();
            $table->integer('consecutive_errors')->default(0);
            $table->timestamp('last_error_at')->nullable();

            // Security fields
            $table->string('connection_hash')->nullable(); // Hash of connection params
            $table->json('security_flags')->nullable(); // Security warnings/flags
            $table->timestamp('last_security_check')->nullable();

            // Metadata
            $table->json('metadata')->nullable(); // Additional provider-specific data
            $table->json('settings')->nullable(); // User preferences

            // Audit trail
            $table->softDeletes();
            $table->timestamps();

            // Indexes for MAXIMUM performance
            $table->index(['user_id', 'status', 'is_connected']);
            $table->index(['provider', 'status']);
            $table->index(['daily_sent_date', 'daily_sent']);
            $table->index(['warmup_progress', 'status']);
            $table->index(['last_activity']);

            // Unique constraint
            $table->unique(['user_id', 'email'], 'unique_user_email');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('email_accounts');
    }
};
