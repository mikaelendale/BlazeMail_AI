<?php

namespace App\Console\Commands;

use App\Jobs\EmailAccountHealthCheckJob;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

class StartEmailHealingSystem extends Command
{
    protected $signature = 'email:start-healing-system 
                            {--force : Force start even if already running}';

    protected $description = 'Start the automated email account healing system';

    public function handle(): int
    {
        try {
            $this->info('🚀 Starting Email Account Healing System...');

            // Start the main health check job
            EmailAccountHealthCheckJob::dispatch()
                ->onQueue('email-health')
                ->delay(now()->addMinutes(1));

            $this->info('✅ Email healing system started successfully!');
            $this->info('');
            $this->info('The system will now:');
            $this->info('• Monitor all email accounts every 2 hours');
            $this->info('• Automatically refresh expired tokens');
            $this->info('• Heal accounts with recoverable errors');
            $this->info('• Reset daily/hourly counters');
            $this->info('• Improve account reputation over time');
            $this->info('');
            $this->info('Make sure your queue worker is running:');
            $this->info('php artisan queue:work --queue=email-health,email-validation');

            Log::info('Email healing system started via command');

            return 0;
        } catch (\Exception $e) {
            $this->error('Failed to start healing system: ' . $e->getMessage());
            Log::error('Failed to start email healing system', [
                'error' => $e->getMessage(),
            ]);
            return 1;
        }
    }
}
