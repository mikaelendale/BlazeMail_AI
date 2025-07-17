<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Http;
use Laravel\Paddle\Exceptions\PaddleException;

class CheckPaddlePermissions extends Command
{
    protected $signature = 'paddle:check-permissions';
    protected $description = 'Check Paddle API permissions and configuration';

    public function handle()
    {
        $this->info('Checking Paddle API configuration...');

        // Check API key
        $apiKey = config('cashier.api_key');
        if (empty($apiKey)) {
            $this->error('PADDLE_API_KEY not configured');
            return;
        }

        $this->info('API Key configured: ' . substr($apiKey, 0, 20) . '...');

        // Check sandbox mode
        $sandbox = config('cashier.sandbox');
        $this->info('Sandbox mode: ' . ($sandbox ? 'enabled' : 'disabled'));

        // Test API connectivity
        try {
            $baseUrl = $sandbox ? 'https://sandbox-api.paddle.com' : 'https://api.paddle.com';

            $response = Http::withHeaders([
                'Authorization' => 'Bearer ' . $apiKey,
                'Content-Type' => 'application/json',
            ])->get($baseUrl . '/products');

            if ($response->successful()) {
                $this->info('✅ API connection successful');
                $products = $response->json()['data'] ?? [];
                $this->info('Found ' . count($products) . ' products');
            } else {
                $this->error('❌ API connection failed: ' . $response->status());
                $this->error('Response: ' . $response->body());
            }
        } catch (\Exception $e) {
            $this->error('❌ API test failed: ' . $e->getMessage());
        }

        // Check webhook secret
        $webhookSecret = config('cashier.webhook_secret');
        if (empty($webhookSecret)) {
            $this->error('PADDLE_WEBHOOK_SECRET not configured');
        } else {
            $this->info('✅ Webhook secret configured');
        }
    }
}
