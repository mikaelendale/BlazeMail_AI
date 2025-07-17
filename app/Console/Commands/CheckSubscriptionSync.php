<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\User;
use Laravel\Paddle\Subscription;

class CheckSubscriptionSync extends Command
{
    protected $signature = 'paddle:check-subscriptions';
    protected $description = 'Check subscription sync status';

    public function handle()
    {
        $this->info('Checking subscription sync...');

        // Check users with paddle_id but no subscriptions
        $usersWithoutSubs = User::whereNotNull('paddle_id')
            ->whereDoesntHave('subscriptions')
            ->get();

        $this->info("Users with Paddle ID but no subscriptions: {$usersWithoutSubs->count()}");

        foreach ($usersWithoutSubs as $user) {
            $this->line("- {$user->email} (Paddle ID: {$user->paddle_id})");
        }

        // Check total subscriptions
        $totalSubs = Subscription::count();
        $this->info("Total subscriptions in database: {$totalSubs}");

        // Check users on trial
        $usersOnTrial = User::whereNotNull('trial_ends_at')
            ->where('trial_ends_at', '>', now())
            ->get();

        $this->info("Users on trial: {$usersOnTrial->count()}");

        foreach ($usersOnTrial as $user) {
            $this->line("- {$user->email} (Trial ends: {$user->trial_ends_at})");
        }
    }
}
