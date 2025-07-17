<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('campaigns', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('name', 255);
            $table->date('starting_date');
            $table->enum('status', ['draft', 'active', 'paused', 'completed'])->default('draft');
            $table->integer('total_groups')->default(0);
            $table->integer('total_emails')->default(0);
            $table->json('sequence_data'); // Store the entire sequence as JSON for fast retrieval
            $table->timestamp('launched_at')->nullable();
            $table->timestamps();

            // Indexes for performance
            $table->index(['user_id', 'status']);
            $table->index(['user_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('campaigns');
    }
};
