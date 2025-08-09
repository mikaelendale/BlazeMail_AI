<?php

use App\Http\Middleware\CheckSocialLogin;
use App\Http\Middleware\HandleAppearance;
use App\Http\Middleware\HandleInertiaRequests;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Middleware\AddLinkHeadersForPreloadedAssets;
use Illuminate\Console\Scheduling\Schedule;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__ . '/../routes/web.php',
        commands: __DIR__ . '/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware) {
        $middleware->encryptCookies(except: ['appearance', 'sidebar_state']);
        $middleware->alias([
            'role' => \Spatie\Permission\Middleware\RoleMiddleware::class,
            'permission' => \Spatie\Permission\Middleware\PermissionMiddleware::class,
            'role_or_permission' => \Spatie\Permission\Middleware\RoleOrPermissionMiddleware::class,
            'social' => CheckSocialLogin::class,
            'social.settings' => \App\Http\Middleware\CheckSocialSettingsAccess::class,
            'subscribed' => \App\Http\Middleware\Subscribed::class,
            'onboarding' => \App\Http\Middleware\OnboardingMiddleware::class,
            'onboardingComplete' => \App\Http\Middleware\onboardingCompleteMiddleware::class,
            'credits' => \App\Http\Middleware\CheckCredits::class,
            'soon' => \App\Http\Middleware\SoonMiddleware::class,
            'payment' => \App\Http\Middleware\PaymentGate::class,
        ]);

        $middleware->web(append: [
            HandleAppearance::class,
            HandleInertiaRequests::class,
            AddLinkHeadersForPreloadedAssets::class,
        ]);

        $middleware->validateCsrfTokens(except: [
            'paddle/*',
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions) {
        //
    })
    ->withSchedule(function (Schedule $schedule) {
        require base_path('routes/console.php');
    })
    ->create();
