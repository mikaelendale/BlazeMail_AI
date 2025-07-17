<?php

namespace App\Console\Commands;

use App\Jobs\ValidateEmailTokensJob;
use App\Models\EmailAccount;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

class HealErrorEmailAccounts extends Command
{
    protected $signature = 'email:heal-errors';

    protected $description = 'Attempts to heal email accounts that are in an "error" status by re-validating their tokens.';

    public function handle(): int
    {
        $this->info('Starting healing process for email accounts in error state...');
        Log::info('HealErrorEmailAccounts command started.');

        try {
            $errorAccounts = EmailAccount::where('status', 'error')
                ->where('provider', 'gmail') // Only applicable for OAuth accounts
                ->get();

            if ($errorAccounts->isEmpty()) {
                $this->info('No email accounts found in "error" status.');
                Log::info('No email accounts found in "error" status.');
                return 0;
            }

            $this->info("Found {$errorAccounts->count()} accounts in error state. Dispatching validation jobs...");

            foreach ($errorAccounts as $account) {
                ValidateEmailTokensJob::dispatch($account)
                    ->onQueue('email-validation')
                    ->delay(now()->addSeconds(rand(1, 30))); // Add a small random delay to spread load

                $this->info("Dispatched healing job for account: {$account->email} (ID: {$account->id})");
                Log::info('Dispatched healing job for error account.', [
                    'account_id' => $account->id,
                    'email' => $account->email,
                ]);
            }

            $this->info('Healing jobs dispatched. Monitor your queue for progress.');
            Log::info('HealErrorEmailAccounts command completed.');
            return 0;
        } catch (\Exception $e) {
            $this->error('Failed to heal error accounts: ' . $e->getMessage());
            Log::error('HealErrorEmailAccounts command failed.', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            return 1;
        }
    }
}
