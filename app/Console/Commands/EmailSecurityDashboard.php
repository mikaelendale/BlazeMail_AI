<?php

namespace App\Console\Commands;

use App\Models\EmailAccount;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Cache;

class EmailSecurityDashboard extends Command
{
    protected $signature = 'email:security-dashboard';

    protected $description = 'Display email security dashboard with current threats and status';

    public function handle(): int
    {
        $this->info('📊 Email Security Dashboard');
        $this->line('');

        // Overall security metrics
        $this->displayOverallMetrics();
        $this->line('');

        // Account status breakdown
        $this->displayAccountStatus();
        $this->line('');

        // Recent security threats
        $this->displayRecentThreats();
        $this->line('');

        // Security recommendations
        $this->displayRecommendations();

        return 0;
    }

    private function displayOverallMetrics(): void
    {
        $totalAccounts = EmailAccount::count();
        $activeAccounts = EmailAccount::where('is_connected', true)->count();
        $secureAccounts = EmailAccount::where('is_connected', true)
            ->whereJsonDoesntContain('security_flags->threats_count', '0')
            ->count();

        $securityPercentage = $totalAccounts > 0 ?
            round(($secureAccounts / $totalAccounts) * 100, 1) : 0;

        $this->table(['Metric', 'Value'], [
            ['Total Email Accounts', $totalAccounts],
            ['Active Accounts', $activeAccounts],
            ['Secure Accounts', $secureAccounts],
            ['Security Score', $securityPercentage . '%'],
        ]);
    }

    private function displayAccountStatus(): void
    {
        $statusCounts = EmailAccount::selectRaw('status, COUNT(*) as count')
            ->groupBy('status')
            ->pluck('count', 'status')
            ->toArray();

        $statusData = [];
        foreach (['active', 'warming', 'warning', 'error', 'suspended', 'pending'] as $status) {
            $count = $statusCounts[$status] ?? 0;
            $statusData[] = [ucfirst($status), $count];
        }

        $this->info('📈 Account Status Breakdown:');
        $this->table(['Status', 'Count'], $statusData);
    }

    private function displayRecentThreats(): void
    {
        $this->info('🚨 Recent Security Threats:');

        $threatenedAccounts = EmailAccount::whereJsonContains('security_flags->threats_count', '0')
            ->orWhere('status', 'suspended')
            ->orWhere('consecutive_errors', '>=', 3)
            ->limit(10)
            ->get();

        if ($threatenedAccounts->isEmpty()) {
            $this->info('✅ No recent security threats detected');
            return;
        }

        $threatData = [];
        foreach ($threatenedAccounts as $account) {
            $securityFlags = $account->security_flags ?? [];
            $threatData[] = [
                $account->email,
                $account->status,
                $securityFlags['threats_count'] ?? 0,
                $account->consecutive_errors,
                $account->last_error_at?->diffForHumans() ?? 'Never',
            ];
        }

        $this->table(
            ['Email', 'Status', 'Threats', 'Errors', 'Last Error'],
            $threatData
        );
    }

    private function displayRecommendations(): void
    {
        $this->info('💡 Security Recommendations:');

        $recommendations = [];

        // Check for accounts needing attention
        $errorAccounts = EmailAccount::where('status', 'error')->count();
        if ($errorAccounts > 0) {
            $recommendations[] = "• Fix {$errorAccounts} accounts in error state";
        }

        $staleAccounts = EmailAccount::where('last_activity', '<', now()->subDays(30))
            ->where('is_connected', true)
            ->count();
        if ($staleAccounts > 0) {
            $recommendations[] = "• Review {$staleAccounts} inactive accounts (30+ days)";
        }

        $highErrorAccounts = EmailAccount::where('consecutive_errors', '>=', 3)->count();
        if ($highErrorAccounts > 0) {
            $recommendations[] = "• Investigate {$highErrorAccounts} accounts with multiple errors";
        }

        $missingHealthChecks = EmailAccount::where('last_health_check', '<', now()->subHours(24))
            ->where('is_connected', true)
            ->count();
        if ($missingHealthChecks > 0) {
            $recommendations[] = "• Run health checks on {$missingHealthChecks} accounts";
        }

        if (empty($recommendations)) {
            $this->info('✅ No immediate security actions required');
        } else {
            foreach ($recommendations as $recommendation) {
                $this->line($recommendation);
            }
        }
    }
}
