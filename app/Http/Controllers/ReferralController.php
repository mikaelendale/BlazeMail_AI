<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class ReferralController extends Controller
{

    public function index()
    {
        // Mock data based on your specific request
        $referralData = [
            'referralCode' => Auth::user()->own_referral_code,
            'referralLink' => config('app.url').'/?ref='.Auth::user()->own_referral_code,
            'stats' => [
                'totalReferrals' => User::where('referred_by', Auth::user()->own_referral_code)->count(),
                'payingReferrals' => User::where('referred_by', Auth::user()->own_referral_code)
                    ->get()
                    ->filter(function ($user) {
                        return $user->subscribed('default');
                    })
                    ->count(),
                'totalCreditsEarned' => 0, // in emails
            ],
            'howItWorks' => "Earn AI email credits by inviting others. You get +100 credits when they sign up. If they become a paying customer, you get +500 more. No limit. Boost your outreach for free.",
            'hasReferrals' => true, // Set to true if stats.totalReferrals is greater than 0
        ];
        // Example of how you might dynamically set hasReferrals
        if ($referralData['stats']['totalReferrals'] === 0) {
            $referralData['hasReferrals'] = false;
        }

        return Inertia::render('settings/referral', [
            'referralData' => $referralData,
            'pageTitle' => 'Referral Program – BlazeMail',
            'pageDescription' => 'Earn AI email credits by inviting others to BlazeMail',
        ]);
    }
}
