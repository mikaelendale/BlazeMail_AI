<?php

namespace App\Http\Controllers;

use App\Models\EmailAccount;
use App\Services\GmailService;
use App\Services\ImapService;
use App\Jobs\TestEmailConnectionJob;
use App\Jobs\WarmupEmailAccountJob;
use Illuminate\Http\Request;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class EmailAccountController extends Controller
{
    protected GmailService $gmailService;
    // protected ImapService $imapService;

    public function __construct(GmailService $gmailService, ImapService $imapService)
    {
        $this->gmailService = $gmailService;
        // $this->imapService = $imapService;
        // Apply rate limiting to all methods
        $this->middleware('throttle:60,1');
    }

    /**
     * Display email accounts - ENHANCED WITH REAUTH DETECTION 🚀
     */
    public function index(): Response
    {
        try {
            // Get user's email accounts with optimized query - ENHANCED!
            $accounts = Auth::user()
                ->emailAccounts()
                ->select([
                    'id',
                    'email',
                    'provider',
                    'status',
                    'is_connected',
                    'is_verified',
                    'daily_limit',
                    'daily_sent',
                    'hourly_limit',
                    'hourly_sent',
                    'warmup_progress',
                    'reputation',
                    'last_activity',
                    'last_sync',           // 🔥 FIXED: Added missing field
                    'last_health_check',   // 🔥 FIXED: Added missing field
                    'token_expires_at',    // 🔥 FIXED: Added missing field
                    'last_error',          // 🔥 FIXED: Added missing field
                    'consecutive_errors',  // 🔥 FIXED: Added missing field
                    'created_at',
                    'bounce_rate',
                    'complaint_rate',
                    'success_rate',
                    'settings',
                    'metadata'
                ])
                ->orderBy('created_at', 'desc')
                ->get()
                ->map(function ($account) {
                    // ENHANCED setup check
                    $settings = $account->settings ?? [];
                    $isSetupComplete = !empty($settings['setup_completed_at']);
                    $needsSetup = $account->is_connected && !$isSetupComplete;

                    // 🔥 NEW: Check if account needs reauth
                    $needsReauth = $this->checkNeedsReauth($account);

                    return [
                        'id' => $account->id,
                        'email' => $account->email,
                        'provider' => $account->provider,
                        'status' => $account->status,
                        'isConnected' => $account->is_connected,
                        'isVerified' => $account->is_verified,
                        'dailyLimit' => $account->daily_limit,
                        'dailySent' => $account->daily_sent,
                        'hourlyLimit' => $account->hourly_limit,
                        'hourlySent' => $account->hourly_sent,
                        'warmupProgress' => $account->warmup_progress,
                        'reputation' => $account->reputation,

                        // 🔥 FIXED: Properly format dates
                        'lastActivity' => $account->last_activity?->toISOString(),
                        'lastSync' => $account->last_sync?->toISOString(),
                        'lastHealthCheck' => $account->last_health_check?->toISOString(),
                        'tokenExpiresAt' => $account->token_expires_at?->toISOString(),
                        'lastError' => $account->last_error,
                        'consecutiveErrors' => $account->consecutive_errors ?? 0,

                        'createdAt' => $account->created_at->toISOString(),
                        'healthScore' => $this->calculateHealthScore($account),
                        'canSend' => $this->canAccountSend($account),
                        'nextWarmupEmail' => $account->needsWarmup() ?
                            $account->getWarmupEmailsAllowed() - $account->warmup_emails_today : null,

                        // Setup status fields
                        'isSetupComplete' => $isSetupComplete,
                        'needsSetup' => $needsSetup,
                        'setupCompletedAt' => $settings['setup_completed_at'] ?? null,

                        // 🔥 NEW: Reauth status
                        'needsReauth' => $needsReauth,
                        'canReauth' => $account->provider === 'gmail',

                        // Mock message counts (you can replace with real data)
                        'messageCount' => rand(50, 500),
                        'unreadCount' => rand(0, 25),
                    ];
                });

            // Get providers with real-time status
            $providers = [
                'gmail' => [
                    'name' => 'Gmail',
                    'enabled' => true,
                    'oauth' => true,
                ],
                'outlook' => [
                    'name' => 'Outlook',
                    'enabled' => false,
                    'oauth' => true,
                    'coming_soon' => true,
                ],
                'yahoo' => [
                    'name' => 'Yahoo',
                    'enabled' => false,
                    'coming_soon' => true,
                ],
                'imap' => [
                    'name' => 'Custom IMAP',
                    'enabled' => false,
                    'coming_soon' => true,
                ],
            ];

            // ENHANCED user statistics
            $stats = [
                'total_accounts' => $accounts->count(),
                'active_accounts' => $accounts->where('status', 'active')->count(),
                'warming_accounts' => $accounts->where('status', 'warming')->count(),
                'error_accounts' => $accounts->where('status', 'error')->count(),
                'needs_setup' => $accounts->where('needsSetup', true)->count(),
                'needs_reauth' => $accounts->where('needsReauth', true)->count(), // 🔥 NEW
            ];

            return Inertia::render('settings/connected-accounts', [
                'accounts' => $accounts,
                'providers' => $providers,
                'stats' => $stats,
                'breadcrumbs' => [
                    ['title' => 'Settings', 'href' => '/settings'],
                    ['title' => 'Email Accounts', 'href' => '/settings/email-accounts'],
                ],
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to load email accounts page', [
                'user_id' => Auth::id(),
                'error' => $e->getMessage(),
            ]);

            return Inertia::render('settings/connected-accounts', [
                'accounts' => [],
                'providers' => [],
                'stats' => ['error' => 'Failed to load accounts'],
                'breadcrumbs' => [],
            ])->with('error', 'Failed to load email accounts. Please try again.');
        }
    }

    /**
     * 🔥 NEW: Check if account needs re-authentication
     */
    private function checkNeedsReauth(EmailAccount $account): bool
    {
        // Check explicit status
        if (in_array($account->status, ['needs_reauth', 'suspended', 'error'])) {
            return true;
        }

        // Check token expiration (Gmail)
        if ($account->provider === 'gmail' && $account->token_expires_at) {
            if ($account->token_expires_at->isPast() || $account->token_expires_at->diffInHours(now()) <= 24) {
                return true;
            }
        }

        // Check for auth-related errors
        if ($account->last_error && (
            str_contains($account->last_error, 'invalid_grant') ||
            str_contains($account->last_error, 'unauthorized') ||
            str_contains($account->last_error, 'token') ||
            str_contains($account->last_error, 'authorization')
        )) {
            return true;
        }

        // Check consecutive errors
        if (($account->consecutive_errors ?? 0) >= 3) {
            return true;
        }

        // Check if not connected but should be
        if (!$account->is_connected && $account->status !== 'paused') {
            return true;
        }

        return false;
    }

    /**
     * Show email account details - ENHANCED WITH REAUTH DATA 📊
     */
    public function show(EmailAccount $emailAccount): Response
    {
        if ($emailAccount->user_id !== Auth::id()) {
            abort(404, "Email account doesn't exist");
        }

        try {
            // ENHANCED setup check
            $settings = $emailAccount->settings ?? [];
            $isSetupComplete = !empty($settings['setup_completed_at']);
            $needsReauth = $this->checkNeedsReauth($emailAccount);

            $accountDetails = [
                'id' => $emailAccount->id,
                'email' => $emailAccount->email,
                'provider' => $emailAccount->provider,
                'status' => $emailAccount->status,
                'isConnected' => $emailAccount->is_connected,
                'isVerified' => $emailAccount->is_verified,
                'isSetupComplete' => $isSetupComplete,
                'needsSetup' => $emailAccount->is_connected && !$isSetupComplete,
                'setupCompletedAt' => $settings['setup_completed_at'] ?? null,

                // 🔥 NEW: Reauth fields
                'needsReauth' => $needsReauth,
                'canReauth' => $emailAccount->provider === 'gmail',

                'dailyLimit' => $emailAccount->daily_limit,
                'hourlyLimit' => $emailAccount->hourly_limit,
                'dailySent' => $emailAccount->daily_sent,
                'hourlySent' => $emailAccount->hourly_sent,
                'warmupProgress' => $emailAccount->warmup_progress,
                'warmupDay' => $emailAccount->warmup_day,
                'reputation' => $emailAccount->reputation,
                'bounceRate' => $emailAccount->bounce_rate,
                'complaintRate' => $emailAccount->complaint_rate,
                'successRate' => $emailAccount->success_rate,
                'consecutiveErrors' => $emailAccount->consecutive_errors,

                // 🔥 FIXED: Properly format all dates
                'lastActivity' => $emailAccount->last_activity?->toISOString(),
                'lastSync' => $emailAccount->last_sync?->toISOString(),
                'lastHealthCheck' => $emailAccount->last_health_check?->toISOString(),
                'tokenExpiresAt' => $emailAccount->token_expires_at?->toISOString(),
                'lastError' => $emailAccount->last_error,

                // OAuth specific fields
                'oauthProviderId' => $emailAccount->oauth_provider_id,
                'oauthScopes' => $emailAccount->oauth_scopes ?? [],

                'settings' => $emailAccount->settings,
                'metadata' => $emailAccount->metadata,
                'createdAt' => $emailAccount->created_at->toISOString(),
                'updatedAt' => $emailAccount->updated_at->toISOString(),
            ];

            return Inertia::render('settings/email-account-detail', [
                'account' => $accountDetails,
                'breadcrumbs' => [
                    ['title' => 'Settings', 'href' => '/settings'],
                    ['title' => 'Email Accounts', 'href' => '/settings/email-accounts'],
                    ['title' => $emailAccount->email, 'href' => ''],
                ],
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to load email account details', [
                'user_id' => Auth::id(),
                'account_id' => $emailAccount->id,
                'error' => $e->getMessage(),
            ]);

            return back()->with('error', 'Failed to load account details.');
        }
    }

    // Keep all your existing methods (store, toggle, destroy, update, etc.)
    // ... [rest of your existing methods remain unchanged]

    /**
     * Store new email account with SMART validation 🧠
     */
    public function store(Request $request): RedirectResponse
    {
        // Rate limiting per user
        $key = 'email-account-creation:' . Auth::id();
        if (RateLimiter::tooManyAttempts($key, 5)) {
            return back()->with('error', 'Too many account creation attempts. Please wait before trying again.');
        }

        try {
            // SMART validation based on provider
            $provider = $request->input('provider');
            if ($provider === 'gmail') {
                // For Gmail OAuth - NO EMAIL REQUIRED!
                $validator = Validator::make($request->all(), [
                    'provider' => ['required', 'in:gmail'],
                ]);
            } else {
                return back()->with('error', 'Other accounts are currently not supported. Please use Gmail OAuth instead.');
            }

            if ($validator->fails()) {
                return back()
                    ->withErrors($validator)
                    ->withInput()
                    ->with('error', 'Please fix the validation errors and try again.');
            }

            if ($provider === 'gmail') {
                // Create placeholder Gmail account for OAuth flow
                $account = Auth::user()->emailAccounts()->create([
                    'email' => 'pending-oauth-' . time() . '@gmail.com',
                    'provider' => 'gmail',
                    'status' => 'pending',
                    'is_connected' => false,
                    'is_verified' => false,
                    'daily_limit' => 100,
                    'hourly_limit' => 20,
                    'warmup_progress' => 0,
                    'warmup_day' => 1,
                    'reputation' => 'unknown',
                    'metadata' => [
                        'created_ip' => $request->ip(),
                        'oauth_flow_started' => now()->toISOString(),
                    ],
                ]);

                RateLimiter::hit($key, 300);
                return redirect()->route('oauth.gmail.start', ['return_url' => route('settings.email-accounts')]);
            }
        } catch (\Exception $e) {
            Log::error('Failed to create email account', [
                'user_id' => Auth::id(),
                'error' => $e->getMessage(),
            ]);
            RateLimiter::hit($key, 60);
            return back()->with('error', 'Failed to add email account. Please try again.');
        }
    }

    /**
     * Toggle email account status - SIMPLE VERSION
     */
    public function toggle(Request $request, EmailAccount $emailAccount): RedirectResponse
    {
        if ($emailAccount->user_id !== Auth::id()) {
            abort(403, 'Unauthorized access to email account.');
        }

        try {
            // SIMPLE setup check
            $settings = $emailAccount->settings ?? [];
            $isSetupComplete = !empty($settings['setup_completed_at']);

            if (!$emailAccount->is_connected && !$isSetupComplete) {
                return back()->with('error', 'Please complete the account setup before enabling this account.');
            }

            $newStatus = $emailAccount->is_connected ? 'paused' : 'active';

            if (!$emailAccount->is_connected && $emailAccount->status === 'error') {
                return back()->with('error', 'Cannot enable account with connection errors. Please check settings.');
            }

            $emailAccount->update([
                'is_connected' => !$emailAccount->is_connected,
                'status' => $newStatus,
                'last_activity' => now(),
            ]);

            if ($emailAccount->is_connected && $emailAccount->needsWarmup()) {
                WarmupEmailAccountJob::dispatch($emailAccount)->delay(now()->addMinutes(5));
            }

            $action = $emailAccount->is_connected ? 'enabled' : 'disabled';
            return back()->with('success', "Email account {$action} successfully.");
        } catch (\Exception $e) {
            Log::error('Failed to toggle email account', [
                'user_id' => Auth::id(),
                'account_id' => $emailAccount->id,
                'error' => $e->getMessage(),
            ]);

            return back()->with('error', 'Failed to update account status. Please try again.');
        }
    }

    /**
     * Delete email account 🗑️
     */
    public function destroy(EmailAccount $emailAccount): RedirectResponse
    {
        if ($emailAccount->user_id !== Auth::id()) {
            abort(403, 'Unauthorized access to email account.');
        }

        try {
            // Check if this email account is used in campaigns or other related tables
            $relatedCampaigns = \App\Models\Campaign::where('email_account_id', $emailAccount->id)->count();

            if ($relatedCampaigns > 0) {
                return back()->with('error', 'Cannot delete this email account because it is still linked to one or more campaigns. Please remove or reassign those campaigns first.');
            }

            $email = $emailAccount->email;
            $emailAccount->delete();

            Log::info('Email account deleted', [
                'user_id' => Auth::id(),
                'account_id' => $emailAccount->id,
                'email' => $email,
            ]);

            return back()->with('success', 'Email account deleted successfully.');
        } catch (\Exception $e) {
            Log::error('Failed to delete email account', [
                'user_id' => Auth::id(),
                'account_id' => $emailAccount->id,
                'error' => $e->getMessage(),
            ]);

            return back()->with('error', 'Failed to delete email account. Please try again.');
        }
    }

    /**
     * Update email account settings ✏️
     */
    public function update(Request $request, EmailAccount $emailAccount): RedirectResponse
    {
        if ($emailAccount->user_id !== Auth::id()) {
            abort(403, 'Unauthorized access to email account.');
        }

        try {
            $validator = Validator::make($request->all(), [
                'daily_limit' => ['integer', 'min:1', 'max:10000'],
                'hourly_limit' => ['integer', 'min:1', 'max:1000'],
            ]);

            if ($validator->fails()) {
                return back()->withErrors($validator)->with('error', 'Please fix the validation errors.');
            }

            $validated = $validator->validated();
            $updateData = array_filter($validated, fn($value) => $value !== null);

            if (!empty($updateData)) {
                $emailAccount->update($updateData);
            }

            return back()->with('success', 'Email account updated successfully.');
        } catch (\Exception $e) {
            Log::error('Failed to update email account', [
                'user_id' => Auth::id(),
                'account_id' => $emailAccount->id,
                'error' => $e->getMessage(),
            ]);

            return back()->with('error', 'Failed to update email account. Please try again.');
        }
    }

    /**
     * Test email account connection 🧪
     */
    public function testConnection(EmailAccount $emailAccount): JsonResponse
    {
        if ($emailAccount->user_id !== Auth::id()) {
            return response()->json(['success' => false, 'error' => 'Unauthorized'], 403);
        }

        // Use the GmailService to test connection
        if ($emailAccount->provider === 'gmail') {
            $result = $this->gmailService->testConnection($emailAccount);
            return response()->json($result);
        }

        return response()->json([
            'success' => false,
            'error' => 'Connection testing only supported for Gmail accounts currently.',
        ]);
    }

    /**
     * Calculate account health score - SIMPLE VERSION
     */
    private function calculateHealthScore(EmailAccount $account): int
    {
        $score = 100;
        $score -= ($account->consecutive_errors ?? 0) * 10;
        $score -= $account->bounce_rate;
        $score -= $account->complaint_rate * 2;
        $score = ($score * $account->success_rate) / 100;
        return max(0, min(100, (int) $score));
    }

    /**
     * Check if account can send emails - SIMPLE VERSION
     */
    private function canAccountSend(EmailAccount $account): bool
    {
        $settings = $account->settings ?? [];
        $isSetupComplete = !empty($settings['setup_completed_at']);

        return $account->is_connected
            && $account->status === 'active'
            && $isSetupComplete
            && ($account->consecutive_errors ?? 0) < 3;
    }

    /**
     * Bulk operations - SIMPLE VERSION
     */
    public function bulkAction(Request $request): RedirectResponse
    {
        $validator = Validator::make($request->all(), [
            'action' => ['required', 'in:enable,disable,delete'],
            'account_ids' => ['required', 'array', 'min:1'],
            'account_ids.*' => ['integer', 'exists:email_accounts,id'],
        ]);

        if ($validator->fails()) {
            return back()->withErrors($validator);
        }

        try {
            $accountIds = $request->input('account_ids');
            $action = $request->input('action');
            $accounts = Auth::user()->emailAccounts()->whereIn('id', $accountIds)->get();

            if ($accounts->count() !== count($accountIds)) {
                return back()->with('error', 'Some accounts were not found or you do not have permission.');
            }

            $successCount = 0;
            foreach ($accounts as $account) {
                try {
                    switch ($action) {
                        case 'enable':
                            $settings = $account->settings ?? [];
                            if (!empty($settings['setup_completed_at']) && $account->status !== 'error') {
                                $account->update(['is_connected' => true, 'status' => 'active']);
                                $successCount++;
                            }
                            break;
                        case 'disable':
                            $account->update(['is_connected' => false, 'status' => 'paused']);
                            $successCount++;
                            break;
                        case 'delete':
                            $account->delete();
                            $successCount++;
                            break;
                    }
                } catch (\Exception $e) {
                    Log::error("Bulk action failed for account {$account->id}", [
                        'error' => $e->getMessage(),
                        'action' => $action,
                    ]);
                }
            }

            return back()->with('success', "Bulk {$action} completed. {$successCount} accounts processed.");
        } catch (\Exception $e) {
            Log::error('Bulk action failed', [
                'user_id' => Auth::id(),
                'error' => $e->getMessage(),
            ]);

            return back()->with('error', 'Bulk action failed. Please try again.');
        }
    }
}
