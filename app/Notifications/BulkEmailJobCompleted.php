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

    public function toMail($notifiable): MailMessage
    {
        $success = $this->jobData['success'];
        $data = $this->jobData['data'];

        if ($success) {
            return (new MailMessage)
                ->subject('✅ Bulk Email Campaign Completed Successfully')
                ->greeting("Hi {$notifiable->name}!")
                ->line('Your bulk personalized email campaign has been completed successfully.')
                ->line("📊 **Campaign Results:**")
                ->line("• Successfully sent: {$data['successful']} emails")
                ->line("• Failed: {$data['failed']} emails")
                ->line("• Credits used: {$data['credits_used']}")
                ->line("• Credits refunded: {$data['credits_refunded']}")
                ->line("• Net credits used: {$data['net_credits_used']}")
                ->action('View Email Dashboard', url('/dashboard/emails'))
                ->line('Thank you for using our advanced email personalization system!');
        } else {
            return (new MailMessage)
                ->subject('❌ Bulk Email Campaign Failed')
                ->greeting("Hi {$notifiable->name}!")
                ->line('Unfortunately, your bulk personalized email campaign encountered an error.')
                ->line("**Error:** {$data['error']}")
                ->action('Contact Support', url('/support'))
                ->line('Our team has been notified and will investigate the issue.');
        }
    }

    public function toDatabase($notifiable): array
    {
        return [
            'type' => 'bulk_email_job_completed',
            'success' => $this->jobData['success'],
            'job_type' => $this->jobData['job_type'],
            'email_template_id' => $this->jobData['email_template_id'],
            'email_template_subject' => $this->jobData['email_template_subject'],
            'data' => $this->jobData['data'],
            'completed_at' => $this->jobData['completed_at'],
            'title' => $this->jobData['success'] ?
                '✅ Bulk Email Campaign Completed' :
                '❌ Bulk Email Campaign Failed',
            'message' => $this->jobData['success'] ?
                "Successfully sent {$this->jobData['data']['successful']} personalized emails" :
                "Campaign failed: {$this->jobData['data']['error']}"
        ];
    }
}
