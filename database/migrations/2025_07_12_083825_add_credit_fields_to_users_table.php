<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->integer('credit_balance')->default(0)->after('own_referral_code');
            $table->integer('referral_credits')->default(0)->after('credit_balance');
            $table->string('device_fingerprint')->nullable()->after('referral_credits');
            $table->timestamp('last_credit_activity')->nullable()->after('device_fingerprint');
            $table->integer('fraud_score')->default(0)->after('last_credit_activity');
            $table->enum('account_status', ['active', 'suspended', 'flagged'])->default('active')->after('fraud_score');
            $table->json('credit_metadata')->nullable()->after('account_status');

            // Indexes for performance
            $table->index('credit_balance');
            $table->index('account_status');
            $table->index('device_fingerprint');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn([
                'credit_balance',
                'referral_credits',
                'device_fingerprint',
                'last_credit_activity',
                'fraud_score',
                'account_status',
                'credit_metadata'
            ]);
        });
    }
};
