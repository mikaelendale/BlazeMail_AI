<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Http;
use Laravel\Paddle\Subscription;
use App\Models\User;

class TestPaddleWebhooks extends Command
{
    protected $signature = 'paddle:test-webhooks';
    protected $description = 'Test Paddle webhook connectivity and subscription sync';

    public function handle()
    {
        $this->info('Testing Paddle webhook setup...');

        // Check webhook URL accessibility
        $webhookUrl = config('cashier.webhook_url', url('/paddle/webhook'));
        $this->info("Webhook URL: {$webhookUrl}");

        try {
            $response = Http::timeout(10)->get($webhookUrl);
            $this->info("Webhook URL accessible (Status: {$response->status()})");
        } catch (\Exception $e) {
            $this->error("Webhook URL not accessible: {$e->getMessage()}");
        }

        // Check webhook secret
        $webhookSecret = config('cashier.webhook_secret');
        if (empty($webhookSecret)) {
            $this->error('PADDLE_WEBHOOK_SECRET not configured');
        } else {
            $this->info('Webhook secret configured');
        }

        // Check subscription sync status
        $usersWithPaddleId = User::whereNotNull('paddle_id')->count();
        $totalSubscriptions = Subscription::count();

        $this->info("Users with Paddle ID: {$usersWithPaddleId}");
        $this->info("Total subscriptions: {$totalSubscriptions}");

        if ($usersWithPaddleId > $totalSubscriptions) {
            $this->warn('Some users have Paddle IDs but no subscriptions - webhook sync issue');

            $usersWithoutSubs = User::whereNotNull('paddle_id')
                ->whereDoesntHave('subscriptions')
                ->get(['id', 'email', 'paddle_id']);

            foreach ($usersWithoutSubs as $user) {
                $this->line("- {$user->email} (Paddle ID: {$user->paddle_id})");
            }
        }
    }
}
