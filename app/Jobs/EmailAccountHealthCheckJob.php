<?php

namespace App\Jobs;

use App\Models\EmailAccount;
use App\Services\GmailService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;

class EmailAccountHealthCheckJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public $timeout = 600; // 10 minutes
    public $tries = 2;

    public function handle(): void
    {
        try {
            Log::info('Starting email account health check');

            // Get all active email accounts
            $accounts = EmailAccount::where('is_connected', true)
                ->whereIn('status', ['active', 'warming', 'warning'])
                ->get();

            Log::info('Found accounts for health check', [
                'count' => $accounts->count(),
            ]);

            foreach ($accounts as $account) {
                try {
                    $this->performHealthCheck($account);
                } catch (\Exception $e) {
                    Log::error('Health check failed for account', [
                        'account_id' => $account->id,
                        'error' => $e->getMessage(),
                    ]);
                }
            }

            Log::info('Email account health check completed');
        } catch (\Exception $e) {
            Log::error('Health check job failed', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            throw $e;
        }
    }

    private function performHealthCheck(EmailAccount $account): void
    {
        Log::info('Performing health check', [
            'account_id' => $account->id,
            'email' => $account->email,
        ]);

        // Reset daily counters if needed
        $this->resetDailyCountersIfNeeded($account);

        // Reset hourly counters if needed
        $this->resetHourlyCountersIfNeeded($account);

        // Update warmup progress if needed
        $this->updateWarmupProgress($account);

        // Calculate and update reputation
        $this->updateReputation($account);

        // Schedule token validation if needed
        $this->scheduleTokenValidationIfNeeded($account);

        // Update health check timestamp
        $account->update(['last_health_check' => now()]);

        Log::info('Health check completed', [
            'account_id' => $account->id,
            'status' => $account->fresh()->status,
            'reputation' => $account->fresh()->reputation,
        ]);
    }

    private function resetDailyCountersIfNeeded(EmailAccount $account): void
    {
        $today = now()->toDateString();

        if (!$account->daily_sent_date || $account->daily_sent_date->toDateString() !== $today) {
            Log::info('Resetting daily counters', [
                'account_id' => $account->id,
                'old_date' => $account->daily_sent_date?->toDateString(),
                'new_date' => $today,
                'old_sent' => $account->daily_sent,
            ]);

            $account->resetDailyCounts();
        }
    }

    private function resetHourlyCountersIfNeeded(EmailAccount $account): void
    {
        if (!$account->hourly_sent_reset || $account->hourly_sent_reset->isPast()) {
            Log::info('Resetting hourly counters', [
                'account_id' => $account->id,
                'old_reset' => $account->hourly_sent_reset?->toISOString(),
                'old_sent' => $account->hourly_sent,
            ]);

            $account->resetHourlyCounts();
        }
    }

    private function updateWarmupProgress(EmailAccount $account): void
    {
        if (!$account->needsWarmup()) {
            return;
        }

        $warmupDay = $account->warmup_day;
        $emailsToday = $account->warmup_emails_today;
        $allowedToday = $account->getWarmupEmailsAllowed();

        // If we've sent the required emails for today, advance to next day
        if ($emailsToday >= $allowedToday) {
            $newWarmupDay = min($warmupDay + 1, 30); // Max 30 days warmup
            $newProgress = min(100, ($newWarmupDay / 30) * 100);

            $account->update([
                'warmup_day' => $newWarmupDay,
                'warmup_progress' => $newProgress,
                'warmup_emails_today' => 0, // Reset for new day
            ]);

            Log::info('Warmup progress updated', [
                'account_id' => $account->id,
                'old_day' => $warmupDay,
                'new_day' => $newWarmupDay,
                'new_progress' => $newProgress,
            ]);

            // If warmup is complete, change status to active
            if ($newProgress >= 100) {
                $account->update(['status' => 'active']);

                Log::info('Warmup completed', [
                    'account_id' => $account->id,
                    'email' => $account->email,
                ]);
            }
        }
    }

    private function updateReputation(EmailAccount $account): void
    {
        $successRate = $account->success_rate;
        $bounceRate = $account->bounce_rate;
        $complaintRate = $account->complaint_rate;
        $consecutiveErrors = $account->consecutive_errors;

        $oldReputation = $account->reputation;
        $newReputation = $this->calculateReputation($successRate, $bounceRate, $complaintRate, $consecutiveErrors);

        if ($oldReputation !== $newReputation) {
            $account->update(['reputation' => $newReputation]);

            Log::info('Reputation updated', [
                'account_id' => $account->id,
                'old_reputation' => $oldReputation,
                'new_reputation' => $newReputation,
                'success_rate' => $successRate,
                'bounce_rate' => $bounceRate,
                'complaint_rate' => $complaintRate,
                'consecutive_errors' => $consecutiveErrors,
            ]);
        }
    }

    private function calculateReputation(float $successRate, float $bounceRate, float $complaintRate, int $consecutiveErrors): string
    {
        // Calculate base score
        $score = $successRate;

        // Deduct for bounce rate
        $score -= ($bounceRate * 10);

        // Deduct heavily for complaint rate
        $score -= ($complaintRate * 20);

        // Deduct for consecutive errors
        $score -= ($consecutiveErrors * 5);

        // Determine reputation based on score
        if ($score >= 95 && $bounceRate < 2 && $complaintRate < 0.1) {
            return 'excellent';
        } elseif ($score >= 85 && $bounceRate < 5 && $complaintRate < 0.5) {
            return 'good';
        } elseif ($score >= 70 && $bounceRate < 10 && $complaintRate < 1) {
            return 'fair';
        } else {
            return 'poor';
        }
    }

    private function scheduleTokenValidationIfNeeded(EmailAccount $account): void
    {
        // Only for OAuth accounts
        if ($account->provider !== 'gmail') {
            return;
        }

        // Check if token expires within 1 hour or hasn't been checked in 6 hours
        $needsValidation = false;

        if ($account->token_expires_at && $account->token_expires_at->diffInHours(now()) <= 1) {
            $needsValidation = true;
            $reason = 'token expires soon';
        } elseif (!$account->last_health_check || $account->last_health_check->diffInHours(now()) >= 6) {
            $needsValidation = true;
            $reason = 'periodic validation';
        }

        if ($needsValidation) {
            Log::info('Scheduling token validation', [
                'account_id' => $account->id,
                'reason' => $reason,
            ]);

            ValidateEmailTokensJob::dispatch($account)
                ->onQueue('email-validation')
                ->delay(now()->addMinutes(rand(1, 10))); // Random delay to spread load
        }
    }
}
