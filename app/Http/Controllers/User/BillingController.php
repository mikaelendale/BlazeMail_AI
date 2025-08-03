<?php

namespace App\Http\Controllers\User;

use App\Http\Controllers\Controller;
use App\Services\ContactLimitService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Laravel\Paddle\Exceptions\PaddleException;

class BillingController extends Controller
{
    protected ContactLimitService $contactLimitService;

    
    public function __construct(ContactLimitService $contactLimitService)
    {
        $this->contactLimitService = $contactLimitService;
    }

    public function index(Request $request)
    {
        $user = $request->user();

        // Get subscription data
        $usageStats = $this->contactLimitService->getUsageStats($user);

        return Inertia::render('user/billing-section', [
            'usage' => $usageStats,
        ]);
    }

     

    private function getUsageData($user)
    {

        // Customize this based on your app's usage metrics
        return [
            'users' => ['current' => 1, 'limit' => 25],
            'storage' => ['current' => 5, 'limit' => 100],
            'apiCalls' => ['current' => 1250, 'limit' => 50000],
        ];
    }

    private function getBillingHistory($user)
    {
        $transactions = $user->transactions()->latest()->take(10)->get();
        
        return $transactions->map(function ($transaction) {
            return [
                'id' => $transaction->id,
                'date' => $transaction->billed_at->format('M d, Y'),
                'amount' => $transaction->total() == 0 ? '$0.00' : '$' . number_format((float)$transaction->total() / 100, 2),
                'status' => ucfirst($transaction->paddle_status),
                'description' => $transaction->total() == 0 ? 'Trial Setup' : 'Subscription Payment',
            ];
        })->toArray();
    }

    private function getCurrentPlan($user)
    {
        $activeSub = $user->subscriptions()->active()->first();
        
        if (!$activeSub) {
            return 'free';
        }

        foreach ($this->plans as $planId => $plan) {
            if ($plan['paddle_id'] === $activeSub->paddle_price_id) {
                return $planId;
            }
        }

        return 'free';
    }

    private function getPlanNameFromPaddleId($paddleId)
    {
        foreach ($this->plans as $plan) {
            if ($plan['paddle_id'] === $paddleId) {
                return $plan['name'];
            }
        }
        return 'Unknown';
    }

    public function changePlan(Request $request)
    {
        $planId = $request->input('plan');
        $billing = $request->input('billing', 'next_cycle');
        $user = $request->user();

        if (!isset($this->plans[$planId])) {
            return back()->with('error', 'Invalid plan selected.');
        }

        $plan = $this->plans[$planId];

        // Handle free plan
        if ($planId === 'free') {
            $subscription = $user->subscriptions()->active()->first();
            if ($subscription) {
                try {
                    $subscription->cancel();
                    return back()->with('success', 'Subscription canceled. You\'ll have access until the end of your billing period.');
                } catch (PaddleException $e) {
                    return back()->with('error', 'Unable to cancel subscription.');
                }
            }
            return back()->with('success', 'You\'re already on the free plan.');
        }

        // Handle paid plans
        $subscription = $user->subscription('default');
        
        if (!$subscription || !$subscription->valid()) {
            // Create new subscription
            try {
                $checkout = $user->subscribe($plan['paddle_id'], 'default')
                    ->returnTo(route('billing.index'));
                return Inertia::location($checkout->url());
            } catch (PaddleException $e) {
                return back()->with('error', 'Unable to create subscription.');
            }
        }

        // Swap existing subscription
        try {
            switch ($billing) {
                case 'immediate':
                    $subscription->swapAndInvoice($plan['paddle_id']);
                    $message = "Successfully switched to {$plan['name']} plan! You've been charged immediately.";
                    break;
                case 'no_prorate':
                    $subscription->noProrate()->swap($plan['paddle_id']);
                    $message = "Successfully switched to {$plan['name']} plan! Changes take effect next billing cycle.";
                    break;
                default:
                    $subscription->swap($plan['paddle_id']);
                    $message = "Successfully switched to {$plan['name']} plan! Changes take effect next billing cycle.";
                    break;
            }
            
            return back()->with('success', $message);
        } catch (PaddleException $e) {
            return back()->with('error', 'Unable to switch plans.');
        }
    }

    public function updatePaymentMethod(Request $request)
    {
        $user = $request->user();
        $subscription = $user->subscriptions()->valid()->first();
        
        if (!$subscription) {
            return back()->with('error', 'No active subscription found.');
        }

        try {
            return Inertia::location($subscription->redirectToUpdatePaymentMethod());
        } catch (PaddleException $e) {
            return back()->with('error', 'Unable to update payment method.');
        }
    }

    public function cancelSubscription(Request $request)
    {
        $user = $request->user();
        $subscription = $user->subscriptions()->notCanceled()->first();
        
        if (!$subscription) {
            return back()->with('error', 'No active subscription found.');
        }

        try {
            $subscription->cancel();
            return back()->with('success', 'Subscription canceled. You\'ll have access until the end of your billing period.');
        } catch (PaddleException $e) {
            return back()->with('error', 'Unable to cancel subscription.');
        }
    }

    public function downloadInvoice(Request $request, $transactionId)
    {
        $user = $request->user();
        $transaction = $user->transactions()->where('id', $transactionId)->first();
        
        if (!$transaction) {
            return back()->with('error', 'Invoice not found.');
        }

        try {
            return $transaction->redirectToInvoicePdf();
        } catch (PaddleException $e) {
            return back()->with('error', 'Unable to download invoice.');
        }
    }

    public function pauseSubscription(Request $request)
    {
        $user = $request->user();
        $subscription = $user->subscriptions()->notPaused()->first();
        
        if (!$subscription) {
            return back()->with('error', 'No active subscription found.');
        }

        try {
            $subscription->pause();
            return back()->with('success', 'Subscription paused successfully.');
        } catch (PaddleException $e) {
            return back()->with('error', 'Unable to pause subscription.');
        }
    }

    public function resumeSubscription(Request $request)
    {
        $user = $request->user();
        $pausedSubscription = $user->subscriptions()->paused()->first();
        
        if (!$pausedSubscription) {
            $canceledSubscription = $user->subscriptions()->onGracePeriod()->first();
            
            if ($canceledSubscription) {
                try {
                    $canceledSubscription->resume();
                    return back()->with('success', 'Subscription resumed successfully.');
                } catch (PaddleException $e) {
                    return back()->with('error', 'Unable to resume subscription.');
                }
            }
            
            return back()->with('error', 'No paused or canceled subscription found to resume.');
        }

        try {
            $pausedSubscription->resume();
            return back()->with('success', 'Subscription resumed successfully.');
        } catch (PaddleException $e) {
            return back()->with('error', 'Unable to resume subscription.');
        }
    }

    public function swapPlan(Request $request)
    {
        $plan = $request->input('plan');
        $billing = $request->input('billing', 'next_cycle');
        $user = $request->user();

        if (!isset($this->plans[$plan])) {
            return back()->with('error', 'Invalid plan selected.');
        }

        $subscription = $user->subscription('default');
        
        if (!$subscription || !$subscription->valid()) {
            return back()->with('error', 'No active subscription found to swap.');
        }

        try {
            switch ($billing) {
                case 'immediate':
                    $subscription->swapAndInvoice($this->plans[$plan]['paddle_id']);
                    $message = "Successfully switched to {$this->plans[$plan]['name']} plan! You've been charged immediately.";
                    break;
                
            case 'no_prorate':
                $subscription->noProrate()->swap($this->plans[$plan]['paddle_id']);
                $message = "Successfully switched to {$this->plans[$plan]['name']} plan! Changes take effect next billing cycle (no proration).";
                break;
                
            case 'no_prorate_immediate':
                $subscription->noProrate()->swapAndInvoice($this->plans[$plan]['paddle_id']);
                $message = "Successfully switched to {$this->plans[$plan]['name']} plan! You've been charged immediately (no proration).";
                break;
                
            case 'no_bill':
                $subscription->doNotBill()->swap($this->plans[$plan]['paddle_id']);
                $message = "Successfully switched to {$this->plans[$plan]['name']} plan! No additional charges.";
                break;
                
            default:
                $subscription->swap($this->plans[$plan]['paddle_id']);
                $message = "Successfully switched to {$this->plans[$plan]['name']} plan! Changes take effect next billing cycle.";
                break;
        }
        
        return back()->with('success', $message);
        
    } catch (PaddleException $e) {
        return back()->with('error', 'Unable to switch plans.');
    }
}
}

