<?php

namespace App\Services;

use App\Models\EmailAccount;
use App\Models\EmailBatch;
use App\Jobs\ProcessEmailBatchJob;
use App\Jobs\SendBatchEmailJob;
use Google\Client;
use Google\Service\Gmail;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Collection;

class GmailBatchService
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
            Gmail::GMAIL_SEND,
            Gmail::GMAIL_READONLY,
            Gmail::GMAIL_MODIFY,
            'https://www.googleapis.com/auth/userinfo.email',
        ]);
    }

    /**
     * Create and queue email batches for a campaign
     */
    public function createBatchCampaign(EmailAccount $account, array $recipients, array $emailTemplate, array $options = []): array
    {
        try {
            // Validate account can send
            if (!$this->canAccountSend($account)) {
                throw new \Exception('Account is not ready to send emails');
            }

            $settings = $account->settings ?? [];
            $batchSize = $settings['batch_size'] ?? 50;
            $delayMinutes = $settings['batch_delay_minutes'] ?? 60;

            // Split recipients into batches
            $recipientBatches = collect($recipients)->chunk($batchSize);
            $totalBatches = $recipientBatches->count();
            $campaignId = 'campaign_' . time() . '_' . $account->id;

            Log::info('Creating batch campaign', [
                'account_id' => $account->id,
                'campaign_id' => $campaignId,
                'total_recipients' => count($recipients),
                'total_batches' => $totalBatches,
                'batch_size' => $batchSize,
                'delay_minutes' => $delayMinutes,
            ]);

            $batches = [];
            $currentDelay = 0;

            foreach ($recipientBatches as $index => $batchRecipients) {
                $batch = EmailBatch::create([
                    'user_id' => $account->user_id,
                    'email_account_id' => $account->id,
                    'campaign_id' => $campaignId,
                    'batch_number' => $index + 1,
                    'total_batches' => $totalBatches,
                    'recipients' => $batchRecipients->toArray(),
                    'email_template' => $emailTemplate,
                    'status' => 'pending',
                    'scheduled_at' => now()->addMinutes($currentDelay),
                    'batch_size' => $batchRecipients->count(),
                    'settings' => [
                        'sender_name' => $settings['sender_name'] ?? '',
                        'reply_to_email' => $settings['reply_to_email'] ?? $account->email,
                        'signature' => $settings['signature'] ?? '',
                        'tracking_enabled' => $settings['tracking_enabled'] ?? true,
                        'auto_unsubscribe' => $settings['auto_unsubscribe'] ?? true,
                    ],
                    'metadata' => [
                        'created_at' => now()->toISOString(),
                        'account_email' => $account->email,
                        'batch_delay_minutes' => $delayMinutes,
                    ],
                ]);

                // Queue the batch job with delay
                ProcessEmailBatchJob::dispatch($batch)
                    ->delay(now()->addMinutes($currentDelay));

                $batches[] = $batch;
                $currentDelay += $delayMinutes;
            }

            // Update account metadata
            $account->update([
                'metadata' => array_merge($account->metadata ?? [], [
                    'last_campaign_id' => $campaignId,
                    'last_campaign_created' => now()->toISOString(),
                    'total_campaigns' => ($account->metadata['total_campaigns'] ?? 0) + 1,
                ]),
            ]);

            return [
                'success' => true,
                'campaign_id' => $campaignId,
                'total_batches' => $totalBatches,
                'total_recipients' => count($recipients),
                'estimated_completion' => now()->addMinutes($currentDelay - $delayMinutes),
                'batches' => $batches,
            ];
        } catch (\Exception $e) {
            Log::error('Failed to create batch campaign', [
                'account_id' => $account->id,
                'error' => $e->getMessage(),
                'recipients_count' => count($recipients),
            ]);

            return [
                'success' => false,
                'error' => $e->getMessage(),
            ];
        }
    }

    /**
     * Process a single email batch
     */
    public function processBatch(EmailBatch $batch): array
    {
        try {
            Log::info('Processing email batch', [
                'batch_id' => $batch->id,
                'campaign_id' => $batch->campaign_id,
                'batch_number' => $batch->batch_number,
                'recipient_count' => $batch->batch_size,
            ]);

            // Update batch status
            $batch->update([
                'status' => 'processing',
                'started_at' => now(),
            ]);

            $account = $batch->emailAccount;
            $this->setupClientForAccount($account);
            $this->gmail = new Gmail($this->client);

            $successCount = 0;
            $errorCount = 0;
            $errors = [];

            foreach ($batch->recipients as $recipient) {
                try {
                    // Check daily limit
                    if ($account->daily_sent >= $account->daily_limit) {
                        throw new \Exception('Daily sending limit reached');
                    }

                    // Prepare email data
                    $emailData = $this->prepareEmailData($recipient, $batch);

                    // Send email via Gmail API
                    $result = $this->sendSingleEmail($emailData);

                    if ($result['success']) {
                        $successCount++;
                        $account->incrementSentCount();
                    } else {
                        $errorCount++;
                        $errors[] = [
                            'recipient' => $recipient['email'] ?? 'unknown',
                            'error' => $result['error'],
                        ];
                    }

                    // Small delay between emails in the same batch
                    usleep(500000); // 0.5 seconds
                } catch (\Exception $e) {
                    $errorCount++;
                    $errors[] = [
                        'recipient' => $recipient['email'] ?? 'unknown',
                        'error' => $e->getMessage(),
                    ];

                    Log::error('Failed to send email in batch', [
                        'batch_id' => $batch->id,
                        'recipient' => $recipient['email'] ?? 'unknown',
                        'error' => $e->getMessage(),
                    ]);
                }
            }

            // Update batch with results
            $batch->update([
                'status' => $errorCount === 0 ? 'completed' : 'completed_with_errors',
                'completed_at' => now(),
                'sent_count' => $successCount,
                'error_count' => $errorCount,
                'errors' => $errors,
                'metadata' => array_merge($batch->metadata ?? [], [
                    'processing_completed' => now()->toISOString(),
                    'success_rate' => $batch->batch_size > 0 ? ($successCount / $batch->batch_size) * 100 : 0,
                ]),
            ]);

            Log::info('Batch processing completed', [
                'batch_id' => $batch->id,
                'success_count' => $successCount,
                'error_count' => $errorCount,
                'success_rate' => $batch->batch_size > 0 ? ($successCount / $batch->batch_size) * 100 : 0,
            ]);

            return [
                'success' => true,
                'sent_count' => $successCount,
                'error_count' => $errorCount,
                'errors' => $errors,
            ];
        } catch (\Exception $e) {
            $batch->update([
                'status' => 'failed',
                'completed_at' => now(),
                'errors' => [['error' => $e->getMessage()]],
            ]);

            Log::error('Batch processing failed', [
                'batch_id' => $batch->id,
                'error' => $e->getMessage(),
            ]);

            return [
                'success' => false,
                'error' => $e->getMessage(),
            ];
        }
    }

    /**
     * Send a single email via Gmail API
     */
    private function sendSingleEmail(array $emailData): array
    {
        try {
            $message = new \Google\Service\Gmail\Message();
            $rawMessage = $this->createRawMessage($emailData);
            $message->setRaw($rawMessage);

            $result = $this->gmail->users_messages->send('me', $message);

            return [
                'success' => true,
                'message_id' => $result->getId(),
            ];
        } catch (\Exception $e) {
            return [
                'success' => false,
                'error' => $e->getMessage(),
            ];
        }
    }

    /**
     * Prepare email data for a recipient
     */
    private function prepareEmailData(array $recipient, EmailBatch $batch): array
    {
        $template = $batch->email_template;
        $settings = $batch->settings;

        // Replace placeholders in template
        $subject = $this->replacePlaceholders($template['subject'] ?? 'Confirmation Required', $recipient);
        $body = $this->replacePlaceholders($template['body'] ?? '', $recipient);

        // Add signature if configured
        if (!empty($settings['signature'])) {
            $body .= "\n\n" . $settings['signature'];
        }

        // Add unsubscribe link if enabled
        if ($settings['auto_unsubscribe'] ?? true) {
            $unsubscribeUrl = route('unsubscribe', ['email' => $recipient['email'], 'token' => hash('sha256', $recipient['email'] . config('app.key'))]);
            $body .= "\n\n<p><small><a href=\"{$unsubscribeUrl}\">Unsubscribe</a></small></p>";
        }

        return [
            'to' => $recipient['email'],
            'to_name' => $recipient['name'] ?? '',
            'from' => $batch->emailAccount->email,
            'from_name' => $settings['sender_name'] ?? '',
            'reply_to' => $settings['reply_to_email'] ?? $batch->emailAccount->email,
            'subject' => $subject,
            'body' => $body,
        ];
    }

    /**
     * Replace placeholders in email content
     */
    private function replacePlaceholders(string $content, array $recipient): string
    {
        $placeholders = [
            '{{name}}' => $recipient['name'] ?? '',
            '{{email}}' => $recipient['email'] ?? '',
            '{{first_name}}' => $recipient['first_name'] ?? explode(' ', $recipient['name'] ?? '')[0] ?? '',
            '{{confirmation_url}}' => $recipient['confirmation_url'] ?? '',
            '{{token}}' => $recipient['token'] ?? '',
        ];

        return str_replace(array_keys($placeholders), array_values($placeholders), $content);
    }

    /**
     * Setup Gmail client for account
     */
    private function setupClientForAccount(EmailAccount $account): void
    {
        $this->client->setAccessToken([
            'access_token' => $account->encrypted_access_token,
            'refresh_token' => $account->encrypted_refresh_token,
            'expires_in' => $account->token_expires_at ?
                $account->token_expires_at->diffInSeconds(now()) : 3600,
        ]);

        if ($this->client->isAccessTokenExpired()) {
            $newToken = $this->client->fetchAccessTokenWithRefreshToken($account->encrypted_refresh_token);
            if (isset($newToken['error'])) {
                throw new \Exception('Token refresh failed: ' . $newToken['error']);
            }

            $account->update([
                'encrypted_access_token' => $newToken['access_token'],
                'token_expires_at' => isset($newToken['expires_in']) ?
                    now()->addSeconds($newToken['expires_in']) : null,
            ]);
        }
    }

    /**
     * Create raw email message for Gmail API
     */
    private function createRawMessage(array $emailData): string
    {
        $to = $emailData['to'];
        $subject = $emailData['subject'] ?? 'No Subject';
        $body = $emailData['body'] ?? '';
        $from = $emailData['from_name'] ? "{$emailData['from_name']} <{$emailData['from']}>" : $emailData['from'];
        $replyTo = $emailData['reply_to'] ?? $emailData['from'];

        $rawMessage = "To: {$to}\r\n";
        $rawMessage .= "From: {$from}\r\n";
        $rawMessage .= "Reply-To: {$replyTo}\r\n";
        $rawMessage .= "Subject: {$subject}\r\n";
        $rawMessage .= "Content-Type: text/html; charset=utf-8\r\n\r\n";
        $rawMessage .= $body;

        return base64url_encode($rawMessage);
    }

    /**
     * Check if account can send emails
     */
    private function canAccountSend(EmailAccount $account): bool
    {
        $settings = $account->settings ?? [];
        return $account->is_connected
            && $account->status === 'active'
            && !empty($settings['setup_completed_at'])
            && $account->daily_sent < $account->daily_limit;
    }

    /**
     * Get batch campaign status
     */
    public function getCampaignStatus(string $campaignId): array
    {
        $batches = EmailBatch::where('campaign_id', $campaignId)->get();

        if ($batches->isEmpty()) {
            return ['success' => false, 'error' => 'Campaign not found'];
        }

        $totalBatches = $batches->count();
        $completedBatches = $batches->whereIn('status', ['completed', 'completed_with_errors'])->count();
        $failedBatches = $batches->where('status', 'failed')->count();
        $totalSent = $batches->sum('sent_count');
        $totalErrors = $batches->sum('error_count');
        $totalRecipients = $batches->sum('batch_size');

        return [
            'success' => true,
            'campaign_id' => $campaignId,
            'total_batches' => $totalBatches,
            'completed_batches' => $completedBatches,
            'failed_batches' => $failedBatches,
            'progress_percentage' => $totalBatches > 0 ? ($completedBatches / $totalBatches) * 100 : 0,
            'total_recipients' => $totalRecipients,
            'total_sent' => $totalSent,
            'total_errors' => $totalErrors,
            'success_rate' => $totalRecipients > 0 ? ($totalSent / $totalRecipients) * 100 : 0,
            'status' => $this->determineCampaignStatus($batches),
            'batches' => $batches->map(function ($batch) {
                return [
                    'id' => $batch->id,
                    'batch_number' => $batch->batch_number,
                    'status' => $batch->status,
                    'batch_size' => $batch->batch_size,
                    'sent_count' => $batch->sent_count,
                    'error_count' => $batch->error_count,
                    'scheduled_at' => $batch->scheduled_at?->toISOString(),
                    'started_at' => $batch->started_at?->toISOString(),
                    'completed_at' => $batch->completed_at?->toISOString(),
                ];
            }),
        ];
    }

    /**
     * Determine overall campaign status
     */
    private function determineCampaignStatus(Collection $batches): string
    {
        $statuses = $batches->pluck('status')->unique();

        if ($statuses->contains('processing')) {
            return 'processing';
        }

        if ($statuses->contains('pending')) {
            return 'pending';
        }

        if ($statuses->contains('failed')) {
            return $statuses->every(fn($status) => $status === 'failed') ? 'failed' : 'completed_with_errors';
        }

        return 'completed';
    }
}

// Helper function for base64url encoding
if (!function_exists('base64url_encode')) {
    function base64url_encode($data)
    {
        return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
    }
}
