<?php

namespace App\Providers;

use App\Models\EmailConnection;
use App\Policies\EmailConnectionPolicy;
use Illuminate\Foundation\Support\Providers\AuthServiceProvider as ServiceProvider;

class AuthServiceProvider extends ServiceProvider
{
    protected $policies = [
        EmailConnection::class => EmailConnectionPolicy::class,
    ];

    public function boot(): void
    {
        $this->registerPolicies();
    }
}
