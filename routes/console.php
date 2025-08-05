<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;
use App\Models\EmailAccount;
use App\Console\Commands\RefillMonthlyCredits;
use Illuminate\Support\Facades\Log;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Schedule::command('email:heal-errors')
    ->everyTwoHours()
    ->withoutOverlapping()
    ->runInBackground();

Schedule::command('email:schedule-health-checks')
    ->hourly()
    ->withoutOverlapping()
    ->runInBackground();

Schedule::command('email:security-check')
    ->daily()
    ->at('02:00')
    ->withoutOverlapping();

Schedule::command('email:system-status')
    ->everySixHours()
    ->withoutOverlapping();

Schedule::call(function () {
    EmailAccount::whereDate('daily_sent_date', '<', now()->toDateString())
        ->update([
            'daily_sent' => 0,
            'daily_sent_date' => now()->toDateString(),
            'warmup_emails_today' => 0,
        ]);
})->daily()->at('00:01');

Schedule::command('queue:work database --stop-when-empty --max-jobs=10')
    ->everyMinute()
    ->withoutOverlapping()
    ->runInBackground();

Schedule::command(RefillMonthlyCredits::class)
    ->monthlyOn(1, '00:00');

Schedule::command('queue:prune-failed --hours=48')
    ->daily();

Schedule::call(function () {
    EmailAccount::where('is_connected', true)
        ->chunk(100, function ($accounts) {
            foreach ($accounts as $account) {
                $account->resetDailyCounts();
            }
        });
})->dailyAt('02:00');

Schedule::command('email:security-dashboard')
    ->dailyAt('08:00')
    ->appendOutputTo(storage_path('logs/security-dashboard.log'));

Schedule::call(function () {
    $suspendedAccounts = EmailAccount::where('status', 'suspended')->count();
    $criticalErrors = EmailAccount::where('consecutive_errors', '>=', 5)->count();

    if ($suspendedAccounts > 0 || $criticalErrors > 0) {
        Log::critical('Critical email security issues detected', [
            'suspended_accounts' => $suspendedAccounts,
            'critical_errors' => $criticalErrors,
        ]);
    }
})->hourly();

Schedule::command('inbox:fetch')
    ->everyFifteenMinutes()
    ->withoutOverlapping()
    ->runInBackground();

Schedule::call(function () {
    EmailAccount::where('daily_sent_date', '<', now()->toDateString())
        ->update([
            'daily_sent' => 0,
            'daily_sent_date' => now()->toDateString(),
        ]);
})->daily();

Schedule::call(function () {
    EmailAccount::where('hourly_sent_reset', '<', now()->subHour())
        ->update([
            'hourly_sent' => 0,
            'hourly_sent_reset' => now(),
        ]);
})->hourly();