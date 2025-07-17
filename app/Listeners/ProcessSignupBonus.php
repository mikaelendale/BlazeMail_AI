<?php

namespace App\Listeners;

use App\Services\CreditService;
use Illuminate\Auth\Events\Registered;
use Illuminate\Contracts\Queue\ShouldQueue;

class ProcessSignupBonus implements ShouldQueue
{
    public function __construct(
        private CreditService $creditService
    ) {}

    public function handle(Registered $event): void
    {
        $this->creditService->processSignupBonus($event->user);
    }
}
