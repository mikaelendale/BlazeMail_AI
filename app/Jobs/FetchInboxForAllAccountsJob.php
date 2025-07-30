<?php

namespace App\Jobs;

use App\Models\EmailAccount;
use App\Services\GmailInboxService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class FetchInboxForAllAccountsJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public $timeout = 1800; // 30 minutes timeout
    public $tries = 2;

    /**
     * Execute the job - Fetch inbox for all connected Gmail accounts
     */
    public function handle(GmailInboxService $inboxService): void
    {
        try {
            Log::info('Starting inbox fetch for all accounts');

            // Get all connected Gmail accounts
            $accounts = EmailAccount::where('provider', 'gmail')
                ->where('is_connected', true)
                ->where('status', 'active')
                ->get();

            $totalAccounts = $accounts->count();
            $successCount = 0;
            $errorCount = 0;

            Log::info('Found accounts to sync', [
                'total_accounts' => $totalAccounts,
            ]);

            foreach ($accounts as $account) {
                try {
                    Log::info('Syncing account inbox', [
                        'account_id' => $account->id,
                        'email' => $account->email,
                    ]);

                    $result = $inboxService->fetchInboxMessages($account, 100);

                    if ($result['success']) {
                        $successCount++;
                        Log::info('Account inbox synced successfully', [
                            'account_id' => $account->id,
                            'fetched_count' => $result['fetched_count'],
                            'new_count' => $result['new_count'],
                        ]);
                    } else {
                        $errorCount++;
                        Log::error('Account inbox sync failed', [
                            'account_id' => $account->id,
                            'error' => $result['error'],
                        ]);

                        // If account needs re-auth, mark it
                        if ($result['needs_reauth'] ?? false) {
                            $account->update([
                                'status' => 'error',
                                'last_error' => 'Needs re-authorization for inbox access',
                                'consecutive_errors' => ($account->consecutive_errors ?? 0) + 1,
                            ]);
                        }
                    }

                    // Small delay between accounts to be respectful
                    sleep(2);
                } catch (\Exception $e) {
                    $errorCount++;
                    Log::error('Exception during account inbox sync', [
                        'account_id' => $account->id,
                        'error' => $e->getMessage(),
                    ]);

                    $account->update([
                        'last_error' => $e->getMessage(),
                        'consecutive_errors' => ($account->consecutive_errors ?? 0) + 1,
                        'last_health_check' => now(),
                    ]);
                }
            }

            Log::info('Inbox fetch for all accounts completed', [
                'total_accounts' => $totalAccounts,
                'success_count' => $successCount,
                'error_count' => $errorCount,
            ]);
        } catch (\Exception $e) {
            Log::error('Inbox fetch job failed', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            throw $e;
        }
    }

    /**
     * Handle a job failure.
     */
    public function failed(\Throwable $exception): void
    {
        Log::error('Inbox fetch job permanently failed', [
            'error' => $exception->getMessage(),
        ]);
    }

    /**
     * Get the tags that should be assigned to the job.
     */
    public function tags(): array
    {
        return ['inbox-sync', 'all-accounts'];
    }
}
