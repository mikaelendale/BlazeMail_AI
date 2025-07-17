<?php

namespace App\Console\Commands;

use App\Jobs\EmailAccountHealthCheckJob;
use App\Jobs\ValidateEmailTokensJob;
use App\Models\EmailAccount;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

class ScheduleEmailHealthChecks extends Command
{
    protected $signature = 'email:schedule-health-checks 
                            {--force : Force run even if recently executed}
                            {--account-id= : Run for specific account ID only}';

    protected $description = 'Schedule health checks and token validation for email accounts';

    public function handle(): int
    {
        try {
            $this->info('Starting email health check scheduling...');

            if ($accountId = $this->option('account-id')) {
                $this->handleSpecificAccount((int) $accountId);
            } else {
                $this->handleAllAccounts();
            }

            $this->info('Email health check scheduling completed successfully!');
            return 0;
        } catch (\Exception $e) {
            $this->error('Failed to schedule health checks: ' . $e->getMessage());
            Log::error('Health check scheduling failed', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            return 1;
        }
    }

    private function handleSpecificAccount(int $accountId): void
    {
        $account = EmailAccount::find($accountId);

        if (!$account) {
            $this->error("Account with ID {$accountId} not found");
            return;
        }

        $this->info("Scheduling health check for account: {$account->email}");

        // Schedule immediate token validation
        ValidateEmailTokensJob::dispatch($account)
            ->onQueue('email-validation');

        $this->info("✓ Token validation scheduled for {$account->email}");
    }

    private function handleAllAccounts(): void
    {
        // Schedule general health check job
        EmailAccountHealthCheckJob::dispatch()
            ->onQueue('email-health')
            ->delay(now()->addMinutes(2));

        $this->info('✓ General health check job scheduled');

        // Get accounts that need immediate token validation
        $accountsNeedingValidation = EmailAccount::where('is_connected', true)
            ->where('provider', 'gmail')
            ->where(function ($query) {
                $query->where('token_expires_at', '<=', now()->addHour())
                    ->orWhere('last_health_check', '<=', now()->subHours(6))
                    ->orWhereNull('last_health_check');
            })
            ->get();

        $this->info("Found {$accountsNeedingValidation->count()} accounts needing token validation");

        foreach ($accountsNeedingValidation as $index => $account) {
            // Spread the jobs over time to avoid rate limits
            $delay = now()->addMinutes($index * 2 + rand(1, 5));

            ValidateEmailTokensJob::dispatch($account)
                ->onQueue('email-validation')
                ->delay($delay);

            $this->info("✓ Token validation scheduled for {$account->email} (delay: {$delay->diffInMinutes(now())} min)");
        }

        // Show summary
        $this->table(['Metric', 'Count'], [
            ['Total Active Accounts', EmailAccount::where('is_connected', true)->count()],
            ['Accounts Needing Validation', $accountsNeedingValidation->count()],
            ['Gmail Accounts', EmailAccount::where('provider', 'gmail')->where('is_connected', true)->count()],
            ['Accounts in Error State', EmailAccount::where('status', 'error')->count()],
        ]);
    }
}
