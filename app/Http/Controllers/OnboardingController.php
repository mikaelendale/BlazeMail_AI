<?php

namespace App\Http\Controllers;

use App\Models\EmailAccount;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;

class OnboardingController extends Controller
{
    public function index()
    {
        try {
            // Get user's email accounts with optimized query
            $accounts = Auth::user()
                ->emailAccounts()
                ->select([
                    'id',
                    'email',
                    'provider',
                    'status',
                    'is_connected',
                    'is_verified',
                ])
                ->orderBy('created_at', 'desc')
                ->get()
                ->map(function ($account) {
                    return [
                        'id' => $account->id,
                        'email' => $account->email,
                        'provider' => $account->provider,
                        'status' => $account->status,
                        'isConnected' => $account->is_connected,
                        'isVerified' => $account->is_verified,
                        'createdAt' => $account->created_at,
                        'updatedAt' => $account->updated_at,
                    ];
                });

            // Get providers with real-time status
            $providers = EmailAccount::getAvailableProviders();


            return Inertia::render('onboarding/index', [
                'accounts' => $accounts,
                'providers' => $providers,
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to load email accounts page', [
                'user_id' => Auth::id(),
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return Inertia::render('onboarding/index', [
                'accounts' => [],
                'providers' => EmailAccount::getAvailableProviders(),
            ])->with('error', 'Failed to load email accounts. Please try again.');
        }
    }
    public function store(Request $request)
    {
        // Validate the request data
        $data = $request->validate([
            'emailConnected' => 'required|in:true,false',
            'profileCompleted' => 'required|in:true,false',
            'firstEmailSent' => 'required|in:true,false',
            'userGoal' => 'required|string',
            'customGoal' => 'nullable|string',
            'userInfo' => 'required|string',
            'emailData' => 'required|string',
            'newsletter' => 'required|in:true,false',
            'rating' => 'required|string',
        ]);

        // Get the authenticated user
        $user = Auth::user();

        // Create or update the onboarding record
        $userOnboarding = $user->onboarding()->updateOrCreate(
            ['user_id' => $user->id],
            [
                'email_connected' => $data['emailConnected'] === 'true',
                'profile_completed' => $data['profileCompleted'] === 'true',
                'first_email_sent' => $data['firstEmailSent'] === 'true',
                'user_goal' => $data['userGoal'],
                'custom_goal' => $data['customGoal'],
                'user_info' => json_decode($data['userInfo'], true),
                'email_data' => json_decode($data['emailData'], true),
                'newsletter' => $data['newsletter'] === 'true',
                'rating' => $data['rating'],
            ]
        );

        // Optionally update onboarding_status on the user
        $user->onboarding_status = true; // Assuming true means onboarding is complete';
        $user->save();

        // Log the onboarding completion
        Log::info('User onboarding completed', [
            'user_id' => $user->id,
            'email_connected' => $data['emailConnected'],
            'profile_completed' => $data['profileCompleted'],
            'first_email_sent' => $data['firstEmailSent'],
            'user_goal' => $data['userGoal'],
            'custom_goal' => $data['customGoal'],
            'newsletter' => $data['newsletter'],
            'rating' => $data['rating'],
        ]);

        return redirect()->route('dashboard')->with('success', 'Onboarding completed successfully.');
    }
}
