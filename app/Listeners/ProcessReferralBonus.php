<?php

namespace App\Listeners;

use App\Models\User;
use App\Services\CreditService;
use Laravel\Paddle\Events\SubscriptionCreated;
use Illuminate\Contracts\Queue\ShouldQueue; // Keep ShouldQueue if you have queues configured

class ProcessReferralBonus implements ShouldQueue // Keep or remove ShouldQueue based on your queue setup
{
    public function __construct(
        private CreditService $creditService
    ) {}

    public function handle(SubscriptionCreated $event): void
    {
        $user = $event->billable;

        // Process referral bonus if applicable2
        if ($user->referred_by) {
            $referrer = User::where('own_referral_code', $user->referred_by)->first();

            if ($referrer) {
                $this->creditService->processReferralBonus($referrer, $user);
            }
        }

        // Process initial/renewal subscription credit refill for the user
        $this->creditService->processSubscriptionRefill($user);
    }
}
