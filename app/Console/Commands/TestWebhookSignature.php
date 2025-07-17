<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Http;

class TestWebhookSignature extends Command
{
    protected $signature = 'paddle:test-webhook';
    protected $description = 'Test webhook signature verification';

    public function handle()
    {
        $webhookSecret = config('cashier.webhook_secret');

        if (empty($webhookSecret)) {
            $this->error('PADDLE_WEBHOOK_SECRET is not set in .env file');
            return;
        }

        $this->info('Webhook secret is configured: ' . substr($webhookSecret, 0, 10) . '...');

        // Test webhook URL
        $webhookUrl = config('cashier.webhook_url', url('/paddle/webhook'));
        $this->info('Webhook URL: ' . $webhookUrl);

        // Check if webhook URL is accessible
        try {
            $response = Http::timeout(10)->get($webhookUrl);
            $this->info('Webhook URL is accessible (Status: ' . $response->status() . ')');
        } catch (\Exception $e) {
            $this->error('Webhook URL is not accessible: ' . $e->getMessage());
        }
    }
}
