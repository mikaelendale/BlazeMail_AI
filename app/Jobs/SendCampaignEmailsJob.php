<?php

namespace App\Jobs;

use App\Models\Campaign;
use App\Models\Contact;
use App\Models\CampaignExecution;
use App\Services\AIPersonalizationService;
use App\Services\GmailService;
use App\Services\CampaignService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;

class SendCampaignEmailsJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    protected $campaignId;
    protected $groupIndex;
    protected $emailIndex;
    protected $batchSize;

    public $timeout = 600; // 10 minutes timeout
    public $tries = 3;
    public $backoff = [60, 180, 300]; // Retry delays

    public function __construct(Campaign $campaign, int $groupIndex = 0, int $emailIndex = 0, int $batchSize = 25)
    {
        $this->campaignId = $campaign->id; // Store ID instead of object
        $this->groupIndex = $groupIndex;
        $this->emailIndex = $emailIndex;
        $this->batchSize = $batchSize;
    }

    /**
     * 🚀 MAIN JOB EXECUTION
     */
    public function handle(AIPersonalizationService $aiService, GmailService $emailService, CampaignService $campaignService)
    {
        try {
            Log::info("🚀 Starting email campaign job for campaign ID: {$this->campaignId}", [
                'group_index' => $this->groupIndex,
                'email_index' => $this->emailIndex,
                'batch_size' => $this->batchSize
            ]);

            // Load campaign initially
            $campaign = Campaign::find($this->campaignId);
            if (!$campaign) {
                Log::error("❌ Campaign (ID: {$this->campaignId}) not found at job start, stopping job.", ['campaign_id' => $this->campaignId]);
                return;
            }

            // ✅ CHECK CAMPAIGN STATUS
            if ($campaign->status !== 'active') {
                Log::info("⏸️ Campaign is not active, stopping job", [
                    'campaign_id' => $campaign->id,
                    'status' => $campaign->status
                ]);
                return;
            }

            // 📧 LOAD EMAIL ACCOUNT
            $campaign->load('emailAccount');
            if (!$campaign->emailAccount) {
                Log::error("❌ No email account found for campaign", ['campaign_id' => $campaign->id]);
                $this->fail(new \Exception('No email account configured'));
                return;
            }

            // 🔍 CHECK IF ACCOUNT CAN SEND
            if (!$campaign->emailAccount->canSendEmail()) {
                Log::warning("⚠️ Email account cannot send emails", [
                    'campaign_id' => $campaign->id,
                    'email_account_id' => $campaign->email_account_id,
                    'status' => $campaign->emailAccount->status,
                    'daily_sent' => $campaign->emailAccount->current_daily_sent ?? 0,
                    'daily_limit' => $campaign->emailAccount->daily_limit ?? 0
                ]);

                // Reschedule for tomorrow if daily limit reached
                if (($campaign->emailAccount->current_daily_sent ?? 0) >= ($campaign->emailAccount->daily_limit ?? 0)) {
                    $this->rescheduleForTomorrow($campaign);
                    return;
                }
                $this->fail(new \Exception('Email account cannot send emails'));
                return;
            }

            // 📋 GET CURRENT GROUP AND EMAIL
            $groups = $campaign->sequence_data['groups'] ?? [];
            if (!isset($groups[$this->groupIndex])) {
                Log::info("✅ No more groups to process - campaign complete", ['campaign_id' => $campaign->id]);
                $this->completeCampaign($campaign);
                return;
            }

            $currentGroup = $groups[$this->groupIndex];
            $emails = $currentGroup['emails'] ?? [];
            if (!isset($emails[$this->emailIndex])) {
                // Move to next group
                $this->scheduleNextGroup($campaign);
                return;
            }

            $currentEmail = $emails[$this->emailIndex];

            // 👥 GET RECIPIENTS
            $recipients = $campaignService->getCampaignRecipients($campaign);
            if ($recipients->isEmpty()) {
                Log::warning("⚠️ No recipients found for campaign", ['campaign_id' => $campaign->id]);
                $this->scheduleNextEmail($campaign);
                return;
            }

            Log::info("📊 Processing recipients", [
                'campaign_id' => $campaign->id,
                'recipient_count' => $recipients->count(),
                'current_email' => $currentEmail['subject'],
                'email_account' => $campaign->emailAccount->email,
            ]);

            // 📧 PROCESS RECIPIENTS IN BATCHES
            $totalSent = 0;
            $totalFailed = 0;
            foreach ($recipients->chunk($this->batchSize) as $batch) {
                $result = $this->processBatch(
                    $batch,
                    $aiService,
                    $emailService,
                    $currentEmail,
                    $currentGroup,
                    $this->campaignId // Pass campaign ID
                );
                $totalSent += $result['sent'];
                $totalFailed += $result['failed'];

                // Small delay between batches to avoid rate limiting
                if ($batch->count() === $this->batchSize) {
                    sleep(2); // 2 second delay between batches
                }
            }

            // Re-fetch campaign *immediately before* updating progress to ensure it's still valid
            Log::debug("DEBUG POINT 1: Before final campaign re-fetch. Campaign ID: {$this->campaignId}");
            $campaign = Campaign::find($this->campaignId);
            Log::debug("DEBUG POINT 2: After final campaign re-fetch. Campaign object is " . (is_null($campaign) ? "NULL" : "NOT NULL (ID: " . ($campaign->id ?? 'N/A') . ")"));

            if (!$campaign) {
                Log::warning("⚠️ Campaign (ID: {$this->campaignId}) was deleted or became null after batch processing, stopping progress update and further processing.", ['campaign_id' => $this->campaignId]);
                return; // Campaign was deleted, stop here.
            }

            try {
                Log::debug("DEBUG POINT 3: Campaign is confirmed NOT NULL before calling updateCampaignProgress. Campaign ID: {$campaign->id}");
                // 📈 UPDATE CAMPAIGN PROGRESS
                $this->updateCampaignProgress($campaign, $currentGroup, $currentEmail, $totalSent, $totalFailed);
                Log::debug("DEBUG POINT 4: updateCampaignProgress completed successfully for Campaign ID: {$campaign->id}");
            } catch (\Exception $e) {
                Log::error("❌ Error during updateCampaignProgress for Campaign ID: {$campaign->id}", [
                    'error' => $e->getMessage(),
                    'trace' => $e->getTraceAsString()
                ]);
                // Pause the campaign on failure during progress update
                $campaign->update(['status' => 'paused']);
                $this->fail($e); // Mark job as failed
                return;
            }

            // ⏭️ SCHEDULE NEXT EMAIL
            $this->scheduleNextEmail($campaign);
        } catch (\Exception $e) {
            Log::error("❌ Campaign email job failed for campaign ID: {$this->campaignId}", [
                'group_index' => $this->groupIndex,
                'email_index' => $this->emailIndex,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            $this->fail($e);
        }
    }

    /**
     * 📦 PROCESS BATCH OF RECIPIENTS
     */
    protected function processBatch($recipients, AIPersonalizationService $aiService, GmailService $emailService, array $currentEmail, array $currentGroup, int $campaignId)
    {
        $sent = 0;
        $failed = 0;

        // Re-fetch campaign inside the batch processing for robustness
        $campaign = Campaign::find($campaignId);
        if (!$campaign) {
            Log::warning("Campaign not found during batch processing, skipping remaining recipients in batch.", ['campaign_id' => $campaignId]);
            return ['sent' => 0, 'failed' => $recipients->count()]; // Return all as failed if campaign is gone
        }
        $campaign->load('emailAccount'); // Ensure emailAccount is loaded

        foreach ($recipients as $recipient) {
            // Check for duplicates BEFORE creating a 'processing' record
            $alreadySent = CampaignExecution::where('campaign_id', $campaign->id)
                ->where('recipient_data->contact_id', $recipient->id)
                ->whereJsonContains('execution_log->email_id', $currentEmail['id'])
                ->whereIn('status', ['completed', 'simulated_sent']) // Check for both actual and simulated sends
                ->exists();

            if ($alreadySent) {
                Log::info("⏭️ Email already sent (or simulated) to recipient, skipping", [
                    'campaign_id' => $campaign->id,
                    'recipient_id' => $recipient->id,
                    'email_id' => $currentEmail['id']
                ]);
                continue; // Skip to next recipient
            }

            // Create a CampaignExecution record with 'processing' status before sending
            $execution = CampaignExecution::create([
                'campaign_id' => $campaign->id,
                'user_id' => $campaign->user_id,
                'recipient_data' => [
                    'contact_id' => $recipient->id,
                    'email' => $recipient->email,
                    'name' => $recipient->name ?? $recipient->email,
                    'company' => $recipient->company,
                    'classification' => $recipient->classification,
                ],
                'status' => 'processing', // Mark as processing before sending
                'scheduled_at' => now(),
                'execution_log' => [
                    'email_id' => $currentEmail['id'],
                    'subject' => $currentEmail['subject'],
                    'attempted_at' => now()->toISOString(),
                    'email_account_id' => $campaign->email_account_id,
                    'group_index' => $this->groupIndex,
                    'email_index' => $this->emailIndex,
                    'provider' => 'gmail_api',
                ]
            ]);

            try {
                // 🔍 CHECK DAILY LIMIT DURING PROCESSING
                $campaign->emailAccount->refresh();
                if (($campaign->emailAccount->current_daily_sent ?? 0) >= ($campaign->emailAccount->daily_limit ?? 0)) {
                    Log::warning("⚠️ Daily sending limit reached during batch processing", [
                        'campaign_id' => $campaign->id,
                        'email_account_id' => $campaign->email_account_id,
                        'current_sent' => $campaign->emailAccount->current_daily_sent ?? 0,
                        'limit' => $campaign->emailAccount->daily_limit ?? 0
                    ]);
                    // Reschedule remaining for tomorrow
                    $this->rescheduleForTomorrow($campaign);
                    // Update the current execution record to failed due to limit
                    $this->logEmailFailed($execution, $currentEmail, 'Daily sending limit reached.', $campaign);
                    break; // Stop processing this batch
                }

                // 🤖 PERSONALIZE EMAIL WITH AI
                $personalizedContent = $aiService->personalizeEmail([
                    'recipient' => $recipient,
                    'email_template' => $currentEmail,
                    'campaign_context' => [
                        'campaign_id' => $campaign->id,
                        'campaign_name' => $campaign->name,
                        'group_title' => $currentGroup['title'],
                        'sender_info' => $campaign->emailAccount->toArray(),
                        'unsubscribe_enabled' => $campaign->campaign_settings['unsubscribe_enabled'] ?? true,
                    ]
                ]);

                // Log the personalized content before "sending"
                Log::info("📧 SIMULATED SEND: Personalized email for {$recipient->email}", [
                    'campaign_id' => $campaign->id,
                    'recipient_id' => $recipient->id,
                    'subject' => $personalizedContent['subject'],
                    'content_preview' => substr($personalizedContent['content'], 0, 500) . (strlen($personalizedContent['content']) > 500 ? '...' : ''),
                    'personalization_applied' => $personalizedContent['personalization_applied'] ?? false
                ]);

                // 📧 COMMENTED OUT: SEND EMAIL VIA GMAIL SERVICE
                // $result = $emailService->sendEmail($campaign->emailAccount, [
                //     'to' => $recipient->email,
                //     'from' => $campaign->emailAccount->email,
                //     'subject' => $personalizedContent['subject'],
                //     'body' => $personalizedContent['content'],
                //     'html_content' => $personalizedContent['content'],
                //     'text_content' => strip_tags($personalizedContent['content']),
                //     'campaign_id' => $campaign->id,
                //     'recipient_id' => $recipient->id,
                // ]);

                // Simulate a successful send result for logging purposes
                $result = [
                    'success' => true,
                    'message_id' => 'simulated_message_id_' . uniqid(),
                    'provider_response' => ['status' => 'simulated_ok']
                ];

                if ($result['success']) {
                    // ✅ LOG SUCCESS - Update the existing execution record with simulated status
                    $this->logEmailSent($execution, $currentEmail, $result, $personalizedContent, $campaign);
                    $sent++;
                    Log::info("✅ Email personalization logged successfully (simulated send)", [
                        'campaign_id' => $campaign->id,
                        'recipient_email' => $recipient->email,
                        'message_id' => $result['message_id'] ?? null,
                        'personalization_applied' => $personalizedContent['personalization_applied'] ?? false
                    ]);
                } else {
                    // This block will now only be hit if personalization itself fails, not sending.
                    throw new \Exception($result['error'] ?? 'Unknown personalization error');
                }

                // ⏱️ SMALL DELAY BETWEEN EMAILS (still useful for simulating workload)
                usleep(500000); // 0.5 second delay

            } catch (\Exception $e) {
                Log::error("❌ Failed to personalize or simulate send email to recipient", [
                    'campaign_id' => $campaign->id,
                    'recipient_id' => $recipient->id,
                    'recipient_email' => $recipient->email,
                    'error' => $e->getMessage(),
                    'error_section' => 'EMAIL_PERSONALIZATION_OR_SIMULATION'
                ]);
                // 📝 LOG FAILURE - Update the existing execution record
                $this->logEmailFailed($execution, $currentEmail, $e->getMessage(), $campaign);
                $failed++;
            }
        }

        return ['sent' => $sent, 'failed' => $failed];
    }

    /**
     * Schedule next email in sequence
     */
    protected function scheduleNextEmail(Campaign $campaign)
    {
        $groups = $campaign->sequence_data['groups'] ?? [];
        $currentGroup = $groups[$this->groupIndex];
        $emails = $currentGroup['emails'] ?? [];

        // Check if there are more emails in current group
        if (isset($emails[$this->emailIndex + 1])) {
            // Schedule next email in same group (small delay)
            self::dispatch($campaign, $this->groupIndex, $this->emailIndex + 1, $this->batchSize)
                ->delay(now()->addMinutes(10)); // 10 minute delay between emails in same group

            Log::info("⏭️ Scheduled next email in same group", [
                'campaign_id' => $campaign->id,
                'group_index' => $this->groupIndex,
                'next_email_index' => $this->emailIndex + 1
            ]);
        } else {
            // Move to next group with delay
            $this->scheduleNextGroup($campaign);
        }
    }

    /**
     * Schedule next group in sequence
     */
    protected function scheduleNextGroup(Campaign $campaign)
    {
        $groups = $campaign->sequence_data['groups'] ?? [];
        if (!isset($groups[$this->groupIndex + 1])) {
            // Campaign completed
            $this->completeCampaign($campaign);
            return;
        }

        $nextGroup = $groups[$this->groupIndex + 1];
        $delay = $nextGroup['delay'];

        // Calculate delay in minutes
        $delayMinutes = ($delay['days'] * 24 * 60) + ($delay['hours'] * 60) + $delay['minutes'];
        // Minimum delay of 30 minutes between groups
        $delayMinutes = max($delayMinutes, 30);

        // Schedule next group
        self::dispatch($campaign, $this->groupIndex + 1, 0, $this->batchSize)
            ->delay(now()->addMinutes($delayMinutes));

        Log::info("⏭️ Scheduled next group", [
            'campaign_id' => $campaign->id,
            'next_group_index' => $this->groupIndex + 1,
            'delay_minutes' => $delayMinutes,
            'scheduled_for' => now()->addMinutes($delayMinutes)->toISOString()
        ]);
    }

    /**
     * Reschedule for tomorrow due to daily limits
     */
    protected function rescheduleForTomorrow(Campaign $campaign)
    {
        // Reset daily counter at midnight
        $campaign->emailAccount->update(['current_daily_sent' => 0]);

        // Schedule for tomorrow at 9 AM
        $tomorrow = Carbon::tomorrow()->setHour(9)->setMinute(0);
        self::dispatch($campaign, $this->groupIndex, $this->emailIndex, $this->batchSize)
            ->delay($tomorrow);

        Log::info("📅 Rescheduled campaign for tomorrow due to daily limits", [
            'campaign_id' => $campaign->id,
            'scheduled_for' => $tomorrow->toISOString(),
            'current_daily_sent' => $campaign->emailAccount->current_daily_sent ?? 0,
            'daily_limit' => $campaign->emailAccount->daily_limit ?? 0,
            'error_section' => 'DAILY_LIMIT_REACHED'
        ]);

        // Update campaign status to paused
        $campaign->update(['status' => 'paused']);
    }

    /**
     * Complete campaign
     */
    protected function completeCampaign(Campaign $campaign)
    {
        $campaign->update([
            'status' => 'completed',
            'completed_at' => now()
        ]);

        Log::info("🎉 Campaign completed successfully", [
            'campaign_id' => $campaign->id,
            'completed_at' => now()->toISOString()
        ]);
    }

    /**
     * Update campaign progress
     */
    protected function updateCampaignProgress(Campaign $campaign, array $currentGroup, array $currentEmail, int $sent, int $failed)
    {
        // Update sequence data with progress
        $sequenceData = $campaign->sequence_data;

        // Mark current group/email as in progress or completed
        foreach ($sequenceData['groups'] as &$group) {
            if (($group['id'] ?? null) === ($currentGroup['id'] ?? null)) { // Added null coalescing for safety
                $group['status'] = 'in-progress';
                $group['last_sent_at'] = now()->toISOString();
                $group['stats'] = [
                    'sent' => ($group['stats']['sent'] ?? 0) + $sent,
                    'failed' => ($group['stats']['failed'] ?? 0) + $failed,
                ];

                // If this is the last email in group, mark as completed
                if ($this->emailIndex === count($group['emails']) - 1) {
                    $group['status'] = 'completed';
                    $group['completed_at'] = now()->toISOString();
                }
                break;
            }
        }

        $campaign->update(['sequence_data' => $sequenceData]);

        Log::info("📈 Updated campaign progress", [
            'campaign_id' => $campaign->id,
            'group_id' => $currentGroup['id'] ?? 'N/A',
            'emails_sent' => $sent,
            'emails_failed' => $failed
        ]);
    }

    /**
     * Log successful email send (updates existing record)
     */
    protected function logEmailSent(CampaignExecution $execution, $email, $result, $personalizedContent, Campaign $campaign)
    {
        $execution->update([
            'status' => 'simulated_sent', // Changed to 'simulated_sent'
            'executed_at' => now(),
            'email_data' => [ // Store the personalized email data here
                'subject' => $personalizedContent['subject'],
                'content' => $personalizedContent['content'],
            ],
            'message_id' => $result['message_id'] ?? null, // Still store simulated message ID
            'personalization_applied' => $personalizedContent['personalization_applied'] ?? false,
            'execution_log' => array_merge($execution->execution_log ?? [], [
                'personalized_subject' => $personalizedContent['subject'],
                'message_id' => $result['message_id'] ?? null,
                'personalization_applied' => $personalizedContent['personalization_applied'] ?? false,
                'sent_at' => now()->toISOString(),
                'provider_response' => $result,
                'personalization_data' => $personalizedContent['recipient_data'] ?? [],
                'simulated_send' => true, // Indicate it was a simulated send
            ])
        ]);
    }

    /**
     * Log failed email send (updates existing record)
     */
    protected function logEmailFailed(CampaignExecution $execution, $email, $error, Campaign $campaign)
    {
        $execution->update([
            'status' => 'failed',
            'executed_at' => now(),
            'execution_log' => array_merge($execution->execution_log ?? [], [
                'error' => $error,
                'failed_at' => now()->toISOString(),
                'error_section' => 'EMAIL_SENDING',
            ])
        ]);
    }

    /**
     * Handle job failure
     */
    public function failed(\Throwable $exception)
    {
        Log::error("❌ Campaign email job permanently failed", [
            'campaign_id' => $this->campaignId,
            'group_index' => $this->groupIndex,
            'email_index' => $this->emailIndex,
            'error' => $exception->getMessage(),
            'trace' => $exception->getTraceAsString(),
            'error_section' => 'JOB_FAILURE'
        ]);

        // Pause the campaign on permanent failure
        // The error at line 480 means $campaign is null here too.
        // We need to re-fetch and check before attempting to update.
        $campaign = Campaign::find($this->campaignId);
        if ($campaign) {
            $campaign->update(['status' => 'paused']);
            Log::info("Campaign (ID: {$this->campaignId}) paused due to job failure.");
        } else {
            Log::warning("Cannot pause campaign (ID: {$this->campaignId}) in failed() method as it was not found.");
        }
    }
}
