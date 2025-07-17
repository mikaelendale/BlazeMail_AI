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
     * Display email accounts with NUCLEAR performance + SETUP STATUS 🚀
     */
    public function index(): Response
    {
        try {
            // Get user's email accounts with optimized query
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
                    'created_at',
                    'bounce_rate',
                    'complaint_rate',
                    'success_rate',
                    'consecutive_errors',
                    'settings', // NEW: Include settings for setup status
                    'metadata'  // NEW: Include metadata for setup status
                ])
                ->orderBy('created_at', 'desc')
                ->get()
                ->map(function ($account) {
                    // NEW: Check setup status
                    $isSetupComplete = $this->isSetupComplete($account);
                    $needsSetup = $account->is_connected && !$isSetupComplete;

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
                        'lastActivity' => $account->last_activity?->toISOString(),
                        'createdAt' => $account->created_at->toISOString(),
                        'healthScore' => $this->calculateHealthScore($account),
                        'canSend' => $this->canAccountSend($account),
                        'nextWarmupEmail' => $account->needsWarmup() ?
                            $account->getWarmupEmailsAllowed() - $account->warmup_emails_today : null,

                        // NEW: Setup status fields 🔥
                        'isSetupComplete' => $isSetupComplete,
                        'needsSetup' => $needsSetup,
                        'setupCompletedAt' => $account->settings['setup_completed_at'] ?? null,

                        // Mock message counts (you can implement actual inbox counting)
                        'messageCount' => rand(50, 500),
                        'unreadCount' => rand(0, 25),
                    ];
                });

            // NEW: Auto-pause accounts that need setup 🚨
            $this->pauseIncompleteAccounts($accounts);

            // Get providers with real-time status
            $providers = EmailAccount::getAvailableProviders();

            // Get user statistics
            $stats = $this->getUserEmailStats();

            // NEW: Add setup statistics 📊
            $stats['setup_stats'] = $this->getSetupStats($accounts);

            return Inertia::render('Settings/EmailAccounts/Index', [ // Updated path
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
                'trace' => $e->getTraceAsString()
            ]);

            return Inertia::render('Settings/EmailAccounts/Index', [
                'accounts' => [],
                'providers' => EmailAccount::getAvailableProviders(),
                'stats' => ['error' => 'Failed to load accounts'],
                'breadcrumbs' => [],
            ])->with('error', 'Failed to load email accounts. Please try again.');
        }
    }

    /**
     * NEW: Check if account setup is complete 🔍
     */
    private function isSetupComplete(EmailAccount $account): bool
    {
        $settings = $account->settings ?? [];

        $requiredFields = [
            'sender_name',
            'reply_to_email',
            'compliance_confirmed',
            'setup_completed_at',
        ];

        foreach ($requiredFields as $field) {
            if (empty($settings[$field])) {
                return false;
            }
        }

        return true;
    }

    /**
     * NEW: Auto-pause accounts that need setup 🚨
     */
    private function pauseIncompleteAccounts($accounts): void
    {
        foreach ($accounts as $accountData) {
            if ($accountData['needsSetup'] && $accountData['status'] !== 'paused') {
                $account = EmailAccount::find($accountData['id']);
                if ($account) {
                    $account->update([
                        'status' => 'paused',
                        'metadata' => array_merge($account->metadata ?? [], [
                            'paused_reason' => 'setup_incomplete',
                            'paused_at' => now()->toISOString(),
                            'auto_paused_by_system' => true,
                        ]),
                    ]);

                    Log::info('Account auto-paused due to incomplete setup', [
                        'account_id' => $account->id,
                        'email' => $account->email,
                        'user_id' => $account->user_id,
                    ]);
                }
            }
        }
    }

    /**
     * NEW: Get setup statistics 📊
     */
    private function getSetupStats($accounts): array
    {
        $total = count($accounts);
        $completed = collect($accounts)->where('isSetupComplete', true)->count();
        $needsSetup = collect($accounts)->where('needsSetup', true)->count();

        return [
            'total_accounts' => $total,
            'setup_completed' => $completed,
            'needs_setup' => $needsSetup,
            'completion_rate' => $total > 0 ? round(($completed / $total) * 100, 1) : 0,
        ];
    }

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
                // For IMAP - EMAIL REQUIRED
                // $validator = Validator::make($request->all(), [
                //     'email' => [
                //         'required',
                //         'email:rfc,dns',
                //         'max:255',
                //         Rule::unique('email_accounts')->where(function ($query) {
                //             return $query->where('user_id', Auth::id())->whereNull('deleted_at');
                //         }),
                //     ],
                //     'provider' => ['required', 'in:imap'],
                //     'password' => ['required', 'string', 'min:8', 'max:255'],
                //     'imap_host' => ['required', 'string', 'max:255', 'regex:/^[a-zA-Z0-9.-]+$/'],
                //     'imap_port' => ['required', 'integer', 'between:1,65535'],
                //     'smtp_host' => ['required', 'string', 'max:255', 'regex:/^[a-zA-Z0-9.-]+$/'],
                //     'smtp_port' => ['required', 'integer', 'between:1,65535'],
                //     'encryption_type' => ['in:tls,ssl,none'],
                //     'daily_limit' => ['integer', 'min:1', 'max:10000'],
                // ]);
                return back()->with('error', 'Other accounts are currently not supported. Please use Gmail OAuth instead.');
            }

            if ($validator->fails()) {
                return back()
                    ->withErrors($validator)
                    ->withInput()
                    ->with('error', 'Please fix the validation errors and try again.');
            }

            $validated = $validator->validated();

            if ($provider === 'gmail') {
                // Create placeholder Gmail account for OAuth flow
                $account = Auth::user()->emailAccounts()->create([
                    'email' => 'pending-oauth@gmail.com', // Temporary email
                    'provider' => 'gmail',
                    'status' => 'pending',
                    'is_connected' => false,
                    'is_verified' => false,
                    'daily_limit' => 100, // Default for Gmail
                    'hourly_limit' => 20,
                    'warmup_progress' => 0,
                    'warmup_day' => 1,
                    'reputation' => 'unknown',
                    'metadata' => [
                        'created_ip' => $request->ip(),
                        'created_user_agent' => $request->userAgent(),
                        'oauth_flow_started' => now()->toISOString(),
                        'setup_required' => true, // NEW: Mark as requiring setup
                    ],
                ]);

                RateLimiter::hit($key, 300); // 5 minutes cooldown
                return redirect()->route('oauth.gmail.start', ['account_id' => $account->id]); // Updated route name
            }

            RateLimiter::hit($key, 60); // 1 minute cooldown

        } catch (\Exception $e) {
            Log::error('Failed to create email account', [
                'user_id' => Auth::id(),
                'error' => $e->getMessage(),
                'input' => $request->except(['password']),
                'trace' => $e->getTraceAsString()
            ]);

            RateLimiter::hit($key, 60);
            return back()
                ->withInput($request->except(['password']))
                ->with('error', 'Failed to add email account. Please check your settings and try again.');
        }
    }

    /**
     * Toggle email account status (enable/disable) - UPDATED WITH SETUP CHECK 🔄
     */
    public function toggle(Request $request, EmailAccount $emailAccount): RedirectResponse
    {
        // Ensure user owns this account
        if ($emailAccount->user_id !== Auth::id()) {
            abort(403, 'Unauthorized access to email account.');
        }

        try {
            // NEW: Check if setup is required before enabling 🚨
            if (!$emailAccount->is_connected && !$this->isSetupComplete($emailAccount)) {
                return back()->with('error', 'Please complete the account setup before enabling this account.');
            }

            $newStatus = $emailAccount->is_connected ? 'paused' : 'active';

            // Don't allow enabling if account has errors
            if (!$emailAccount->is_connected && $emailAccount->status === 'error') {
                return back()->with('error', 'Cannot enable account with connection errors. Please check settings.');
            }

            $emailAccount->update([
                'is_connected' => !$emailAccount->is_connected,
                'status' => $newStatus,
                'last_activity' => now(),
                // NEW: Clear auto-pause metadata if manually enabled
                'metadata' => array_merge($emailAccount->metadata ?? [], [
                    'manually_toggled_at' => now()->toISOString(),
                    'auto_paused_by_system' => false,
                ]),
            ]);

            // If enabling and needs warmup, start warmup process
            if ($emailAccount->is_connected && $emailAccount->needsWarmup()) {
                WarmupEmailAccountJob::dispatch($emailAccount)->delay(now()->addMinutes(5));
            }

            $action = $emailAccount->is_connected ? 'enabled' : 'disabled';
            Log::info("Email account {$action}", [
                'user_id' => Auth::id(),
                'account_id' => $emailAccount->id,
                'email' => $emailAccount->email,
            ]);

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
        // Ensure user owns this account
        if ($emailAccount->user_id !== Auth::id()) {
            abort(403, 'Unauthorized access to email account.');
        }

        try {
            $email = $emailAccount->email;

            // Soft delete the account
            if (method_exists($emailAccount, 'forceDelete')) {
                $emailAccount->forceDelete();
            } else {
                $emailAccount->delete();
            }

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
     * Show email account details 👁️ - UPDATED WITH SETUP STATUS
     */
    public function show(EmailAccount $emailAccount): Response
    {
        // Ensure user owns this account
        if ($emailAccount->user_id !== Auth::id()) {
            abort(404, "Email account doesn't exist");
        }

        try {
            // NEW: Check setup status
            $isSetupComplete = $this->isSetupComplete($emailAccount);
            $needsSetup = $emailAccount->is_connected && !$isSetupComplete;

            // Get detailed account information
            $accountDetails = [
                'id' => $emailAccount->id,
                'email' => $emailAccount->email,
                'provider' => $emailAccount->provider,
                'status' => $emailAccount->status,
                'isConnected' => $emailAccount->is_connected,
                'isVerified' => $emailAccount->is_verified,

                // NEW: Setup status fields 🔥
                'isSetupComplete' => $isSetupComplete,
                'needsSetup' => $needsSetup,
                'setupCompletedAt' => $emailAccount->settings['setup_completed_at'] ?? null,

                // Limits & Usage
                'dailyLimit' => $emailAccount->daily_limit,
                'hourlyLimit' => $emailAccount->hourly_limit,
                'dailySent' => $emailAccount->daily_sent,
                'hourlySent' => $emailAccount->hourly_sent,
                'dailySentDate' => $emailAccount->daily_sent_date?->toISOString(),
                'hourlySentReset' => $emailAccount->hourly_sent_reset?->toISOString(),

                // Warmup
                'warmupProgress' => $emailAccount->warmup_progress,
                'warmupDay' => $emailAccount->warmup_day,
                'warmupEmailsToday' => $emailAccount->warmup_emails_today,
                'warmupSchedule' => $emailAccount->warmup_schedule,

                // Health Metrics
                'reputation' => $emailAccount->reputation,
                'bounceRate' => $emailAccount->bounce_rate,
                'complaintRate' => $emailAccount->complaint_rate,
                'successRate' => $emailAccount->success_rate,
                'consecutiveErrors' => $emailAccount->consecutive_errors,

                // Connection Details
                'imapHost' => $emailAccount->encrypted_imap_host,
                'imapPort' => $emailAccount->imap_port,
                'smtpHost' => $emailAccount->encrypted_smtp_host,
                'smtpPort' => $emailAccount->smtp_port,
                'encryptionType' => $emailAccount->encryption_type,

                // OAuth Details
                'oauthProviderId' => $emailAccount->oauth_provider_id,
                'tokenExpiresAt' => $emailAccount->token_expires_at?->toISOString(),
                'oauthScopes' => $emailAccount->oauth_scopes,

                // Activity
                'lastActivity' => $emailAccount->last_activity?->toISOString(),
                'lastSync' => $emailAccount->last_sync?->toISOString(),
                'lastHealthCheck' => $emailAccount->last_health_check?->toISOString(),
                'lastError' => $emailAccount->last_error,
                'lastErrorAt' => $emailAccount->last_error_at?->toISOString(),

                // Security
                'connectionHash' => $emailAccount->connection_hash,
                'securityFlags' => $emailAccount->security_flags,
                'lastSecurityCheck' => $emailAccount->last_security_check,

                // Metadata
                'metadata' => $emailAccount->metadata,
                'settings' => $emailAccount->settings,

                // Timestamps
                'createdAt' => $emailAccount->created_at->toISOString(),
                'updatedAt' => $emailAccount->updated_at->toISOString(),
            ];

            // Get recent email activity (mock for now)
            $recentActivity = $this->getAccountActivity($emailAccount);

            // Get health history (mock for now)
            $healthHistory = $this->getHealthHistory($emailAccount);

            return Inertia::render('Settings/EmailAccounts/Detail', [ // Updated path
                'account' => $accountDetails,
                'activity' => $recentActivity,
                'healthHistory' => $healthHistory,
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

            return Inertia::render('Settings/EmailAccounts/Detail', [
                'account' => null,
                'activity' => [],
                'healthHistory' => [],
                'breadcrumbs' => [],
                'error' => 'Failed to load account details.',
            ]);
        }
    }

    /**
     * Update email account settings ✏️
     */
    public function update(Request $request, EmailAccount $emailAccount): RedirectResponse
    {
        // Ensure user owns this account
        if ($emailAccount->user_id !== Auth::id()) {
            abort(403, 'Unauthorized access to email account.');
        }

        try {
            $validator = Validator::make($request->all(), [
                'daily_limit' => ['integer', 'min:1', 'max:10000'],
                'hourly_limit' => ['integer', 'min:1', 'max:1000'],
                'password' => ['nullable', 'string', 'min:8', 'max:255'],
                'imap_host' => ['nullable', 'string', 'max:255', 'regex:/^[a-zA-Z0-9.-]+$/'],
                'imap_port' => ['nullable', 'integer', 'between:1,65535'],
                'smtp_host' => ['nullable', 'string', 'max:255', 'regex:/^[a-zA-Z0-9.-]+$/'],
                'smtp_port' => ['nullable', 'integer', 'between:1,65535'],
                'encryption_type' => ['nullable', 'in:tls,ssl,none'],
            ]);

            if ($validator->fails()) {
                return back()
                    ->withErrors($validator)
                    ->with('error', 'Please fix the validation errors.');
            }

            $validated = $validator->validated();

            // Update only provided fields
            $updateData = array_filter($validated, fn($value) => $value !== null);

            if (!empty($updateData)) {
                $emailAccount->update($updateData);

                // If connection settings changed, test connection
                if (array_intersect_key($updateData, array_flip(['password', 'imap_host', 'imap_port', 'smtp_host', 'smtp_port', 'encryption_type']))) {
                    TestEmailConnectionJob::dispatch($emailAccount)->onQueue('default');
                }
            }

            Log::info('Email account updated', [
                'user_id' => Auth::id(),
                'account_id' => $emailAccount->id,
                'updated_fields' => array_keys($updateData),
            ]);

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
        // Ensure user owns this account
        if ($emailAccount->user_id !== Auth::id()) {
            return response()->json(['success' => false, 'error' => 'Unauthorized'], 403);
        }

        try {
            if ($emailAccount->provider === 'imap') {
                // $result = $this->imapService->testConnection($emailAccount);
                // return response()->json($result);
                return response()->json([
                    'success' => false,
                    'error' => 'Connection testing for IMAP accounts is not implemented yet.',
                ]);
            } else {
                return response()->json([
                    'success' => false,
                    'error' => 'Connection testing only supported for IMAP accounts. Currently we only support Gmail OAuth.',
                ]);
            }
        } catch (\Exception $e) {
            Log::error('Manual connection test failed', [
                'user_id' => Auth::id(),
                'account_id' => $emailAccount->id,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'error' => 'Connection test failed: ' . $e->getMessage(),
            ]);
        }
    }

    /**
     * Get account activity for the last 30 days 📊
     */
    private function getAccountActivity(EmailAccount $emailAccount): array
    {
        // This would typically query an email_logs table
        // For now, return mock data structure
        return [
            'daily_stats' => [],
            'recent_emails' => [],
            'error_logs' => [],
        ];
    }

    /**
     * Calculate account health score 💪
     */
    private function calculateHealthScore(EmailAccount $account): int
    {
        $score = 100;

        // Deduct for errors
        $score -= $account->consecutive_errors * 10;

        // Deduct for poor rates
        $score -= $account->bounce_rate;
        $score -= $account->complaint_rate * 2;

        // Add for good success rate
        $score = ($score * $account->success_rate) / 100;

        return max(0, min(100, (int) $score));
    }

    /**
     * Check if account can send emails - UPDATED WITH SETUP CHECK 🔍
     */
    private function canAccountSend(EmailAccount $account): bool
    {
        return $account->is_connected
            && $account->status === 'active'
            && $this->isSetupComplete($account) // NEW: Must have completed setup
            && !$account->isDailyLimitReached()
            && !$account->isHourlyLimitReached()
            && $account->consecutive_errors < 3;
    }

    /**
     * Get user email statistics 📈 - UPDATED WITH SETUP STATS
     */
    private function getUserEmailStats(): array
    {
        $user = Auth::user();
        $accounts = $user->emailAccounts()->get();

        // Calculate setup statistics
        $setupComplete = $accounts->filter(fn($account) => $this->isSetupComplete($account))->count();
        $needsSetup = $accounts->filter(fn($account) => $account->is_connected && !$this->isSetupComplete($account))->count();

        return [
            'total_accounts' => $user->emailAccounts()->count(),
            'active_accounts' => $user->emailAccounts()->active()->count(),
            'warming_accounts' => $user->emailAccounts()->where('status', 'warming')->count(),
            'error_accounts' => $user->emailAccounts()->where('status', 'error')->count(),
            'total_daily_limit' => $user->emailAccounts()->active()->sum('daily_limit'),
            'total_daily_sent' => $user->emailAccounts()->active()->sum('daily_sent'),
            'average_health_score' => $user->emailAccounts()->active()->get()
                ->avg(fn($account) => $this->calculateHealthScore($account)) ?? 0,

            // NEW: Setup statistics 🔥
            'setup_complete' => $setupComplete,
            'needs_setup' => $needsSetup,
            'setup_completion_rate' => $accounts->count() > 0 ?
                round(($setupComplete / $accounts->count()) * 100, 1) : 0,
        ];
    }

    /**
     * Bulk operations on email accounts 
     */
    public function bulkAction(Request $request): RedirectResponse
    {
        $validator = Validator::make($request->all(), [
            'action' => ['required', 'in:enable,disable,delete,test'],
            'account_ids' => ['required', 'array', 'min:1'],
            'account_ids.*' => ['integer', 'exists:email_accounts,id'],
        ]);

        if ($validator->fails()) {
            return back()->withErrors($validator);
        }

        try {
            $accountIds = $request->input('account_ids');
            $action = $request->input('action');

            // Ensure user owns all accounts
            $accounts = Auth::user()->emailAccounts()->whereIn('id', $accountIds)->get();

            if ($accounts->count() !== count($accountIds)) {
                return back()->with('error', 'Some accounts were not found or you do not have permission.');
            }

            $successCount = 0;
            $setupRequiredCount = 0;

            foreach ($accounts as $account) {
                try {
                    switch ($action) {
                        case 'enable':
                            // NEW: Check setup before enabling 🚨
                            if (!$this->isSetupComplete($account)) {
                                $setupRequiredCount++;
                                continue;
                            }

                            if ($account->status !== 'error') {
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
                        case 'test':
                            TestEmailConnectionJob::dispatch($account)->onQueue('default');
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

            $message = "Bulk {$action} completed. {$successCount} out of " . count($accountIds) . " accounts processed successfully.";

            // NEW: Add setup warning if applicable
            if ($setupRequiredCount > 0) {
                $message .= " {$setupRequiredCount} accounts require setup completion before they can be enabled.";
            }

            return back()->with('success', $message);
        } catch (\Exception $e) {
            Log::error('Bulk action failed', [
                'user_id' => Auth::id(),
                'error' => $e->getMessage(),
                'action' => $request->input('action'),
            ]);

            return back()->with('error', 'Bulk action failed. Please try again.');
        }
    }

    /**
     * Get health history for charts
     */
    private function getHealthHistory(EmailAccount $emailAccount): array
    {
        // Mock data for now - you can implement real tracking later
        return [
            'daily_sent' => [
                ['date' => '2025-07-01', 'sent' => 45],
                ['date' => '2025-07-02', 'sent' => 0],
            ],
            'success_rate' => [
                ['date' => '2025-07-01', 'rate' => 98.5],
                ['date' => '2025-07-02', 'rate' => 100],
            ],
            'bounce_rate' => [
                ['date' => '2025-07-01', 'rate' => 1.2],
                ['date' => '2025-07-02', 'rate' => 0],
            ],
        ];
    }
}
