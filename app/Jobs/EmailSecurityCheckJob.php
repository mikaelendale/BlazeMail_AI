<?php

namespace App\Jobs;

use App\Models\EmailAccount;
use App\Models\EmailMessage;
use App\Models\SecurityAlert;
use App\Services\GmailService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Cache;
use Carbon\Carbon;

class EmailSecurityCheckJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public $timeout = 900; // 15 minutes
    public $tries = 2;
    public $backoff = [300, 900]; // 5min, 15min

    protected ?EmailAccount $emailAccount;
    protected bool $runForAllAccounts;

    public function __construct(?EmailAccount $emailAccount = null)
    {
        $this->emailAccount = $emailAccount;
        $this->runForAllAccounts = $emailAccount === null;
    }

    public function handle(): void
    {
        try {
            Log::info('Starting email security check', [
                'account_id' => $this->emailAccount?->id,
                'run_for_all' => $this->runForAllAccounts,
            ]);

            if ($this->runForAllAccounts) {
                $this->runSecurityCheckForAllAccounts();
            } else {
                $this->runSecurityCheckForAccount($this->emailAccount);
            }

            Log::info('Email security check completed successfully');
        } catch (\Exception $e) {
            Log::error('Email security check failed', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'account_id' => $this->emailAccount?->id,
            ]);
            throw $e;
        }
    }

    private function runSecurityCheckForAllAccounts(): void
    {
        $accounts = EmailAccount::where('is_connected', true)
            ->whereIn('status', ['active', 'warming'])
            ->get();

        Log::info('Running security check for all accounts', [
            'account_count' => $accounts->count(),
        ]);

        foreach ($accounts as $account) {
            try {
                $this->runSecurityCheckForAccount($account);
            } catch (\Exception $e) {
                Log::error('Security check failed for account', [
                    'account_id' => $account->id,
                    'error' => $e->getMessage(),
                ]);
                // Continue with other accounts
            }
        }
    }

    private function runSecurityCheckForAccount(EmailAccount $account): void
    {
        Log::info('Running security check for account', [
            'account_id' => $account->id,
            'email' => $account->email,
        ]);

        $securityReport = [
            'account_id' => $account->id,
            'email' => $account->email,
            'check_timestamp' => now()->toISOString(),
            'threats_detected' => [],
            'warnings' => [],
            'recommendations' => [],
            'security_score' => 100,
        ];

        // 1. Check for suspicious login patterns
        $this->checkSuspiciousLoginPatterns($account, $securityReport);

        // 2. Check for token security issues
        $this->checkTokenSecurity($account, $securityReport);

        // 3. Check for unusual sending patterns
        $this->checkSendingPatterns($account, $securityReport);

        // 4. Check for account compromise indicators
        $this->checkCompromiseIndicators($account, $securityReport);

        // 5. Check for compliance issues
        $this->checkComplianceIssues($account, $securityReport);

        // 6. Check for rate limiting violations
        $this->checkRateLimitingViolations($account, $securityReport);

        // 7. Check for OAuth scope creep
        $this->checkOAuthScopeCreep($account, $securityReport);

        // 8. Check for stale connections
        $this->checkStaleConnections($account, $securityReport);

        // Calculate final security score
        $finalScore = $this->calculateSecurityScore($securityReport);
        $securityReport['security_score'] = $finalScore;

        // Store security report
        $this->storeSecurityReport($account, $securityReport);

        // Create alerts for high-priority threats
        $this->createSecurityAlerts($account, $securityReport);

        // Update account security flags
        $this->updateAccountSecurityFlags($account, $securityReport);

        Log::info('Security check completed for account', [
            'account_id' => $account->id,
            'security_score' => $finalScore,
            'threats_count' => count($securityReport['threats_detected']),
            'warnings_count' => count($securityReport['warnings']),
        ]);
    }

    private function checkSuspiciousLoginPatterns(EmailAccount $account, array &$report): void
    {
        try {
            // Check for multiple failed authentication attempts
            if ($account->consecutive_errors >= 3) {
                $report['threats_detected'][] = [
                    'type' => 'authentication_failures',
                    'severity' => 'high',
                    'description' => "Account has {$account->consecutive_errors} consecutive authentication errors",
                    'last_error' => $account->last_error,
                    'last_error_at' => $account->last_error_at?->toISOString(),
                ];
                $report['security_score'] -= 20;
            }

            // Check for rapid token refresh attempts
            $recentTokenRefreshes = Cache::get("token_refresh_count:{$account->id}", 0);
            if ($recentTokenRefreshes > 10) {
                $report['threats_detected'][] = [
                    'type' => 'excessive_token_refresh',
                    'severity' => 'medium',
                    'description' => "Unusual number of token refresh attempts: {$recentTokenRefreshes}",
                ];
                $report['security_score'] -= 10;
            }

            // Check for login from unusual locations (if we track IPs)
            if (isset($account->metadata['recent_ips']) && is_array($account->metadata['recent_ips'])) {
                $uniqueIps = count(array_unique($account->metadata['recent_ips']));
                if ($uniqueIps > 5) {
                    $report['warnings'][] = [
                        'type' => 'multiple_ip_addresses',
                        'severity' => 'low',
                        'description' => "Account accessed from {$uniqueIps} different IP addresses recently",
                    ];
                    $report['security_score'] -= 5;
                }
            }
        } catch (\Exception $e) {
            Log::warning('Failed to check suspicious login patterns', [
                'account_id' => $account->id,
                'error' => $e->getMessage(),
            ]);
        }
    }

    private function checkTokenSecurity(EmailAccount $account, array &$report): void
    {
        try {
            // Check if tokens are close to expiration
            if ($account->token_expires_at && $account->token_expires_at->diffInHours(now()) <= 2) {
                $report['warnings'][] = [
                    'type' => 'token_expiring_soon',
                    'severity' => 'low',
                    'description' => 'Access token expires within 2 hours',
                    'expires_at' => $account->token_expires_at->toISOString(),
                ];
            }

            // Check if refresh token is missing (critical for OAuth)
            if ($account->provider === 'gmail' && empty($account->encrypted_refresh_token)) {
                $report['threats_detected'][] = [
                    'type' => 'missing_refresh_token',
                    'severity' => 'critical',
                    'description' => 'OAuth account missing refresh token - re-authentication required',
                ];
                $report['security_score'] -= 30;
            }

            // Check for token age (if tokens are very old, might be compromised)
            if ($account->token_expires_at && $account->token_expires_at->diffInDays(now()) > 30) {
                $report['recommendations'][] = [
                    'type' => 'old_tokens',
                    'description' => 'Consider refreshing tokens that are older than 30 days',
                ];
            }
        } catch (\Exception $e) {
            Log::warning('Failed to check token security', [
                'account_id' => $account->id,
                'error' => $e->getMessage(),
            ]);
        }
    }

    private function checkSendingPatterns(EmailAccount $account, array &$report): void
    {
        try {
            // Check for unusual sending volume
            $dailyAverage = $this->calculateDailySendingAverage($account);
            if ($account->daily_sent > ($dailyAverage * 3) && $dailyAverage > 0) {
                $report['threats_detected'][] = [
                    'type' => 'unusual_sending_volume',
                    'severity' => 'high',
                    'description' => "Daily sending volume ({$account->daily_sent}) is 3x higher than average ({$dailyAverage})",
                ];
                $report['security_score'] -= 15;
            }

            // Check for sending at unusual hours
            $currentHour = now()->hour;
            if (($currentHour >= 0 && $currentHour <= 5) && $account->daily_sent > 0) {
                $report['warnings'][] = [
                    'type' => 'unusual_sending_time',
                    'severity' => 'medium',
                    'description' => 'Emails sent during unusual hours (midnight to 5 AM)',
                ];
                $report['security_score'] -= 5;
            }

            // Check for rapid sending (potential spam)
            $recentSendingRate = Cache::get("sending_rate:{$account->id}", 0);
            if ($recentSendingRate > 50) { // More than 50 emails in last hour
                $report['threats_detected'][] = [
                    'type' => 'rapid_sending',
                    'severity' => 'high',
                    'description' => "Rapid sending detected: {$recentSendingRate} emails in last hour",
                ];
                $report['security_score'] -= 20;
            }
        } catch (\Exception $e) {
            Log::warning('Failed to check sending patterns', [
                'account_id' => $account->id,
                'error' => $e->getMessage(),
            ]);
        }
    }

    private function checkCompromiseIndicators(EmailAccount $account, array &$report): void
    {
        try {
            // Check bounce and complaint rates
            if ($account->bounce_rate > 10) {
                $report['threats_detected'][] = [
                    'type' => 'high_bounce_rate',
                    'severity' => 'high',
                    'description' => "High bounce rate: {$account->bounce_rate}% (threshold: 10%)",
                ];
                $report['security_score'] -= 15;
            }

            if ($account->complaint_rate > 1) {
                $report['threats_detected'][] = [
                    'type' => 'high_complaint_rate',
                    'severity' => 'critical',
                    'description' => "High complaint rate: {$account->complaint_rate}% (threshold: 1%)",
                ];
                $report['security_score'] -= 25;
            }

            // Check for reputation degradation
            if ($account->reputation === 'poor') {
                $report['threats_detected'][] = [
                    'type' => 'poor_reputation',
                    'severity' => 'high',
                    'description' => 'Account reputation has degraded to "poor"',
                ];
                $report['security_score'] -= 20;
            }

            // Check for sudden success rate drop
            if ($account->success_rate < 80) {
                $report['warnings'][] = [
                    'type' => 'low_success_rate',
                    'severity' => 'medium',
                    'description' => "Low success rate: {$account->success_rate}% (threshold: 80%)",
                ];
                $report['security_score'] -= 10;
            }
        } catch (\Exception $e) {
            Log::warning('Failed to check compromise indicators', [
                'account_id' => $account->id,
                'error' => $e->getMessage(),
            ]);
        }
    }

    private function checkComplianceIssues(EmailAccount $account, array &$report): void
    {
        try {
            // Check if account exceeds daily limits
            if ($account->daily_sent >= $account->daily_limit) {
                $report['warnings'][] = [
                    'type' => 'daily_limit_reached',
                    'severity' => 'medium',
                    'description' => "Daily sending limit reached: {$account->daily_sent}/{$account->daily_limit}",
                ];
            }

            // Check if account exceeds hourly limits
            if ($account->hourly_sent >= $account->hourly_limit) {
                $report['warnings'][] = [
                    'type' => 'hourly_limit_reached',
                    'severity' => 'medium',
                    'description' => "Hourly sending limit reached: {$account->hourly_sent}/{$account->hourly_limit}",
                ];
            }

            // Check for warmup compliance
            if ($account->status === 'warming' && $account->warmup_progress < 100) {
                $allowedToday = $account->getWarmupEmailsAllowed();
                if ($account->warmup_emails_today > $allowedToday) {
                    $report['threats_detected'][] = [
                        'type' => 'warmup_violation',
                        'severity' => 'high',
                        'description' => "Warmup limit exceeded: {$account->warmup_emails_today}/{$allowedToday} for day {$account->warmup_day}",
                    ];
                    $report['security_score'] -= 15;
                }
            }
        } catch (\Exception $e) {
            Log::warning('Failed to check compliance issues', [
                'account_id' => $account->id,
                'error' => $e->getMessage(),
            ]);
        }
    }

    private function checkRateLimitingViolations(EmailAccount $account, array &$report): void
    {
        try {
            // Check for API rate limiting violations
            $apiCallCount = Cache::get("api_calls:{$account->id}", 0);
            if ($apiCallCount > 1000) { // Gmail API has quotas
                $report['warnings'][] = [
                    'type' => 'high_api_usage',
                    'severity' => 'medium',
                    'description' => "High API usage: {$apiCallCount} calls in last hour",
                ];
                $report['security_score'] -= 5;
            }

            // Check for connection attempt frequency
            $connectionAttempts = Cache::get("connection_attempts:{$account->id}", 0);
            if ($connectionAttempts > 20) {
                $report['warnings'][] = [
                    'type' => 'excessive_connection_attempts',
                    'severity' => 'medium',
                    'description' => "Excessive connection attempts: {$connectionAttempts} in last hour",
                ];
                $report['security_score'] -= 5;
            }
        } catch (\Exception $e) {
            Log::warning('Failed to check rate limiting violations', [
                'account_id' => $account->id,
                'error' => $e->getMessage(),
            ]);
        }
    }

    private function checkOAuthScopeCreep(EmailAccount $account, array &$report): void
    {
        try {
            if ($account->provider !== 'gmail' || !$account->oauth_scopes) {
                return;
            }

            $currentScopes = $account->oauth_scopes;
            $expectedScopes = [
                'https://www.googleapis.com/auth/gmail.readonly',
                'https://www.googleapis.com/auth/gmail.send',
                'https://www.googleapis.com/auth/userinfo.email',
                'https://www.googleapis.com/auth/userinfo.profile',
            ];

            $unexpectedScopes = array_diff($currentScopes, $expectedScopes);
            if (!empty($unexpectedScopes)) {
                $report['threats_detected'][] = [
                    'type' => 'oauth_scope_creep',
                    'severity' => 'high',
                    'description' => 'Account has unexpected OAuth scopes: ' . implode(', ', $unexpectedScopes),
                ];
                $report['security_score'] -= 20;
            }

            $missingScopes = array_diff($expectedScopes, $currentScopes);
            if (!empty($missingScopes)) {
                $report['warnings'][] = [
                    'type' => 'missing_oauth_scopes',
                    'severity' => 'medium',
                    'description' => 'Account missing expected OAuth scopes: ' . implode(', ', $missingScopes),
                ];
                $report['security_score'] -= 10;
            }
        } catch (\Exception $e) {
            Log::warning('Failed to check OAuth scope creep', [
                'account_id' => $account->id,
                'error' => $e->getMessage(),
            ]);
        }
    }

    private function checkStaleConnections(EmailAccount $account, array &$report): void
    {
        try {
            // Check if account hasn't been used recently
            if ($account->last_activity && $account->last_activity->diffInDays(now()) > 30) {
                $report['warnings'][] = [
                    'type' => 'stale_connection',
                    'severity' => 'low',
                    'description' => "Account inactive for {$account->last_activity->diffInDays(now())} days",
                ];
                $report['recommendations'][] = [
                    'type' => 'consider_deactivation',
                    'description' => 'Consider deactivating unused accounts to reduce security surface',
                ];
            }

            // Check if health checks are failing
            if ($account->last_health_check && $account->last_health_check->diffInHours(now()) > 24) {
                $report['warnings'][] = [
                    'type' => 'missed_health_checks',
                    'severity' => 'medium',
                    'description' => "Health check overdue by {$account->last_health_check->diffInHours(now())} hours",
                ];
                $report['security_score'] -= 5;
            }
        } catch (\Exception $e) {
            Log::warning('Failed to check stale connections', [
                'account_id' => $account->id,
                'error' => $e->getMessage(),
            ]);
        }
    }

    private function calculateDailySendingAverage(EmailAccount $account): float
    {
        try {
            // This would typically query a email_logs table
            // For now, return a simple calculation based on account age
            $accountAge = $account->created_at->diffInDays(now());
            if ($accountAge < 7) {
                return $account->daily_sent; // New account, use current as baseline
            }

            // Mock calculation - in production, you'd query actual sending history
            return $account->daily_limit * 0.3; // Assume 30% of limit is normal
        } catch (\Exception $e) {
            return 0;
        }
    }

    private function calculateSecurityScore(array $report): int
    {
        $score = $report['security_score'];

        // Additional penalties for multiple threats
        $threatCount = count($report['threats_detected']);
        if ($threatCount > 3) {
            $score -= ($threatCount - 3) * 5; // Extra penalty for many threats
        }

        return max(0, min(100, $score));
    }

    private function storeSecurityReport(EmailAccount $account, array $report): void
    {
        try {
            // Update account security metadata
            $securityFlags = $account->security_flags ?? [];
            $securityFlags['last_security_check'] = now()->toISOString();
            $securityFlags['security_score'] = $report['security_score'];
            $securityFlags['threats_count'] = count($report['threats_detected']);
            $securityFlags['warnings_count'] = count($report['warnings']);

            $account->update([
                'security_flags' => $securityFlags,
                'last_security_check' => now(),
            ]);

            // Store detailed report in cache for 30 days
            Cache::put(
                "security_report:{$account->id}",
                $report,
                now()->addDays(30)
            );

            Log::info('Security report stored', [
                'account_id' => $account->id,
                'security_score' => $report['security_score'],
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to store security report', [
                'account_id' => $account->id,
                'error' => $e->getMessage(),
            ]);
        }
    }

    private function createSecurityAlerts(EmailAccount $account, array $report): void
    {
        try {
            foreach ($report['threats_detected'] as $threat) {
                if ($threat['severity'] === 'critical' || $threat['severity'] === 'high') {
                    // Create security alert (you might want to create a SecurityAlert model)
                    Log::critical('Security threat detected', [
                        'account_id' => $account->id,
                        'email' => $account->email,
                        'threat_type' => $threat['type'],
                        'severity' => $threat['severity'],
                        'description' => $threat['description'],
                    ]);

                    // You could also send notifications here
                    // Mail::to($account->user->email)->send(new SecurityAlertMail($threat));
                }
            }
        } catch (\Exception $e) {
            Log::error('Failed to create security alerts', [
                'account_id' => $account->id,
                'error' => $e->getMessage(),
            ]);
        }
    }

    private function updateAccountSecurityFlags(EmailAccount $account, array $report): void
    {
        try {
            $criticalThreats = array_filter($report['threats_detected'], function ($threat) {
                return $threat['severity'] === 'critical';
            });

            $highThreats = array_filter($report['threats_detected'], function ($threat) {
                return $threat['severity'] === 'high';
            });

            // If critical threats detected, consider suspending account
            if (!empty($criticalThreats)) {
                $account->update([
                    'status' => 'suspended',
                    'is_connected' => false,
                    'last_error' => 'Account suspended due to critical security threats',
                    'last_error_at' => now(),
                ]);

                Log::critical('Account suspended due to security threats', [
                    'account_id' => $account->id,
                    'threats' => $criticalThreats,
                ]);
            }
            // If multiple high threats, set to warning status
            elseif (count($highThreats) >= 2) {
                $account->update(['status' => 'warning']);

                Log::warning('Account set to warning status', [
                    'account_id' => $account->id,
                    'threats' => $highThreats,
                ]);
            }
        } catch (\Exception $e) {
            Log::error('Failed to update account security flags', [
                'account_id' => $account->id,
                'error' => $e->getMessage(),
            ]);
        }
    }

    public function failed(\Throwable $exception): void
    {
        Log::error('Email security check job failed permanently', [
            'account_id' => $this->emailAccount?->id,
            'error' => $exception->getMessage(),
            'attempts' => $this->attempts(),
        ]);
    }
}
