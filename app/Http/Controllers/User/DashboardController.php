<?php

namespace App\Http\Controllers\User;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;

class DashboardController extends Controller
{

    public function index()
    {
        $user = auth()->user();

        // Usage stats (replace with real queries)
        $emailsThisMonth = \App\Models\UserSavedEmails::where('user_id', $user->id)
            ->whereMonth('created_at', now()->month)
            ->count();
        $monthlyLimit = 150; // You can fetch this from user's plan
        $emailsToday = \App\Models\UserSavedEmails::where('user_id', $user->id)
            ->whereDate('created_at', now())
            ->count();
        $dailyLimit = 25; // You can fetch this from user's plan
        $totalEmails = \App\Models\UserSavedEmails::where('user_id', $user->id)->count();

        // Recent emails
        $recentEmails = \App\Models\UserSavedEmails::where('user_id', $user->id)
            ->orderByDesc('created_at')
            ->take(3)
            ->get(['id', 'subject', 'email_content', 'created_at', 'tone', 'audience', 'created_at', 'purpose']);

        return Inertia::render('user/dashboard', [
            'user' => [
                'name' => $user->name,
                'email' => $user->email,
                'company' => $user->company ?? '',
                'plan' => $user->plan_name ?? 'Free Plan',
            ],
            'usageStats' => [
                'emailsThisMonth' => $emailsThisMonth,
                'monthlyLimit' => $monthlyLimit,
                'emailsToday' => $emailsToday,
                'dailyLimit' => $dailyLimit,
                'totalEmails' => $totalEmails,
            ],
            'recentEmails' => $recentEmails,
        ]);
    }
}
