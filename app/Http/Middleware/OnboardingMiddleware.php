<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class OnboardingMiddleware
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        // Check if the user is authenticated
        if ($request->user()) {
            // Check if the user has completed onboarding
            if (!$request->user()->onboarding_status) {
                // Redirect to the onboarding page
                return redirect()->route('user.onboarding');
            }
        }
        return $next($request);
    }
}
