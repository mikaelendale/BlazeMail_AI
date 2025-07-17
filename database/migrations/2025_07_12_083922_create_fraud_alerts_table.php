<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('fraud_alerts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->enum('alert_type', [
                'multiple_accounts',
                'suspicious_referrals',
                'rapid_usage',
                'unusual_pattern',
                'device_mismatch',
                'ip_mismatch'
            ]);
            $table->enum('severity', ['low', 'medium', 'high', 'critical']);
            $table->json('metadata');
            $table->boolean('resolved')->default(false);
            $table->foreignId('resolved_by')->nullable()->constrained('users');
            $table->text('resolution_notes')->nullable();
            $table->timestamp('resolved_at')->nullable();
            $table->timestamps();

            $table->index(['user_id', 'resolved']);
            $table->index(['alert_type', 'severity']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('fraud_alerts');
    }
};
