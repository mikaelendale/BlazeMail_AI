<?php

namespace App\Http\Controllers\Socialite;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Laravel\Socialite\Facades\Socialite;
use Illuminate\Support\Facades\Log;

class ProviderRedirectController extends Controller
{
    private const SUPPORTED_PROVIDERS = ['github', 'google'];

    /**
     * Handle the incoming request.
     */
    public function __invoke(string $provider): RedirectResponse
    {
        if (!in_array($provider, self::SUPPORTED_PROVIDERS, true)) {
            return redirect()->route('login')->withErrors(['provider' => 'Unsupported authentication provider.']);
        }

        try {
            return Socialite::driver($provider)->redirect();
        } catch (\Exception $e) {
            Log::error('Socialite redirect error', ['provider' => $provider, 'error' => $e->getMessage()]);
            return redirect()->route('login')->withErrors(['provider' => 'Authentication failed. Please try again.']);
        }
    }
}