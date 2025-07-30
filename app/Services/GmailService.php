<?php

namespace App\Services;

use App\Models\EmailAccount;
use Google\Client;
use Google\Service\Gmail;
use Google\Service\Oauth2;
use Illuminate\Support\Facades\Log;

class GmailService
{
    protected Client $client;

    public function __construct()
    {
        $this->client = new Client();
        $this->client->setClientId(config('services.gmail.client_id'));
        $this->client->setClientSecret(config('services.gmail.client_secret'));
        $this->client->setRedirectUri(config('services.gmail.redirect_uri'));

        // 🔥 FIXED SCOPES - ADD ALL NECESSARY PERMISSIONS
        $this->client->addScope([
            Gmail::GMAIL_SEND,                                    // Send emails
            Gmail::GMAIL_READONLY,                                // Read emails
            Gmail::GMAIL_MODIFY,                                  // Modify emails (mark as read, etc.)
            'https://www.googleapis.com/auth/userinfo.email',     // User email
            'https://www.googleapis.com/auth/userinfo.profile'    // User profile
        ]);

        $this->client->setAccessType('offline');
        $this->client->setPrompt('consent'); // 🔥 FORCE CONSENT TO GET NEW SCOPES
    }

    /**
     * Get OAuth authorization URL
     */
    public function getAuthUrl(EmailAccount $account): string
    {
        $state = json_encode([
            'account_id' => $account->id,
            'user_id' => $account->user_id,
            'timestamp' => time(),
            'hash' => hash('sha256', $account->id . $account->user_id . config('app.key'))
        ]);

        $this->client->setState($state);
        $authUrl = $this->client->createAuthUrl();

        Log::info('Generated Gmail OAuth URL with FULL SCOPES', [
            'account_id' => $account->id,
            'scopes' => $this->client->getScopes(),
            'redirect_uri' => $this->client->getRedirectUri(),
        ]);

        return $authUrl;
    }

    /**
     * Handle OAuth callback - SAVE ALL SCOPES
     */
    public function handleCallback(string $code, string $state): array
    {
        try {
            Log::info('Processing Gmail OAuth callback', [
                'code_length' => strlen($code),
                'state' => $state,
            ]);

            // Validate state
            $stateData = json_decode($state, true);
            if (!$stateData || !isset($stateData['account_id'], $stateData['user_id'])) {
                throw new \Exception('Invalid state parameter: ' . $state);
            }

            // Verify hash
            $expectedHash = hash('sha256', $stateData['account_id'] . $stateData['user_id'] . config('app.key'));
            if (!hash_equals($expectedHash, $stateData['hash'])) {
                throw new \Exception('Invalid state hash - security check failed');
            }

            // Find the placeholder account
            $account = EmailAccount::where('id', $stateData['account_id'])
                ->where('user_id', $stateData['user_id'])
                ->first();

            if (!$account) {
                throw new \Exception('Account not found with ID: ' . $stateData['account_id']);
            }

            // Exchange code for tokens
            $token = $this->client->fetchAccessTokenWithAuthCode($code);
            if (isset($token['error'])) {
                throw new \Exception('Token exchange failed: ' . $token['error']);
            }

            Log::info('Token exchange successful with FULL SCOPES', [
                'has_access_token' => isset($token['access_token']),
                'has_refresh_token' => isset($token['refresh_token']),
                'expires_in' => $token['expires_in'] ?? null,
                'scope' => $token['scope'] ?? null,
            ]);

            // Get user info from Google
            $this->client->setAccessToken($token);
            $oauth2 = new Oauth2($this->client);
            $userInfo = $oauth2->userinfo->get();

            // 🔥 SAVE WITH FULL SCOPES
            $updateData = [
                'email' => $userInfo->email,
                'status' => 'active',
                'is_connected' => true,
                'is_verified' => true,
                'encrypted_access_token' => $token['access_token'],
                'encrypted_refresh_token' => $token['refresh_token'] ?? null,
                'token_expires_at' => isset($token['expires_in']) ?
                    now()->addSeconds($token['expires_in']) : null,
                'oauth_provider_id' => $userInfo->id,

                // 🔥 SAVE ALL GRANTED SCOPES
                'oauth_scopes' => isset($token['scope']) ?
                    explode(' ', $token['scope']) : [
                        'https://www.googleapis.com/auth/gmail.send',
                        'https://www.googleapis.com/auth/gmail.readonly',
                        'https://www.googleapis.com/auth/gmail.modify',
                        'https://www.googleapis.com/auth/gmail.metadata',
                        'https://www.googleapis.com/auth/userinfo.email',
                        'https://www.googleapis.com/auth/userinfo.profile'
                    ],

                'last_activity' => now(),
                'last_sync' => now(),
                'last_health_check' => now(),
                'metadata' => array_merge($account->metadata ?? [], [
                    'oauth_completed' => now()->toISOString(),
                    'google_user_id' => $userInfo->id,
                    'google_name' => $userInfo->name,
                    'google_picture' => $userInfo->picture,
                    'google_verified_email' => $userInfo->verifiedEmail,
                    'token_scope' => $token['scope'] ?? null,
                    'token_type' => $token['token_type'] ?? 'Bearer',
                    'scopes_granted' => explode(' ', $token['scope'] ?? ''),
                ]),
            ];

            $account->update($updateData);

            Log::info('Gmail OAuth completed with FULL PERMISSIONS', [
                'account_id' => $account->id,
                'email' => $userInfo->email,
                'scopes_count' => count($account->oauth_scopes ?? []),
                'scopes' => $account->oauth_scopes,
            ]);

            return [
                'success' => true,
                'account_id' => $account->id,
                'email' => $userInfo->email,
                'account' => $account->fresh(),
            ];
        } catch (\Exception $e) {
            Log::error('Gmail OAuth callback processing failed', [
                'error' => $e->getMessage(),
                'code_length' => strlen($code ?? ''),
                'state' => $state,
            ]);

            return [
                'success' => false,
                'error' => $e->getMessage(),
            ];
        }
    }

    /**
     * Send email using Gmail API 📧
     */
    public function sendEmail(EmailAccount $account, array $emailData): array
    {
        try {
            // Set up the client with the account's tokens
            $this->client->setAccessToken([
                'access_token' => $account->encrypted_access_token,
                'refresh_token' => $account->encrypted_refresh_token,
                'expires_in' => $account->token_expires_at ?
                    $account->token_expires_at->diffInSeconds(now()) : 3600,
            ]);

            // Check if token needs refresh
            if ($this->client->isAccessTokenExpired()) {
                $newToken = $this->client->fetchAccessTokenWithRefreshToken($account->encrypted_refresh_token);
                if (isset($newToken['error'])) {
                    throw new \Exception('Token refresh failed: ' . $newToken['error']);
                }

                // Update the account with new token
                $account->update([
                    'encrypted_access_token' => $newToken['access_token'],
                    'token_expires_at' => isset($newToken['expires_in']) ?
                        now()->addSeconds($newToken['expires_in']) : null,
                    'last_sync' => now(),
                ]);
            }

            $gmail = new Gmail($this->client);

            // Create the email message
            $message = new \Google\Service\Gmail\Message();
            $rawMessage = $this->createRawMessage($emailData);
            $message->setRaw($rawMessage);

            // Send the email
            $result = $gmail->users_messages->send('me', $message);

            // Record success
            $account->recordSuccess();
            $account->incrementSentCount();

            Log::info('Email sent successfully via Gmail API', [
                'account_id' => $account->id,
                'message_id' => $result->getId(),
                'to' => $emailData['to'] ?? 'unknown',
                'subject' => $emailData['subject'] ?? 'No subject',
            ]);

            return [
                'success' => true,
                'message_id' => $result->getId(),
                'account_id' => $account->id,
            ];
        } catch (\Exception $e) {
            $account->recordError($e->getMessage());

            Log::error('Failed to send email via Gmail API', [
                'account_id' => $account->id,
                'error' => $e->getMessage(),
                'email_data' => $emailData,
            ]);

            return [
                'success' => false,
                'error' => $e->getMessage(),
            ];
        }
    }

    /**
     * 🔥 NEW: Test Gmail connection for email account
     */
    public function testConnection(EmailAccount $account): array
    {
        try {
            Log::info('Testing Gmail connection', [
                'account_id' => $account->id,
                'email' => $account->email,
                'has_access_token' => !empty($account->encrypted_access_token),
                'has_refresh_token' => !empty($account->encrypted_refresh_token)
            ]);

            // Check if account has required tokens
            if (empty($account->encrypted_access_token)) {
                throw new \Exception('No access token found for account');
            }

            // Set up the client with the account's tokens
            $this->client->setAccessToken([
                'access_token' => $account->encrypted_access_token,
                'refresh_token' => $account->encrypted_refresh_token,
                'expires_in' => $account->token_expires_at ?
                    $account->token_expires_at->diffInSeconds(now()) : 3600,
            ]);

            // Check if token needs refresh
            if ($this->client->isAccessTokenExpired()) {
                if (empty($account->encrypted_refresh_token)) {
                    throw new \Exception('Access token expired and no refresh token available');
                }

                Log::info('Refreshing expired access token', ['account_id' => $account->id]);

                $newToken = $this->client->fetchAccessTokenWithRefreshToken($account->encrypted_refresh_token);

                if (isset($newToken['error'])) {
                    throw new \Exception('Token refresh failed: ' . $newToken['error']);
                }

                // Update the account with new token
                $account->update([
                    'encrypted_access_token' => $newToken['access_token'],
                    'token_expires_at' => isset($newToken['expires_in']) ?
                        now()->addSeconds($newToken['expires_in']) : null,
                    'last_sync' => now(),
                ]);

                Log::info('Access token refreshed successfully', ['account_id' => $account->id]);
            }

            // Test the connection by getting user profile
            $gmail = new Gmail($this->client);
            $profile = $gmail->users->getProfile('me');

            // Update account status
            $account->update([
                'status' => 'active',
                'is_connected' => true,
                'last_health_check' => now(),
                'consecutive_errors' => 0,
                'last_error' => null,
                'metadata' => array_merge($account->metadata ?? [], [
                    'last_connection_test' => now()->toISOString(),
                    'gmail_messages_total' => $profile->getMessagesTotal(),
                    'gmail_threads_total' => $profile->getThreadsTotal(),
                    'connection_test_result' => 'success'
                ])
            ]);

            Log::info('Gmail connection test successful', [
                'account_id' => $account->id,
                'email' => $account->email,
                'messages_total' => $profile->getMessagesTotal(),
                'threads_total' => $profile->getThreadsTotal(),
                'connection_status' => 'active'
            ]);

            return [
                'success' => true,
                'account_id' => $account->id,
                'email' => $account->email,
                'messages_total' => $profile->getMessagesTotal(),
                'threads_total' => $profile->getThreadsTotal(),
                'connection_status' => 'active'
            ];
        } catch (\Exception $e) {
            // Update account with error status
            $account->update([
                'status' => 'error',
                'is_connected' => false,
                'last_health_check' => now(),
                'consecutive_errors' => ($account->consecutive_errors ?? 0) + 1,
                'last_error' => $e->getMessage(),
                'metadata' => array_merge($account->metadata ?? [], [
                    'last_connection_test' => now()->toISOString(),
                    'connection_test_result' => 'failed',
                    'connection_error' => $e->getMessage()
                ])
            ]);

            Log::error('Gmail connection test failed', [
                'account_id' => $account->id,
                'email' => $account->email,
                'error' => $e->getMessage(),
                'consecutive_errors' => $account->consecutive_errors
            ]);

            return [
                'success' => false,
                'account_id' => $account->id,
                'email' => $account->email,
                'error' => $e->getMessage(),
                'connection_status' => 'error'
            ];
        }
    }
    
    /**
     * 🔥 NEW: Check if account has required scopes for inbox access
     */
    public function hasInboxScopes(EmailAccount $account): bool
    {
        $requiredScopes = [
            'https://www.googleapis.com/auth/gmail.readonly',
            'https://www.googleapis.com/auth/gmail.modify',
        ];

        $grantedScopes = $account->oauth_scopes ?? [];

        foreach ($requiredScopes as $scope) {
            if (!in_array($scope, $grantedScopes)) {
                return false;
            }
        }

        return true;
    }

    /**
     * Create raw email message for Gmail API
     */
    private function createRawMessage(array $emailData): string
    {
        $to = $emailData['to'];
        $subject = $emailData['subject'] ?? 'No Subject';
        $body = $emailData['body'] ?? '';
        $from = $emailData['from'] ?? '';

        $rawMessage = "To: {$to}\r\n";
        $rawMessage .= "From: {$from}\r\n";
        $rawMessage .= "Subject: {$subject}\r\n";
        $rawMessage .= "Content-Type: text/html; charset=utf-8\r\n\r\n";
        $rawMessage .= $body;

        return base64url_encode($rawMessage);
    }
}

// Helper function for base64url encoding
if (!function_exists('base64url_encode')) {
    function base64url_encode($data)
    {
        return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
    }
}
