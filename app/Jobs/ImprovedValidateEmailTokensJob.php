<?php

namespace App\Jobs;

use App\Models\EmailAccount;
use App\Services\GmailService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;

class ImprovedValidateEmailTokensJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public $timeout = 300; // 5 minutes
    public $tries = 3;
    public $backoff = [60, 180, 300]; // 1min, 3min, 5min

    protected EmailAccount $emailAccount;

    public function __construct(EmailAccount $emailAccount)
    {
        $this->emailAccount = $emailAccount;
    }

    public function handle(GmailService $gmailService): void
    {
        try {
            Log::info('🔧 Starting improved token validation', [
                'account_id' => $this->emailAccount->id,
                'email' => $this->emailAccount->email,
                'status' => $this->emailAccount->status,
                'consecutive_errors' => $this->emailAccount->consecutive_errors,
                'last_error' => $this->emailAccount->last_error,
                'token_expires_at' => $this->emailAccount->token_expires_at?->toISOString(),
            ]);

            // Skip if account is not OAuth-based
            if ($this->emailAccount->provider !== 'gmail') {
                Log::info('⏭️ Skipping non-OAuth account', [
                    'account_id' => $this->emailAccount->id,
                    'provider' => $this->emailAccount->provider,
                ]);
                return;
            }

            // Always update health check timestamp
            $this->emailAccount->update([
                'last_health_check' => now(),
                'last_healing_attempt' => now(),
                'healing_attempts_today' => ($this->emailAccount->healing_attempts_today ?? 0) + 1,
            ]);

            // Check if we should skip this account temporarily
            if ($this->shouldSkipAccount()) {
                return;
            }

            // Check if account needs complete re-authentication
            if ($this->needsReAuthentication()) {
                $this->handleReAuthenticationNeeded();
                return;
            }

            // Try to refresh token if needed
            $refreshResult = $this->attemptTokenRefresh();
            if (!$refreshResult['success']) {
                $this->handleTokenRefreshFailure($refreshResult['error']);
                return;
            }

            // Test the connection
            $connectionResult = $this->testGmailConnection();
            if ($connectionResult['success']) {
                $this->handleConnectionSuccess($connectionResult);
            } else {
                $this->handleConnectionFailure($connectionResult['error']);
            }
        } catch (\Exception $e) {
            Log::error('❌ Token validation job failed', [
                'account_id' => $this->emailAccount->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            $this->handleConnectionFailure($e->getMessage());
            throw $e;
        }
    }

    private function shouldSkipAccount(): bool
    {
        // Skip if account has too many healing attempts today
        if (($this->emailAccount->healing_attempts_today ?? 0) >= 10) {
            Log::info('⏭️ Skipping account with too many healing attempts today', [
                'account_id' => $this->emailAccount->id,
                'healing_attempts_today' => $this->emailAccount->healing_attempts_today,
            ]);
            return true;
        }

        // Skip if last healing attempt was very recent (less than 5 minutes ago)
        if (
            $this->emailAccount->last_healing_attempt &&
            $this->emailAccount->last_healing_attempt->gt(now()->subMinutes(5))
        ) {
            Log::info('⏭️ Skipping account with very recent healing attempt', [
                'account_id' => $this->emailAccount->id,
                'last_healing_attempt' => $this->emailAccount->last_healing_attempt->toISOString(),
            ]);
            return true;
        }

        return false;
    }

    private function needsReAuthentication(): bool
    {
        $lastError = strtolower($this->emailAccount->last_error ?? '');

        // Check for specific errors that require re-authentication
        $reAuthErrors = [
            'invalid_grant',
            'unauthorized_client',
            'access_denied',
            'invalid_client',
            'token has been expired or revoked',
            'refresh token is invalid',
        ];

        foreach ($reAuthErrors as $errorType) {
            if (str_contains($lastError, $errorType)) {
                Log::info('🔐 Account needs re-authentication', [
                    'account_id' => $this->emailAccount->id,
                    'error_type' => $errorType,
                    'last_error' => $this->emailAccount->last_error,
                ]);
                return true;
            }
        }

        // Check if refresh token is missing
        if (empty($this->emailAccount->encrypted_refresh_token)) {
            Log::info('🔐 Account missing refresh token', [
                'account_id' => $this->emailAccount->id,
            ]);
            return true;
        }

        return false;
    }

    private function handleReAuthenticationNeeded(): void
    {
        Log::warning('🔐 Marking account for re-authentication', [
            'account_id' => $this->emailAccount->id,
            'email' => $this->emailAccount->email,
            'reason' => $this->emailAccount->last_error,
        ]);

        $this->emailAccount->update([
            'status' => 'needs_reauth',
            'is_connected' => false,
            'last_error' => 'Account requires re-authentication: ' . ($this->emailAccount->last_error ?? 'Token invalid'),
            'last_error_at' => now(),
            'metadata' => array_merge($this->emailAccount->metadata ?? [], [
                'reauth_required' => true,
                'reauth_reason' => $this->emailAccount->last_error ?? 'Token invalid',
                'reauth_required_at' => now()->toISOString(),
                'healing_result' => 'needs_reauth',
            ]),
        ]);
    }

    private function attemptTokenRefresh(): array
    {
        try {
            Log::info('🔄 Attempting token refresh', [
                'account_id' => $this->emailAccount->id,
                'has_refresh_token' => !empty($this->emailAccount->encrypted_refresh_token),
                'token_expires_at' => $this->emailAccount->token_expires_at?->toISOString(),
            ]);

            // Check if we have a refresh token
            if (empty($this->emailAccount->encrypted_refresh_token)) {
                return [
                    'success' => false,
                    'error' => 'No refresh token available',
                    'needs_reauth' => true,
                ];
            }

            // Set up Google Client
            $client = new \Google\Client();
            $client->setClientId(config('services.gmail.client_id'));
            $client->setClientSecret(config('services.gmail.client_secret'));
            $client->setAccessType('offline');

            // Attempt to refresh the token
            $newToken = $client->fetchAccessTokenWithRefreshToken(
                $this->emailAccount->encrypted_refresh_token
            );

            if (isset($newToken['error'])) {
                $error = $newToken['error'];
                Log::error('❌ Token refresh failed', [
                    'account_id' => $this->emailAccount->id,
                    'error' => $error,
                    'error_description' => $newToken['error_description'] ?? null,
                ]);

                return [
                    'success' => false,
                    'error' => $error,
                    'needs_reauth' => in_array($error, ['invalid_grant', 'unauthorized_client']),
                ];
            }

            // Update the account with new token
            $updateData = [
                'encrypted_access_token' => $newToken['access_token'],
                'token_expires_at' => isset($newToken['expires_in']) ?
                    now()->addSeconds($newToken['expires_in']) : null,
                'last_sync' => now(),
                'last_token_refresh' => now(),
                'token_refresh_count' => ($this->emailAccount->token_refresh_count ?? 0) + 1,
                'token_refresh_failed_at' => null, // Clear previous failure
            ];

            $this->emailAccount->update($updateData);

            Log::info('✅ Token refreshed successfully', [
                'account_id' => $this->emailAccount->id,
                'new_expires_at' => $this->emailAccount->fresh()->token_expires_at?->toISOString(),
                'refresh_count' => $updateData['token_refresh_count'],
            ]);

            return ['success' => true];
        } catch (\Exception $e) {
            Log::error('❌ Token refresh exception', [
                'account_id' => $this->emailAccount->id,
                'error' => $e->getMessage(),
            ]);

            // Update failure timestamp
            $this->emailAccount->update([
                'token_refresh_failed_at' => now(),
            ]);

            return [
                'success' => false,
                'error' => $e->getMessage(),
                'needs_reauth' => str_contains($e->getMessage(), 'invalid_grant'),
            ];
        }
    }

    private function testGmailConnection(): array
    {
        try {
            Log::info('🧪 Testing Gmail connection', [
                'account_id' => $this->emailAccount->id,
                'has_access_token' => !empty($this->emailAccount->encrypted_access_token),
            ]);

            $client = new \Google\Client();
            $client->setClientId(config('services.gmail.client_id'));
            $client->setClientSecret(config('services.gmail.client_secret'));

            $client->setAccessToken([
                'access_token' => $this->emailAccount->encrypted_access_token,
                'refresh_token' => $this->emailAccount->encrypted_refresh_token,
                'expires_in' => $this->emailAccount->token_expires_at ?
                    max(60, $this->emailAccount->token_expires_at->diffInSeconds(now())) : 3600,
            ]);

            $gmail = new \Google\Service\Gmail($client);

            // Test with a simple API call
            $profile = $gmail->users->getProfile('me');

            if ($profile->getEmailAddress() !== $this->emailAccount->email) {
                throw new \Exception('Email mismatch: expected ' . $this->emailAccount->email . ', got ' . $profile->getEmailAddress());
            }

            Log::info('✅ Gmail connection test successful', [
                'account_id' => $this->emailAccount->id,
                'email' => $profile->getEmailAddress(),
                'messages_total' => $profile->getMessagesTotal(),
            ]);

            return [
                'success' => true,
                'profile' => [
                    'email' => $profile->getEmailAddress(),
                    'messages_total' => $profile->getMessagesTotal(),
                    'threads_total' => $profile->getThreadsTotal(),
                ],
            ];
        } catch (\Google\Service\Exception $e) {
            $error = json_decode($e->getMessage(), true);
            $errorMessage = $error['error']['message'] ?? $e->getMessage();
            $errorCode = $e->getCode();

            Log::error('❌ Gmail API error during connection test', [
                'account_id' => $this->emailAccount->id,
                'error_code' => $errorCode,
                'error_message' => $errorMessage,
            ]);

            return [
                'success' => false,
                'error' => $errorMessage,
                'error_code' => $errorCode,
                'needs_reauth' => in_array($errorCode, [401, 403]) ||
                    str_contains($errorMessage, 'invalid_grant'),
            ];
        } catch (\Exception $e) {
            Log::error('❌ Connection test exception', [
                'account_id' => $this->emailAccount->id,
                'error' => $e->getMessage(),
            ]);

            return [
                'success' => false,
                'error' => $e->getMessage(),
                'needs_reauth' => str_contains($e->getMessage(), 'invalid_grant'),
            ];
        }
    }

    private function handleConnectionSuccess(array $result): void
    {
        Log::info('🎉 Connection validation successful - HEALING ACCOUNT', [
            'account_id' => $this->emailAccount->id,
            'email' => $this->emailAccount->email,
            'previous_status' => $this->emailAccount->status,
            'consecutive_errors' => $this->emailAccount->consecutive_errors,
        ]);

        $updateData = [
            'status' => 'active',
            'is_connected' => true,
            'last_health_check' => now(),
            'last_activity' => now(),
            'last_sync' => now(),
            'consecutive_errors' => 0, // Reset errors on success
            'last_error' => null,
            'last_error_at' => null,
            'success_rate' => min(100, ($this->emailAccount->success_rate ?? 90) + 5),
            'auto_healed_at' => now(),
            'auto_heal_count' => ($this->emailAccount->auto_heal_count ?? 0) + 1,
        ];

        // Update metadata with healing info
        $metadata = $this->emailAccount->metadata ?? [];
        $metadata['last_successful_healing'] = now()->toISOString();
        $metadata['healing_result'] = 'success';
        $metadata['gmail_profile'] = $result['profile'] ?? [];
        $updateData['metadata'] = $metadata;

        // Update healing history
        $healingHistory = $this->emailAccount->healing_history ?? [];
        $healingHistory[] = [
            'timestamp' => now()->toISOString(),
            'result' => 'success',
            'previous_status' => $this->emailAccount->status,
            'previous_errors' => $this->emailAccount->consecutive_errors,
            'method' => 'token_refresh_and_test',
        ];
        $updateData['healing_history'] = array_slice($healingHistory, -10); // Keep last 10 entries

        $this->emailAccount->update($updateData);

        Log::info('✅ ACCOUNT SUCCESSFULLY HEALED!', [
            'account_id' => $this->emailAccount->id,
            'email' => $this->emailAccount->email,
            'new_status' => 'active',
            'heal_count' => $updateData['auto_heal_count'],
            'messages_total' => $result['profile']['messages_total'] ?? 0,
        ]);
    }

    private function handleConnectionFailure(string $error): void
    {
        $consecutiveErrors = $this->emailAccount->consecutive_errors + 1;

        Log::warning('⚠️ Connection validation failed', [
            'account_id' => $this->emailAccount->id,
            'email' => $this->emailAccount->email,
            'error' => $error,
            'consecutive_errors' => $consecutiveErrors,
        ]);

        $updateData = [
            'consecutive_errors' => $consecutiveErrors,
            'last_error' => $error,
            'last_error_at' => now(),
            'last_health_check' => now(),
            'success_rate' => max(0, ($this->emailAccount->success_rate ?? 90) - 3),
        ];

        // Determine new status based on error type and count
        if (
            str_contains($error, 'invalid_grant') ||
            str_contains($error, 'unauthorized') ||
            str_contains($error, 'access_denied')
        ) {

            $updateData['status'] = 'needs_reauth';
            $updateData['is_connected'] = false;

            Log::warning('🔐 Account needs re-authentication', [
                'account_id' => $this->emailAccount->id,
                'error' => $error,
            ]);
        } elseif ($consecutiveErrors >= 5) {
            $updateData['status'] = 'error';
            $updateData['is_connected'] = false;

            Log::warning('❌ Account disabled due to consecutive errors', [
                'account_id' => $this->emailAccount->id,
                'consecutive_errors' => $consecutiveErrors,
                'error' => $error,
            ]);
        } elseif ($consecutiveErrors >= 3) {
            $updateData['status'] = 'warning';

            Log::warning('⚠️ Account in warning state', [
                'account_id' => $this->emailAccount->id,
                'consecutive_errors' => $consecutiveErrors,
                'error' => $error,
            ]);
        }

        // Update healing history
        $healingHistory = $this->emailAccount->healing_history ?? [];
        $healingHistory[] = [
            'timestamp' => now()->toISOString(),
            'result' => 'failed',
            'error' => $error,
            'consecutive_errors' => $consecutiveErrors,
            'method' => 'token_refresh_and_test',
        ];
        $updateData['healing_history'] = array_slice($healingHistory, -10);

        $this->emailAccount->update($updateData);
    }

    private function handleTokenRefreshFailure(string $error): void
    {
        Log::error('❌ Token refresh failed, updating account status', [
            'account_id' => $this->emailAccount->id,
            'error' => $error,
        ]);

        $updateData = [
            'last_error' => 'Token refresh failed: ' . $error,
            'last_error_at' => now(),
            'last_health_check' => now(),
            'consecutive_errors' => $this->emailAccount->consecutive_errors + 1,
            'token_refresh_failed_at' => now(),
        ];

        if (str_contains($error, 'invalid_grant') || str_contains($error, 'unauthorized')) {
            $updateData['status'] = 'needs_reauth';
            $updateData['is_connected'] = false;
        } else {
            $updateData['status'] = 'error';
        }

        $this->emailAccount->update($updateData);
    }

    public function failed(\Throwable $exception): void
    {
        Log::error('❌ Token validation job failed permanently', [
            'account_id' => $this->emailAccount->id,
            'error' => $exception->getMessage(),
            'attempts' => $this->attempts(),
        ]);

        $this->handleConnectionFailure('Job failed after ' . $this->attempts() . ' attempts: ' . $exception->getMessage());
    }
}
