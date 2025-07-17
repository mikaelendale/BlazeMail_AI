<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('rate_limits', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('action_type'); // 'ai_usage', 'referral_creation', etc.
            $table->integer('count')->default(0);
            $table->timestamp('window_start');
            $table->integer('window_duration'); // in minutes
            $table->timestamps();

            $table->unique(['user_id', 'action_type', 'window_start']);
            $table->index(['user_id', 'action_type']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('rate_limits');
    }
};
