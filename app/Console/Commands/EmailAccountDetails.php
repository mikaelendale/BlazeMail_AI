<?php

namespace App\Console\Commands;

use App\Models\EmailAccount;
use Illuminate\Console\Command;

class EmailAccountDetails extends Command
{
    protected $signature = 'email:account-details {account-id : The ID of the email account}';
    protected $description = 'Show detailed information about a specific email account';

    public function handle(): int
    {
        $accountId = $this->argument('account-id');
        $account = EmailAccount::find($accountId);

        if (!$account) {
            $this->error("❌ Account with ID {$accountId} not found");
            return 1;
        }

        $this->info("📧 Email Account Details: {$account->email}");
        $this->line('');

        // Basic Information
        $this->info('📋 Basic Information:');
        $this->table(['Field', 'Value'], [
            ['ID', $account->id],
            ['Email', $account->email],
            ['Provider', $account->provider],
            ['Status', $this->getStatusWithEmoji($account->status)],
            ['Connected', $account->is_connected ? '✅ Yes' : '❌ No'],
            ['Verified', $account->is_verified ? '✅ Yes' : '❌ No'],
            ['Created', $account->created_at->format('Y-m-d H:i:s')],
        ]);

        $this->line('');

        // Error Information
        $this->info('⚠️ Error Information:');
        $this->table(['Field', 'Value'], [
            ['Consecutive Errors', $account->consecutive_errors],
            ['Last Error', $account->last_error ?? 'None'],
            ['Last Error At', $account->last_error_at ? $account->last_error_at->format('Y-m-d H:i:s') : 'Never'],
            ['Success Rate', $account->success_rate . '%'],
        ]);

        $this->line('');

        // Token Information
        $this->info('🔐 Token Information:');
        $this->table(['Field', 'Value'], [
            ['Has Access Token', !empty($account->encrypted_access_token) ? '✅ Yes' : '❌ No'],
            ['Has Refresh Token', !empty($account->encrypted_refresh_token) ? '✅ Yes' : '❌ No'],
            ['Token Expires At', $account->token_expires_at ? $account->token_expires_at->format('Y-m-d H:i:s') : 'Unknown'],
            ['Token Expires In', $account->token_expires_at ? $account->token_expires_at->diffForHumans() : 'Unknown'],
            ['Last Token Refresh', $account->last_token_refresh ? $account->last_token_refresh->format('Y-m-d H:i:s') : 'Never'],
            ['Token Refresh Count', $account->token_refresh_count ?? 0],
        ]);

        $this->line('');

        // Healing Information
        $this->info('🔧 Healing Information:');
        $this->table(['Field', 'Value'], [
            ['Auto Healing Enabled', ($account->auto_healing_enabled ?? true) ? '✅ Yes' : '❌ No'],
            ['Last Healing Attempt', $account->last_healing_attempt ? $account->last_healing_attempt->format('Y-m-d H:i:s') : 'Never'],
            ['Healing Attempts Today', $account->healing_attempts_today ?? 0],
            ['Auto Heal Count', $account->auto_heal_count ?? 0],
            ['Last Auto Healed', $account->auto_healed_at ? $account->auto_healed_at->format('Y-m-d H:i:s') : 'Never'],
        ]);

        $this->line('');

        // Activity Information
        $this->info('📊 Activity Information:');
        $this->table(['Field', 'Value'], [
            ['Last Activity', $account->last_activity ? $account->last_activity->format('Y-m-d H:i:s') : 'Never'],
            ['Last Sync', $account->last_sync ? $account->last_sync->format('Y-m-d H:i:s') : 'Never'],
            ['Last Health Check', $account->last_health_check ? $account->last_health_check->format('Y-m-d H:i:s') : 'Never'],
            ['Daily Sent', $account->daily_sent ?? 0],
            ['Daily Limit', $account->daily_limit ?? 0],
        ]);

        $this->line('');

        // Healing History
        if (!empty($account->healing_history)) {
            $this->info('📜 Recent Healing History:');
            $historyData = [];
            foreach (array_slice($account->healing_history, -5) as $entry) {
                $historyData[] = [
                    $entry['timestamp'] ?? 'Unknown',
                    $entry['result'] ?? 'Unknown',
                    $entry['error'] ?? 'None',
                    $entry['method'] ?? 'Unknown',
                ];
            }
            $this->table(['Timestamp', 'Result', 'Error', 'Method'], $historyData);
        }

        $this->line('');

        // Recommendations
        $this->info('💡 Recommendations:');
        $recommendations = $this->getRecommendations($account);
        foreach ($recommendations as $recommendation) {
            $this->line("• {$recommendation}");
        }

        return 0;
    }

    private function getStatusWithEmoji(string $status): string
    {
        $statusEmojis = [
            'active' => '🟢 Active',
            'warming' => '🟡 Warming',
            'warning' => '🟠 Warning',
            'error' => '🔴 Error',
            'needs_reauth' => '🔵 Needs Re-auth',
            'suspended' => '⚫ Suspended',
            'pending' => '⚪ Pending',
            'paused' => '⏸️ Paused',
        ];

        return $statusEmojis[$status] ?? "❓ {$status}";
    }

    private function getRecommendations(EmailAccount $account): array
    {
        $recommendations = [];

        if ($account->status === 'needs_reauth') {
            $recommendations[] = 'Account needs re-authentication. User must reconnect their Gmail account.';
        }

        if ($account->status === 'error' && $account->consecutive_errors >= 5) {
            $recommendations[] = 'Account has too many errors. Consider manual intervention.';
        }

        if (empty($account->encrypted_refresh_token)) {
            $recommendations[] = 'Missing refresh token. Account needs to be re-connected.';
        }

        if ($account->token_expires_at && $account->token_expires_at->isPast()) {
            $recommendations[] = 'Access token has expired. Run healing job to refresh.';
        }

        if (!$account->last_health_check || $account->last_health_check->lt(now()->subHours(24))) {
            $recommendations[] = 'Health check is overdue. Run: php artisan email:heal-errors-improved --account-id=' . $account->id;
        }

        if (($account->healing_attempts_today ?? 0) >= 5) {
            $recommendations[] = 'Too many healing attempts today. Account may need manual attention.';
        }

        if (empty($recommendations)) {
            $recommendations[] = 'Account looks healthy! No immediate action required.';
        }

        return $recommendations;
    }
}
