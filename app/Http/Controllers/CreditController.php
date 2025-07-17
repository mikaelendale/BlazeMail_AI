<?php

namespace App\Http\Controllers;

use App\Models\CreditTransaction;
use App\Services\CreditService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response; // For Inertia Response type hint

class CreditController extends Controller
{
    public function __construct(
        private CreditService $creditService
    ) {}

    /**
     * Display credit dashboard
     */
    public function index(Request $request): Response
    {
        $user = $request->user();

        $stats = $this->creditService->getCreditStats($user);

        $recentTransactions = CreditTransaction::where('user_id', $user->id)
            ->orderBy('created_at', 'desc')
            ->limit(10) // Limit to 10 recent transactions as in your provided code
            ->get()
            ->map(function ($transaction) {
                return [
                    'id' => $transaction->id,
                    'type' => $transaction->type,
                    'amount' => $transaction->amount,
                    'description' => $transaction->description,
                    'created_at' => $transaction->created_at->format('Y-m-d H:i:s'),
                    'metadata' => $transaction->metadata,
                ];
            });

        // NEW: Fetch usage data over time for the graph
        $usageOverTime = $this->creditService->getUsageOverTime($user, 30); // Get last 30 days of usage

        return Inertia::render('Credits/Dashboard', [
            'stats' => $stats,
            'recentTransactions' => $recentTransactions,
            'usageOverTime' => $usageOverTime, // Pass the new data
        ]);
    }
    /**
     * Manual credit adjustment (admin only)
     */
    public function adjust(Request $request)
    {
        $this->authorize('manage-credits');

        $request->validate([
            'user_id' => 'required|exists:users,id',
            'amount' => 'required|integer|not_in:0',
            'reason' => 'required|string|max:255',
        ]);

        $user = \App\Models\User::findOrFail($request->user_id);

        if ($request->amount > 0) {
            $transaction = $this->creditService->addCredits(
                $user,
                $request->amount,
                'manual_adjustment',
                $request->reason,
                ['adjusted_by' => $request->user()->id]
            );
        } else {
            $transaction = $this->creditService->deductCredits(
                $user,
                abs($request->amount),
                'manual_adjustment',
                $request->reason,
                ['adjusted_by' => $request->user()->id]
            );
        }

        return back()->with('success', 'Credits adjusted successfully');
    }

    /**
     * Use credits for AI generation
     */
    public function useForAI(Request $request)
    {
        $request->validate([
            'credits_needed' => 'required|integer|min:1',
            'action' => 'required|string',
        ]);

        try {
            $transaction = $this->creditService->deductCredits(
                $request->user(),
                $request->credits_needed,
                'ai_usage',
                "AI usage: {$request->action}",
                ['action' => $request->action]
            );

            return response()->json([
                'success' => true,
                'transaction_id' => $transaction->id,
                'remaining_balance' => $request->user()->fresh()->credit_balance,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 400);
        }
    }
}
