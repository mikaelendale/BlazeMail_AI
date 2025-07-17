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
            Gmail::GMAIL_SEND,
            'https://www.googleapis.com/auth/userinfo.email',
        ]);
    }

    /**
     * Fetch inbox messages for an account 📬 - BULLETPROOF VERSION! 🛡️
     */
    public function fetchInboxMessages(EmailAccount $account, int $maxResults = 50): array
    {
        try {
            // Set up the client with account tokens
            $this->setupClientForAccount($account);
            $this->gmail = new Gmail($this->client);

            Log::info('Starting inbox fetch', [
                'account_id' => $account->id,
                'email' => $account->email,
                'max_results' => $maxResults,
            ]);

            // Get list of messages from inbox
            $query = 'in:inbox'; // Only fetch inbox messages
            $messages = $this->gmail->users_messages->listUsersMessages('me', [
                'q' => $query,
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
                            // Update sync timestamp
                            $existingMessage->update(['synced_at' => now()]);
                            $fetchedCount++;
                            continue;
                        }

                        // Fetch full message details
                        $fullMessage = $this->gmail->users_messages->get('me', $message->getId());

                        // Parse and store the message - WITH UTF-8 PROTECTION! 🛡️
                        $emailMessage = $this->parseAndStoreMessage($account, $fullMessage);

                        if ($emailMessage) {
                            $newCount++;
                            Log::info('New email stored', [
                                'message_id' => $emailMessage->id,
                                'subject' => mb_substr($emailMessage->subject ?? '', 0, 100),
                                'from' => mb_substr($emailMessage->from_email ?? '', 0, 100),
                            ]);
                        }

                        $fetchedCount++;
                    } catch (\Exception $e) {
                        $errorCount++;
                        Log::error('Failed to process message', [
                            'message_id' => $message->getId(),
                            'error' => $e->getMessage(),
                        ]);
                        // Continue processing other messages
                    }
                }
            }

            // Update account sync status
            $account->update([
                'last_sync' => now(),
                'last_activity' => now(),
            ]);

            Log::info('Inbox fetch completed', [
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
        } catch (\Exception $e) {
            Log::error('Inbox fetch failed', [
                'account_id' => $account->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return [
                'success' => false,
                'error' => $e->getMessage(),
            ];
        }
    }

    /**
     * Parse Gmail message and store in database 📝 - UTF-8 SAFE VERSION! 🛡️
     */
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

            // Create email message record with UTF-8 protection
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

            // Detect if this is a cold email safely
            try {
                $emailMessage->update([
                    'is_cold_email' => $emailMessage->detectIfColdEmail()
                ]);
            } catch (\Exception $e) {
                Log::warning('Cold email detection failed', [
                    'message_id' => $emailMessage->id,
                    'error' => $e->getMessage(),
                ]);
            }

            return $emailMessage;
        } catch (\Exception $e) {
            Log::error('Failed to parse and store message', [
                'gmail_message_id' => $gmailMessage->getId(),
                'error' => $e->getMessage(),
            ]);
            return null;
        }
    }

    /**
     * SAFE: Sanitize text to prevent UTF-8 errors 🧹
     */
    private function sanitizeText(?string $text): ?string
    {
        if (empty($text)) {
            return null;
        }

        try {
            // Remove invalid UTF-8 characters
            $text = mb_convert_encoding($text, 'UTF-8', 'UTF-8');

            // Remove null bytes and dangerous control characters
            $text = preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/', '', $text);

            // Ensure it's valid UTF-8
            if (!mb_check_encoding($text, 'UTF-8')) {
                Log::warning('Invalid UTF-8 detected, using fallback');
                return '(Invalid encoding)';
            }

            // Truncate if extremely long (prevent memory issues)
            if (mb_strlen($text) > 50000) {
                $text = mb_substr($text, 0, 50000) . '... (truncated)';
            }

            return $text;
        } catch (\Exception $e) {
            Log::warning('Text sanitization failed', [
                'original_length' => strlen($text ?? ''),
                'error' => $e->getMessage(),
            ]);
            return '(Text encoding error)';
        }
    }

    /**
     * Extract body content from Gmail message 📄 - SAFE VERSION
     */
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

            // Handle multipart messages
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
                        Log::warning('Failed to extract part body', [
                            'error' => $e->getMessage(),
                        ]);
                        continue;
                    }
                }
            }
        } catch (\Exception $e) {
            Log::warning('Failed to extract body content', [
                'error' => $e->getMessage(),
            ]);
        }

        return $body;
    }

    /**
     * Setup Gmail client for specific account 🔧
     */
    private function setupClientForAccount(EmailAccount $account): void
    {
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

            // Update account with new token
            $account->update([
                'encrypted_access_token' => $newToken['access_token'],
                'token_expires_at' => isset($newToken['expires_in']) ?
                    now()->addSeconds($newToken['expires_in']) : null,
                'last_sync' => now(),
            ]);
        }
    }

    /**
     * Helper methods for parsing email data 🛠️ - ALL SAFE VERSIONS
     */
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

    /**
     * Sync all messages for user's accounts 🔄
     */
    public function syncAllAccountsForUser(int $userId): array
    {
        $accounts = EmailAccount::where('user_id', $userId)
            ->where('is_connected', true)
            ->where('status', 'active')
            ->get();

        $results = [];

        foreach ($accounts as $account) {
            try {
                $result = $this->fetchInboxMessages($account);
                $results[$account->id] = $result;
            } catch (\Exception $e) {
                Log::error('Failed to sync account', [
                    'account_id' => $account->id,
                    'error' => $e->getMessage(),
                ]);
                $results[$account->id] = [
                    'success' => false,
                    'error' => $e->getMessage(),
                ];
            }
        }

        return $results;
    }
}
