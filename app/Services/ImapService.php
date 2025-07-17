<?php

namespace App\Services;

use App\Models\EmailAccount;
use App\Models\Campaign;
use App\Models\EmailLog;
use App\Models\Lead;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\DB;

class ImapService
{
    /**
     * Test connection for cold email sending 🚀
     */
    public function testConnection(EmailAccount $account): array
    {
        try {
            Log::info('🔥 Testing cold email account connection', [
                'account_id' => $account->id,
                'email' => $account->email,
                'daily_limit' => $account->daily_limit,
            ]);

            // Test IMAP (for reading replies)
            $imapResult = $this->testImapConnection($account);
            if (!$imapResult['success']) {
                return $imapResult;
            }

            // Test SMTP (for sending campaigns)
            $smtpResult = $this->testSmtpConnection($account);
            if (!$smtpResult['success']) {
                return $smtpResult;
            }

            // Update account for cold email sending
            $account->update([
                'status' => 'active',
                'is_connected' => true,
                'is_verified' => true,
                'consecutive_errors' => 0,
                'last_error' => null,
                'last_health_check' => now(),
                'last_activity' => now(),
                'reputation' => 'good', // Start with good reputation
                'bounce_rate' => 0,
                'complaint_rate' => 0,
                'success_rate' => 100,
                'metadata' => array_merge($account->metadata ?? [], [
                    'connection_tested_at' => now()->toISOString(),
                    'cold_email_ready' => true,
                    'warmup_needed' => $account->warmup_progress < 100,
                    'sending_capacity' => $this->calculateSendingCapacity($account),
                ]),
            ]);

            Log::info('✅ Cold email account ready!', [
                'account_id' => $account->id,
                'daily_limit' => $account->daily_limit,
                'warmup_progress' => $account->warmup_progress,
            ]);

            return [
                'success' => true,
                'message' => '✅ Account ready for cold email campaigns!',
                'sending_capacity' => $this->calculateSendingCapacity($account),
                'warmup_needed' => $account->warmup_progress < 100,
            ];

        } catch (\Exception $e) {
            Log::error('💥 Cold email account test failed', [
                'account_id' => $account->id,
                'error' => $e->getMessage(),
            ]);

            return [
                'success' => false,
                'error' => 'Connection failed: ' . $e->getMessage(),
            ];
        }
    }

    /**
     * Send cold email campaign 📧
     */
    public function sendColdEmail(EmailAccount $account, Lead $lead, Campaign $campaign): array
    {
        try {
            // Check if account can send
            if (!$this->canAccountSend($account)) {
                return [
                    'success' => false,
                    'error' => 'Account cannot send: limits reached or account issues',
                ];
            }

            // Personalize email content
            $personalizedContent = $this->personalizeEmailContent(
                $campaign->email_template,
                $lead,
                $campaign
            );

            // Send via SMTP
            $result = $this->sendViaSMTP($account, [
                'to' => $lead->email,
                'to_name' => $lead->first_name . ' ' . $lead->last_name,
                'subject' => $this->personalizeSubject($campaign->subject, $lead),
                'body' => $personalizedContent,
                'campaign_id' => $campaign->id,
                'lead_id' => $lead->id,
            ]);

            if ($result['success']) {
                // Log successful send
                EmailLog::create([
                    'email_account_id' => $account->id,
                    'campaign_id' => $campaign->id,
                    'lead_id' => $lead->id,
                    'type' => 'sent',
                    'status' => 'delivered',
                    'subject' => $this->personalizeSubject($campaign->subject, $lead),
                    'message_id' => $result['message_id'],
                    'sent_at' => now(),
                    'metadata' => [
                        'smtp_response' => $result['smtp_response'] ?? null,
                        'personalization_used' => true,
                    ],
                ]);

                // Update account stats
                $account->increment('daily_sent');
                $account->increment('hourly_sent');
                $account->update(['last_activity' => now()]);

                // Update campaign stats
                $campaign->increment('emails_sent');

                // Update lead status
                $lead->update([
                    'status' => 'contacted',
                    'last_contacted_at' => now(),
                ]);

                Log::info('✅ Cold email sent successfully', [
                    'account_id' => $account->id,
                    'lead_id' => $lead->id,
                    'campaign_id' => $campaign->id,
                    'message_id' => $result['message_id'],
                ]);
            }

            return $result;

        } catch (\Exception $e) {
            Log::error('❌ Cold email sending failed', [
                'account_id' => $account->id,
                'lead_id' => $lead->id,
                'error' => $e->getMessage(),
            ]);

            return [
                'success' => false,
                'error' => $e->getMessage(),
            ];
        }
    }

    /**
     * Check for replies and track engagement 📬
     */
    public function checkForReplies(EmailAccount $account): array
    {
        try {
            $host = Crypt::decryptString($account->encrypted_imap_host);
            $port = $account->imap_port;
            $email = $account->email;
            $password = Crypt::decryptString($account->encrypted_password);
            $encryption = $account->encryption_type ?? 'tls';

            // Build connection
            $flags = '/imap';
            if ($port == 993 || $encryption === 'ssl') {
                $flags .= '/ssl';
            } else {
                $flags .= '/tls';
            }
            $flags .= '/novalidate-cert';

            $mailbox = "{{$host}:{$port}{$flags}}INBOX";
            $connection = @imap_open($mailbox, $email, $password);

            if (!$connection) {
                throw new \Exception('Failed to connect to IMAP for reply checking');
            }

            // Get unread emails
            $unreadEmails = imap_search($connection, 'UNSEEN');
            $repliesFound = 0;

            if ($unreadEmails) {
                foreach ($unreadEmails as $emailNumber) {
                    $header = imap_headerinfo($connection, $emailNumber);
                    $body = imap_body($connection, $emailNumber);

                    // Check if this is a reply to our campaign
                    $originalMessageId = $this->extractOriginalMessageId($header, $body);
                    
                    if ($originalMessageId) {
                        $emailLog = EmailLog::where('message_id', $originalMessageId)->first();
                        
                        if ($emailLog) {
                            // This is a reply to our cold email!
                            EmailLog::create([
                                'email_account_id' => $account->id,
                                'campaign_id' => $emailLog->campaign_id,
                                'lead_id' => $emailLog->lead_id,
                                'type' => 'reply',
                                'status' => 'received',
                                'subject' => $header->subject ?? '',
                                'body' => $body,
                                'received_at' => now(),
                                'metadata' => [
                                    'original_message_id' => $originalMessageId,
                                    'reply_from' => $header->fromaddress ?? '',
                                    'reply_sentiment' => $this->analyzeSentiment($body),
                                ],
                            ]);

                            // Update lead status
                            if ($emailLog->lead) {
                                $emailLog->lead->update([
                                    'status' => 'replied',
                                    'last_reply_at' => now(),
                                ]);
                            }

                            // Update campaign stats
                            if ($emailLog->campaign) {
                                $emailLog->campaign->increment('replies_received');
                            }

                            $repliesFound++;
                        }
                    }

                    // Mark as read
                    imap_setflag_full($connection, $emailNumber, "\\Seen");
                }
            }

            imap_close($connection);

            Log::info('📬 Reply check completed', [
                'account_id' => $account->id,
                'replies_found' => $repliesFound,
            ]);

            return [
                'success' => true,
                'replies_found' => $repliesFound,
            ];

        } catch (\Exception $e) {
            Log::error('❌ Reply checking failed', [
                'account_id' => $account->id,
                'error' => $e->getMessage(),
            ]);

            return [
                'success' => false,
                'error' => $e->getMessage(),
            ];
        }
    }

    /**
     * Warmup email account for better deliverability 🔥
     */
    public function sendWarmupEmail(EmailAccount $account): array
    {
        try {
            // Get warmup settings
            $warmupDay = $account->warmup_day ?? 1;
            $emailsToSend = $this->getWarmupEmailCount($warmupDay);

            // Send warmup emails to internal addresses
            $warmupEmails = $this->getWarmupEmailAddresses();
            $sent = 0;

            foreach (array_slice($warmupEmails, 0, $emailsToSend) as $warmupEmail) {
                $result = $this->sendViaSMTP($account, [
                    'to' => $warmupEmail,
                    'to_name' => 'Warmup Contact',
                    'subject' => $this->generateWarmupSubject(),
                    'body' => $this->generateWarmupContent(),
                    'is_warmup' => true,
                ]);

                if ($result['success']) {
                    $sent++;
                }

                // Small delay between warmup emails
                usleep(rand(5000000, 15000000)); // 5-15 seconds
            }

            // Update warmup progress
            $newProgress = min(100, ($warmupDay / 30) * 100);
            $account->update([
                'warmup_progress' => $newProgress,
                'warmup_day' => $warmupDay + 1,
                'warmup_emails_today' => $sent,
                'last_warmup_at' => now(),
            ]);

            Log::info('🔥 Warmup emails sent', [
                'account_id' => $account->id,
                'emails_sent' => $sent,
                'warmup_progress' => $newProgress,
            ]);

            return [
                'success' => true,
                'emails_sent' => $sent,
                'warmup_progress' => $newProgress,
            ];

        } catch (\Exception $e) {
            Log::error('❌ Warmup failed', [
                'account_id' => $account->id,
                'error' => $e->getMessage(),
            ]);

            return [
                'success' => false,
                'error' => $e->getMessage(),
            ];
        }
    }

    // Private helper methods...

    private function testImapConnection(EmailAccount $account): array
    {
        try {
            $host = Crypt::decryptString($account->encrypted_imap_host);
            $port = $account->imap_port;
            $email = $account->email;
            $password = Crypt::decryptString($account->encrypted_password);
            $encryption = $account->encryption_type ?? 'tls';

            if (!extension_loaded('imap')) {
                throw new \Exception('PHP IMAP extension required for cold email platform');
            }

            $flags = '/imap';
            if ($port == 993 || $encryption === 'ssl') {
                $flags .= '/ssl';
            } else {
                $flags .= '/tls';
            }
            $flags .= '/novalidate-cert';

            $mailbox = "{{$host}:{$port}{$flags}}INBOX";
            $connection = @imap_open($mailbox, $email, $password, OP_HALFOPEN, 3);

            if (!$connection) {
                $error = imap_last_error() ?: 'IMAP connection failed';
                throw new \Exception($error);
            }

            imap_close($connection);

            return ['success' => true];

        } catch (\Exception $e) {
            return [
                'success' => false,
                'error' => 'IMAP: ' . $e->getMessage(),
            ];
        }
    }

    private function testSmtpConnection(EmailAccount $account): array
    {
        try {
            $host = Crypt::decryptString($account->encrypted_smtp_host);
            $port = $account->smtp_port;
            $email = $account->email;
            $password = Crypt::decryptString($account->encrypted_password);

            // Basic socket test
            $socket = @stream_socket_client("tcp://{$host}:{$port}", $errno, $errstr, 10);
            if (!$socket) {
                throw new \Exception("SMTP connection failed: {$errstr}");
            }

            $response = fgets($socket, 512);
            fclose($socket);

            if (!str_starts_with($response, '220')) {
                throw new \Exception('Invalid SMTP response: ' . trim($response));
            }

            return ['success' => true];

        } catch (\Exception $e) {
            return [
                'success' => false,
                'error' => 'SMTP: ' . $e->getMessage(),
            ];
        }
    }

    private function sendViaSMTP(EmailAccount $account, array $emailData): array
    {
        try {
            $host = Crypt::decryptString($account->encrypted_smtp_host);
            $port = $account->smtp_port;
            $email = $account->email;
            $password = Crypt::decryptString($account->encrypted_password);
            $encryption = $account->encryption_type ?? 'tls';

            // Create socket connection
            if ($encryption === 'ssl' || $port == 465) {
                $socket = @stream_socket_client("ssl://{$host}:{$port}", $errno, $errstr, 30);
            } else {
                $socket = @stream_socket_client("tcp://{$host}:{$port}", $errno, $errstr, 30);
            }

            if (!$socket) {
                throw new \Exception("SMTP connection failed: {$errstr}");
            }

            // SMTP conversation
            $this->smtpCommand($socket, null, '220');
            $this->smtpCommand($socket, "EHLO " . gethostname(), '250');

            // Start TLS if needed
            if (($encryption === 'tls' || $port == 587) && $port != 465) {
                $this->smtpCommand($socket, "STARTTLS", '220');
                stream_socket_enable_crypto($socket, true, STREAM_CRYPTO_METHOD_TLS_CLIENT);
                $this->smtpCommand($socket, "EHLO " . gethostname(), '250');
            }

            // Authenticate
            $this->smtpCommand($socket, "AUTH LOGIN", '334');
            $this->smtpCommand($socket, base64_encode($email), '334');
            $this->smtpCommand($socket, base64_encode($password), '235');

            // Send email
            $this->smtpCommand($socket, "MAIL FROM:<{$email}>", '250');
            $this->smtpCommand($socket, "RCPT TO:<{$emailData['to']}>", '250');
            $this->smtpCommand($socket, "DATA", '354');

            // Build email with tracking
            $messageId = uniqid() . '@' . parse_url($email, PHP_URL_HOST);
            $emailContent = $this->buildColdEmailContent($emailData, $messageId);

            fwrite($socket, $emailContent . "\r\n.\r\n");
            $response = fgets($socket, 512);

            if (!str_starts_with($response, '250')) {
                throw new \Exception('Email sending failed: ' . trim($response));
            }

            $this->smtpCommand($socket, "QUIT", '221');
            fclose($socket);

            return [
                'success' => true,
                'message_id' => $messageId,
                'smtp_response' => trim($response),
            ];

        } catch (\Exception $e) {
            if (isset($socket)) {
                @fclose($socket);
            }

            return [
                'success' => false,
                'error' => $e->getMessage(),
            ];
        }
    }

    private function smtpCommand($socket, ?string $command, string $expectedCode): void
    {
        if ($command !== null) {
            fwrite($socket, $command . "\r\n");
        }

        $response = fgets($socket, 512);
        if (!str_starts_with($response, $expectedCode)) {
            throw new \Exception("SMTP error. Expected {$expectedCode}, got: " . trim($response));
        }
    }
  
private function buildColdEmailContent(array $emailData, string $messageId): string
{
    $trackingPixel = config('app.url') . "/track/open/{$emailData['campaign_id']}/{$emailData['lead_id']}";

    // Fix: assign variables first
    $fromName = isset($emailData['from_name']) ? $emailData['from_name'] : 'Sales Team';
    $fromEmail = isset($emailData['from']) ? $emailData['from'] : $emailData['to'];
    $toName = isset($emailData['to_name']) ? $emailData['to_name'] : '';
    $toEmail = $emailData['to'];

    $headers = [
        "From: {$fromName} <{$fromEmail}>",
        "To: {$toName} <{$toEmail}>",
        "Subject: {$emailData['subject']}",
        "MIME-Version: 1.0",
        "Content-Type: text/html; charset=UTF-8",
        "Message-ID: <{$messageId}>",
        "Date: " . date('r'),
        "X-Mailer: ColdEmailPlatform/1.0",
    ];

    $body = $emailData['body'];

    // Add tracking pixel for opens
    if (!($emailData['is_warmup'] ?? false)) {
        $body .= "<img src=\"{$trackingPixel}\" width=\"1\" height=\"1\" style=\"display:none;\">";
    }

    return implode("\r\n", $headers) . "\r\n\r\n" . $body;
}

    private function personalizeEmailContent(string $template, Lead $lead, Campaign $campaign): string
    {
        $replacements = [
            '{{first_name}}' => $lead->first_name,
            '{{last_name}}' => $lead->last_name,
            '{{company}}' => $lead->company,
            '{{title}}' => $lead->title,
            '{{industry}}' => $lead->industry,
            '{{campaign_name}}' => $campaign->name,
        ];

        return str_replace(array_keys($replacements), array_values($replacements), $template);
    }

    private function personalizeSubject(string $subject, Lead $lead): string
    {
        return str_replace([
            '{{first_name}}',
            '{{company}}',
        ], [
            $lead->first_name,
            $lead->company,
        ], $subject);
    }

    private function canAccountSend(EmailAccount $account): bool
    {
        return $account->is_connected
            && $account->status === 'active'
            && $account->daily_sent < $account->daily_limit
            && $account->hourly_sent < $account->hourly_limit
            && $account->consecutive_errors < 3;
    }

    private function calculateSendingCapacity(EmailAccount $account): int
    {
        $dailyRemaining = $account->daily_limit - $account->daily_sent;
        $hourlyRemaining = $account->hourly_limit - $account->hourly_sent;
        
        return min($dailyRemaining, $hourlyRemaining * 8); // Estimate daily based on hourly
    }

    private function getWarmupEmailCount(int $day): int
    {
        // Gradual warmup schedule
        if ($day <= 5) return 5;
        if ($day <= 10) return 10;
        if ($day <= 15) return 15;
        if ($day <= 20) return 20;
        return 25;
    }

    private function getWarmupEmailAddresses(): array
    {
        return [
            'warmup1@yourdomain.com',
            'warmup2@yourdomain.com',
            'warmup3@yourdomain.com',
            // Add more warmup addresses
        ];
    }

    private function generateWarmupSubject(): string
    {
        $subjects = [
            'Quick question about your business',
            'Following up on our conversation',
            'Thought you might find this interesting',
            'Quick update from our team',
        ];

        return $subjects[array_rand($subjects)];
    }

    private function generateWarmupContent(): string
    {
        return "Hi there,\n\nHope you're having a great day!\n\nBest regards,\nThe Team";
    }

    private function extractOriginalMessageId($header, $body): ?string
    {
        // Extract Message-ID from In-Reply-To or References headers
        if (isset($header->in_reply_to)) {
            return trim($header->in_reply_to, '<>');
        }

        if (isset($header->references)) {
            $refs = explode(' ', $header->references);
            return trim(end($refs), '<>');
        }

        return null;
    }

    private function analyzeSentiment(string $body): string
    {
        $positiveWords = ['interested', 'yes', 'sure', 'sounds good', 'let\'s talk'];
        $negativeWords = ['not interested', 'no', 'remove', 'unsubscribe', 'stop'];

        $bodyLower = strtolower($body);
        
        foreach ($positiveWords as $word) {
            if (strpos($bodyLower, $word) !== false) {
                return 'positive';
            }
        }

        foreach ($negativeWords as $word) {
            if (strpos($bodyLower, $word) !== false) {
                return 'negative';
            }
        }

        return 'neutral';
    }
}
