<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('newsletter_subscriptions', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('email')->unique();
            $table->string('name')->nullable();
            $table->timestamp('email_verified_at')->nullable();
            $table->string('verification_token')->nullable();
            $table->boolean('is_active')->default(true);
            $table->json('preferences')->nullable(); // categories, frequency, etc.
            $table->timestamps();

            $table->index('email');
            $table->index('is_active');
        });
    }

    public function down()
    {
        Schema::dropIfExists('newsletter_subscriptions');
    }
};
