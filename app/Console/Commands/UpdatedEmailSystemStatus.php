<?php

namespace App\Console\Commands;

use App\Models\EmailAccount;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class UpdatedEmailSystemStatus extends Command
{
    protected $signature = 'email:system-status-updated';
    protected $description = 'Display updated email system status with reauth detection';

    public function handle(): int
    {
        $this->info('📊 Updated Email System Status Dashboard');
        $this->line('');

        // Overall system health
        $this->displaySystemHealth();
        $this->line('');

        // Account status breakdown
        $this->displayAccountStatus();
        $this->line('');

        // Re-authentication needed
        $this->displayReauthNeeded();
        $this->line('');

        // Recent activity
        $this->displayRecentActivity();

        return 0;
    }

    private function displaySystemHealth(): void
    {
        $totalAccounts = EmailAccount::count();
        $activeAccounts = EmailAccount::where('status', 'active')->where('is_connected', true)->count();
        $errorAccounts = EmailAccount::where('status', 'error')->count();
        $suspendedAccounts = EmailAccount::where('status', 'suspended')->count();
        $needsReauth = EmailAccount::where('last_error', 'like', '%NEEDS_REAUTH%')
            ->orWhere('last_error', 'like', '%invalid_grant%')
            ->count();

        $healthPercentage = $totalAccounts > 0 ?
            round(($activeAccounts / $totalAccounts) * 100, 1) : 0;

        $healthStatus = $healthPercentage >= 90 ? '🟢 Excellent' : ($healthPercentage >= 70 ? '🟡 Good' : ($healthPercentage >= 50 ? '🟠 Fair' : '🔴 Poor'));

        $this->table(['Metric', 'Value', 'Status'], [
            ['Total Accounts', $totalAccounts, ''],
            ['Active & Connected', $activeAccounts, '🟢'],
            ['Error State', $errorAccounts, $errorAccounts > 0 ? '🔴' : '🟢'],
            ['Suspended (may need reauth)', $suspendedAccounts, $suspendedAccounts > 0 ? '🟡' : '🟢'],
            ['Need Re-authentication', $needsReauth, $needsReauth > 0 ? '🔐' : '🟢'],
            ['System Health', $healthPercentage . '%', $healthStatus],
        ]);
    }

    private function displayAccountStatus(): void
    {
        $statusCounts = EmailAccount::select('status', DB::raw('count(*) as count'))
            ->groupBy('status')
            ->pluck('count', 'status')
            ->toArray();

        $statusData = [];
        $statusEmojis = [
            'active' => '🟢',
            'warming' => '🟡',
            'error' => '🔴',
            'suspended' => '🔵', // May indicate needs reauth
            'pending' => '⚪',
            'paused' => '⏸️',
        ];

        foreach ($statusEmojis as $status => $emoji) {
            $count = $statusCounts[$status] ?? 0;
            $note = $status === 'suspended' ? ' (may need reauth)' : '';
            $statusData[] = [$emoji . ' ' . ucfirst($status) . $note, $count];
        }

        $this->info('📈 Account Status Breakdown:');
        $this->table(['Status', 'Count'], $statusData);
    }

    private function displayReauthNeeded(): void
    {
        $reauthAccounts = EmailAccount::where(function ($query) {
            $query->where('last_error', 'like', '%NEEDS_REAUTH%')
                ->orWhere('last_error', 'like', '%invalid_grant%')
                ->orWhere(function ($subQuery) {
                    $subQuery->where('status', 'suspended')
                        ->whereJsonContains('metadata->reauth_required', true);
                });
        })->get();

        if ($reauthAccounts->isNotEmpty()) {
            $this->info('🔐 Accounts Needing Re-authentication:');

            $reauthData = [];
            foreach ($reauthAccounts as $account) {
                $reauthData[] = [
                    $account->id,
                    $account->email,
                    $account->status,
                    $account->last_error_at ? $account->last_error_at->diffForHumans() : 'Unknown',
                ];
            }

            $this->table(['ID', 'Email', 'Status', 'Last Error'], $reauthData);

            $this->warn('⚠️ These accounts need user re-authentication through the web interface.');
        } else {
            $this->info('✅ No accounts currently need re-authentication.');
        }
    }

    private function displayRecentActivity(): void
    {
        $this->info('🕐 Recent Activity (Last 24 Hours):');

        $recentlyHealed = EmailAccount::where('updated_at', '>=', now()->subDay())
            ->where('consecutive_errors', 0)
            ->where('status', 'active')
            ->count();

        $recentErrors = EmailAccount::where('last_error_at', '>=', now()->subDay())
            ->count();

        $needsAttention = EmailAccount::where(function ($query) {
            $query->where('consecutive_errors', '>=', 3)
                ->orWhere('status', 'error')
                ->orWhere('last_error', 'like', '%NEEDS_REAUTH%');
        })->count();

        $this->table(['Activity', 'Count'], [
            ['Accounts Healed', $recentlyHealed],
            ['New Errors', $recentErrors],
            ['Need Attention', $needsAttention],
        ]);

        if ($needsAttention > 0) {
            $this->warn("⚠️ {$needsAttention} accounts need attention. Run: php artisan email:heal-errors-fixed");
        }
    }
}
