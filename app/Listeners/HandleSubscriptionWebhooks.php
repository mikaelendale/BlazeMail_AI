<?php

namespace App\Listeners;

use Laravel\Paddle\Events\WebhookReceived;
use Laravel\Paddle\Events\SubscriptionCreated;
use Illuminate\Support\Facades\Log;

class HandleSubscriptionWebhooks
{
    public function handle($event): void
    {
        if ($event instanceof WebhookReceived) {
            $eventType = $event->payload['event_type'] ?? 'unknown';

            Log::info("Paddle webhook received: {$eventType}", [
                'event_id' => $event->payload['event_id'] ?? null,
                'data' => $event->payload['data'] ?? []
            ]);
        }

        if ($event instanceof SubscriptionCreated) {
            Log::info('Subscription created successfully', [
                'subscription_id' => $event->subscription->id,
                'paddle_id' => $event->subscription->paddle_id,
                'user_id' => $event->subscription->billable_id,
                'status' => $event->subscription->paddle_status,
                'trial_ends_at' => $event->subscription->trial_ends_at,
            ]);
        }
    }
}
