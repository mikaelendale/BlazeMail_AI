<?php

namespace App\Providers;

use App\Listeners\ProcessSignupBonus;
use Illuminate\Auth\Events\Registered;
use Illuminate\Support\ServiceProvider;

class EventServiceProvider extends ServiceProvider
{
    /**
     * The event listener mappings for the application.
     *
     * @var array
     */
    protected $listen = [
        \Laravel\Paddle\Events\SubscriptionCreated::class => [
            \App\Listeners\TrackSubscription::class,
            \App\Listeners\ProcessReferralBonus::class,
        ],
        Registered::class => [
            ProcessSignupBonus::class,
        ],
    ];

    /**
     * Register services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap services.
     */
    public function boot(): void
    {
        //
    }
}
