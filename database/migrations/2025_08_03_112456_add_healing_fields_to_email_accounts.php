<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('email_accounts', function (Blueprint $table) {
            // Add healing system fields
            $table->timestamp('last_healing_attempt')->nullable()->after('last_health_check');
            $table->integer('healing_attempts_today')->default(0)->after('last_healing_attempt');
            $table->json('healing_history')->nullable()->after('healing_attempts_today');

            // Add auto-healing flags
            $table->boolean('auto_healing_enabled')->default(true)->after('healing_history');
            $table->timestamp('auto_healed_at')->nullable()->after('auto_healing_enabled');
            $table->integer('auto_heal_count')->default(0)->after('auto_healed_at');

            // Add token refresh tracking
            $table->timestamp('last_token_refresh')->nullable()->after('token_expires_at');
            $table->integer('token_refresh_count')->default(0)->after('last_token_refresh');
            $table->timestamp('token_refresh_failed_at')->nullable()->after('token_refresh_count');

            // Add indexes for healing queries
            $table->index(['status', 'consecutive_errors', 'last_health_check']);
            $table->index(['auto_healing_enabled', 'status']);
            $table->index(['token_expires_at', 'provider']);
        });
    }

    public function down(): void
    {
        Schema::table('email_accounts', function (Blueprint $table) {
            $table->dropIndex(['status', 'consecutive_errors', 'last_health_check']);
            $table->dropIndex(['auto_healing_enabled', 'status']);
            $table->dropIndex(['token_expires_at', 'provider']);

            $table->dropColumn([
                'last_healing_attempt',
                'healing_attempts_today',
                'healing_history',
                'auto_healing_enabled',
                'auto_healed_at',
                'auto_heal_count',
                'last_token_refresh',
                'token_refresh_count',
                'token_refresh_failed_at',
            ]);
        });
    }
};
