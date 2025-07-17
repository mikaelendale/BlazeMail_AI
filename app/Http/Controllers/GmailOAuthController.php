<?php

namespace App\Http\Controllers;

use App\Models\EmailAccount;
use App\Services\GmailService;
use Illuminate\Http\Request;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

class GmailOAuthController extends Controller
{
    protected GmailService $gmailService;

    public function __construct(GmailService $gmailService)
    {
        $this->gmailService = $gmailService;
    }

    /**
     * Start Gmail OAuth flow - WITH RETURN URL! 🚀
     */
    public function start(Request $request): RedirectResponse
    {
        try {
            Log::info('Gmail OAuth start requested', [
                'user_id' => Auth::id(),
                'ip' => $request->ip(),
                'return_url' => $request->input('return_url'),
                'user_agent' => $request->userAgent(),
            ]);

            // Store return URL in session for after OAuth
            if ($returnUrl = $request->input('return_url')) {
                session(['oauth_return_url' => $returnUrl]);
            }

            // Create placeholder Gmail account
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
                    'oauth_flow_started' => now()->toISOString(),
                    'created_ip' => $request->ip(),
                ],
            ]);

            // Get OAuth URL and redirect
            $oauthUrl = $this->gmailService->getAuthUrl($account);
            Log::info('Redirecting to Gmail OAuth', [
                'account_id' => $account->id,
                'user_id' => Auth::id(),
                'oauth_url_domain' => parse_url($oauthUrl, PHP_URL_HOST),
            ]);
            return redirect($oauthUrl);
        } catch (\Exception $e) {
            Log::error('Gmail OAuth start failed', [
                'user_id' => Auth::id(),
                'error' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
            ]);
            // Get return URL or fallback
            $returnUrl = $request->input('return_url') ?: route('settings.email-accounts');
            return redirect($returnUrl)
                ->with('error', 'Failed to start Gmail OAuth: ' . $e->getMessage());
        }
    }

    /**
     * Handle Gmail OAuth callback - WITH SMART REDIRECT! 💪
     */
    public function callback(Request $request): RedirectResponse
    {
        // Get return URL from session or default
        $returnUrl = session('oauth_return_url') ?: route('settings.email-accounts');
        session()->forget('oauth_return_url'); // Clean up session immediately

        try {
            $code = $request->input('code');
            $state = $request->input('state');
            $error = $request->input('error');

            Log::info('Gmail OAuth callback received', [
                'has_code' => !empty($code),
                'has_state' => !empty($state),
                'has_error' => !empty($error),
                'user_id' => Auth::id(),
                'full_url' => $request->fullUrl(),
                'all_params' => $request->all(),
            ]);

            if ($error) {
                throw new \Exception("OAuth error from Google: {$error}");
            }

            if (!$code) {
                throw new \Exception('No authorization code received from Google');
            }

            // Process the OAuth callback and get the real Gmail data
            $result = $this->gmailService->handleCallback($code, $state);

            if (!$result['success']) {
                throw new \Exception($result['error'] ?? 'OAuth processing failed');
            }

            Log::info('Gmail OAuth successful - Account updated!', [
                'account_id' => $result['account_id'] ?? null,
                'user_id' => Auth::id(),
                'email' => $result['email'] ?? null,
            ]);

            return redirect($returnUrl) // Always redirect to the stored returnUrl
                ->with('success', 'Gmail account connected successfully! Email: ' . $result['email']);
        } catch (\Exception $e) {
            Log::error('Gmail OAuth callback failed', [
                'error' => $e->getMessage(),
                'user_id' => Auth::id(),
                'request_data' => $request->all(),
                'trace' => $e->getTraceAsString(),
            ]);

            return redirect($returnUrl) // Always redirect to the stored returnUrl
                ->with('error', '❌ Gmail OAuth failed: ' . $e->getMessage());
        }
    }
}
