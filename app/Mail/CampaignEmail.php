<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class CampaignEmail extends Mailable
{
    use Queueable, SerializesModels;

    public $emailData;

    public function __construct(array $emailData)
    {
        $this->emailData = $emailData;
    }

    public function build()
    {
        return $this->subject($this->emailData['subject'])
            ->html($this->emailData['content'])
            ->withSwiftMessage(function ($message) {
                $message->getHeaders()->addTextHeader('X-Campaign-ID', $this->emailData['campaign_id']);
                $message->getHeaders()->addTextHeader('X-Recipient-ID', $this->emailData['recipient_id']);
                $message->getHeaders()->addTextHeader('Message-ID', $this->emailData['message_id']);
            });
    }
}
