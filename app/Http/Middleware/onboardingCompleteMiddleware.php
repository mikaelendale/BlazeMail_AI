<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class onboardingCompleteMiddleware
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
            // Check if the onboarding is complete
            if ($request->user()->onboarding_status) {
                return redirect()->route('dashboard');
            }
        }
        return $next($request);
    }
}
