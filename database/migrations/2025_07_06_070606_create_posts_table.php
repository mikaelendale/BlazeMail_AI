<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('posts', function (Blueprint $table) {
            $table->uuid('id')->primary(); // <-- change this line
            $table->string('title');
            $table->string('slug')->unique();
            $table->longText('content');
            $table->text('excerpt');
            $table->foreignId('author_id')->constrained('users')->onDelete('cascade');
            $table->string('featured_image')->nullable();
            $table->enum('status', ['draft', 'published', 'archived'])->default('draft');
            $table->timestamp('published_at')->nullable();
            $table->integer('views')->default(0);
            $table->timestamps();

            $table->index(['status', 'published_at']);
            $table->index('slug');
        });
    }

    public function down()
    {
        Schema::dropIfExists('posts');
    }
};
