<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('campaigns', function (Blueprint $table) {
            $table->boolean('is_setup_complete')->default(false)->after('sequence_data');
            $table->foreignId('email_account_id')->nullable()->constrained()->after('is_setup_complete');
            $table->json('recipient_settings')->nullable()->after('email_account_id');
            $table->json('campaign_settings')->nullable()->after('recipient_settings');
            $table->enum('sending_schedule', ['business-hours', 'extended', '24-7', 'custom'])->default('business-hours')->after('campaign_settings');
            $table->text('notes')->nullable()->after('sending_schedule');

            // Indexes for performance
            $table->index(['user_id', 'is_setup_complete']);
            $table->index(['email_account_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::table('campaigns', function (Blueprint $table) {
            $table->dropForeign(['email_account_id']);
            $table->dropColumn([
                'is_setup_complete',
                'email_account_id',
                'recipient_settings',
                'campaign_settings',
                'sending_schedule',
                'notes'
            ]);
        });
    }
};
