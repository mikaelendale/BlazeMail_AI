<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('prepared_emails', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('user_id');
            $table->unsignedBigInteger('email_template_id');
            $table->unsignedBigInteger('contact_id');
            $table->unsignedBigInteger('email_account_id');
            $table->string('batch_id'); // Groups emails from same job
            $table->string('contact_name');
            $table->string('contact_email');
            $table->string('contact_company')->nullable();
            $table->string('contact_job_title')->nullable();
            $table->string('subject');
            $table->longText('body');
            $table->integer('personalization_score')->default(0);
            $table->json('personalization_metadata')->nullable();
            $table->string('model_used')->nullable();
            $table->enum('status', ['pending', 'approved', 'sent', 'failed'])->default('pending');
            $table->timestamp('sent_at')->nullable();
            $table->string('message_id')->nullable();
            $table->text('send_error')->nullable();
            $table->timestamps();

            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
            $table->foreign('email_template_id')->references('id')->on('user_saved_emails')->onDelete('cascade');
            $table->foreign('contact_id')->references('id')->on('contacts')->onDelete('cascade');
            $table->foreign('email_account_id')->references('id')->on('email_accounts')->onDelete('cascade');

            $table->index(['user_id', 'batch_id']);
            $table->index(['status']);
        });
    }

    public function down()
    {
        Schema::dropIfExists('prepared_emails');
    }
};
