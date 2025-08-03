<?php

namespace App\Console\Commands;

use App\Models\EmailAccount;
use App\Jobs\ImprovedValidateEmailTokensJob;
use Illuminate\Console\Command;

class TestEmailConnection extends Command
{
    protected $signature = 'email:test-connection {account-id : The ID of the email account to test}';
    protected $description = 'Test connection for a specific email account';

    public function handle(): int
    {
        $accountId = $this->argument('account-id');
        $account = EmailAccount::find($accountId);

        if (!$account) {
            $this->error("❌ Account with ID {$accountId} not found");
            return 1;
        }

        $this->info("🧪 Testing connection for: {$account->email}");
        $this->info("📊 Current status: {$account->status}");
        $this->line('');

        try {
            // Dispatch the healing job synchronously for testing
            $this->info('🚀 Running connection test...');

            ImprovedValidateEmailTokensJob::dispatchSync($account);

            // Refresh the account to get updated status
            $account->refresh();

            $this->line('');
            $this->info('✅ Connection test completed!');
            $this->info("📊 New status: {$account->status}");
            $this->info("🔗 Connected: " . ($account->is_connected ? 'Yes' : 'No'));
            $this->info("⚠️ Consecutive errors: {$account->consecutive_errors}");

            if ($account->last_error) {
                $this->warn("🚨 Last error: {$account->last_error}");
            }

            if ($account->status === 'active' && $account->is_connected) {
                $this->info('🎉 Account is now healthy and ready to use!');
            } elseif ($account->status === 'needs_reauth') {
                $this->warn('🔐 Account needs re-authentication. User must reconnect Gmail.');
            } else {
                $this->warn('⚠️ Account still has issues. Check the error details above.');
            }

            return 0;
        } catch (\Exception $e) {
            $this->error("❌ Connection test failed: {$e->getMessage()}");
            return 1;
        }
    }
}
