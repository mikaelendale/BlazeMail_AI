<?php

namespace App\Jobs;

use App\Models\EmailAccount;
use App\Services\GmailService;
use App\Services\ImapService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class TestEmailConnectionJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    protected EmailAccount $account;

    public $tries = 3;
    public $backoff = [30, 60, 120]; // Exponential backoff in seconds
    public $timeout = 120; // 2 minutes timeout

    public function __construct(EmailAccount $account)
    {
        $this->account = $account;
        // Use database queue - NO REDIS NEEDED!
        $this->onQueue('default');
    }

    /**
     * Execute the job with NUCLEAR error handling
     */
    public function handle(): void
    {
        try {
            Log::info('Testing email connection', [
                'account_id' => $this->account->id,
                'provider' => $this->account->provider,
                'attempt' => $this->attempts(),
            ]);

            $success = false;

            // Test connection based on provider
            if ($this->account->provider === 'gmail') {
                $gmailService = app(GmailService::class);
                $success = $gmailService->testConnection($this->account);
            } elseif ($this->account->provider === 'imap') {
                $imapService = app(ImapService::class);
                $success = $imapService->testConnection($this->account);
            }

            if ($success) {
                Log::info('Email connection test successful', [
                    'account_id' => $this->account->id,
                    'provider' => $this->account->provider,
                ]);

                // Start warmup process if account is new
                if ($this->account->status === 'pending') {
                    $this->account->update(['status' => 'warming']);

                    // Dispatch warmup job with 5 minute delay
                    WarmupEmailAccountJob::dispatch($this->account)
                        ->delay(now()->addMinutes(5));
                }
            } else {
                throw new \Exception('Connection test failed');
            }
        } catch (\Exception $e) {
            Log::error('Email connection test failed', [
                'account_id' => $this->account->id,
                'provider' => $this->account->provider,
                'attempt' => $this->attempts(),
                'error' => $e->getMessage(),
            ]);

            // If this is the last attempt, mark account as error
            if ($this->attempts() >= $this->tries) {
                $this->account->update([
                    'status' => 'error',
                    'is_connected' => false,
                ]);
                $this->account->recordError('Connection test failed after ' . $this->tries . ' attempts: ' . $e->getMessage());
            }

            throw $e; // Re-throw to trigger retry
        }
    }

    /**
     * Handle job failure
     */
    public function failed(\Throwable $exception): void
    {
        Log::error('Email connection test job failed permanently', [
            'account_id' => $this->account->id,
            'error' => $exception->getMessage(),
        ]);

        $this->account->update([
            'status' => 'error',
            'is_connected' => false,
        ]);
        $this->account->recordError('Connection test job failed: ' . $exception->getMessage());
    }
}
