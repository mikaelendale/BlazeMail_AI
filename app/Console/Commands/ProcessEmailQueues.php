<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Artisan;

class ProcessEmailQueues extends Command
{
    protected $signature = 'email:process-queues {--timeout=60}';
    protected $description = 'Process email management queues';

    public function handle()
    {
        $this->info('🚀 Starting email queue processing...');

        // Process database queue with timeout
        $timeout = $this->option('timeout');

        Artisan::call('queue:work', [
            'connection' => 'database',
            '--tries' => 3,
            '--timeout' => $timeout,
            '--sleep' => 3,
            '--max-jobs' => 100,
            '--max-time' => 3600, // 1 hour
        ]);

        $this->info('Queue processing completed!');
    }
}
