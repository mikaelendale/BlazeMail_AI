<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class JobProgressUpdated implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $jobProgress;
    public $userId;

    public function __construct(array $jobProgress, int $userId)
    {
        $this->jobProgress = $jobProgress;
        $this->userId = $userId;
    }

    /**
     * 🔥 BROADCAST ON USER-SPECIFIC PRIVATE CHANNEL
     */
    public function broadcastOn(): array
    {
        return [
            new PrivateChannel("job-progress.{$this->userId}"),
        ];
    }

    /**
     * 🔥 BROADCAST EVENT NAME
     */
    public function broadcastAs(): string
    {
        return 'job.progress.updated';
    }

    /**
     * 🔥 DATA TO BROADCAST
     */
    public function broadcastWith(): array
    {
        return [
            'job' => $this->jobProgress,
            'timestamp' => now()->toISOString(),
        ];
    }
}
