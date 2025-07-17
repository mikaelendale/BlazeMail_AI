<?php

namespace App\Providers;

use App\Models\AppSetting;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\DB; 
use App\Listeners\HandlePaddleWebhook;
use App\Listeners\HandleSubscriptionWebhooks;
use App\Listeners\PaddleWebhookLogger;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\ServiceProvider;
use Laravel\Paddle\Events\CustomerUpdated;
use Laravel\Paddle\Events\SubscriptionCreated;
use Laravel\Paddle\Events\SubscriptionUpdated;
use Laravel\Paddle\Events\TransactionCompleted;
use Laravel\Paddle\Events\WebhookReceived;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // Cache settings for performance (optional, but recommended)
        // $settings = cache()->rememberForever('app_settings', function () {
        //     return AppSetting::all()->pluck('value', 'key')->toArray();
        // });

        // // Helper to get a setting with fallback
        // $get = fn($key, $default = null) => $settings[$key] ?? $default;

        // // Dynamically override config values
        // config([
        //     // App info
        //     'app.name' => $get('app_name'),
        //     'app.timezone' => $get('timezone', 'UTC'),

        //     // Email settings
        //     'mail.mailers.smtp.host' => $get('smtp_host'),
        //     'mail.mailers.smtp.port' => $get('smtp_port'),
        //     'mail.mailers.smtp.username' => $get('smtp_user'),
        //     'mail.mailers.smtp.password' => $get('smtp_password'),
        //     'mail.mailers.smtp.encryption' => $get('smtp_encryption'),
        //     'mail.from.address' => $get('email_from_address'),
        //     'mail.from.name' => $get('email_from_name'),

        //     // Paddle
        //     'cashier.vendor_id' => $get('paddle_vendor_id'),
        //     'cashier.sandbox' => $get('paddle_sandbox_mode') === 'true',

        //     // AI config (custom usage in your app)
        //     'blazemail.ai_model' => $get('model_default'),
        //     'blazemail.ai_tokens' => (int) $get('ai_max_tokens', 500),
        //     'blazemail.daily_limit' => (int) $get('rate_limit_daily', 50),

        //     // Pricing plans (custom usage in your app)
        //     'blazemail.plans.basic.limit' => (int) $get('plan_basic_limit_emails'),
        //     'blazemail.plans.pro.limit' => (int) $get('plan_pro_limit_emails'),
        //     'blazemail.plans.basic.price' => (float) $get('plan_basic_price'),
        //     'blazemail.plans.pro.price' => (float) $get('plan_pro_price'),
        // ]);

        Event::listen([
            WebhookReceived::class,
            SubscriptionCreated::class,
        ], HandleSubscriptionWebhooks::class);
    }
}
