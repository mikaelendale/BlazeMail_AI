<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class TrialStatusMiddleware
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $status = 'expired';

        if ($request->user() && $request->user()->created_at->diffInDays(now()) < 7) {
            $status = 'active';
        }

        $request->merge(['trial_status' => $status]);

        return $next($request);
    }
}
