<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('job_progress', function (Blueprint $table) {
            $table->id();
            $table->string('job_id')->unique();
            $table->string('batch_id')->nullable();
            $table->unsignedBigInteger('user_id');
            $table->string('job_type');
            $table->string('status')->default('started'); // started, processing, completed, failed
            $table->integer('total_items')->default(0);
            $table->integer('processed_items')->default(0);
            $table->integer('successful_items')->default(0);
            $table->integer('failed_items')->default(0);
            $table->json('current_item')->nullable();
            $table->json('metadata')->nullable();
            $table->decimal('progress_percentage', 5, 2)->default(0);
            $table->timestamp('started_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->text('error_message')->nullable();
            $table->timestamps();

            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
            $table->index(['user_id', 'status']);
            $table->index(['batch_id']);
        });
    }

    public function down()
    {
        Schema::dropIfExists('job_progress');
    }
};
