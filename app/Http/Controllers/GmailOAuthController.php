<?php

namespace App\Http\Controllers;

use App\Models\EmailAccount;
use App\Services\GmailService;
use Illuminate\Http\Request;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Session;

class GmailOAuthController extends Controller
{
    protected GmailService $gmailService;

    public function __construct(GmailService $gmailService)
    {
        $this->gmailService = $gmailService;
    }

    /**
     * Start Gmail OAuth flow - handles both initial connection and re-authentication.
     *
     * @param Request $request
     * @return RedirectResponse
     */
    public function start(Request $request): RedirectResponse
    {
        $accountId = $request->query('account_id');
        $returnUrl = $request->query('return_url', route('settings.email-accounts'));
        $reauth = $request->query('reauth', 'false') === 'true';

        $account = null;
        if ($reauth && $accountId) {
            // If it's a reauth flow, try to find the existing account
            $account = Auth::user()->emailAccounts()->find($accountId);
            if (!$account) {
                Log::warning('Attempted reauth start for non-existent or unauthorized account', [
                    'account_id' => $accountId,
                    'user_id' => Auth::id(),
                ]);
                return redirect()->route('settings.email-accounts')->with('error', 'Account not found or unauthorized for re-authentication.');
            }
            // Update account status to indicate reauth in progress
            $account->update([
                'status' => 'pending',
                'metadata' => array_merge($account->metadata ?? [], [
                    'reauth_started' => now()->toISOString(),
                    'reauth_reason' => 'manual_reauth_flow', // Or derive from account status
                ]),
            ]);
            Log::info('Starting re-authentication flow for existing account', [
                'account_id' => $account->id,
                'email' => $account->email,
                'user_id' => Auth::id(),
            ]);
        } else {
            // This is an initial connection, create a placeholder account
            try {
                $account = Auth::user()->emailAccounts()->create([
                    'email' => 'pending-oauth-' . time() . '@gmail.com', // Placeholder email
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
                        'oauth_flow_started' => now()->toISOString(),
                        'created_ip' => $request->ip(),
                    ],
                ]);
                Log::info('Created placeholder account for new Gmail OAuth connection', ['account_id' => $account->id, 'user_id' => Auth::id()]);
            } catch (\Exception $e) {
                Log::error('Failed to create placeholder account for new OAuth flow', [
                    'user_id' => Auth::id(),
                    'error' => $e->getMessage(),
                ]);
                return redirect($returnUrl)->with('error', 'Failed to initiate Gmail connection: ' . $e->getMessage());
            }
        }

        // Generate the OAuth URL using the GmailService
        $oauthUrl = $this->gmailService->getAuthUrl($account, $returnUrl, $reauth);

        Log::info('Redirecting to Gmail OAuth for user', [
            'user_id' => Auth::id(),
            'account_id' => $account->id,
            'reauth_flow' => $reauth,
            'oauth_url_domain' => parse_url($oauthUrl, PHP_URL_HOST),
        ]);

        return redirect($oauthUrl);
    }

    /**
     * Handle the Gmail OAuth callback.
     *
     * @param Request $request
     * @return RedirectResponse
     */
    public function callback(Request $request): RedirectResponse
    {
        $stateJson = $request->query('state');
        $state = json_decode($stateJson, true);
        $returnUrl = $state['return_url'] ?? route('settings.email-accounts');

        Log::info('Gmail OAuth callback received', [
            'has_code' => $request->has('code'),
            'has_state' => $request->has('state'),
            'has_error' => $request->has('error'),
            'user_id' => Auth::id(),
            'full_url' => $request->fullUrl(),
            'state_data' => $state, // Log decoded state for debugging
        ]);

        if ($request->has('error')) {
            $errorMessage = $request->query('error_description') ?? $request->query('error');
            Log::error('Gmail OAuth error callback', [
                'error' => $errorMessage,
                'state' => $state,
            ]);
            return redirect($returnUrl)
                ->with('error', 'Gmail authorization failed: ' . $errorMessage);
        }

        $code = $request->query('code');
        if (!$code) {
            Log::error('Gmail OAuth callback missing code', ['state' => $state]);
            return redirect($returnUrl)
                ->with('error', 'Gmail authorization failed: Missing authorization code.');
        }

        try {
            // Use GmailService to handle the callback logic (token exchange, account update/create)
            $result = $this->gmailService->handleCallback($code, $stateJson);

            if (!$result['success']) {
                throw new \Exception($result['error'] ?? 'OAuth processing failed');
            }

            Log::info('Gmail OAuth successful - Account updated/created!', [
                'account_id' => $result['account_id'] ?? null,
                'user_id' => Auth::id(),
                'email' => $result['email'] ?? null,
            ]);

            return redirect($returnUrl)
                ->with('success', 'Gmail account connected successfully! Email: ' . $result['email']);
        } catch (\Exception $e) {
            Log::error('Failed to process Gmail OAuth callback', [
                'error' => $e->getMessage(),
                'state' => $state,
                'trace' => $e->getTraceAsString(),
            ]);
            return redirect($returnUrl)
                ->with('error', 'Failed to connect Gmail account: ' . $e->getMessage());
        }
    }
}
