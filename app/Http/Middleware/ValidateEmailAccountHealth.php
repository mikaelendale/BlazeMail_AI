<?php

namespace App\Http\Middleware;

use App\Jobs\ValidateEmailTokensJob;
use App\Models\EmailAccount;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpFoundation\Response;

class ValidateEmailAccountHealth
{
    public function handle(Request $request, Closure $next): Response
    {
        // Only apply to email account related routes
        if (!$this->shouldValidate($request)) {
            return $next($request);
        }

        try {
            $accountId = $this->extractAccountId($request);

            if ($accountId) {
                $account = EmailAccount::find($accountId);

                if ($account && $this->needsHealthCheck($account)) {
                    Log::info('Triggering health check via middleware', [
                        'account_id' => $account->id,
                        'route' => $request->route()?->getName(),
                    ]);

                    // Dispatch token validation job
                    ValidateEmailTokensJob::dispatch($account)
                        ->onQueue('email-validation');
                }
            }
        } catch (\Exception $e) {
            Log::warning('Health check middleware failed', [
                'error' => $e->getMessage(),
                'route' => $request->route()?->getName(),
            ]);
            // Don't block the request if health check fails
        }

        return $next($request);
    }

    private function shouldValidate(Request $request): bool
    {
        $routeName = $request->route()?->getName();

        return in_array($routeName, [
            'email-accounts.test-connection',
            'inbox.sync',
            'inbox.sync-account',
        ]);
    }

    private function extractAccountId(Request $request): ?int
    {
        // Try to get account ID from route parameters
        if ($request->route('emailAccount')) {
            return $request->route('emailAccount')->id;
        }

        // Try to get from request data
        if ($request->has('account_id')) {
            return (int) $request->input('account_id');
        }

        return null;
    }

    private function needsHealthCheck(EmailAccount $account): bool
    {
        // Check if OAuth account needs token validation
        if ($account->provider === 'gmail') {
            // Check if token expires soon or hasn't been validated recently
            if ($account->token_expires_at && $account->token_expires_at->diffInMinutes(now()) <= 30) {
                return true;
            }

            if (!$account->last_health_check || $account->last_health_check->diffInHours(now()) >= 2) {
                return true;
            }
        }

        return false;
    }
}
