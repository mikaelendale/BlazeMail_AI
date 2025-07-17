<?php

namespace App\Http\Middleware;

use App\Services\CreditService;
use Closure;
use Illuminate\Http\Request;

class CheckCredits
{
    public function __construct(
        private CreditService $creditService
    ) {}

    public function handle(Request $request, Closure $next, string $action = null, int $customAmount = null)
    {
        $user = $request->user();

        if (!$user) {
            return $next($request);
        }

        // If specific action is provided, check for that action
        if ($action) {
            $canPerform = $this->creditService->canPerformAction($user, $action);

            if (!$canPerform['can_perform']) {
                if ($request->expectsJson()) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Insufficient credits for this action',
                        'error_type' => 'insufficient_credits',
                        'required' => $canPerform['cost'],
                        'available' => $canPerform['current_balance'],
                        'shortfall' => $canPerform['shortfall'],
                    ], 402); // 402 Payment Required
                }

                return redirect()->route('credits.index')
                    ->with('error', "You need {$canPerform['cost']} credits to perform this action, but you only have {$canPerform['current_balance']}.");
            }
        } else {
            // General credit check - just ensure user has some credits
            if (!$this->creditService->hasCredits($user)) {
                if ($request->expectsJson()) {
                    return response()->json([
                        'success' => false,
                        'message' => 'No credits available',
                        'error_type' => 'no_credits',
                        'available' => $user->credit_balance,
                    ], 402);
                }

                return redirect()->route('credits.index')
                    ->with('error', 'You have no credits available. Please purchase more credits to continue.');
            }
        }

        return $next($request);
    }
}
