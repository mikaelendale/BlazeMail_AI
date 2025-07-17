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

/**
 * 🚀 AUTOMATIC EMAIL SYNC JOB - RUNS IN BACKGROUND! 
 * 
 * This job syncs emails for a specific account automatically
 * Jobs are PERFECT for:
 * - Long-running tasks (like API calls)
 * - Tasks that can fail and retry
 * - Background processing
 * - Scheduled operations
 */
class SyncInboxJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    protected EmailAccount $account;
    protected int $maxMessages;

    /**
     * Job timeout in seconds (5 minutes max for Gmail API)
     */
    public $timeout = 300;

    /**
     * Number of times to retry if job fails
     */
    public $tries = 3;

    /**
     * Seconds to wait before retrying
     */
    public $backoff = [30, 60, 120]; // 30s, 1min, 2min

    /**
     * Create a new job instance - THIS IS THE CONSTRUCTOR! 🏗️
     */
    public function __construct(EmailAccount $account, int $maxMessages = 50)
    {
        $this->account = $account;
        $this->maxMessages = $maxMessages;

        // Set queue name (you can have different queues for different priorities)
        $this->onQueue('emails'); // This job goes to 'emails' queue

        Log::info('📧 Sync job created', [
            'account_id' => $account->id,
            'email' => $account->email,
            'max_messages' => $maxMessages,
        ]);
    }

    /**
     * Execute the job - THIS IS WHERE THE MAGIC HAPPENS! ✨
     */
    public function handle(GmailInboxService $gmailInboxService): void
    {
        try {
            Log::info('🚀 Starting inbox sync job', [
                'account_id' => $this->account->id,
                'email' => $this->account->email,
                'attempt' => $this->attempts(), // Which attempt is this?
            ]);

            // Check if account is still active and connected
            // (Account might have been disconnected while job was queued)
            $freshAccount = EmailAccount::find($this->account->id);

            if (!$freshAccount || !$freshAccount->is_connected || $freshAccount->status !== 'active') {
                Log::warning('⚠️ Skipping sync for inactive account', [
                    'account_id' => $this->account->id,
                    'exists' => $freshAccount ? 'yes' : 'no',
                    'is_connected' => $freshAccount?->is_connected ?? false,
                    'status' => $freshAccount?->status ?? 'unknown',
                ]);
                return; // Exit gracefully
            }

            // Update the account reference to fresh data
            $this->account = $freshAccount;

            // 🔥 DO THE ACTUAL SYNC WORK!
            $result = $gmailInboxService->fetchInboxMessages($this->account, $this->maxMessages);

            if ($result['success']) {
                Log::info('✅ Inbox sync job completed successfully', [
                    'account_id' => $this->account->id,
                    'fetched_count' => $result['fetched_count'] ?? 0,
                    'new_count' => $result['new_count'] ?? 0,
                    'error_count' => $result['error_count'] ?? 0,
                    'duration' => microtime(true) - LARAVEL_START,
                ]);

                // Clear any previous errors
                $this->account->clearError();

                // Update last successful sync
                $this->account->update([
                    'last_sync' => now(),
                    'last_activity' => now(),
                ]);
            } else {
                Log::error('❌ Inbox sync job failed', [
                    'account_id' => $this->account->id,
                    'error' => $result['error'] ?? 'Unknown error',
                ]);

                // Record error but don't fail the job (it's a soft failure)
                $this->account->recordError($result['error'] ?? 'Sync failed');

                // If it's a token error, we might want to retry
                if (str_contains($result['error'] ?? '', 'token') || str_contains($result['error'] ?? '', 'auth')) {
                    throw new \Exception('Authentication error: ' . $result['error']);
                }
            }
        } catch (\Exception $e) {
            Log::error('💥 Inbox sync job exception', [
                'account_id' => $this->account->id,
                'error' => $e->getMessage(),
                'attempt' => $this->attempts(),
                'max_tries' => $this->tries,
            ]);

            // Record error on account
            $this->account->recordError($e->getMessage());

            // Re-throw to mark job as failed (will trigger retry)
            throw $e;
        }
    }

    /**
     * Handle a job failure - CALLED WHEN ALL RETRIES ARE EXHAUSTED! 💀
     */
    public function failed(\Throwable $exception): void
    {
        Log::error('💀 Inbox sync job failed permanently', [
            'account_id' => $this->account->id,
            'email' => $this->account->email,
            'error' => $exception->getMessage(),
            'attempts_made' => $this->attempts(),
        ]);

        // Record permanent failure on account
        $this->account->recordError('Sync failed after ' . $this->tries . ' attempts: ' . $exception->getMessage());

        // Maybe send notification to user or admin here
        // Notification::send($this->account->user, new SyncFailedNotification($this->account));
    }

    /**
     * Get unique job ID for deduplication
     */
    public function uniqueId(): string
    {
        return 'sync-inbox-' . $this->account->id;
    }

    /**
     * How long to keep this job unique (prevents duplicate jobs)
     */
    public function uniqueFor(): int
    {
        return 300; // 5 minutes
    }
}
