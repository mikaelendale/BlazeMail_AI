<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Laravel\Paddle\Cashier;
use App\Models\User;
use Illuminate\Support\Facades\Http;

class SyncPaddleData extends Command
{
    protected $signature = 'paddle:sync {user_id?}';
    protected $description = 'Manually sync Paddle data for debugging';

    public function handle()
    {
        $userId = $this->argument('user_id');

        if ($userId) {
            $user = User::find($userId);
            if (!$user) {
                $this->error("User not found");
                return;
            }
            $this->syncUserData($user);
        } else {
            $this->info("Syncing all users with Paddle customer IDs...");
            User::whereNotNull('paddle_id')->each(function ($user) {
                $this->syncUserData($user);
            });
        }
    }

    private function syncUserData(User $user)
    {
        $this->info("Syncing user: {$user->email} (Paddle ID: {$user->paddle_id})");

        try {
            // This will fetch and sync subscriptions from Paddle
            $subscriptions = $user->subscriptions;
            $this->info("Found {$subscriptions->count()} subscriptions");

            // This will fetch and sync transactions from Paddle
            $transactions = $user->transactions;
            $this->info("Found {$transactions->count()} transactions");
        } catch (\Exception $e) {
            $this->error("Error syncing user {$user->email}: " . $e->getMessage());
        }
    }
}
