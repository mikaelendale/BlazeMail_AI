<?php

namespace App\Console;

use App\Console\Commands\RefillMonthlyCredits;
use Illuminate\Console\Scheduling\Schedule;
use Illuminate\Foundation\Console\Kernel as ConsoleKernel;

class Kernel extends ConsoleKernel
{
    protected $commands = [
        Commands\StartEmailHealingSystem::class,
        Commands\EmailSystemStatus::class,
        Commands\HealErrorEmailAccounts::class,
        Commands\ScheduleEmailHealthChecks::class,
        Commands\RunEmailSecurityCheck::class,
        Commands\EmailSecurityDashboard::class,
    ];

    protected function schedule(Schedule $schedule): void
    {
        // Email healing system - runs every 2 hours
        $schedule->command('email:heal-errors')
            ->everyTwoHours()
            ->withoutOverlapping()
            ->runInBackground();

        // Health checks - runs every hour
        $schedule->command('email:schedule-health-checks')
            ->hourly()
            ->withoutOverlapping()
            ->runInBackground();

        // Security checks - runs daily
        $schedule->command('email:security-check')
            ->daily()
            ->at('02:00')
            ->withoutOverlapping();

        // System status logging - runs every 6 hours
        $schedule->command('email:system-status')
            ->everySixHours()
            ->withoutOverlapping();

        // Reset daily counters at midnight
        $schedule->call(function () {
            \App\Models\EmailAccount::whereDate('daily_sent_date', '<', now()->toDateString())
                ->update([
                    'daily_sent' => 0,
                    'daily_sent_date' => now()->toDateString(),
                    'warmup_emails_today' => 0,
                ]);
        })->daily()->at('00:01');

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

        // Clean up old logs and reset counters daily at 2 AM
        $schedule->call(function () {
            \App\Models\EmailAccount::where('is_connected', true)
                ->chunk(100, function ($accounts) {
                    foreach ($accounts as $account) {
                        $account->resetDailyCounts();
                    }
                });
        })->dailyAt('02:00');

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
