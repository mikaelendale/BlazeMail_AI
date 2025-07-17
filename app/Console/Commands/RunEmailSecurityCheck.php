<?php

namespace App\Console\Commands;

use App\Jobs\EmailSecurityCheckJob;
use App\Models\EmailAccount;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

class RunEmailSecurityCheck extends Command
{
    protected $signature = 'email:security-check 
                            {--account-id= : Run security check for specific account ID}
                            {--force : Force run even if recently executed}';

    protected $description = 'Run comprehensive security checks on email accounts';

    public function handle(): int
    {
        try {
            $this->info('Starting email security check...');

            if ($accountId = $this->option('account-id')) {
                $this->runForSpecificAccount((int) $accountId);
            } else {
                $this->runForAllAccounts();
            }

            $this->info('Email security check completed successfully!');
            return 0;
        } catch (\Exception $e) {
            $this->error('Failed to run security check: ' . $e->getMessage());
            Log::error('Security check command failed', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            return 1;
        }
    }

    private function runForSpecificAccount(int $accountId): void
    {
        $account = EmailAccount::find($accountId);

        if (!$account) {
            $this->error("Account with ID {$accountId} not found");
            return;
        }

        $this->info("Running security check for account: {$account->email}");

        EmailSecurityCheckJob::dispatch($account)
            ->onQueue('email-security');

        $this->info("✓ Security check scheduled for {$account->email}");
    }

    private function runForAllAccounts(): void
    {
        // Schedule security check for all accounts
        EmailSecurityCheckJob::dispatch()
            ->onQueue('email-security')
            ->delay(now()->addMinutes(1));

        $this->info('✓ Security check scheduled for all accounts');

        // Show summary
        $stats = [
            ['Metric', 'Count'],
            ['Total Active Accounts', EmailAccount::where('is_connected', true)->count()],
            ['Accounts in Warning', EmailAccount::where('status', 'warning')->count()],
            ['Accounts in Error', EmailAccount::where('status', 'error')->count()],
            ['Accounts Suspended', EmailAccount::where('status', 'suspended')->count()],
        ];

        $this->table($stats[0], array_slice($stats, 1));
    }
}
