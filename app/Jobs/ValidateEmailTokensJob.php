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

class ValidateEmailTokensJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public $timeout = 300; // 5 minutes
    public $tries = 3;
    public $backoff = [60, 300, 900]; // 1min, 5min, 15min

    protected EmailAccount $emailAccount;

    public function __construct(EmailAccount $emailAccount)
    {
        $this->emailAccount = $emailAccount;
    }

    public function handle(GmailService $gmailService): void
    {
        try {
            Log::info('Starting token validation', [
                'account_id' => $this->emailAccount->id,
                'email' => $this->emailAccount->email,
                'token_expires_at' => $this->emailAccount->token_expires_at?->toISOString(),
            ]);

            // Skip if account is not OAuth-based
            if ($this->emailAccount->provider !== 'gmail') {
                Log::info('Skipping non-OAuth account', [
                    'account_id' => $this->emailAccount->id,
                    'provider' => $this->emailAccount->provider,
                ]);
                return;
            }

            // Skip if account is not connected
            if (!$this->emailAccount->is_connected || $this->emailAccount->status !== 'active') {
                Log::info('Skipping disconnected account', [
                    'account_id' => $this->emailAccount->id,
                    'is_connected' => $this->emailAccount->is_connected,
                    'status' => $this->emailAccount->status,
                ]);
                return;
            }

            // Check if token needs refresh (expires within 10 minutes)
            $needsRefresh = false;
            if ($this->emailAccount->token_expires_at) {
                $expiresIn = $this->emailAccount->token_expires_at->diffInMinutes(now());
                $needsRefresh = $expiresIn <= 10;

                Log::info('Token expiration check', [
                    'account_id' => $this->emailAccount->id,
                    'expires_in_minutes' => $expiresIn,
                    'needs_refresh' => $needsRefresh,
                ]);
            } else {
                // No expiration time set, assume needs refresh
                $needsRefresh = true;
            }

            if ($needsRefresh) {
                $result = $this->refreshToken($gmailService);

                if (!$result['success']) {
                    $this->handleTokenRefreshFailure($result['error']);
                    return;
                }
            }

            // Test the connection by making a simple API call
            $connectionResult = $this->testConnection($gmailService);

            if ($connectionResult['success']) {
                $this->handleConnectionSuccess();
            } else {
                $this->handleConnectionFailure($connectionResult['error']);
            }
        } catch (\Exception $e) {
            Log::error('Token validation job failed', [
                'account_id' => $this->emailAccount->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            $this->handleConnectionFailure($e->getMessage());
            throw $e; // Re-throw to trigger retry mechanism
        }
    }

    private function refreshToken(GmailService $gmailService): array
    {
        try {
            Log::info('Refreshing OAuth token', [
                'account_id' => $this->emailAccount->id,
            ]);

            // Use the Gmail service to refresh the token
            $client = new \Google\Client();
            $client->setClientId(config('services.gmail.client_id'));
            $client->setClientSecret(config('services.gmail.client_secret'));
            $client->setAccessType('offline');

            if (!$this->emailAccount->encrypted_refresh_token) {
                throw new \Exception('No refresh token available');
            }

            $newToken = $client->fetchAccessTokenWithRefreshToken(
                $this->emailAccount->encrypted_refresh_token
            );

            if (isset($newToken['error'])) {
                throw new \Exception('Token refresh failed: ' . $newToken['error']);
            }

            // Update the account with new token
            $this->emailAccount->update([
                'encrypted_access_token' => $newToken['access_token'],
                'token_expires_at' => isset($newToken['expires_in']) ?
                    now()->addSeconds($newToken['expires_in']) : null,
                'last_sync' => now(),
                'last_health_check' => now(),
                'consecutive_errors' => 0,
                'last_error' => null,
            ]);

            Log::info('Token refreshed successfully', [
                'account_id' => $this->emailAccount->id,
                'new_expires_at' => $this->emailAccount->fresh()->token_expires_at?->toISOString(),
            ]);

            return ['success' => true];
        } catch (\Exception $e) {
            Log::error('Token refresh failed', [
                'account_id' => $this->emailAccount->id,
                'error' => $e->getMessage(),
            ]);

            return [
                'success' => false,
                'error' => $e->getMessage(),
            ];
        }
    }

    private function testConnection(GmailService $gmailService): array
    {
        try {
            Log::info('Testing Gmail connection', [
                'account_id' => $this->emailAccount->id,
            ]);

            $client = new \Google\Client();
            $client->setClientId(config('services.gmail.client_id'));
            $client->setClientSecret(config('services.gmail.client_secret'));

            $client->setAccessToken([
                'access_token' => $this->emailAccount->encrypted_access_token,
                'refresh_token' => $this->emailAccount->encrypted_refresh_token,
                'expires_in' => $this->emailAccount->token_expires_at ?
                    $this->emailAccount->token_expires_at->diffInSeconds(now()) : 3600,
            ]);

            $gmail = new \Google\Service\Gmail($client);

            // Make a simple API call to test connection
            $profile = $gmail->users->getProfile('me');

            if ($profile->getEmailAddress() !== $this->emailAccount->email) {
                throw new \Exception('Email mismatch: expected ' . $this->emailAccount->email . ', got ' . $profile->getEmailAddress());
            }

            Log::info('Gmail connection test successful', [
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
        } catch (\Exception $e) {
            Log::error('Gmail connection test failed', [
                'account_id' => $this->emailAccount->id,
                'error' => $e->getMessage(),
            ]);

            return [
                'success' => false,
                'error' => $e->getMessage(),
            ];
        }
    }

    private function handleConnectionSuccess(): void
    {
        $this->emailAccount->update([
            'status' => 'active',
            'is_connected' => true,
            'last_health_check' => now(),
            'last_activity' => now(),
            'consecutive_errors' => 0,
            'last_error' => null,
            'success_rate' => min(100, $this->emailAccount->success_rate + 1),
        ]);

        Log::info('Connection validation successful', [
            'account_id' => $this->emailAccount->id,
            'email' => $this->emailAccount->email,
        ]);
    }

    private function handleConnectionFailure(string $error): void
    {
        $consecutiveErrors = $this->emailAccount->consecutive_errors + 1;

        $updateData = [
            'consecutive_errors' => $consecutiveErrors,
            'last_error' => $error,
            'last_error_at' => now(),
            'last_health_check' => now(),
            'success_rate' => max(0, $this->emailAccount->success_rate - 5),
        ];

        // If too many consecutive errors, disable the account
        if ($consecutiveErrors >= 5) {
            $updateData['status'] = 'error';
            $updateData['is_connected'] = false;

            Log::warning('Account disabled due to consecutive errors', [
                'account_id' => $this->emailAccount->id,
                'consecutive_errors' => $consecutiveErrors,
                'error' => $error,
            ]);
        } elseif ($consecutiveErrors >= 3) {
            $updateData['status'] = 'warning';

            Log::warning('Account in warning state', [
                'account_id' => $this->emailAccount->id,
                'consecutive_errors' => $consecutiveErrors,
                'error' => $error,
            ]);
        }

        $this->emailAccount->update($updateData);
    }

    private function handleTokenRefreshFailure(string $error): void
    {
        Log::error('Token refresh failed, disabling account', [
            'account_id' => $this->emailAccount->id,
            'error' => $error,
        ]);

        $this->emailAccount->update([
            'status' => 'error',
            'is_connected' => false,
            'last_error' => 'Token refresh failed: ' . $error,
            'last_error_at' => now(),
            'consecutive_errors' => $this->emailAccount->consecutive_errors + 1,
        ]);
    }

    public function failed(\Throwable $exception): void
    {
        Log::error('Token validation job failed permanently', [
            'account_id' => $this->emailAccount->id,
            'error' => $exception->getMessage(),
            'attempts' => $this->attempts(),
        ]);

        $this->handleConnectionFailure('Job failed after ' . $this->attempts() . ' attempts: ' . $exception->getMessage());
    }
}
