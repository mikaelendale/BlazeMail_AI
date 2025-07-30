<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class BulkEmailJobCompleted extends Notification implements ShouldQueue
{
    use Queueable;

    protected $jobData;

    public function __construct(array $jobData)
    {
        $this->jobData = $jobData;
    }

    public function via($notifiable): array
    {
        return ['database'];
    }

    public function toDatabase($notifiable): array
    {
        $success = $this->jobData['success'];
        $data = $this->jobData['data'];

        if ($success) {
            return [
                'type' => 'bulk_email_preparation_completed',
                'success' => true,
                'job_type' => $this->jobData['job_type'],
                'email_template_id' => $this->jobData['email_template_id'],
                'email_template_subject' => $this->jobData['email_template_subject'],
                'batch_id' => $data['batch_id'] ?? null,
                'data' => $data,
                'completed_at' => $this->jobData['completed_at'],
                'title' => 'Emails Prepared Successfully',
                'message' => "Successfully prepared {$data['successful']} personalized emails for review",
                'action_text' => 'Review & Send Emails',
                'action_url' => $data['review_url'] ?? null,
                'stats' => [
                    'successful' => $data['successful'],
                    'failed' => $data['failed'] ?? 0,
                    'avg_score' => $data['average_personalization_score'] ?? 0,
                    'credits_used' => $data['net_credits_used'] ?? 0
                ]
            ];
        } else {
            return [
                'type' => 'bulk_email_preparation_failed',
                'success' => false,
                'job_type' => $this->jobData['job_type'],
                'email_template_id' => $this->jobData['email_template_id'],
                'email_template_subject' => $this->jobData['email_template_subject'],
                'batch_id' => $data['batch_id'] ?? null,
                'data' => $data,
                'completed_at' => $this->jobData['completed_at'],
                'title' => 'Email Preparation Failed',
                'message' => "Email preparation failed: {$data['error']}",
                'action_text' => 'Contact Support',
                'action_url' => route('support')
            ];
        }
    }
}
