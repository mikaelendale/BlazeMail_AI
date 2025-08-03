<?php

namespace App\Console\Commands;

use App\Models\EmailAccount;
use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

class CreateReauthNotification extends Command
{
    protected $signature = 'email:create-reauth-notifications';
    protected $description = 'Create notifications for users who need to re-authenticate their email accounts';

    public function handle(): int
    {
        try {
            $this->info('📧 Creating re-authentication notifications...');

            // Get users who have accounts needing reauth
            $usersNeedingReauth = User::whereHas('emailAccounts', function ($query) {
                $query->where(function ($subQuery) {
                    $subQuery->where('status', 'suspended')
                        ->orWhere('status', 'needs_reauth')
                        ->orWhere('last_error', 'like', '%NEEDS_REAUTH%')
                        ->orWhere('last_error', 'like', '%invalid_grant%');
                });
            })->with(['emailAccounts' => function ($query) {
                $query->where(function ($subQuery) {
                    $subQuery->where('status', 'suspended')
                        ->orWhere('status', 'needs_reauth')
                        ->orWhere('last_error', 'like', '%NEEDS_REAUTH%')
                        ->orWhere('last_error', 'like', '%invalid_grant%');
                });
            }])->get();

            if ($usersNeedingReauth->isEmpty()) {
                $this->info('✅ No users need re-authentication notifications');
                return 0;
            }

            $this->info("Found {$usersNeedingReauth->count()} users needing re-authentication:");

            $notificationData = [];
            foreach ($usersNeedingReauth as $user) {
                $accountEmails = $user->emailAccounts->pluck('email')->toArray();
                $accountCount = $user->emailAccounts->count();

                $notificationData[] = [
                    $user->id,
                    $user->name ?? 'Unknown',
                    $user->email ?? 'No email',
                    $accountCount,
                    implode(', ', array_slice($accountEmails, 0, 2)) . ($accountCount > 2 ? '...' : ''),
                ];

                // Log for potential email notification system
                Log::info('User needs email account re-authentication', [
                    'user_id' => $user->id,
                    'user_email' => $user->email,
                    'accounts_needing_reauth' => $accountEmails,
                    'account_count' => $accountCount,
                ]);
            }

            $this->table([
                'User ID',
                'Name',
                'User Email',
                'Accounts',
                'Account Emails'
            ], $notificationData);

            $this->line('');
            $this->info('💡 NOTIFICATION SUGGESTIONS:');
            $this->line('• Send email notifications to users about expired Gmail connections');
            $this->line('• Add in-app notifications when users log in');
            $this->line('• Show banner on email accounts page');
            $this->line('• Send reminder after 24 hours if not fixed');

            return 0;
        } catch (\Exception $e) {
            $this->error('Failed to create reauth notifications: ' . $e->getMessage());
            Log::error('CreateReauthNotification command failed', [
                'error' => $e->getMessage(),
            ]);
            return 1;
        }
    }
}
