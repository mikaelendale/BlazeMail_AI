<?php

namespace App\Console;

use App\Console\Commands\RefillMonthlyCredits;
use Illuminate\Console\Scheduling\Schedule;
use Illuminate\Foundation\Console\Kernel as ConsoleKernel;

class Kernel extends ConsoleKernel
{
    protected function schedule(Schedule $schedule)
    {
        // Process queues every minute using Laravel's built-in scheduler
        $schedule->command('queue:work database --stop-when-empty --max-jobs=10')
            ->everyMinute()
            ->withoutOverlapping()
            ->runInBackground();
        // Run the monthly credit refill and expiration command
        // This will run on the first day of every month at midnight.
        $schedule->command(RefillMonthlyCredits::class)->monthlyOn(1, '00:00');

        // You might also want to run it daily to catch any edge cases or for more frequent checks
        // $schedule->command(RefillMonthlyCredits::class)->dailyAt('00:00');

        // Clean up old failed jobs
        $schedule->command('queue:prune-failed --hours=48')
            ->daily();

        // Run email health checks every 30 minutes
        $schedule->command('email:schedule-health-checks')
            ->everyThirtyMinutes()
            ->withoutOverlapping(10) // Prevent overlapping runs
            ->runInBackground()
            ->appendOutputTo(storage_path('logs/email-health-checks.log'));

        // Run comprehensive health check every 6 hours
        $schedule->job(new \App\Jobs\EmailAccountHealthCheckJob)
            ->everySixHours()
            ->onQueue('email-health');

        // Clean up old logs and reset counters daily at 2 AM
        $schedule->call(function () {
            \App\Models\EmailAccount::where('is_connected', true)
                ->chunk(100, function ($accounts) {
                    foreach ($accounts as $account) {
                        $account->resetDailyCounts();
                    }
                });
        })->dailyAt('02:00');

        // Monitor queue health every 5 minutes
        $schedule->call(function () {
            $queueSize = \Illuminate\Support\Facades\Queue::size('email-validation');
            if ($queueSize > 100) {
                \Illuminate\Support\Facades\Log::warning('Email validation queue is getting large', [
                    'queue_size' => $queueSize,
                ]);
            }
        })->everyFiveMinutes();

        // Run security checks every 4 hours
        $schedule->job(new \App\Jobs\EmailSecurityCheckJob)
            ->everyFourHours()
            ->onQueue('email-security')
            ->withoutOverlapping(30);

        // Run security dashboard daily at 8 AM
        $schedule->command('email:security-dashboard')
            ->dailyAt('08:00')
            ->appendOutputTo(storage_path('logs/security-dashboard.log'));

        // Alert on critical security issues every hour
        $schedule->call(function () {
            $suspendedAccounts = \App\Models\EmailAccount::where('status', 'suspended')->count();
            $criticalErrors = \App\Models\EmailAccount::where('consecutive_errors', '>=', 5)->count();

            if ($suspendedAccounts > 0 || $criticalErrors > 0) {
                \Illuminate\Support\Facades\Log::critical('Critical email security issues detected', [
                    'suspended_accounts' => $suspendedAccounts,
                    'critical_errors' => $criticalErrors,
                ]);
            }
        })->hourly();
        $schedule->command('inbox:fetch')
            ->everyFifteenMinutes()
            ->withoutOverlapping()
            ->runInBackground();

        // Reset daily email counters at midnight
        $schedule->call(function () {
            \App\Models\EmailAccount::where('daily_sent_date', '<', now()->toDateString())
                ->update([
                    'daily_sent' => 0,
                    'daily_sent_date' => now()->toDateString(),
                ]);
        })->daily();

        // Reset hourly email counters every hour
        $schedule->call(function () {
            \App\Models\EmailAccount::where('hourly_sent_reset', '<', now()->subHour())
                ->update([
                    'hourly_sent' => 0,
                    'hourly_sent_reset' => now(),
                ]);
        })->hourly();
    }
    /**
     * Register the commands for the application.
     */
    protected function commands(): void
    {
        $this->load(__DIR__ . '/Commands');

        require base_path('routes/console.php');
    }
}
