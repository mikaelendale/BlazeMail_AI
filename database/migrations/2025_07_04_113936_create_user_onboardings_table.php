<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateUserOnboardingsTable extends Migration
{
    public function up()
    {
        Schema::create('user_onboardings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->boolean('profile_completed')->default(false);
            $table->boolean('first_email_sent')->default(false);
            $table->string('user_goal')->nullable();
            $table->string('custom_goal')->nullable();

            // User Info (JSON for flexibility)
            $table->json('user_info')->nullable();

            // Email Data (JSON for flexibility)
            $table->json('email_data')->nullable();

            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('user_onboardings');
    }
}
