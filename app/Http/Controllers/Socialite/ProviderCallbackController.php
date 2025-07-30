<?php

namespace App\Http\Controllers\Socialite;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Laravel\Socialite\Facades\Socialite;
use Laravel\Socialite\Two\InvalidStateException;
use Illuminate\Http\RedirectResponse;
use Illuminate\Auth\Events\Registered; // Add this import

class ProviderCallbackController extends Controller
{
    private const SUPPORTED_PROVIDERS = ['github', 'google'];
    private const MAX_REFERRAL_ATTEMPTS = 10;

    private function generateUniqueReferralCode(string $name, string $email): string
    {
        $firstName = strtolower(Str::before($name, ' '));
        $emailInitials = strtolower(Str::substr($email, 0, 2));

        $attempts = 0;
        do {
            if ($attempts >= self::MAX_REFERRAL_ATTEMPTS) {
                return Str::lower(Str::random(8));
            }
            $code = $firstName . $emailInitials . random_int(100, 999);
            $attempts++;
        } while (User::where('own_referral_code', $code)->exists());

        return $code;
    }

    private function validateSocialUser($socialUser): ?string
    {
        if (empty($socialUser->email)) {
            return 'Email address is required but not provided by the authentication provider.';
        }

        if (empty($socialUser->name)) {
            return 'Name is required but not provided by the authentication provider.';
        }

        if (empty($socialUser->id)) {
            return 'User ID is required but not provided by the authentication provider.';
        }

        if (!filter_var($socialUser->email, FILTER_VALIDATE_EMAIL)) {
            return 'Invalid email format provided by the authentication provider.';
        }

        return null;
    }

    private function handleExistingUser(User $user, $socialUser, string $provider): User
    {
        // Check if user has a password (registered with email/password)
        if (!empty($user->password)) {
            throw new \Exception("This email is already registered with email and password. Please sign in using your email and password, or reset your password if you've forgotten it.");
        }

        // Check for provider conflicts
        if ($user->provider_name && $user->provider_name !== $provider) {
            throw new \Exception("This email is already registered with {$user->provider_name}. Please use {$user->provider_name} to sign in or use a different email address.");
        }

        // Check for provider ID conflicts
        if ($user->provider_id && $user->provider_id !== $socialUser->id && $user->provider_name === $provider) {
            throw new \Exception("This {$provider} account is already linked to a different user. Please use the correct {$provider} account.");
        }

        // Update user data
        $updateData = [
            'provider_token' => $socialUser->token,
            'provider_refresh_token' => $socialUser->refreshToken,
        ];

        // Link provider if not already linked
        if (!$user->provider_id) {
            $updateData['provider_id'] = $socialUser->id;
            $updateData['provider_name'] = $provider;
        }

        // Update name if changed
        if ($user->name !== $socialUser->name) {
            $updateData['name'] = $socialUser->name;
        }

        $user->update($updateData);
        return $user;
    }

    private function createNewUser($socialUser, string $provider): User
    {
        $ownReferralCode = $this->generateUniqueReferralCode($socialUser->name, $socialUser->email);

        // Handle referral code
        $referralCode = null;
        if (session()->has('referral_code')) {
            try {
                $referralCode = decrypt(session('referral_code'));
                // Validate referral code exists
                if ($referralCode && !User::where('own_referral_code', $referralCode)->exists()) {
                    $referralCode = null;
                }
            } catch (\Exception $e) {
                Log::warning('Invalid referral code in session', ['error' => $e->getMessage()]);
                $referralCode = null;
            }
        }

        $user = User::create([
            'name' => $socialUser->name,
            'email' => $socialUser->email,
            'provider_id' => $socialUser->id,
            'provider_name' => $provider,
            'provider_token' => $socialUser->token,
            'provider_refresh_token' => $socialUser->refreshToken,
            'own_referral_code' => $ownReferralCode,
            'referred_by' => $referralCode,
            'email_verified_at' => now(),
        ]);

        // Assign role if method exists
        if (method_exists($user, 'assignRole')) {
            $user->assignRole('user');
        }

        // Fire the Registered event for new social users
        event(new Registered($user));

        return $user;
    }

    public function __invoke(string $provider): RedirectResponse
    {
        if (!in_array($provider, self::SUPPORTED_PROVIDERS, true)) {
            Log::warning('Unsupported provider callback attempted', ['provider' => $provider]);
            return redirect()->route('login')->with([
                'error' => 'Unsupported authentication provider.'
            ]);
        }

        try {
            $socialUser = Socialite::driver($provider)->user();

            // Validate social user data
            $validationError = $this->validateSocialUser($socialUser);
            if ($validationError) {
                Log::warning('Invalid social user data', [
                    'provider' => $provider,
                    'error' => $validationError
                ]);
                return redirect()->route('login')->with(['error' => $validationError]);
            }

            DB::beginTransaction();

            try {
                // Find existing user
                $existingUser = User::where(function ($query) use ($socialUser, $provider) {
                    $query->where('email', $socialUser->email)
                        ->orWhere(function ($subQuery) use ($socialUser, $provider) {
                            $subQuery->where('provider_id', $socialUser->id)
                                ->where('provider_name', $provider);
                        });
                })->first();

                if ($existingUser) {
                    $user = $this->handleExistingUser($existingUser, $socialUser, $provider);
                    $isNewUser = false;
                } else {
                    $user = $this->createNewUser($socialUser, $provider);
                    $isNewUser = true;
                }

                DB::commit();

                Log::info('Successful social authentication', [
                    'provider' => $provider,
                    'user_id' => $user->id,
                    'email' => $user->email,
                    'is_new_user' => $isNewUser
                ]);

                Auth::login($user, true);
                session()->forget('referral_code');

                $message = $isNewUser
                    ? "Welcome! Successfully registered with " . ucfirst($provider) . "!"
                    : "Successfully signed in with " . ucfirst($provider) . "!";

                return redirect()->intended('/dashboard')->with('success', $message);
            } catch (\Exception $e) {
                DB::rollBack();
                throw $e;
            }
        } catch (InvalidStateException $e) {
            Log::warning('Invalid state exception during social auth', [
                'provider' => $provider,
                'error' => $e->getMessage()
            ]);
            return redirect()->route('login')->with([
                'error' => 'Authentication session expired. Please try again.'
            ]);
        } catch (\Exception $e) {
            Log::error('Social authentication error', [
                'provider' => $provider,
                'error' => $e->getMessage()
            ]);

            $errorMessage = $e->getMessage();
            if (Str::contains($errorMessage, ['already registered with', 'already linked to'])) {
                return redirect()->route('login')->with(['error' => $errorMessage]);
            }

            return redirect()->route('login')->with([
                'error' => 'Authentication failed. Please try again or contact support if the problem persists.'
            ]);
        }
    }
}
