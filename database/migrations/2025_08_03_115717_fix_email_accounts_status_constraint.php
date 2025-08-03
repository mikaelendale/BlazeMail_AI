<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Drop the existing check constraint
        DB::statement('ALTER TABLE email_accounts DROP CONSTRAINT IF EXISTS email_accounts_status_check');

        // Add the new check constraint with all valid statuses including needs_reauth
        DB::statement("
            ALTER TABLE email_accounts 
            ADD CONSTRAINT email_accounts_status_check 
            CHECK (status IN ('active', 'warming', 'paused', 'error', 'pending', 'suspended', 'warning', 'needs_reauth'))
        ");
    }

    public function down(): void
    {
        // Drop the new constraint
        DB::statement('ALTER TABLE email_accounts DROP CONSTRAINT IF EXISTS email_accounts_status_check');

        // Restore the original constraint (without needs_reauth)
        DB::statement("
            ALTER TABLE email_accounts 
            ADD CONSTRAINT email_accounts_status_check 
            CHECK (status IN ('active', 'warming', 'paused', 'error', 'pending', 'suspended'))
        ");
    }
};
