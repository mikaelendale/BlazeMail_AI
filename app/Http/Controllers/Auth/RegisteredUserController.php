<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Auth\Events\Registered;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Support\Str;


class RegisteredUserController extends Controller
{
    /**
     * Show the registration page.
     */
    public function create(): Response
    {
        return Inertia::render('auth/register');
    }

    /**
     * Handle an incoming registration request.
     *
     * @throws \Illuminate\Validation\ValidationException
     */
    private function generateUniqueReferralCode($name, $email): string
    {
        $firstName = strtolower(Str::before($name, ' '));
        $emailInitials = strtolower(Str::substr($email, 0, 2));

        do {
            $code = $firstName . $emailInitials . random_int(100, 999);
        } while (\App\Models\User::where('own_referral_code', $code)->exists());

        return $code;
    }

    public function store(Request $request): RedirectResponse
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|lowercase|email|max:255|unique:' . User::class,
            'password' => ['required', 'confirmed', Rules\Password::defaults()], 
        ]);

        $ownReferralCode = $this->generateUniqueReferralCode($request->name, $request->email);
        $referralCode = session('referral_code');
 
        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'own_referral_code' => $ownReferralCode,
            'referred_by' => $referralCode ?? null,
        ])->assignRole('user');

        event(new Registered($user));
        Auth::login($user);
        session()->forget('referral_code');
        return redirect()->intended(route('dashboard', absolute: false));
    }
}
