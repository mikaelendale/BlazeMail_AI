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

class WarmupEmailAccountJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    protected EmailAccount $account;

    public $tries = 2;
    public $timeout = 300; // 5 minutes
    public $backoff = [60, 120]; // 1 minute, 2 minutes

    public function __construct(EmailAccount $account)
    {
        $this->account = $account;
        // Use database queue - SIMPLE!
        $this->onQueue('default');
    }

    /**
     * Execute warmup process
     */
    public function handle(): void
    {
        try {
            // Refresh account data
            $this->account->refresh();

            // Check if account still needs warmup
            if (!$this->account->needsWarmup()) {
                Log::info('Account no longer needs warmup', [
                    'account_id' => $this->account->id,
                ]);
                return;
            }

            // Check if we can send warmup emails today
            $allowedEmails = $this->account->getWarmupEmailsAllowed();
            $sentToday = $this->account->warmup_emails_today;

            if ($sentToday >= $allowedEmails) {
                Log::info('Daily warmup limit reached, scheduling for tomorrow', [
                    'account_id' => $this->account->id,
                    'sent_today' => $sentToday,
                    'allowed' => $allowedEmails,
                ]);

                // Schedule for tomorrow at 9 AM
                self::dispatch($this->account)->delay(now()->addDay()->startOfDay()->addHours(9));
                return;
            }

            // Send warmup email
            $emailData = $this->generateWarmupEmail();

            if ($this->account->provider === 'gmail') {
                $gmailService = app(GmailService::class);
                $result = $gmailService->sendEmail($this->account, $emailData);
            } else {
                $imapService = app(ImapService::class);
                $result = $imapService->sendEmail($this->account, $emailData);
            }

            if ($result['success']) {
                // Update warmup progress
                $this->account->updateWarmupProgress();

                Log::info('Warmup email sent successfully', [
                    'account_id' => $this->account->id,
                    'warmup_day' => $this->account->warmup_day,
                    'progress' => $this->account->warmup_progress,
                ]);

                // Schedule next warmup email (random interval between 2-6 hours)
                $nextDelay = rand(120, 360); // 2-6 hours in minutes
                self::dispatch($this->account)->delay(now()->addMinutes($nextDelay));
            } else {
                throw new \Exception('Warmup email send failed: ' . $result['error']);
            }
        } catch (\Exception $e) {
            Log::error('Warmup job failed', [
                'account_id' => $this->account->id,
                'error' => $e->getMessage(),
            ]);

            $this->account->recordError('Warmup failed: ' . $e->getMessage());

            // Retry later if not too many errors
            if ($this->account->consecutive_errors < 3) {
                self::dispatch($this->account)->delay(now()->addHours(2));
            }
        }
    }

    /**
     * Generate warmup email content
     */
    private function generateWarmupEmail(): array
    {
        $subjects = [
            'Weekly Newsletter Update',
            'Important Account Information',
            'Your Monthly Summary',
            'Service Update Notification',
            'Account Activity Report',
        ];

        $template = [
            'subject' => $subjects[array_rand($subjects)],
            'text' => "Hello,\n\nThis is an automated warmup email to maintain account reputation.\n\nBest regards,\nThe Team",
            'html' => "<p>Hello,</p><p>This is an automated warmup email to maintain account reputation.</p><p>Best regards,<br>The Team</p>",
        ];

        return [
            'to' => $this->account->email, // Send to self for warmup
            'from' => $this->account->email,
            'subject' => $template['subject'],
            'text' => $template['text'],
            'html' => $template['html'],
        ];
    }

    /**
     * Handle job failure
     */
    public function failed(\Throwable $exception): void
    {
        Log::error('Warmup job failed permanently', [
            'account_id' => $this->account->id,
            'error' => $exception->getMessage(),
        ]);

        $this->account->recordError('Warmup job failed permanently: ' . $exception->getMessage());
    }
}
