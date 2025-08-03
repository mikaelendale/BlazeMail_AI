<?php

namespace App\Console\Commands;

use App\Models\EmailAccount;
use Illuminate\Console\Command;

class EmailHealingSummary extends Command
{
    protected $signature = 'email:healing-summary';
    protected $description = 'Show comprehensive healing system summary and next steps';

    public function handle(): int
    {
        $this->info('🎉 EMAIL HEALING SYSTEM - COMPLETE SUMMARY');
        $this->line('');

        // Healing Results
        $this->displayHealingResults();
        $this->line('');

        // Account Categories
        $this->displayAccountCategories();
        $this->line('');

        // Next Steps
        $this->displayNextSteps();
        $this->line('');

        // User Actions Required
        $this->displayUserActionsRequired();

        return 0;
    }

    private function displayHealingResults(): void
    {
        $this->info('✅ HEALING SYSTEM RESULTS:');

        $totalAccounts = EmailAccount::count();
        $needsReauth = EmailAccount::where(function ($query) {
            $query->where('status', 'suspended')
                ->orWhere('status', 'needs_reauth')
                ->orWhere('last_error', 'like', '%NEEDS_REAUTH%')
                ->orWhere('last_error', 'like', '%invalid_grant%');
        })->count();

        $activeAccounts = EmailAccount::where('status', 'active')
            ->where('is_connected', true)
            ->where('consecutive_errors', 0)
            ->count();

        $errorAccounts = EmailAccount::where('status', 'error')->count();

        $this->table(['Metric', 'Count', 'Status'], [
            ['Total Accounts', $totalAccounts, '📊'],
            ['Need Re-authentication', $needsReauth, $needsReauth > 0 ? '🔐 Action Required' : '✅ Good'],
            ['Fully Active & Healthy', $activeAccounts, $activeAccounts > 0 ? '✅ Good' : '⚠️ None'],
            ['Still in Error State', $errorAccounts, $errorAccounts > 0 ? '❌ Needs Attention' : '✅ Good'],
        ]);

        if ($needsReauth === $totalAccounts && $totalAccounts > 0) {
            $this->info('🎯 DIAGNOSIS: All accounts have invalid_grant errors - they need user re-authentication');
        }
    }

    private function displayAccountCategories(): void
    {
        $this->info('📋 ACCOUNT CATEGORIES:');

        // Get accounts needing reauth
        $reauthAccounts = EmailAccount::where(function ($query) {
            $query->where('status', 'suspended')
                ->orWhere('status', 'needs_reauth')
                ->orWhere('last_error', 'like', '%NEEDS_REAUTH%')
                ->orWhere('last_error', 'like', '%invalid_grant%');
        })->get();

        // Get healthy accounts
        $healthyAccounts = EmailAccount::where('status', 'active')
            ->where('is_connected', true)
            ->where('consecutive_errors', 0)
            ->get();

        // Get error accounts
        $errorAccounts = EmailAccount::where('status', 'error')->get();

        if ($reauthAccounts->isNotEmpty()) {
            $this->warn('🔐 ACCOUNTS NEEDING RE-AUTHENTICATION:');
            $reauthData = [];
            foreach ($reauthAccounts as $account) {
                $reason = 'Token expired/revoked';
                if (str_contains($account->last_error ?? '', 'invalid_grant')) {
                    $reason = 'OAuth token invalid';
                }

                $reauthData[] = [
                    $account->id,
                    $account->email,
                    $account->status,
                    $reason,
                    $account->created_at->format('M j, Y'),
                ];
            }
            $this->table(['ID', 'Email', 'Status', 'Reason', 'Created'], $reauthData);
        }

        if ($healthyAccounts->isNotEmpty()) {
            $this->info('✅ HEALTHY ACCOUNTS:');
            $healthyData = [];
            foreach ($healthyAccounts as $account) {
                $healthyData[] = [
                    $account->id,
                    $account->email,
                    '✅ Active',
                    $account->last_activity ? $account->last_activity->diffForHumans() : 'Never',
                ];
            }
            $this->table(['ID', 'Email', 'Status', 'Last Activity'], $healthyData);
        }

        if ($errorAccounts->isNotEmpty()) {
            $this->error('❌ ACCOUNTS STILL IN ERROR:');
            $errorData = [];
            foreach ($errorAccounts as $account) {
                $errorData[] = [
                    $account->id,
                    $account->email,
                    $account->consecutive_errors,
                    substr($account->last_error ?? 'Unknown', 0, 50) . '...',
                ];
            }
            $this->table(['ID', 'Email', 'Errors', 'Last Error'], $errorData);
        }
    }

    private function displayNextSteps(): void
    {
        $this->info('🚀 NEXT STEPS FOR SYSTEM MAINTENANCE:');

        $steps = [
            '1. Set up automated healing (every 2 hours):',
            '   php artisan schedule:work',
            '',
            '2. Monitor system health:',
            '   php artisan email:system-status-updated',
            '',
            '3. Run healing when needed:',
            '   php artisan email:heal-errors-fixed',
            '',
            '4. Check specific accounts:',
            '   php artisan email:account-details {account-id}',
            '',
            '5. Test connections:',
            '   php artisan email:test-connection {account-id}',
        ];

        foreach ($steps as $step) {
            $this->line($step);
        }
    }

    private function displayUserActionsRequired(): void
    {
        $needsReauth = EmailAccount::where(function ($query) {
            $query->where('status', 'suspended')
                ->orWhere('status', 'needs_reauth')
                ->orWhere('last_error', 'like', '%NEEDS_REAUTH%');
        })->count();

        if ($needsReauth > 0) {
            $this->line('');
            $this->warn('⚠️ USER ACTIONS REQUIRED:');
            $this->line('');

            $actions = [
                "📧 {$needsReauth} email accounts need re-authentication",
                '🔐 Users must reconnect their Gmail accounts through your web interface',
                '🌐 Direct users to: /settings/email-accounts',
                '🔄 They need to click "Reconnect" or "Add Gmail Account" again',
                '✅ After reconnection, accounts will be automatically healed',
            ];

            foreach ($actions as $action) {
                $this->line("   {$action}");
            }

            $this->line('');
            $this->info('💡 WHY THIS HAPPENS:');
            $this->line('   • Gmail OAuth tokens expire after some time');
            $this->line('   • Users may have revoked access in their Google account');
            $this->line('   • Google security policies require periodic re-authentication');
            $this->line('   • This is normal and expected behavior for OAuth applications');
        } else {
            $this->info('✅ No user actions required - all accounts are healthy!');
        }
    }
}
