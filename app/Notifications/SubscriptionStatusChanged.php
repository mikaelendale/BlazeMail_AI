<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class SubscriptionStatusChanged extends Notification
{
    use Queueable;

    public string $message;

    public function __construct(string $message)
    {
        $this->message = $message;
    }

    public function via($notifiable)
    {
        return ['mail', 'database']; // or just ['database'] for in-app only
    }

    public function toMail($notifiable)
    {
        return (new \Illuminate\Notifications\Messages\MailMessage)
            ->line($this->message);
    }

    public function toArray($notifiable)
    {
        return [
            'message' => $this->message,
        ];
    }
}
