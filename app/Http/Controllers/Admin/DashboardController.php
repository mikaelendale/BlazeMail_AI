<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\UserSavedEmails;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Spatie\Activitylog\Models\Activity;

class DashboardController extends Controller
{
    public function index()
    {
        $total_users = User::role('user')->count();
        $total_emails = UserSavedEmails::count();
        $total_revenue = '$11';
        $subscribed_user = User::role('user')->count();
        // You can add more data to be passed to the view here, such as:
        return Inertia::render('admin/dashboard', [
            'total_users' => $total_users,
            'total_emails' => $total_emails,
            'total_revenue' => $total_revenue,
            'subscribed_user' => $subscribed_user
        ]);
    }
    public function users()
    {
        $users = User::role('user')->get()->map(function ($user) {
            $plan = 'free';
            $subscriptionAmount = '$0';
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
            // Merge subscription data into the user array
            return array_merge($user->toArray(), [
                'user_plan' => $plan,
                'amount' => $subscriptionAmount,
            ]);
        });
        return Inertia::render('admin/user-management', [
            'users' => $users,
        ]);
    }
    public function emailMonitor()
    {
        $emails = UserSavedEmails::with('user')->get();
        return Inertia::render('admin/email-monitor', [
            'emails' => $emails
        ]);
    }
    public function emailMonitorDelete($id)
    {
        $email = UserSavedEmails::findOrFail($id);
        $email->delete();
        return redirect()->route('admin.email-monitor')->with('success', 'Email deleted successfully.');
    }
    public function show($id)
    {
        $user = User::findOrFail($id);

        // Fetch recent activities
        $recent_actions = Activity::where('causer_id', $user->id)
            ->orderBy('created_at', 'desc')
            ->take(10)
            ->get()
            ->map(function ($activity) {
                return [
                    'id' => $activity->id,
                    'description' => $activity->description,
                    'created_at' => $activity->created_at->format('Y-m-d H:i:s'),
                    'subject_type' => $activity->subject_type,
                    'properties' => $activity->properties,
                ];
            });

        return Inertia::render('admin/Users/Show', [
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'phone' => $user->phone,
                'location' => $user->location,
                'bio' => $user->bio,
                'avatar_url' => $user->avatar_url,
                'account_status' => $user->account_status,
                'email_verified_at' => $user->email_verified_at?->format('Y-m-d H:i:s'),
                'created_at' => $user->created_at->format('Y-m-d H:i:s'),
                'last_login_at' => $user->last_login_at?->format('Y-m-d H:i:s'),
                'credit_balance' => $user->credit_balance,
                'referral_credits' => $user->referral_credits,
                'subscription_status' => $user->subscription_status,
                'fraud_score' => $user->fraud_score,
                'onboarding_status' => $user->onboarding_status,
                'last_credit_activity' => $user->last_credit_activity?->format('Y-m-d H:i:s'),
                // Add subscription plan logic here
                'user_plan' => $this->getUserPlan($user),
                'amount' => $this->getSubscriptionAmount($user),
            ],
            'recent_actions' => $recent_actions,
        ]);
    }
    private function getUserPlan($user)
    {
        if ($user->subscribedToPrice(config('services.paddle.growth_monthly_price_id'))) {
            return 'growth-monthly';
        } elseif ($user->subscribedToPrice(config('services.paddle.scale_monthly_price_id'))) {
            return 'scale-monthly';
        } elseif ($user->subscribedToPrice(config('services.paddle.growth_annual_price_id'))) {
            return 'growth-annual';
        } elseif ($user->subscribedToPrice(config('services.paddle.scale_annual_price_id'))) {
            return 'scale-annual';
        }
        return 'free';
    }
    private function getSubscriptionAmount($user)
    {
        if ($user->subscribedToPrice(config('services.paddle.growth_monthly_price_id'))) {
            return config('services.paddle.growth_monthly_amount');
        } elseif ($user->subscribedToPrice(config('services.paddle.scale_monthly_price_id'))) {
            return config('services.paddle.scale_monthly_amount');
        } elseif ($user->subscribedToPrice(config('services.paddle.growth_annual_price_id'))) {
            return config('services.paddle.growth_annual_amount');
        } elseif ($user->subscribedToPrice(config('services.paddle.scale_annual_price_id'))) {
            return config('services.paddle.scale_annual_amount');
        }
        return '$0';
    }   
}
