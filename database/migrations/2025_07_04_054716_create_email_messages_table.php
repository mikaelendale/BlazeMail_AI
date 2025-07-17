<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations - ROBUST EMAIL STORAGE! 🔥
     */
    public function up(): void
    {
        Schema::create('email_messages', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->foreignId('email_account_id')->constrained()->onDelete('cascade');

            // Gmail API specific fields
            $table->string('gmail_message_id')->unique(); // Gmail's message ID
            $table->string('gmail_thread_id')->index(); // Gmail's thread ID
            $table->json('gmail_labels')->nullable(); // Gmail labels

            // Email headers
            $table->string('message_id')->nullable(); // Email Message-ID header
            $table->string('subject')->nullable();
            $table->string('from_email')->index();
            $table->string('from_name')->nullable();
            $table->string('to_email')->index();
            $table->string('to_name')->nullable();
            $table->string('reply_to')->nullable();
            $table->json('cc')->nullable(); // Array of CC recipients
            $table->json('bcc')->nullable(); // Array of BCC recipients

            // Email content
            $table->longText('body_html')->nullable();
            $table->longText('body_text')->nullable();
            $table->text('snippet')->nullable(); // Gmail snippet

            // Email metadata
            $table->boolean('is_read')->default(false)->index();
            $table->boolean('is_important')->default(false)->index();
            $table->boolean('is_starred')->default(false)->index();
            $table->boolean('is_draft')->default(false)->index();
            $table->boolean('is_sent')->default(false)->index();
            $table->boolean('is_spam')->default(false)->index();
            $table->boolean('is_trash')->default(false)->index();

            // Size and attachments
            $table->integer('size_bytes')->nullable();
            $table->boolean('has_attachments')->default(false)->index();
            $table->json('attachments')->nullable(); // Attachment metadata

            // Tracking for cold emails
            $table->boolean('is_cold_email')->default(false)->index();
            $table->boolean('is_reply')->default(false)->index();
            $table->string('in_reply_to')->nullable(); // Message-ID this is replying to
            $table->json('references')->nullable(); // Email references chain

            // Sync metadata
            $table->timestamp('received_at')->index(); // When email was received
            $table->timestamp('sent_at')->nullable()->index(); // When email was sent
            $table->timestamp('synced_at')->nullable(); // When we fetched it
            $table->string('sync_status')->default('pending'); // pending, synced, failed
            $table->text('sync_error')->nullable();

            // Search and performance
            $table->fullText(['subject', 'from_email', 'to_email', 'body_text'], 'email_search');
            $table->json('metadata')->nullable(); // Additional Gmail metadata

            $table->timestamps();

            // Indexes for performance 🚀
            $table->index(['user_id', 'received_at']);
            $table->index(['email_account_id', 'received_at']);
            $table->index(['gmail_thread_id', 'received_at']);
            $table->index(['is_read', 'received_at']);
            $table->index(['is_cold_email', 'received_at']);
            $table->index(['sync_status', 'synced_at']);

            // Unique constraint to prevent duplicates
            $table->unique(['email_account_id', 'gmail_message_id'], 'unique_account_message');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('email_messages');
    }
};
