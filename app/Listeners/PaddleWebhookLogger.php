<?php

namespace App\Listeners;

use Laravel\Paddle\Events\WebhookReceived;
use Laravel\Paddle\Events\SubscriptionCreated;
use Laravel\Paddle\Events\SubscriptionUpdated;
use Laravel\Paddle\Events\TransactionCompleted;
use Laravel\Paddle\Events\CustomerUpdated;
use Illuminate\Support\Facades\Log;

class PaddleWebhookLogger
{
    public function handle($event): void
    {
        if ($event instanceof WebhookReceived) {
            Log::info('=== PADDLE WEBHOOK RECEIVED ===', [
                'event_type' => $event->payload['event_type'] ?? 'unknown',
                'event_id' => $event->payload['event_id'] ?? 'unknown',
                'occurred_at' => $event->payload['occurred_at'] ?? 'unknown',
                'full_payload' => $event->payload
            ]);
        }

        if ($event instanceof SubscriptionCreated) {
            Log::info('=== SUBSCRIPTION CREATED EVENT ===', [
                'subscription_id' => $event->subscription->id ?? 'unknown',
                'paddle_id' => $event->subscription->paddle_id ?? 'unknown',
                'user_id' => $event->subscription->billable_id ?? 'unknown',
                'status' => $event->subscription->paddle_status ?? 'unknown'
            ]);
        }

        if ($event instanceof TransactionCompleted) {
            Log::info('=== TRANSACTION COMPLETED EVENT ===', [
                'transaction_id' => $event->transaction->id ?? 'unknown',
                'paddle_id' => $event->transaction->paddle_id ?? 'unknown',
                'user_id' => $event->transaction->billable_id ?? 'unknown',
                'total' => $event->transaction->total ?? 'unknown'
            ]);
        }
    }
}
