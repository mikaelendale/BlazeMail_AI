<?php

namespace App\Http\Controllers\Socialite;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Auth;
use Laravel\Socialite\Facades\Socialite;

class ProviderCallbackController extends Controller
{
    private function generateUniqueReferralCode($name, $email): string
    {
        $firstName = strtolower(Str::before($name, ' '));
        $emailInitials = strtolower(Str::substr($email, 0, 2));

        do {
            $code = $firstName . $emailInitials . random_int(100, 999);
        } while (User::where('own_referral_code', $code)->exists());

        return $code;
    }

    public function __invoke(string $provider)
    {
        if (!in_array($provider, ['github', 'google'])) {
            return redirect()->route('login')->withErrors(['provider' => 'Unsupported provider']);
        }

        try {
            session()->save();

            $socialUser = Socialite::driver($provider)->user();

            if (empty($socialUser->email) || empty($socialUser->name)) {
                return redirect()->route('login')->withErrors([
                    'provider' => 'Missing required information from provider.'
                ]);
            }

            // Check if user exists by provider_id or email
            $user = User::where('provider_id', $socialUser->id)
                ->orWhere('email', $socialUser->email)
                ->first();

            if ($user) {
                // Update token info if needed
                $user->update([
                    'provider_token' => $socialUser->token,
                    'provider_refresh_token' => $socialUser->refreshToken,
                ]);
            } else {
                // Generate unique referral code
                $ownReferralCode = $this->generateUniqueReferralCode($socialUser->name, $socialUser->email);

                $referralCode = decrypt(session('referral_code'));
                // Create new user
                $user = User::create([
                    'name' => $socialUser->name,
                    'email' => $socialUser->email,
                    'provider_id' => $socialUser->id,
                    'provider_name' => $provider,
                    'provider_token' => $socialUser->token,
                    'provider_refresh_token' => $socialUser->refreshToken,
                    'own_referral_code' => $ownReferralCode,
                    'referred_by' => $referralCode ?? null,
                ])->assignRole('user');
            }
            

            Auth::login($user);
            session()->forget('referral_code');
            return redirect('/dashboard');
        } catch (\Exception $e) {
            logger()->error('Socialite error: ' . $e->getMessage());
            return redirect()->route('login')->withErrors([
                'provider' => 'Authentication failed. Please try again.'
            ]);
        }
    }
}
