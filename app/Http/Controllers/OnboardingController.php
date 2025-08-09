<?php

namespace App\Http\Controllers;

use App\Models\EmailAccount;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Illuminate\Validation\ValidationException;

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
        try {
            // Validate the request data with user-friendly error messages
            $data = $request->validate([
                'emailConnected' => 'required|in:true,false',
                'profileCompleted' => 'required|in:true,false',
                'firstEmailSent' => 'in:true,false|nullable',
                'userGoal' => 'required|string|max:255',
                'customGoal' => 'nullable|string|max:500',
                'userInfo' => 'required|string',
                'emailData' => 'nullable|string',
                'newsletter' => 'required|in:true,false',
                'rating' => 'required|string|max:10',
            ], [
                // Custom error messages for better user experience
                'emailConnected.required' => 'Please indicate if your email is connected.',
                'emailConnected.in' => 'Email connection status must be true or false.',
                'profileCompleted.required' => 'Please indicate if your profile is completed.',
                'profileCompleted.in' => 'Profile completion status must be true or false.',
                'userGoal.required' => 'Please select your goal.',
                'userGoal.string' => 'Your goal must be a valid text.',
                'userGoal.max' => 'Your goal cannot exceed 255 characters.',
                'customGoal.string' => 'Custom goal must be valid text.',
                'customGoal.max' => 'Custom goal cannot exceed 500 characters.',
                'userInfo.required' => 'Please provide your user information.',
                'userInfo.string' => 'User information must be valid text.',
                'emailData.string' => 'Email data must be valid text.',
                'newsletter.required' => 'Please indicate your newsletter preference.',
                'newsletter.in' => 'Newsletter preference must be true or false.',
                'rating.required' => 'Please provide a rating.',
                'rating.string' => 'Rating must be valid text.',
                'rating.max' => 'Rating cannot exceed 10 characters.',
            ]);

            // Get the authenticated user
            $user = Auth::user();

            if (!$user) {
                return redirect()->route('login')->with('error', 'Please log in to complete onboarding.');
            }

            // Validate and decode JSON data
            $userInfo = null;
            $emailData = null;

            if (!empty($data['userInfo'])) {
                $userInfo = json_decode($data['userInfo'], true);
                if (json_last_error() !== JSON_ERROR_NONE) {
                    return back()->with('error', 'Invalid user information format.')->withInput();
                }
            } 

            // Create or update the onboarding record
            $userOnboarding = $user->onboarding()->updateOrCreate(
                ['user_id' => $user->id],
                [
                    'email_connected' => $data['emailConnected'] === 'true',
                    'profile_completed' => $data['profileCompleted'] === 'true',
                    'first_email_sent' => $data['firstEmailSent'] ?? true,
                    'user_goal' => $data['userGoal'],
                    'custom_goal' => $data['customGoal'] ?? null,
                    'user_info' => $userInfo,
                    'email_data' => $emailData,
                    'newsletter' => $data['newsletter'] === 'true',
                    'rating' => $data['rating'],
                ]
            );

            // Update onboarding status on the user
            $user->onboarding_status = true;
            $user->save();

            // Log the onboarding completion
            Log::info('User onboarding completed', [
                'user_id' => $user->id,
                'email_connected' => $data['emailConnected'],
                'profile_completed' => $data['profileCompleted'],
                'first_email_sent' => $data['firstEmailSent'],
                'user_goal' => $data['userGoal'],
                'custom_goal' => $data['customGoal'] ?? null,
                'newsletter' => $data['newsletter'],
                'rating' => $data['rating'],
            ]);

            return redirect()->route('dashboard')->with('success', 'Congratulations! Your onboarding has been completed successfully.');
        } catch (ValidationException $e) {
            // Handle validation errors - Laravel automatically redirects back with errors
            return back()->with('error', 'Please fix the validation errors and try again.');
        } catch (\Exception $e) {
            // Log the error for debugging
            Log::error('Onboarding completion failed', [
                'user_id' => Auth::id(),
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            // Return user-friendly error message
            return back()->with('error', 'Something went wrong while completing your onboarding. Please try again or contact support if the problem persists.')->withInput();
        }
    }
}
