<?php

namespace App\Listeners;

use Laravel\Paddle\Events\SubscriptionCreated;
use Laravel\Paddle\Events\SubscriptionUpdated;
use Laravel\Paddle\Events\TransactionCompleted;
use Laravel\Paddle\Events\WebhookReceived;
use Illuminate\Support\Facades\Log;

class HandlePaddleWebhook
{
    public function handle(WebhookReceived $event): void
    {
        Log::info('Paddle webhook received', [
            'event_type' => $event->payload['event_type'] ?? 'unknown',
            'payload' => $event->payload
        ]);

        // Handle specific webhook events
        switch ($event->payload['event_type'] ?? '') {
            case 'subscription.created':
                $this->handleSubscriptionCreated($event->payload);
                break;
            case 'subscription.updated':
                $this->handleSubscriptionUpdated($event->payload);
                break;
            case 'transaction.completed':
                $this->handleTransactionCompleted($event->payload);
                break;
        }
    }

    private function handleSubscriptionCreated(array $payload): void
    {
        Log::info('Subscription created', ['subscription_id' => $payload['data']['id'] ?? 'unknown']);
        // Additional custom logic here if needed
    }

    private function handleSubscriptionUpdated(array $payload): void
    {
        Log::info('Subscription updated', ['subscription_id' => $payload['data']['id'] ?? 'unknown']);
        // Additional custom logic here if needed
    }

    private function handleTransactionCompleted(array $payload): void
    {
        Log::info('Transaction completed', ['transaction_id' => $payload['data']['id'] ?? 'unknown']);
        // Additional custom logic here if needed
    }
}
