<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->boolean('marketing_emails')->default(true)->after('email_verified_at');
            $table->timestamp('welcome_email_sent_at')->nullable()->after('marketing_emails');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['marketing_emails', 'welcome_email_sent_at']);
        });
    }
};
