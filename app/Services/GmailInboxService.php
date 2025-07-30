<?php

namespace App\Services;

use App\Models\EmailAccount;
use App\Models\EmailMessage;
use Google\Client;
use Google\Service\Gmail;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;

class GmailInboxService
{
    protected Client $client;
    protected Gmail $gmail;

    public function __construct()
    {
        $this->client = new Client();
        $this->client->setClientId(config('services.gmail.client_id'));
        $this->client->setClientSecret(config('services.gmail.client_secret'));
        $this->client->setRedirectUri(config('services.gmail.redirect_uri'));

        $this->client->addScope([
            Gmail::GMAIL_READONLY,
            Gmail::GMAIL_MODIFY,
            Gmail::GMAIL_SEND,
            'https://www.googleapis.com/auth/userinfo.email',
        ]);
    }

    /**
     * Fetch inbox messages with improved error handling
     */
    public function fetchInboxMessages(EmailAccount $account, int $maxResults = 50): array
    {
        try {
            // Check scopes first
            if (!$this->hasRequiredScopes($account)) {
                Log::error('Account missing required scopes for inbox access', [
                    'account_id' => $account->id,
                    'granted_scopes' => $account->oauth_scopes ?? [],
                ]);

                return [
                    'success' => false,
                    'error' => 'Account needs re-authorization with inbox permissions. Please reconnect your Gmail account.',
                    'needs_reauth' => true,
                ];
            }

            // Set up the client with account tokens - this may throw an exception
            $tokenSetupResult = $this->setupClientForAccount($account);
            if (!$tokenSetupResult['success']) {
                return $tokenSetupResult;
            }

            $this->gmail = new Gmail($this->client);

            Log::info('Starting inbox fetch', [
                'account_id' => $account->id,
                'email' => $account->email,
                'max_results' => $maxResults,
            ]);

            // Get list of messages from inbox
            $messages = $this->gmail->users_messages->listUsersMessages('me', [
                'maxResults' => $maxResults,
                'labelIds' => ['INBOX'],
            ]);

            $fetchedCount = 0;
            $newCount = 0;
            $errorCount = 0;

            if ($messages->getMessages()) {
                foreach ($messages->getMessages() as $message) {
                    try {
                        // Check if we already have this message
                        $existingMessage = EmailMessage::where('email_account_id', $account->id)
                            ->where('gmail_message_id', $message->getId())
                            ->first();

                        if ($existingMessage) {
                            $existingMessage->update(['synced_at' => now()]);
                            $fetchedCount++;
                            continue;
                        }

                        // Fetch full message details
                        $fullMessage = $this->gmail->users_messages->get('me', $message->getId());

                        // Parse and store the message
                        $emailMessage = $this->parseAndStoreMessage($account, $fullMessage);
                        if ($emailMessage) {
                            $newCount++;
                        }

                        $fetchedCount++;
                    } catch (\Exception $e) {
                        $errorCount++;
                        Log::error('Failed to process message', [
                            'message_id' => $message->getId(),
                            'error' => $e->getMessage(),
                        ]);
                        continue;
                    }
                }
            }

            // Update account sync status
            $account->update([
                'last_sync' => now(),
                'last_activity' => now(),
                'consecutive_errors' => 0, // Reset error count on success
                'last_error' => null,
            ]);

            Log::info('Inbox fetch completed successfully', [
                'account_id' => $account->id,
                'fetched_count' => $fetchedCount,
                'new_count' => $newCount,
                'error_count' => $errorCount,
            ]);

            return [
                'success' => true,
                'fetched_count' => $fetchedCount,
                'new_count' => $newCount,
                'error_count' => $errorCount,
            ];
        } catch (\Google\Service\Exception $e) {
            return $this->handleGoogleServiceException($e, $account);
        } catch (\Exception $e) {
            Log::error('Inbox fetch failed', [
                'account_id' => $account->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            // Update account error status
            $account->update([
                'consecutive_errors' => ($account->consecutive_errors ?? 0) + 1,
                'last_error' => $e->getMessage(),
                'last_health_check' => now(),
            ]);

            return [
                'success' => false,
                'error' => $e->getMessage(),
            ];
        }
    }

    /**
     * Handle Google Service exceptions with specific error handling
     */
    private function handleGoogleServiceException(\Google\Service\Exception $e, EmailAccount $account): array
    {
        $error = json_decode($e->getMessage(), true);
        $errorMessage = $error['error']['message'] ?? $e->getMessage();
        $errorCode = $e->getCode();

        Log::error('Gmail API error during inbox fetch', [
            'account_id' => $account->id,
            'error_code' => $errorCode,
            'error_message' => $errorMessage,
            'granted_scopes' => $account->oauth_scopes ?? [],
        ]);

        // Handle specific error cases
        switch ($errorCode) {
            case 401:
                // Unauthorized - token issues
                if (
                    str_contains($errorMessage, 'invalid_grant') ||
                    str_contains($errorMessage, 'Token has been expired or revoked')
                ) {

                    $this->markAccountForReauth($account, 'OAuth token expired or revoked');

                    return [
                        'success' => false,
                        'error' => 'Gmail account authorization has expired. Please reconnect your account.',
                        'needs_reauth' => true,
                        'error_code' => 'token_expired',
                    ];
                }
                break;

            case 403:
                // Forbidden - scope or permission issues
                if (str_contains($errorMessage, 'insufficient')) {
                    $this->markAccountForReauth($account, 'Insufficient permissions');

                    return [
                        'success' => false,
                        'error' => 'Gmail account needs re-authorization with inbox permissions. Please reconnect your account.',
                        'needs_reauth' => true,
                        'error_code' => 'insufficient_permissions',
                    ];
                }
                break;

            case 429:
                // Rate limit exceeded
                return [
                    'success' => false,
                    'error' => 'Gmail API rate limit exceeded. Please try again later.',
                    'error_code' => 'rate_limit',
                    'retry_after' => 300, // 5 minutes
                ];

            case 500:
            case 502:
            case 503:
                // Server errors - temporary issues
                return [
                    'success' => false,
                    'error' => 'Gmail service temporarily unavailable. Please try again later.',
                    'error_code' => 'service_unavailable',
                    'retry_after' => 60, // 1 minute
                ];
        }

        // Generic error handling
        $account->update([
            'consecutive_errors' => ($account->consecutive_errors ?? 0) + 1,
            'last_error' => $errorMessage,
            'last_health_check' => now(),
        ]);

        return [
            'success' => false,
            'error' => $errorMessage,
            'error_code' => 'api_error',
        ];
    }

    /**
     * Mark account for re-authentication
     */
    private function markAccountForReauth(EmailAccount $account, string $reason): void
    {
        $account->update([
            'status' => 'needs_reauth',
            'is_connected' => false,
            'consecutive_errors' => ($account->consecutive_errors ?? 0) + 1,
            'last_error' => $reason,
            'last_health_check' => now(),
            'metadata' => array_merge($account->metadata ?? [], [
                'reauth_required' => true,
                'reauth_reason' => $reason,
                'reauth_required_at' => now()->toISOString(),
            ]),
        ]);

        Log::warning('Account marked for re-authentication', [
            'account_id' => $account->id,
            'email' => $account->email,
            'reason' => $reason,
        ]);
    }

    /**
     * Setup Gmail client for specific account with improved error handling
     */
    private function setupClientForAccount(EmailAccount $account): array
    {
        try {
            // Check if we have the required tokens
            if (empty($account->encrypted_access_token)) {
                throw new \Exception('No access token available for account');
            }

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

                Log::info('Refreshing expired access token', [
                    'account_id' => $account->id,
                    'email' => $account->email,
                ]);

                $newToken = $this->client->fetchAccessTokenWithRefreshToken($account->encrypted_refresh_token);

                if (isset($newToken['error'])) {
                    $errorMessage = $newToken['error'];

                    // Handle specific refresh token errors
                    if ($errorMessage === 'invalid_grant') {
                        $this->markAccountForReauth($account, 'Refresh token invalid or expired');

                        return [
                            'success' => false,
                            'error' => 'Gmail account authorization has expired. Please reconnect your account.',
                            'needs_reauth' => true,
                            'error_code' => 'invalid_refresh_token',
                        ];
                    }

                    throw new \Exception('Token refresh failed: ' . $errorMessage);
                }

                // Update account with new token
                $account->update([
                    'encrypted_access_token' => $newToken['access_token'],
                    'token_expires_at' => isset($newToken['expires_in']) ?
                        now()->addSeconds($newToken['expires_in']) : null,
                    'last_sync' => now(),
                    'consecutive_errors' => 0, // Reset error count on successful refresh
                    'last_error' => null,
                ]);

                Log::info('Access token refreshed successfully', [
                    'account_id' => $account->id,
                    'email' => $account->email,
                ]);
            }

            return ['success' => true];
        } catch (\Exception $e) {
            Log::error('Failed to setup client for account', [
                'account_id' => $account->id,
                'email' => $account->email,
                'error' => $e->getMessage(),
            ]);

            return [
                'success' => false,
                'error' => $e->getMessage(),
                'needs_reauth' => str_contains($e->getMessage(), 'invalid_grant') ||
                    str_contains($e->getMessage(), 'expired'),
            ];
        }
    }

    /**
     * Check if account has required scopes
     */
    private function hasRequiredScopes(EmailAccount $account): bool
    {
        $requiredScopes = [
            'https://www.googleapis.com/auth/gmail.readonly',
            'https://www.googleapis.com/auth/gmail.modify',
        ];

        $grantedScopes = $account->oauth_scopes ?? [];

        foreach ($requiredScopes as $scope) {
            $hasScope = false;
            foreach ($grantedScopes as $grantedScope) {
                if (
                    str_contains($grantedScope, 'gmail.readonly') ||
                    str_contains($grantedScope, 'gmail.modify') ||
                    $grantedScope === $scope
                ) {
                    $hasScope = true;
                    break;
                }
            }
            if (!$hasScope) {
                return false;
            }
        }

        return true;
    }

    /**
     * Sync all accounts for a user with improved error handling
     */
    public function syncAllAccountsForUser(int $userId): array
    {
        try {
            $accounts = EmailAccount::where('user_id', $userId)
                ->where('provider', 'gmail')
                ->where('is_connected', true)
                ->whereIn('status', ['active', 'needs_reauth'])
                ->get();

            $results = [
                'total_accounts' => $accounts->count(),
                'success_count' => 0,
                'error_count' => 0,
                'reauth_needed' => 0,
                'accounts' => [],
            ];

            foreach ($accounts as $account) {
                $result = $this->fetchInboxMessages($account, 50);

                $accountResult = [
                    'account_id' => $account->id,
                    'email' => $account->email,
                    'success' => $result['success'],
                ];

                if ($result['success']) {
                    $results['success_count']++;
                    $accountResult['fetched_count'] = $result['fetched_count'];
                    $accountResult['new_count'] = $result['new_count'];
                } else {
                    $results['error_count']++;
                    $accountResult['error'] = $result['error'];

                    if ($result['needs_reauth'] ?? false) {
                        $results['reauth_needed']++;
                        $accountResult['needs_reauth'] = true;
                    }
                }

                $results['accounts'][] = $accountResult;

                // Small delay between accounts
                usleep(500000); // 0.5 seconds
            }

            Log::info('Bulk account sync completed', [
                'user_id' => $userId,
                'results' => $results,
            ]);

            return $results;
        } catch (\Exception $e) {
            Log::error('Bulk account sync failed', [
                'user_id' => $userId,
                'error' => $e->getMessage(),
            ]);

            return [
                'success' => false,
                'error' => $e->getMessage(),
            ];
        }
    }

    // Keep all your existing helper methods (sanitizeText, extractEmailAddress, etc.)
    private function sanitizeText(?string $text): ?string
    {
        if (empty($text)) {
            return null;
        }

        try {
            $text = mb_convert_encoding($text, 'UTF-8', 'UTF-8');
            $text = preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/', '', $text);

            if (!mb_check_encoding($text, 'UTF-8')) {
                return '(Invalid encoding)';
            }

            if (mb_strlen($text) > 50000) {
                $text = mb_substr($text, 0, 50000) . '... (truncated)';
            }

            return $text;
        } catch (\Exception $e) {
            return '(Text encoding error)';
        }
    }

    private function parseAndStoreMessage(EmailAccount $account, $gmailMessage): ?EmailMessage
    {
        try {
            $payload = $gmailMessage->getPayload();
            $headers = $payload->getHeaders();

            // Extract headers safely
            $headerMap = [];
            foreach ($headers as $header) {
                $name = $this->sanitizeText($header->getName());
                $value = $this->sanitizeText($header->getValue());
                $headerMap[strtolower($name)] = $value;
            }

            // Extract email addresses safely
            $fromEmail = $this->extractEmailAddress($headerMap['from'] ?? '');
            $toEmail = $this->extractEmailAddress($headerMap['to'] ?? '');

            // Extract body content safely
            $bodyData = $this->extractBodyContent($payload);

            // Determine if this is a reply
            $isReply = !empty($headerMap['in-reply-to']) || !empty($headerMap['references']);

            // Create email message record
            $emailMessage = EmailMessage::create([
                'user_id' => $account->user_id,
                'email_account_id' => $account->id,
                'gmail_message_id' => $gmailMessage->getId(),
                'gmail_thread_id' => $gmailMessage->getThreadId(),
                'gmail_labels' => $gmailMessage->getLabelIds(),
                'message_id' => $headerMap['message-id'] ?? null,
                'subject' => $this->sanitizeText($headerMap['subject'] ?? '(No Subject)'),
                'from_email' => $fromEmail,
                'from_name' => $this->extractNameFromEmail($headerMap['from'] ?? ''),
                'to_email' => $toEmail,
                'to_name' => $this->extractNameFromEmail($headerMap['to'] ?? ''),
                'reply_to' => $headerMap['reply-to'] ?? null,
                'cc' => $this->parseEmailList($headerMap['cc'] ?? ''),
                'bcc' => $this->parseEmailList($headerMap['bcc'] ?? ''),
                'body_html' => $this->sanitizeText($bodyData['html'] ?? null),
                'body_text' => $this->sanitizeText($bodyData['text'] ?? null),
                'snippet' => $this->sanitizeText($gmailMessage->getSnippet()),
                'is_read' => !in_array('UNREAD', $gmailMessage->getLabelIds()),
                'is_important' => in_array('IMPORTANT', $gmailMessage->getLabelIds()),
                'is_starred' => in_array('STARRED', $gmailMessage->getLabelIds()),
                'is_draft' => in_array('DRAFT', $gmailMessage->getLabelIds()),
                'is_sent' => in_array('SENT', $gmailMessage->getLabelIds()),
                'is_spam' => in_array('SPAM', $gmailMessage->getLabelIds()),
                'is_trash' => in_array('TRASH', $gmailMessage->getLabelIds()),
                'size_bytes' => $gmailMessage->getSizeEstimate(),
                'has_attachments' => $this->hasAttachments($payload),
                'attachments' => $this->extractAttachments($payload),
                'is_reply' => $isReply,
                'in_reply_to' => $headerMap['in-reply-to'] ?? null,
                'references' => $this->parseReferences($headerMap['references'] ?? ''),
                'received_at' => $this->parseDate($headerMap['date'] ?? now()),
                'sent_at' => $this->parseDate($headerMap['date'] ?? now()),
                'synced_at' => now(),
                'sync_status' => 'synced',
                'metadata' => [
                    'gmail_internal_date' => $gmailMessage->getInternalDate(),
                    'gmail_size_estimate' => $gmailMessage->getSizeEstimate(),
                    'gmail_history_id' => $gmailMessage->getHistoryId(),
                ],
            ]);

            return $emailMessage;
        } catch (\Exception $e) {
            Log::error('Failed to parse and store message', [
                'gmail_message_id' => $gmailMessage->getId(),
                'error' => $e->getMessage(),
            ]);
            return null;
        }
    }

    private function extractBodyContent($payload): array
    {
        $body = ['text' => '', 'html' => ''];

        try {
            if ($payload->getBody() && $payload->getBody()->getData()) {
                $mimeType = $payload->getMimeType();
                $data = base64_decode(strtr($payload->getBody()->getData(), '-_', '+/'));

                if ($mimeType === 'text/plain') {
                    $body['text'] = $this->sanitizeText($data) ?? '';
                } elseif ($mimeType === 'text/html') {
                    $body['html'] = $this->sanitizeText($data) ?? '';
                }
            }

            if ($payload->getParts()) {
                foreach ($payload->getParts() as $part) {
                    try {
                        $partBody = $this->extractBodyContent($part);
                        if ($partBody['text']) {
                            $body['text'] .= $partBody['text'];
                        }
                        if ($partBody['html']) {
                            $body['html'] .= $partBody['html'];
                        }
                    } catch (\Exception $e) {
                        continue;
                    }
                }
            }
        } catch (\Exception $e) {
            Log::warning('Failed to extract body content', ['error' => $e->getMessage()]);
        }

        return $body;
    }

    private function extractEmailAddress(string $emailString): string
    {
        try {
            $emailString = $this->sanitizeText($emailString) ?? '';
            if (preg_match('/<([^>]+)>/', $emailString, $matches)) {
                return trim($matches[1]);
            }
            return trim($emailString);
        } catch (\Exception $e) {
            return '';
        }
    }

    private function extractNameFromEmail(string $emailString): ?string
    {
        try {
            $emailString = $this->sanitizeText($emailString) ?? '';
            if (preg_match('/^(.+?)\s*<[^>]+>$/', $emailString, $matches)) {
                return trim($matches[1], ' "');
            }
            return null;
        } catch (\Exception $e) {
            return null;
        }
    }

    private function parseEmailList(string $emailList): ?array
    {
        try {
            $emailList = $this->sanitizeText($emailList) ?? '';
            if (empty($emailList)) {
                return null;
            }
            $emails = explode(',', $emailList);
            return array_map('trim', $emails);
        } catch (\Exception $e) {
            return null;
        }
    }

    private function parseReferences(string $references): ?array
    {
        try {
            $references = $this->sanitizeText($references) ?? '';
            if (empty($references)) {
                return null;
            }
            return array_map('trim', explode(' ', $references));
        } catch (\Exception $e) {
            return null;
        }
    }

    private function parseDate(string $dateString): Carbon
    {
        try {
            return Carbon::parse($dateString);
        } catch (\Exception $e) {
            return now();
        }
    }

    private function hasAttachments($payload): bool
    {
        try {
            if ($payload->getParts()) {
                foreach ($payload->getParts() as $part) {
                    if ($part->getFilename()) {
                        return true;
                    }
                    if ($this->hasAttachments($part)) {
                        return true;
                    }
                }
            }
            return false;
        } catch (\Exception $e) {
            return false;
        }
    }

    private function extractAttachments($payload): ?array
    {
        try {
            $attachments = [];
            if ($payload->getParts()) {
                foreach ($payload->getParts() as $part) {
                    if ($part->getFilename()) {
                        $attachments[] = [
                            'filename' => $this->sanitizeText($part->getFilename()) ?? 'unknown',
                            'mime_type' => $part->getMimeType(),
                            'size' => $part->getBody()->getSize(),
                            'attachment_id' => $part->getBody()->getAttachmentId(),
                        ];
                    }
                }
            }
            return empty($attachments) ? null : $attachments;
        } catch (\Exception $e) {
            return null;
        }
    }
}
