<?php

namespace App\Providers;

use App\Services\PromptEngineering\PromptEngineeringService;
use Illuminate\Support\ServiceProvider;

class PromptEngineeringServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->singleton(PromptEngineeringService::class, function ($app) {
            return new PromptEngineeringService();
        });
    }

    public function boot(): void
    {
        $this->publishes([
            __DIR__ . '/../../config/prompt-engineering.php' => config_path('prompt-engineering.php'),
        ], 'prompt-engineering-config');
    }
}
