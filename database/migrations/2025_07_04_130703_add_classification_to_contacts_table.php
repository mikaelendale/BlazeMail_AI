<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('contacts', function (Blueprint $table) {
            $table->enum('classification', ['lead', 'prospect', 'customer', 'partner', 'vendor', 'other'])
                  ->default('prospect')
                  ->after('job_title');
            $table->enum('status', ['active', 'inactive', 'blocked'])
                  ->default('active')
                  ->after('classification');
            $table->json('tags')->nullable()->after('status');
            $table->timestamp('last_contacted')->nullable()->after('tags');
            $table->index(['user_id', 'classification']);
            $table->index(['user_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::table('contacts', function (Blueprint $table) {
            $table->dropColumn(['classification', 'status', 'tags', 'last_contacted']);
        });
    }
};
