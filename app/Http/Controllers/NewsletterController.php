<?php

namespace App\Http\Controllers;

use App\Models\NewsletterSubscription;
use Illuminate\Http\Request;
use Inertia\Inertia;

class NewsletterController extends Controller
{
    public function subscribe(Request $request)
    {
        $request->validate([
            'email' => 'required|email|max:255',
            'name' => 'nullable|string|max:255',
        ]);

        $subscription = NewsletterSubscription::subscribe(
            $request->email,
            $request->name
        );

        return back()->with('success', 'Please check your email to confirm your subscription.');
    }

    public function verify($token)
    {
        $subscription = NewsletterSubscription::where('verification_token', $token)->first();

        if (!$subscription) {
            abort(404);
        }

        if ($subscription->verify($token)) {
            return Inertia::render('Newsletter/Verified', [
                'message' => 'Your subscription has been confirmed! Welcome to our newsletter.'
            ]);
        }

        return Inertia::render('Newsletter/Error', [
            'message' => 'Invalid verification token.'
        ]);
    }

    public function unsubscribe($token)
    {
        $subscription = NewsletterSubscription::where('verification_token', $token)->first();

        if ($subscription) {
            $subscription->update(['is_active' => false]);
            return Inertia::render('Newsletter/Unsubscribed', [
                'message' => 'You have been successfully unsubscribed from our newsletter.'
            ]);
        }

        return Inertia::render('Newsletter/Error', [
            'message' => 'Invalid unsubscribe token.'
        ]);
    }
}
