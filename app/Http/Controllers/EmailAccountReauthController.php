<?php

namespace App\Http\Controllers;

use App\Models\EmailAccount;
use App\Services\GmailService;
use Illuminate\Http\Request;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Inertia\Response;

class EmailAccountReauthController extends Controller
{
    protected GmailService $gmailService;

    public function __construct(GmailService $gmailService)
    {
        $this->gmailService = $gmailService;
        $this->middleware('throttle:10,1'); // 10 requests per minute
    }

    /**
     * Show accounts that need re-authentication 🔐
     */
    public function index(): Response
    {
        try {
            $user = Auth::user();

            // Get accounts that need reauth
            $accountsNeedingReauth = $user->emailAccounts()
                ->whereIn('status', ['needs_reauth', 'error', 'suspended'])
                ->orWhere(function ($query) {
                    $query->where('provider', 'gmail')
                        ->where('is_connected', false)
                        ->where('last_error', 'like', '%token%');
                })
                ->orWhere(function ($query) {
                    $query->where('provider', 'gmail')
                        ->where('token_expires_at', '<', now()->addDays(1));
                })
                ->select([
                    'id',
                    'email',
                    'provider',
                    'status',
                    'is_connected',
                    'last_error',
                    'last_health_check',
                    'token_expires_at',
                    'consecutive_errors',
                    'created_at',
                    'metadata'
                ])
                ->orderBy('last_health_check', 'desc')
                ->get()
                ->map(function ($account) {
                    return [
                        'id' => $account->id,
                        'email' => $account->email,
                        'provider' => $account->provider,
                        'status' => $account->status,
                        'is_connected' => $account->is_connected,
                        'last_error' => $account->last_error,
                        'last_health_check' => $account->last_health_check?->toISOString(),
                        'token_expires_at' => $account->token_expires_at?->toISOString(),
                        'consecutive_errors' => $account->consecutive_errors ?? 0,
                        'created_at' => $account->created_at->toISOString(),
                        'needs_reauth' => $this->determineReauthReason($account),
                        'health_score' => $this->calculateHealthScore($account),
                        'can_reauth' => $account->provider === 'gmail',
                    ];
                });

            // Get summary stats
            $stats = [
                'total_accounts' => $user->emailAccounts()->count(),
                'needs_reauth' => $accountsNeedingReauth->count(),
                'token_expired' => $accountsNeedingReauth->where('needs_reauth.reason', 'token_expired')->count(),
                'connection_failed' => $accountsNeedingReauth->where('needs_reauth.reason', 'connection_failed')->count(),
            ];

            return Inertia::render('user/email/reauth', [
                'accounts' => $accountsNeedingReauth,
                'stats' => $stats,
                'breadcrumbs' => [
                    ['title' => 'Settings', 'href' => '/settings'],
                    ['title' => 'Email Accounts', 'href' => '/settings/email-accounts'],
                    ['title' => 'Re-authentication', 'href' => ''],
                ],
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to load reauth page', [
                'user_id' => Auth::id(),
                'error' => $e->getMessage(),
            ]);

            return Inertia::render('EmailAccounts/Reauth', [
                'accounts' => [],
                'stats' => ['error' => 'Failed to load accounts'],
                'breadcrumbs' => [],
            ])->with('error', 'Failed to load re-authentication page.');
        }
    }

    /**
     * Start re-authentication for an account 🚀
     */
    public function startReauth(Request $request, EmailAccount $account): RedirectResponse
    {
        // Verify user owns this account
        if ($account->user_id !== Auth::id()) {
            abort(404);
        }

        try {
            Log::info('Starting re-authentication', [
                'account_id' => $account->id,
                'email' => $account->email,
                'current_status' => $account->status,
            ]);

            // Only support Gmail OAuth for now
            if ($account->provider !== 'gmail') {
                return back()->with('error', 'Re-authentication is only supported for Gmail accounts.');
            }

            // Update account status to indicate reauth in progress
            $account->update([
                'status' => 'pending',
                'metadata' => array_merge($account->metadata ?? [], [
                    'reauth_started' => now()->toISOString(),
                    'reauth_reason' => $this->determineReauthReason($account)['reason'] ?? 'manual',
                ]),
            ]);

            // Get return URL
            $returnUrl = $request->input('return_url', route('settings.email-accounts'));

            // Redirect to Gmail OAuth with reauth flag
            return redirect()->route('oauth.gmail.start', [
                'account_id' => $account->id,
                'return_url' => $returnUrl,
                'reauth' => 'true',
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to start re-authentication', [
                'account_id' => $account->id,
                'error' => $e->getMessage(),
            ]);

            return back()->with('error', 'Failed to start re-authentication. Please try again.');
        }
    }

    /**
     * Test connection for an account 🧪
     */
    public function testConnection(Request $request, EmailAccount $account)
    {
        // Verify user owns this account
        if ($account->user_id !== Auth::id()) {
            return response()->json(['success' => false, 'error' => 'Unauthorized'], 403);
        }

        try {
            Log::info('Testing account connection', [
                'account_id' => $account->id,
                'email' => $account->email,
            ]);

            // Test the connection using GmailService
            $result = $this->gmailService->testConnection($account);

            if ($result['success']) {
                return response()->json([
                    'success' => true,
                    'message' => 'Connection test successful!',
                    'data' => [
                        'connection_status' => $result['connection_status'],
                        'messages_total' => $result['messages_total'] ?? null,
                        'threads_total' => $result['threads_total'] ?? null,
                    ],
                ]);
            } else {
                return response()->json([
                    'success' => false,
                    'error' => $result['error'],
                    'needs_reauth' => str_contains($result['error'], 'authorization') ||
                        str_contains($result['error'], 'token'),
                ]);
            }
        } catch (\Exception $e) {
            Log::error('Connection test failed', [
                'account_id' => $account->id,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'error' => 'Connection test failed: ' . $e->getMessage(),
            ]);
        }
    }

    /**
     * Remove account (soft delete) 🗑️
     */
    public function removeAccount(EmailAccount $account): RedirectResponse
    {
        // Verify user owns this account
        if ($account->user_id !== Auth::id()) {
            abort(404);
        }

        try {
            $email = $account->email;

            // Soft delete by updating status
            $account->update([
                'status' => 'deleted',
                'is_connected' => false,
                'deleted_at' => now(),
                'metadata' => array_merge($account->metadata ?? [], [
                    'deleted_reason' => 'user_request',
                    'deleted_at' => now()->toISOString(),
                ]),
            ]);

            Log::info('Account soft deleted', [
                'account_id' => $account->id,
                'email' => $email,
                'user_id' => Auth::id(),
            ]);

            return back()->with('success', "Account {$email} has been removed successfully.");
        } catch (\Exception $e) {
            Log::error('Failed to remove account', [
                'account_id' => $account->id,
                'error' => $e->getMessage(),
            ]);

            return back()->with('error', 'Failed to remove account. Please try again.');
        }
    }

    /**
     * Determine why account needs reauth 🔍
     */
    private function determineReauthReason(EmailAccount $account): array
    {
        // Check token expiration
        if ($account->token_expires_at && $account->token_expires_at->isPast()) {
            return [
                'reason' => 'token_expired',
                'message' => 'OAuth token has expired',
                'severity' => 'high',
                'action' => 'Reconnect your Gmail account to restore access',
            ];
        }

        // Check token expiring soon
        if ($account->token_expires_at && $account->token_expires_at->diffInHours(now()) <= 24) {
            return [
                'reason' => 'token_expiring',
                'message' => 'OAuth token expires soon',
                'severity' => 'medium',
                'action' => 'Reconnect to prevent service interruption',
            ];
        }

        // Check for auth errors
        if ($account->last_error && (
            str_contains($account->last_error, 'invalid_grant') ||
            str_contains($account->last_error, 'unauthorized') ||
            str_contains($account->last_error, 'token')
        )) {
            return [
                'reason' => 'auth_error',
                'message' => 'Authentication error detected',
                'severity' => 'high',
                'action' => 'Re-authorize your Gmail account',
            ];
        }

        // Check connection failures
        if ($account->consecutive_errors >= 3) {
            return [
                'reason' => 'connection_failed',
                'message' => 'Multiple connection failures',
                'severity' => 'high',
                'action' => 'Check account settings and reconnect',
            ];
        }

        // Check status
        if (in_array($account->status, ['needs_reauth', 'suspended', 'error'])) {
            return [
                'reason' => 'status_issue',
                'message' => 'Account status requires attention',
                'severity' => 'medium',
                'action' => 'Reconnect to restore functionality',
            ];
        }

        // Default case
        return [
            'reason' => 'unknown',
            'message' => 'Account may need re-authentication',
            'severity' => 'low',
            'action' => 'Test connection or reconnect if needed',
        ];
    }

    /**
     * Calculate simple health score 📊
     */
    private function calculateHealthScore(EmailAccount $account): int
    {
        $score = 100;

        // Deduct for errors
        $score -= ($account->consecutive_errors ?? 0) * 15;

        // Deduct for status issues
        if (in_array($account->status, ['error', 'suspended'])) {
            $score -= 30;
        } elseif ($account->status === 'needs_reauth') {
            $score -= 20;
        }

        // Deduct for token issues
        if ($account->token_expires_at && $account->token_expires_at->isPast()) {
            $score -= 40;
        }

        // Deduct for connection issues
        if (!$account->is_connected) {
            $score -= 25;
        }

        return max(0, min(100, $score));
    }
}
