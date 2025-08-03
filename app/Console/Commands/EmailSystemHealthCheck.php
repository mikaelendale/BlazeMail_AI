<?php

namespace App\Console\Commands;

use App\Models\EmailAccount;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

class EmailSystemHealthCheck extends Command
{
    protected $signature = 'email:health-check 
                            {--alert : Send alerts for critical issues}
                            {--fix : Automatically attempt to fix issues}';

    protected $description = 'Comprehensive email system health check with recommendations';

    public function handle(): int
    {
        $this->info('🏥 EMAIL SYSTEM HEALTH CHECK');
        $this->line('');

        $healthScore = 0;
        $maxScore = 100;
        $issues = [];
        $recommendations = [];

        // Check 1: Account Status Distribution (25 points)
        $healthScore += $this->checkAccountStatus($issues, $recommendations);

        // Check 2: Token Health (25 points)
        $healthScore += $this->checkTokenHealth($issues, $recommendations);

        // Check 3: Error Rates (25 points)
        $healthScore += $this->checkErrorRates($issues, $recommendations);

        // Check 4: System Activity (25 points)
        $healthScore += $this->checkSystemActivity($issues, $recommendations);

        // Display Results
        $this->displayHealthResults($healthScore, $maxScore, $issues, $recommendations);

        // Handle alerts and fixes
        if ($this->option('alert') && $healthScore < 70) {
            $this->sendHealthAlert($healthScore, $issues);
        }

        if ($this->option('fix') && !empty($recommendations)) {
            $this->attemptAutoFix($recommendations);
        }

        return $healthScore >= 70 ? 0 : 1;
    }

    private function checkAccountStatus(array &$issues, array &$recommendations): int
    {
        $total = EmailAccount::count();
        $active = EmailAccount::where('status', 'active')->where('is_connected', true)->count();
        $needsReauth = EmailAccount::where(function ($query) {
            $query->where('status', 'suspended')
                ->orWhere('status', 'needs_reauth')
                ->orWhere('last_error', 'like', '%NEEDS_REAUTH%');
        })->count();

        if ($total === 0) {
            $issues[] = 'No email accounts configured';
            $recommendations[] = 'Add email accounts to the system';
            return 0;
        }

        $activePercentage = ($active / $total) * 100;

        if ($activePercentage >= 80) {
            return 25; // Excellent
        } elseif ($activePercentage >= 60) {
            $issues[] = "Only {$activePercentage}% of accounts are active";
            $recommendations[] = 'Review and fix inactive accounts';
            return 20; // Good
        } elseif ($activePercentage >= 40) {
            $issues[] = "Only {$activePercentage}% of accounts are active";
            $recommendations[] = 'Run healing system: php artisan email:heal-errors-fixed';
            return 15; // Fair
        } else {
            $issues[] = "Critical: Only {$activePercentage}% of accounts are active";
            $recommendations[] = 'Immediate attention required - most accounts need re-authentication';
            return 5; // Poor
        }
    }

    private function checkTokenHealth(array &$issues, array &$recommendations): int
    {
        $total = EmailAccount::where('provider', 'gmail')->count();
        $expiringSoon = EmailAccount::where('provider', 'gmail')
            ->where('token_expires_at', '<=', now()->addDays(7))
            ->count();
        $expired = EmailAccount::where('provider', 'gmail')
            ->where('token_expires_at', '<=', now())
            ->count();

        if ($total === 0) {
            return 25; // No OAuth accounts to check
        }

        $healthyTokens = $total - $expired - $expiringSoon;
        $healthPercentage = ($healthyTokens / $total) * 100;

        if ($expired > 0) {
            $issues[] = "{$expired} accounts have expired tokens";
            $recommendations[] = 'Run token refresh: php artisan email:heal-errors-fixed';
        }

        if ($expiringSoon > 0) {
            $issues[] = "{$expiringSoon} accounts have tokens expiring within 7 days";
            $recommendations[] = 'Schedule proactive token refresh';
        }

        if ($healthPercentage >= 90) {
            return 25;
        } elseif ($healthPercentage >= 70) {
            return 20;
        } elseif ($healthPercentage >= 50) {
            return 15;
        } else {
            return 5;
        }
    }

    private function checkErrorRates(array &$issues, array &$recommendations): int
    {
        $total = EmailAccount::count();
        $highErrors = EmailAccount::where('consecutive_errors', '>=', 3)->count();
        $recentErrors = EmailAccount::where('last_error_at', '>=', now()->subHours(24))->count();

        if ($total === 0) {
            return 25;
        }

        $errorRate = (($highErrors + $recentErrors) / $total) * 100;

        if ($errorRate === 0) {
            return 25; // Perfect
        } elseif ($errorRate <= 10) {
            return 20; // Good
        } elseif ($errorRate <= 25) {
            $issues[] = "{$errorRate}% error rate detected";
            $recommendations[] = 'Monitor error patterns and run healing system';
            return 15; // Fair
        } else {
            $issues[] = "High error rate: {$errorRate}%";
            $recommendations[] = 'Critical: Review system configuration and run diagnostics';
            return 5; // Poor
        }
    }

    private function checkSystemActivity(array &$issues, array &$recommendations): int
    {
        $recentActivity = EmailAccount::where('last_health_check', '>=', now()->subHours(24))->count();
        $total = EmailAccount::count();

        if ($total === 0) {
            return 25;
        }

        $activityRate = ($recentActivity / $total) * 100;

        if ($activityRate >= 80) {
            return 25; // Excellent
        } elseif ($activityRate >= 60) {
            return 20; // Good
        } elseif ($activityRate >= 40) {
            $issues[] = "Low system activity: {$activityRate}% of accounts checked recently";
            $recommendations[] = 'Ensure healing system is running regularly';
            return 15; // Fair
        } else {
            $issues[] = "Very low system activity: {$activityRate}% of accounts checked recently";
            $recommendations[] = 'Start automated healing system: php artisan email:start-healing-system';
            return 5; // Poor
        }
    }

    private function displayHealthResults(int $score, int $maxScore, array $issues, array $recommendations): void
    {
        $percentage = round(($score / $maxScore) * 100, 1);

        $status = $percentage >= 90 ? '🟢 Excellent' : ($percentage >= 70 ? '🟡 Good' : ($percentage >= 50 ? '🟠 Fair' : '🔴 Poor'));

        $this->table(['Metric', 'Value'], [
            ['Overall Health Score', "{$score}/{$maxScore} ({$percentage}%)"],
            ['Health Status', $status],
            ['Issues Found', count($issues)],
            ['Recommendations', count($recommendations)],
        ]);

        if (!empty($issues)) {
            $this->line('');
            $this->warn('⚠️ ISSUES FOUND:');
            foreach ($issues as $issue) {
                $this->line("   • {$issue}");
            }
        }

        if (!empty($recommendations)) {
            $this->line('');
            $this->info('💡 RECOMMENDATIONS:');
            foreach ($recommendations as $recommendation) {
                $this->line("   • {$recommendation}");
            }
        }

        if (empty($issues)) {
            $this->line('');
            $this->info('✅ No critical issues found!');
        }
    }

    private function sendHealthAlert(int $score, array $issues): void
    {
        Log::warning('Email system health alert', [
            'health_score' => $score,
            'issues' => $issues,
            'timestamp' => now()->toISOString(),
        ]);

        $this->warn('🚨 Health alert logged - consider setting up notifications');
    }

    private function attemptAutoFix(array $recommendations): void
    {
        $this->info('🔧 Attempting auto-fix...');

        foreach ($recommendations as $recommendation) {
            if (str_contains($recommendation, 'php artisan email:heal-errors-fixed')) {
                $this->call('email:heal-errors-fixed');
                break;
            }
        }
    }
}
