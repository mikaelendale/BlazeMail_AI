<?php

namespace App\Jobs;

use App\Models\EmailAccount;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

/**
 * 🌟 SYNC ALL ACCOUNTS JOB - THE MASTER DISPATCHER! 
 * 
 * This job finds all active accounts and dispatches individual sync jobs
 * This is a "dispatcher" pattern - one job creates many smaller jobs
 */
class SyncAllAccountsJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    protected ?int $userId;
    protected int $maxMessagesPerAccount;

    public $timeout = 120; // 2 minutes (this job is fast, just dispatching)
    public $tries = 2;

    /**
     * Create job to sync all accounts (or just one user's accounts)
     */
    public function __construct(?int $userId = null, int $maxMessagesPerAccount = 50)
    {
        $this->userId = $userId;
        $this->maxMessagesPerAccount = $maxMessagesPerAccount;
        $this->onQueue('emails');

        Log::info('🌟 Sync all accounts job created', [
            'user_id' => $userId,
            'scope' => $userId ? 'single_user' : 'all_users',
        ]);
    }

    /**
     * Execute the job - DISPATCH INDIVIDUAL SYNC JOBS! 🚀
     */
    public function handle(): void
    {
        try {
            Log::info('🌟 Starting sync all accounts job', [
                'user_id' => $this->userId,
            ]);

            // Get accounts to sync
            $query = EmailAccount::where('is_connected', true)
                ->where('status', 'active');

            if ($this->userId) {
                $query->where('user_id', $this->userId);
            }

            $accounts = $query->get();

            Log::info('📊 Found accounts to sync', [
                'count' => $accounts->count(),
                'user_id' => $this->userId,
            ]);

            $dispatchedCount = 0;
            $skippedCount = 0;

            foreach ($accounts as $account) {
                try {
                    // Check if account was synced recently (avoid spam)
                    $lastSync = $account->last_sync;
                    $minInterval = now()->subMinutes(15); // Don't sync more than every 15 minutes

                    if ($lastSync && $lastSync->gt($minInterval)) {
                        Log::debug('⏭️ Skipping recent sync', [
                            'account_id' => $account->id,
                            'last_sync' => $lastSync->toISOString(),
                        ]);
                        $skippedCount++;
                        continue;
                    }

                    // 🚀 DISPATCH INDIVIDUAL SYNC JOB!
                    SyncInboxJob::dispatch($account, $this->maxMessagesPerAccount)
                        ->delay(now()->addSeconds($dispatchedCount * 2)); // Stagger jobs by 2 seconds

                    $dispatchedCount++;

                    Log::info('📤 Dispatched sync job', [
                        'account_id' => $account->id,
                        'email' => $account->email,
                        'delay_seconds' => $dispatchedCount * 2,
                    ]);
                } catch (\Exception $e) {
                    Log::error('❌ Failed to dispatch sync job', [
                        'account_id' => $account->id,
                        'error' => $e->getMessage(),
                    ]);
                    $skippedCount++;
                }
            }

            Log::info('✅ Sync all accounts job completed', [
                'dispatched_count' => $dispatchedCount,
                'skipped_count' => $skippedCount,
                'total_accounts' => $accounts->count(),
            ]);
        } catch (\Exception $e) {
            Log::error('💥 Sync all accounts job failed', [
                'user_id' => $this->userId,
                'error' => $e->getMessage(),
            ]);
            throw $e;
        }
    }

    public function failed(\Throwable $exception): void
    {
        Log::error('💀 Sync all accounts job failed permanently', [
            'user_id' => $this->userId,
            'error' => $exception->getMessage(),
        ]);
    }
}
