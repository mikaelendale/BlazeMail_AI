<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('campaign_groups', function (Blueprint $table) {
            $table->id();
            $table->foreignId('campaign_id')->constrained()->onDelete('cascade');
            $table->string('title', 255);
            $table->integer('delay_days')->default(0);
            $table->integer('delay_hours')->default(0);
            $table->integer('delay_minutes')->default(0);
            $table->integer('order');
            $table->json('email_ids'); // Store email IDs as JSON array for faster queries
            $table->timestamps();

            // Indexes for performance
            $table->index(['campaign_id', 'order']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('campaign_groups');
    }
};
