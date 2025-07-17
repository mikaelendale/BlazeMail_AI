<?php

namespace App\Http\Middleware;

use App\Models\User;
use App\Services\CreditService;
use Illuminate\Foundation\Inspiring;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Middleware;
use Tighten\Ziggy\Ziggy;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that's loaded on the first page visit.
     *
     * @see https://inertiajs.com/server-side-setup#root-template
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determines the current asset version.
     *
     * @see https://inertiajs.com/asset-versioning
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @see https://inertiajs.com/shared-data
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        [$message, $author] = str(Inspiring::quotes()->random())->explode('-');

        $plan = 'free';
        $subscriptionAmount = '$0';
        $credits = Auth::user()?->credit_balance ?? 0;
        if ($user = Auth::user()) { 
            if ($user->subscribedToPrice(config('services.paddle.growth_monthly_price_id'))) {
                $plan = 'growth-monthly';
                $subscriptionAmount = config('services.paddle.growth_monthly_amount');
            } elseif ($user->subscribedToPrice(config('services.paddle.scale_monthly_price_id'))) {
                $plan = 'scale-monthly';
                $subscriptionAmount = config('services.paddle.scale_monthly_amount');
            } elseif ($user->subscribedToPrice(config('services.paddle.growth_annual_price_id'))) {
                $plan = 'growth-annual';
                $subscriptionAmount = config('services.paddle.growth_annual_amount');
            } elseif ($user->subscribedToPrice(config('services.paddle.scale_annual_price_id'))) {
                $plan = 'scale-annual';
                $subscriptionAmount = config('services.paddle.scale_annual_amount');
            }
        }

        // Share data with Inertia
        $growthMonthlyPrice = config('services.paddle.growth_monthly_amount');
        $growthAnnualPrice = config('services.paddle.growth_annual_amount');
        $scaleMonthlyPrice = config('services.paddle.scale_monthly_amount');
        $scaleAnnualPrice = config('services.paddle.scale_annual_amount');

        $trialStatus = $request->user() ? $request->user()->created_at->diffInDays(now()) < 7 : false;

        // credit service
        $creditService = app(CreditService::class);

        return [
            ...parent::share($request),
            'name' => config('app.name'),
            'url' => config('app.url'),
            'quote' => ['message' => trim($message), 'author' => trim($author)],
            'auth' => [
                'user' => $request->user(),
            ],
            'flash' => [
                'success' => session('success'),
                'error' => session('error'),
            ],
            'ziggy' => fn(): array => [
                ...(new Ziggy)->toArray(),
                'location' => $request->url(),
            ],
            'sidebarOpen' => ! $request->hasCookie('sidebar_state') || $request->cookie('sidebar_state') === 'true',
            // Cashier Paddle Subscription Data
            'subscription' => fn() => $this->getSubscriptionData($request),
            'billing' => fn() => $this->getBillingData($request),
            'customer' => [
                'plan' => $plan, // <-- Detect user plan
                'subscriptionAmount' => $subscriptionAmount,
                'credits' => $credits, // <-- User's credit balance
            ],
            'price' => [
                'growth_monthly' => $growthMonthlyPrice,
                'growth_annual' => $growthAnnualPrice,
                'scale_monthly' => $scaleMonthlyPrice,
                'scale_annual' => $scaleAnnualPrice,
            ],
            'trialStatus' => $trialStatus, // <-- Trial status
            'credits' => $user ? $creditService->getUserCreditInfo($user) : null,
            'referral_stats' => $user ? [
                'total_referrals' => User::where('referred_by', $user->own_referral_code)->count(),
                'paying_referrals' => User::where('referred_by', $user->own_referral_code)
                    ->get()
                    ->filter(function ($referredUser) {
                        return $referredUser->subscribed('default');
                    })
                    ->count(),
                'total_credits_earned' => $user->referral_credits ?? 0,
                'referral_link' => $user->own_referral_code
                    ? route('register') . '?ref=' . $user->own_referral_code
                    : null,
            ] : null,
        ];
    }
    /**
     * Get comprehensive subscription data for the authenticated user
     */
    private function getSubscriptionData(Request $request): array
    {
        if (!$request->user()) {
            return [
                'hasSubscription' => false,
                'states' => [],
                'subscriptions' => [],
            ];
        }

        $user = Auth::user();
        $defaultSubscription = $user->subscription();

        // Get all subscriptions for the user
        $allSubscriptions = $user->subscriptions()->get()->map(function ($subscription) {
            return [
                'id' => $subscription->id,
                'type' => $subscription->type,
                'paddle_id' => $subscription->paddle_id,
                'status' => $subscription->paddle_status,
                'trial_ends_at' => $subscription->trial_ends_at?->toISOString(),
                'ends_at' => $subscription->ends_at?->toISOString(),
                'paused_at' => $subscription->paused_at?->toISOString(),
                'created_at' => $subscription->created_at->toISOString(),
                'updated_at' => $subscription->updated_at->toISOString(),

                // Individual subscription states
                'states' => [
                    'valid' => $subscription->valid(),
                    'active' => $subscription->active(),
                    'onTrial' => $subscription->onTrial(),
                    'recurring' => $subscription->recurring(),
                    'pastDue' => $subscription->pastDue(),
                    'paused' => $subscription->paused(),
                    'onPausedGracePeriod' => $subscription->onPausedGracePeriod(),
                    'canceled' => $subscription->canceled(),
                    'onGracePeriod' => $subscription->onGracePeriod(),
                ],
            ];
        });

        // Default subscription states (most commonly used)
        $defaultStates = [];
        if ($defaultSubscription) {
            $defaultStates = [
                'valid' => $defaultSubscription->valid(),
                'active' => $defaultSubscription->active(),
                'onTrial' => $defaultSubscription->onTrial(),
                'expiredTrial' => $user->hasExpiredTrial(),
                'notOnTrial' => !$defaultSubscription->onTrial(),
                'recurring' => $defaultSubscription->recurring(),
                'pastDue' => $defaultSubscription->pastDue(),
                'paused' => $defaultSubscription->paused(),
                'notPaused' => !$defaultSubscription->paused(),
                'onPausedGracePeriod' => $defaultSubscription->onPausedGracePeriod(),
                'notOnPausedGracePeriod' => !$defaultSubscription->onPausedGracePeriod(),
                'canceled' => $defaultSubscription->canceled(),
                'notCanceled' => !$defaultSubscription->canceled(),
                'onGracePeriod' => $defaultSubscription->onGracePeriod(),
                'notOnGracePeriod' => !$defaultSubscription->onGracePeriod(),
            ];
        }

        // User-level subscription checks
        $userStates = [
            'subscribed' => $user->subscribed(),
            'subscribedToDefault' => $user->subscribed('default'),
            'onGenericTrial' => $user->onGenericTrial(),
            'hasExpiredTrial' => $user->hasExpiredTrial(),
        ];

        return [
            'hasSubscription' => $user->subscribed(),
            'defaultSubscription' => $defaultSubscription ? [
                'id' => $defaultSubscription->id,
                'type' => $defaultSubscription->type,
                'paddle_id' => $defaultSubscription->paddle_id,
                'status' => $defaultSubscription->paddle_status,
                'trial_ends_at' => $defaultSubscription->trial_ends_at?->toISOString(),
                'ends_at' => $defaultSubscription->ends_at?->toISOString(),
                'paused_at' => $defaultSubscription->paused_at?->toISOString(),
            ] : null,
            'states' => array_merge($userStates, $defaultStates),
            'subscriptions' => $allSubscriptions,
            'trialEndsAt' => $user->trialEndsAt()?->toISOString(),
        ];
    }

    /**
     * Get billing and transaction data
     */
    private function getBillingData(Request $request): array
    {
        if (!$request->user()) {
            return [
                'transactions' => [],
                'receipts' => [],
            ];
        }

        $user = $request->user();

        return [
            'transactions' => $user->transactions()->latest()->take(10)->get()->map(function ($transaction) {
                return [
                    'id' => $transaction->id,
                    'paddle_id' => $transaction->paddle_id,
                    'paddle_subscription_id' => $transaction->paddle_subscription_id,
                    'invoice_number' => $transaction->invoice_number,
                    'status' => $transaction->status,
                    'total' => $transaction->total,
                    'tax' => $transaction->tax,
                    'currency' => $transaction->currency,
                    'billed_at' => $transaction->billed_at?->toISOString(),
                    'created_at' => $transaction->created_at->toISOString(),
                ];
            }),
        ];
    }
}
