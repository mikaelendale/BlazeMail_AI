<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('analytics', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('post_id');
            $table->string('session_id')->nullable();
            $table->string('ip_address'); // Changed from ipAddress to string
            $table->string('user_agent')->nullable();
            $table->string('referrer')->nullable();
            $table->string('source')->nullable(); // organic, social, direct, referral
            $table->string('medium')->nullable(); // search, social, email, etc.
            $table->string('campaign')->nullable();
            $table->string('country')->nullable();
            $table->string('city')->nullable();
            $table->string('device_type')->nullable(); // desktop, mobile, tablet
            $table->string('browser')->nullable();
            $table->string('os')->nullable();
            $table->integer('time_on_page')->default(0); // seconds
            $table->boolean('is_bounce')->default(true);
            $table->timestamps();

            $table->foreign('post_id')->references('id')->on('posts')->onDelete('cascade');
            $table->index(['post_id', 'created_at']);
            $table->index(['source', 'medium']);
            $table->index('created_at');
            $table->index('ip_address'); // Add index for better performance
        });
    }

    public function down()
    {
        Schema::dropIfExists('analytics');
    }
};
