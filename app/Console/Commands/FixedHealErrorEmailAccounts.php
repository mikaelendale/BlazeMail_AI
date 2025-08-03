<?php

namespace App\Console\Commands;

use App\Jobs\FixedValidateEmailTokensJob;
use App\Models\EmailAccount;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

class FixedHealErrorEmailAccounts extends Command
{
    protected $signature = 'email:heal-errors-fixed 
                            {--force : Force healing even for recently attempted accounts}
                            {--account-id= : Heal specific account ID only}';

    protected $description = 'FIXED healing system that works with current database constraints';

    public function handle(): int
    {
        try {
            $this->info('🚀 Starting FIXED healing process (works with current DB constraints)...');
            Log::info('FixedHealErrorEmailAccounts command started.');

            if ($accountId = $this->option('account-id')) {
                return $this->healSpecificAccount((int) $accountId);
            }

            // Get accounts that need healing
            $accounts = EmailAccount::where('provider', 'gmail')
                ->where(function ($query) {
                    $query->where('status', 'error')
                        ->orWhere('consecutive_errors', '>', 0)
                        ->orWhere('token_expires_at', '<=', now()->addHours(1))
                        ->orWhere(function ($subQuery) {
                            $subQuery->where('last_health_check', '<=', now()->subHours(6))
                                ->orWhereNull('last_health_check');
                        })
                        ->orWhere('last_error', 'like', '%invalid_grant%')
                        ->orWhere('last_error', 'like', '%NEEDS_REAUTH%');
                })
                ->get();

            if ($accounts->isEmpty()) {
                $this->info('✅ No email accounts found that need healing.');
                return 0;
            }

            $this->info("🔧 Found {$accounts->count()} accounts that need healing:");

            // Show account details
            $tableData = [];
            foreach ($accounts as $account) {
                $needsReauth = str_contains($account->last_error ?? '', 'invalid_grant') ||
                    str_contains($account->last_error ?? '', 'NEEDS_REAUTH');

                $tableData[] = [
                    $account->id,
                    $account->email,
                    $account->status,
                    $account->consecutive_errors,
                    $needsReauth ? '🔐 Needs Reauth' : 'Other',
                    $account->token_expires_at ? $account->token_expires_at->diffForHumans() : 'Unknown',
                ];
            }

            $this->table([
                'ID',
                'Email',
                'Status',
                'Errors',
                'Issue Type',
                'Token Expires'
            ], $tableData);

            $this->info('🚀 Dispatching FIXED healing jobs...');

            $dispatchedCount = 0;
            foreach ($accounts as $account) {
                try {
                    // Use the fixed job
                    FixedValidateEmailTokensJob::dispatch($account)
                        ->onQueue('email-validation')
                        ->delay(now()->addSeconds(rand(5, 30)));

                    $this->info("✅ Dispatched FIXED healing job for: {$account->email} (ID: {$account->id})");
                    $dispatchedCount++;
                } catch (\Exception $e) {
                    $this->error("❌ Failed to dispatch job for {$account->email}: {$e->getMessage()}");
                }
            }

            $this->info('');
            $this->info("🎉 FIXED healing jobs dispatched successfully!");
            $this->info("📊 Total accounts: {$accounts->count()}");
            $this->info("✅ Jobs dispatched: {$dispatchedCount}");
            $this->info('');
            $this->info('📋 Next steps:');
            $this->info('1. Monitor queue: php artisan queue:work --queue=email-validation');
            $this->info('2. Check status: php artisan email:system-status');
            $this->info('3. Accounts marked as "suspended" with NEEDS_REAUTH need user re-authentication');

            return 0;
        } catch (\Exception $e) {
            $this->error('❌ Failed to heal error accounts: ' . $e->getMessage());
            return 1;
        }
    }

    private function healSpecificAccount(int $accountId): int
    {
        $account = EmailAccount::find($accountId);

        if (!$account) {
            $this->error("❌ Account with ID {$accountId} not found");
            return 1;
        }

        $this->info("🔧 Healing specific account: {$account->email}");
        $this->info("📊 Current status: {$account->status}");
        $this->info("⚠️ Consecutive errors: {$account->consecutive_errors}");

        try {
            FixedValidateEmailTokensJob::dispatch($account)
                ->onQueue('email-validation');

            $this->info("✅ FIXED healing job dispatched for {$account->email}");
            return 0;
        } catch (\Exception $e) {
            $this->error("❌ Failed to dispatch healing job: {$e->getMessage()}");
            return 1;
        }
    }
}
