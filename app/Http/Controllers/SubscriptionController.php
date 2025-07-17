<?php

namespace App\Http\Controllers;

use App\Notifications\SubscriptionStatusChanged;
use App\Services\CreditService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\RateLimiter; // Import RateLimiter
use Illuminate\Validation\ValidationException; // Import ValidationException
use Laravel\Paddle\Exceptions\PaddleException;

class SubscriptionController extends Controller
{
    private array $plans;
    private CreditService $creditService;

    public function __construct(CreditService $creditService)
    {
        $this->creditService = $creditService;
        $this->plans = [
            'growth-monthly' => config('services.paddle.growth_monthly_price_id'),
            'growth-annual' => config('services.paddle.growth_annual_price_id'),
            'scale-monthly' => config('services.paddle.scale_monthly_price_id'),
            'scale-annual' => config('services.paddle.scale_annual_price_id'),
        ];
    }

    public function subscribe(Request $request)
    {
        $user = $request->user();
        if (!$user) {
            return redirect()->route('login');
        }

        $plan = $request->query('plan', $request->input('plan', 'scale_monthly'));
        abort_unless(isset($this->plans[$plan]), 404, 'Invalid plan');

        if ($user->subscribed('default')) {
            return redirect()->route('dashboard')->with('info', 'You are already subscribed.');
        }

        try {
            $checkout = $user->subscribe($this->plans[$plan], 'default')
                ->returnTo(route('dashboard'));

            $user->notify(new SubscriptionStatusChanged('Your have successfully subscribed to the ' . $plan . ' plan.'));
            return view('billing', ['checkout' => $checkout]);
        } catch (PaddleException $e) {
            Log::error('Paddle subscribe error', [
                'user_id' => $user->id,
                'plan' => $plan,
                'error' => $e->getMessage()
            ]);
            return redirect()->back()
                ->with('error', 'Unable to create subscription. Please try again.');
        }
    }

    public function swap(Request $request)
    {
        $plan = $request->input('plan');
        $billing = $request->input('billing', 'next_cycle');
        $user = $request->user();

        abort_unless(isset($this->plans[$plan]), 404, 'Invalid plan');

        $subscription = $user->subscription('default');
        if (!$subscription || !$subscription->valid()) {
            return redirect()->route('dashboard')
                ->with('error', 'No active subscription found to swap.');
        }

        // --- NEW: Throttling for plan swaps ---
        $throttleKey = 'swap-plan:' . $user->id;
        $maxAttempts = 3; // Max 2 swaps
        $decayMinutes = 60 * 48; // per 48 hours

        if (RateLimiter::tooManyAttempts($throttleKey, $maxAttempts)) {
            $secondsRemaining = RateLimiter::availableIn($throttleKey);
            throw ValidationException::withMessages([
                'plan' => "You can only change plans {$maxAttempts} times per day. Please try again in " . gmdate("H:i:s", $secondsRemaining) . ".",
            ])->redirectTo(url()->previous());
        }
        RateLimiter::hit($throttleKey, $decayMinutes * 60); // Hit the rate limiter

        // --- END Throttling ---

        // Get the current price ID using Paddle's subscribedToPrice method
        $oldPriceId = null;
        foreach ($this->plans as $key => $priceId) {
            if ($user->subscribedToPrice($priceId, 'default')) {
                $oldPriceId = $priceId;
                break;
            }
        }

        // If oldPriceId is null, it means the user is not subscribed to any of the defined plans
        // This could happen if they are on a trial or a custom plan not in $this->plans
        // For simplicity, we'll treat this as a "free" starting point for credit calculation
        if (is_null($oldPriceId)) {
            // If the user is not subscribed to any known plan, assume they are effectively on a 'free' tier for credit calculation purposes.
            // This prevents issues if they are on a trial or a legacy plan.
            $oldPriceId = 'free'; // Use a dummy ID for calculation
        }


        try {
            switch ($billing) {
                case 'immediate':
                    $subscription->swapAndInvoice($this->plans[$plan]);
                    $message = "Successfully switched to {$plan} plan! You've been charged immediately.";
                    break;
                case 'no_prorate':
                    $subscription->noProrate()->swap($this->plans[$plan]);
                    $message = "Successfully switched to {$plan} plan! Changes take effect next billing cycle (no proration).";
                    break;
                case 'no_prorate_immediate':
                    $subscription->noProrate()->swapAndInvoice($this->plans[$plan]);
                    $message = "Successfully switched to {$plan} plan! You've been charged immediately (no proration).";
                    break;
                case 'no_bill':
                    $subscription->doNotBill()->swap($this->plans[$plan]);
                    $message = "Successfully switched to {$plan} plan! No additional charges.";
                    break;
                default: // 'next_cycle'
                    $subscription->swap($this->plans[$plan]);
                    $message = "Successfully switched to {$plan} plan! Changes take effect next billing cycle.";
                    break;
            }

            // Handle credit adjustment for plan swap
            $this->creditService->handlePlanSwapCredits($user, $oldPriceId, $this->plans[$plan]);

            $user->notify(new SubscriptionStatusChanged($message));
            return redirect()->back()->with('success', $message);
        } catch (PaddleException $e) {
            Log::error('Paddle swap error', [
                'user_id' => $user->id,
                'subscription_id' => $subscription->id,
                'old_price_id' => $oldPriceId,
                'new_plan' => $plan,
                'billing_type' => $billing,
                'error' => $e->getMessage()
            ]);
            // If Paddle swap fails, release the throttle hit
            RateLimiter::clear($throttleKey);
            return redirect()->back()
                ->with('error', 'Unable to switch plans. Please contact support.');
        }
    }

    public function pause(Request $request)
    {
        $user = $request->user();
        $subscription = $user->subscription();
        if (!$subscription || $subscription->paused()) {
            return redirect()->back()
                ->with('error', 'No active subscription found or subscription is already paused.');
        }
        try {
            $subscription->pause();
            $user->notify(new SubscriptionStatusChanged('Your subscription has been paused successfully.'));
            return redirect()->back()
                ->with('success', 'Subscription paused successfully.');
        } catch (PaddleException $e) {
            return redirect()->back()
                ->with('error', 'Unable to pause subscription. Please contact support.');
        }
    }

    public function resume(Request $request)
    {
        $user = $request->user();
        $subscription = $user->subscription();
        try {
            $subscription->resume();
            $user->notify(new SubscriptionStatusChanged('Your subscription has been resumed successfully.'));
            return redirect()->back()
                ->with('success', 'Subscription resumed successfully.');
        } catch (PaddleException $e) {
            return redirect()->back()
                ->with('error', 'Unable to resume subscription. Please contact support.');
        }
    }

    public function cancel(Request $request)
    {
        $user = $request->user();
        $activeSubscription = $user->subscriptions()->notCanceled()->first();
        if (!$activeSubscription) {
            return redirect()->back()
                ->with('error', 'No active subscription found.');
        }
        try {
            $activeSubscription->cancel();
            $user->notify(new SubscriptionStatusChanged('Your subscription will be canceled at the end of your billing period.'));
            return redirect()->back()
                ->with('success', 'Subscription will be canceled at the end of your billing period.');
        } catch (PaddleException $e) {
            return redirect()->back()
                ->with('error', 'Unable to cancel subscription. Please contact support.');
        }
    }

    public function stopCancellation(Request $request)
    {
        $user = $request->user();
        $subscription = $user->subscription();
        if (!$subscription || !$subscription->onGracePeriod()) {
            return redirect()->back()
                ->with('error', 'No subscription found in grace period.');
        }
        try {
            $user->subscription()->stopCancelation();
            return redirect()->back()
                ->with('success', 'Subscription cancellation stopped successfully.');
        } catch (PaddleException $e) {
            return redirect()->back()
                ->with('error', 'Unable to stop cancellation. Please contact support.');
        }
    }

    public function updatePaymentMethod(Request $request)
    {
        $user = $request->user();
        $subscription = $user->subscriptions()->valid()->first();
        if (!$subscription) {
            return redirect()->back()
                ->with('error', 'No active subscription found.');
        }
        try {
            $user->notify(new SubscriptionStatusChanged('Your card was updated successfully.'));
            return $subscription->redirectToUpdatePaymentMethod();
        } catch (PaddleException $e) {
            return redirect()->back()
                ->with('error', 'Unable to update payment method. Please contact support.');
        }
    }
}
