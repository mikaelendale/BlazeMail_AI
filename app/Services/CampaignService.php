<?php

namespace App\Services;

use App\Models\Campaign;
use App\Models\Contact;
use App\Models\CampaignExecution;
use App\Jobs\SendCampaignEmailsJob;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class CampaignService
{
    /**
     * Launch a campaign
     */
    public function launchCampaign(Campaign $campaign): array
    {
        try {
            Log::info('Launching campaign', [
                'campaign_id' => $campaign->id,
                'campaign_name' => $campaign->name,
                'user_id' => $campaign->user_id
            ]);
            // Validate campaign can be launched
            $validation = $this->validateCampaignForLaunch($campaign);
            if (!$validation['valid']) {
                return [
                    'success' => false,
                    'error' => $validation['error']
                ];
            }
            DB::beginTransaction();
            // Update campaign status
            $campaign->update([
                'status' => 'active',
                'launched_at' => now(),
            ]);
            // Initialize sequence data with proper status tracking
            $this->initializeSequenceTracking($campaign);
            // Schedule first email batch with proper delay
            $startDelay = $this->calculateStartDelay($campaign);
            SendCampaignEmailsJob::dispatch($campaign, 0, 0, 25)
                ->delay($startDelay);
            DB::commit();
            Log::info('Campaign launched successfully', [
                'campaign_id' => $campaign->id,
                'launched_at' => now()->toISOString(),
                'start_delay_minutes' => $startDelay->diffInMinutes(now()),
                'total_recipients' => $this->getRecipientCount($campaign)
            ]);
            return [
                'success' => true,
                'message' => 'Campaign launched successfully! Emails will start sending shortly.',
                'campaign' => $campaign->fresh(),
                'start_time' => $startDelay->toISOString()
            ];
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Failed to launch campaign', [
                'campaign_id' => $campaign->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            return [
                'success' => false,
                'error' => 'Failed to launch campaign: ' . $e->getMessage()
            ];
        }
    }
    /**
     * Initialize sequence tracking for launched campaign
     */
    private function initializeSequenceTracking(Campaign $campaign): void
    {
        $sequenceData = $campaign->sequence_data ?? [];
        if (isset($sequenceData['groups'])) {
            foreach ($sequenceData['groups'] as $index => &$group) {
                $group['status'] = $index === 0 ? 'scheduled' : 'waiting';
                $group['stats'] = [
                    'sent' => 0,
                    'opens' => 0,
                    'clicks' => 0,
                    'bounces' => 0,
                    'unsubscribes' => 0
                ];
                $group['created_at'] = now()->toISOString();
            }
        }
        $campaign->update(['sequence_data' => $sequenceData]);
    }
    /**
     * Calculate when to start the campaign based on starting_date and schedule
     */
    private function calculateStartDelay(Campaign $campaign): Carbon
    {
        $startingDate = Carbon::parse($campaign->starting_date);
        $now = now();
        // If starting date is in the future, use that
        if ($startingDate->isFuture()) {
            return $startingDate;
        }
        // If starting date is today or past, start based on sending schedule
        $schedule = $campaign->sending_schedule ?? 'business-hours';
        switch ($schedule) {
            case 'business-hours':
                // 9 AM - 5 PM
                if ($now->hour < 9) {
                    return $now->setHour(9)->setMinute(0)->setSecond(0);
                } elseif ($now->hour >= 17) {
                    return $now->addDay()->setHour(9)->setMinute(0)->setSecond(0);
                }
                break;
            case 'extended':
                // 8 AM - 8 PM
                if ($now->hour < 8) {
                    return $now->setHour(8)->setMinute(0)->setSecond(0);
                } elseif ($now->hour >= 20) {
                    return $now->addDay()->setHour(8)->setMinute(0)->setSecond(0);
                }
                break;
            case '24-7':
                // Start immediately
                return $now->addMinutes(2);
            default:
                // Default to business hours
                return $now->addMinutes(5);
        }
        // Start in 2 minutes if within business hours
        return $now->addSecond(2);
    }
    /**
     * Validate campaign can be launched
     */
    private function validateCampaignForLaunch(Campaign $campaign): array
    {
        // Check if setup is complete
        if (!$campaign->is_setup_complete) {
            return [
                'valid' => false,
                'error' => 'Campaign setup must be completed before launching.'
            ];
        }
        // Check if campaign has email account
        if (!$campaign->email_account_id || !$campaign->emailAccount) {
            return [
                'valid' => false,
                'error' => 'No email account configured for this campaign.'
            ];
        }
        // Check if email account can send
        if (!$campaign->emailAccount->canSendEmail()) {
            return [
                'valid' => false,
                'error' => 'Email account cannot send emails. Please check account status and limits.'
            ];
        }
        // Check if campaign has recipients
        $recipientCount = $this->getRecipientCount($campaign);
        if ($recipientCount === 0) {
            return [
                'valid' => false,
                'error' => 'No recipients found for this campaign.'
            ];
        }
        // Check if campaign has email content
        $sequenceData = $campaign->sequence_data;
        if (!isset($sequenceData['groups']) || empty($sequenceData['groups'])) {
            return [
                'valid' => false,
                'error' => 'Campaign has no email groups configured.'
            ];
        }
        // Check if campaign is in correct status
        if ($campaign->status !== 'draft') {
            return [
                'valid' => false,
                'error' => 'Only draft campaigns can be launched.'
            ];
        }
        return ['valid' => true];
    }
    /**
     * Get recipient count for campaign
     */
    public function getRecipientCount(Campaign $campaign): int
    {
        $settings = $campaign->recipient_settings ?? [];
        $query = Contact::forUser($campaign->user_id)->active();
        switch ($settings['type'] ?? 'all') {
            case 'classification':
                if (!empty($settings['classifications'])) {
                    $query->whereIn('classification', $settings['classifications']);
                }
                break;
            case 'tags':
                if (!empty($settings['tags'])) {
                    foreach ($settings['tags'] as $tag) {
                        $query->byTag($tag);
                    }
                }
                break;
            case 'selected':
                if (!empty($settings['selected_contacts'])) {
                    $query->whereIn('id', $settings['selected_contacts']);
                }
                break;
            case 'all':
            default:
                break;
        }
        return $query->count();
    }
    /**
     * Get campaign recipients
     */
    public function getCampaignRecipients(Campaign $campaign)
    {
        $settings = $campaign->recipient_settings;
        $query = Contact::forUser($campaign->user_id)->active();
        switch ($settings['type']) {
            case 'all':
                break;
            case 'classification':
                if (!empty($settings['classifications'])) {
                    $query->whereIn('classification', $settings['classifications']);
                }
                break;
            case 'tags':
                if (!empty($settings['tags'])) {
                    foreach ($settings['tags'] as $tag) {
                        $query->byTag($tag);
                    }
                }
                break;
            case 'selected':
                if (!empty($settings['selected_contacts'])) {
                    $query->whereIn('id', $settings['selected_contacts']);
                }
                break;
        }
        return $query->get();
    }
    /**
     * Pause campaign
     */
    public function pauseCampaign(Campaign $campaign): array
    {
        try {
            $campaign->update(['status' => 'paused']);
            Log::info('Campaign paused', [
                'campaign_id' => $campaign->id,
                'paused_at' => now()->toISOString()
            ]);
            return [
                'success' => true,
                'message' => 'Campaign paused successfully.',
                'campaign' => $campaign->fresh()
            ];
        } catch (\Exception $e) {
            Log::error(' Failed to pause campaign', [
                'campaign_id' => $campaign->id,
                'error' => $e->getMessage()
            ]);
            return [
                'success' => false,
                'error' => 'Failed to pause campaign.'
            ];
        }
    }
    /**
     * Resume campaign
     */
    public function resumeCampaign(Campaign $campaign): array
    {
        try {
            $campaign->update(['status' => 'active']);
            // Find where to resume from
            $lastExecution = CampaignExecution::where('campaign_id', $campaign->id)
                ->orderBy('executed_at', 'desc')
                ->first();
            $groupIndex = 0;
            $emailIndex = 0;
            if ($lastExecution) {
                $groupIndex = $lastExecution->execution_log['group_index'] ?? 0;
                $emailIndex = $lastExecution->execution_log['email_index'] ?? 0;
            }
            // Resume email sending
            SendCampaignEmailsJob::dispatch($campaign, $groupIndex, $emailIndex, 25)
                ->delay(now()->addMinutes(1));
            Log::info('Campaign resumed', [
                'campaign_id' => $campaign->id,
                'resumed_at' => now()->toISOString(),
                'resume_group_index' => $groupIndex,
                'resume_email_index' => $emailIndex
            ]);
            return [
                'success' => true,
                'message' => 'Campaign resumed successfully.',
                'campaign' => $campaign->fresh()
            ];
        } catch (\Exception $e) {
            Log::error('Failed to resume campaign', [
                'campaign_id' => $campaign->id,
                'error' => $e->getMessage()
            ]);
            return [
                'success' => false,
                'error' => 'Failed to resume campaign.'
            ];
        }
    }
    /**
     * Get campaign statistics
     */
    public function getCampaignStats(Campaign $campaign): array
    {
        $executions = CampaignExecution::where('campaign_id', $campaign->id)->get();
        $totalSent = $executions->where('status', 'completed')->count(); // Changed from 'sent' to 'completed'
        $totalFailed = $executions->where('status', 'failed')->count();
        // TODO: Implement tracking for these metrics
        $totalOpens = 0;
        $totalClicks = 0;
        $totalBounces = 0;
        $totalUnsubscribes = 0;
        $stats = [
            'total_sent' => $totalSent,
            'total_failed' => $totalFailed,
            'total_opens' => $totalOpens,
            'total_clicks' => $totalClicks,
            'total_bounces' => $totalBounces,
            'total_unsubscribes' => $totalUnsubscribes,
        ];
        $stats['total_recipients'] = $this->getRecipientCount($campaign);
        $stats['delivery_rate'] = $stats['total_recipients'] > 0
            ? round(($stats['total_sent'] / $stats['total_recipients']) * 100, 2)
            : 0;
        $stats['open_rate'] = $totalSent > 0
            ? round(($totalOpens / $totalSent) * 100, 2)
            : 0;
        $stats['click_rate'] = $totalSent > 0
            ? round(($totalClicks / $totalSent) * 100, 2)
            : 0;
        $stats['bounce_rate'] = $totalSent > 0
            ? round(($totalBounces / $totalSent) * 100, 2)
            : 0;
        $stats['unsubscribe_rate'] = $totalSent > 0
            ? round(($totalUnsubscribes / $totalSent) * 100, 2)
            : 0;
        return $stats;
    }
    /**
     * Get campaign progress
     */
    public function getCampaignProgress(Campaign $campaign): array
    {
        $sequenceData = $campaign->sequence_data;
        $groups = $sequenceData['groups'] ?? [];
        $progress = [
            'total_groups' => count($groups),
            'completed_groups' => 0,
            'current_group' => null,
            'overall_progress' => 0,
        ];
        foreach ($groups as $group) {
            if (($group['status'] ?? 'scheduled') === 'completed') {
                $progress['completed_groups']++;
            } elseif (($group['status'] ?? 'scheduled') === 'in-progress') {
                $progress['current_group'] = $group;
            }
        }
        if ($progress['total_groups'] > 0) {
            $progress['overall_progress'] = round(
                ($progress['completed_groups'] / $progress['total_groups']) * 100,
                2
            );
        }
        return $progress;
    }
    /**
     * Mark campaign as completed
     */
    public function completeCampaign(Campaign $campaign): void
    {
        $campaign->update([
            'status' => 'completed',
            'completed_at' => now()
        ]);
        Log::info(' Campaign completed', [
            'campaign_id' => $campaign->id,
            'completed_at' => now()->toISOString()
        ]);
    }
}
