<?php

namespace App\Listeners;

use Laravel\Paddle\Events\WebhookReceived;
use Laravel\Paddle\Events\SubscriptionCreated;
use Laravel\Paddle\Events\SubscriptionUpdated;
use Laravel\Paddle\Events\TransactionCompleted;
use Illuminate\Support\Facades\Log;
use App\Models\User;

class SubscriptionWebhookHandler
{
    public function handle($event): void
    {
        if ($event instanceof WebhookReceived) {
            $eventType = $event->payload['event_type'] ?? 'unknown';

            Log::info("=== PADDLE WEBHOOK: {$eventType} ===", [
                'event_id' => $event->payload['event_id'] ?? 'unknown',
                'occurred_at' => $event->payload['occurred_at'] ?? 'unknown',
                'data' => $event->payload['data'] ?? []
            ]);

            // Handle subscription creation specifically
            if ($eventType === 'subscription.created') {
                $this->handleSubscriptionCreated($event->payload);
            }
        }

        if ($event instanceof SubscriptionCreated) {
            Log::info('=== SUBSCRIPTION CREATED EVENT PROCESSED ===', [
                'subscription_id' => $event->subscription->id,
                'paddle_id' => $event->subscription->paddle_id,
                'user_id' => $event->subscription->billable_id,
                'status' => $event->subscription->paddle_status,
                'type' => $event->subscription->type,
                'trial_ends_at' => $event->subscription->trial_ends_at,
            ]);
        }

        if ($event instanceof TransactionCompleted) {
            Log::info('=== TRANSACTION COMPLETED ===', [
                'transaction_id' => $event->transaction->id,
                'paddle_id' => $event->transaction->paddle_id,
                'user_id' => $event->transaction->billable_id,
                'total' => $event->transaction->total,
                'status' => $event->transaction->paddle_status,
            ]);
        }
    }

    private function handleSubscriptionCreated(array $payload): void
    {
        $subscriptionData = $payload['data'] ?? [];
        $customerId = $subscriptionData['customer_id'] ?? null;

        if ($customerId) {
            $user = User::where('paddle_id', $customerId)->first();
            if ($user) {
                Log::info('Subscription created for user', [
                    'user_id' => $user->id,
                    'user_email' => $user->email,
                    'subscription_paddle_id' => $subscriptionData['id'] ?? 'unknown',
                    'status' => $subscriptionData['status'] ?? 'unknown',
                    'trial_ends_at' => $subscriptionData['trial_ends_at'] ?? null,
                ]);
            } else {
                Log::warning('Could not find user for subscription', [
                    'customer_id' => $customerId,
                    'subscription_id' => $subscriptionData['id'] ?? 'unknown'
                ]);
            }
        }
    }
}
