<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('user_saved_emails', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('subject');
            $table->string('recipient')->nullable();
            $table->string('sender')->nullable();
            $table->string('audience')->nullable();
            $table->string('tone')->nullable();
            $table->string('purpose')->nullable();
            $table->string('cta')->nullable();
            $table->text('context')->nullable();
            $table->longText('prompt');
            $table->longText('email_content');
            $table->text('feedback')->nullable();
            $table->string('model_used')->nullable(); // for tracking which model generated the email
            $table->json('meta')->nullable(); // for tracking any future key-value like language, tags, etc.
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('user_saved_emails');
    }
};
