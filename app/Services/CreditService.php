<?php

namespace App\Services;

use App\Models\User;
use App\Models\CreditTransaction;
use App\Models\FraudAlert;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Exception;

class CreditService
{
    const REFERRAL_BONUS = 500;

    const CREDIT_COSTS = [
        'email_generation' => 1,
        'email_generation' => 1,
        'ai_subject_line' => 1,
        'ai_template' => 2,
        'bulk_email_generation' => 5,
        'premium_template' => 3,
    ];

    public function addCredits(
        User $user,
        int $amount,
        string $type,
        string $description = null,
        array $metadata = [],
        $expiresAt = null,
        string $referenceId = null
    ): CreditTransaction {
        return DB::transaction(function () use ($user, $amount, $type, $description, $metadata, $expiresAt, $referenceId) {
            $user = User::where('id', $user->id)->lockForUpdate()->first();
            if (!$user) {
                throw new Exception('User not found for credit addition.');
            }

            if ($amount <= 0) {
                throw new Exception('Credit amount must be positive');
            }
            $this->checkFraudPatterns($user, $type, $amount);
            $user->increment('credit_balance', $amount);
            $user->update(['last_credit_activity' => now()]);
            $transaction = CreditTransaction::create([
                'user_id' => $user->id,
                'type' => $type,
                'amount' => $amount,
                'description' => $description,
                'metadata' => $metadata,
                'expires_at' => $expiresAt,
                'reference_id' => $referenceId,
            ]);
            Log::info('Credits added', [
                'user_id' => $user->id,
                'amount' => $amount,
                'type' => $type,
                'transaction_id' => $transaction->id
            ]);
            return $transaction;
        });
    }

    public function deductCredits(
        User $user,
        int $amount,
        string $type,
        string $description = null,
        array $metadata = [],
        string $referenceId = null
    ): CreditTransaction {
        return DB::transaction(function () use ($user, $amount, $type, $description, $metadata, $referenceId) {
            $user = User::where('id', $user->id)->lockForUpdate()->first();
            if (!$user) {
                throw new Exception('User not found for credit deduction.');
            }

            if ($amount <= 0) {
                throw new Exception('Deduction amount must be positive');
            }
            if ($user->credit_balance < $amount) {
                throw new Exception('Insufficient credits. You need ' . $amount . ' credits but only have ' . $user->credit_balance . '.');
            }
            if ($user->account_status !== 'active') {
                throw new Exception('Account is suspended. Cannot use credits.');
            }
            $this->checkRateLimit($user, $type);
            $user->decrement('credit_balance', $amount);
            $user->update(['last_credit_activity' => now()]);
            $transaction = CreditTransaction::create([
                'user_id' => $user->id,
                'type' => $type,
                'amount' => -$amount,
                'description' => $description,
                'metadata' => $metadata,
                'reference_id' => $referenceId,
            ]);
            $this->monitorUnusualActivity($user);
            Log::info('Credits deducted', [
                'user_id' => $user->id,
                'amount' => $amount,
                'type' => $type,
                'transaction_id' => $transaction->id,
                'remaining_balance' => $user->credit_balance
            ]);
            return $transaction;
        });
    }

    public function processSignupBonus(User $user): ?CreditTransaction
    {
        $existingBonus = CreditTransaction::where('user_id', $user->id)
            ->where('type', 'signup_bonus')
            ->exists();
        if ($existingBonus) {
            return null;
        }
        $freeCredits = config('services.credits.free_plan_monthly');
        $expiresAt = now()->endOfMonth();
        return $this->addCredits(
            $user,
            $freeCredits,
            'signup_bonus',
            'Welcome bonus for new users (Free Plan)',
            ['signup_date' => now()->toDateString()],
            $expiresAt
        );
    }

    public function processReferralBonus(User $referrer, User $referred): ?CreditTransaction
    {
        if (!$referred->subscribed('default')) {
            return null;
        }
        $existingBonus = CreditTransaction::where('user_id', $referrer->id)
            ->where('type', 'referral_bonus')
            ->where('metadata->referred_user_id', $referred->id)
            ->exists();
        if ($existingBonus) {
            return null;
        }
        $this->checkSelfReferralFraud($referrer, $referred);
        return $this->addCredits(
            $referrer,
            self::REFERRAL_BONUS,
            'referral_bonus',
            "Referral bonus for {$referred->name}",
            [
                'referred_user_id' => $referred->id,
                'referred_user_email' => $referred->email,
                'referral_date' => now()->toDateString()
            ]
        );
    }

    public function processSubscriptionRefill(User $user): ?CreditTransaction
    {
        $subscription = $user->subscription('default');
        if (!$subscription || !$subscription->valid()) {
            Log::warning("Attempted to refill credits for invalid subscription", ['user_id' => $user->id]);
            return null;
        }

        $priceId = $subscription->paddle_price;
        $creditsToAdd = $this->getMonthlyCreditsForPriceId($priceId);
        $planName = $this->getPlanNameFromPriceId($priceId);

        if ($creditsToAdd === 0) {
            Log::warning("No credit amount configured for price ID: {$priceId}", ['user_id' => $user->id]);
            return null;
        }

        // Check if credits for this subscription and month have already been refilled
        $lastRefill = CreditTransaction::where('user_id', $user->id)
            ->where('type', 'subscription_refill')
            ->where('created_at', '>=', now()->startOfMonth())
            ->where('metadata->subscription_id', $subscription->id)
            ->first();

        if ($lastRefill) {
            Log::info("Credits already refilled for user {$user->id} this month for subscription {$subscription->id}");
            return null;
        }

        $transaction = $this->addCredits(
            $user,
            $creditsToAdd,
            'subscription_refill',
            "Monthly credit refill for {$planName} plan",
            [
                'subscription_id' => $subscription->id,
                'plan_name' => $planName,
                'price_id' => $priceId,
                'refill_period' => now()->format('Y-m'),
            ]
        );

        $user->update(['last_monthly_refill_at' => now()]);

        return $transaction;
    }

    /**
     * Handles credit adjustment when a user swaps plans.
     * This logic aims to prevent credit accumulation from rapid plan changes.
     */
    public function handlePlanSwapCredits(User $user, string $oldPriceId, string $newPriceId): void
    {
        $oldPlanMonthlyCredits = $this->getMonthlyCreditsForPriceId($oldPriceId);
        $newPlanMonthlyCredits = $this->getMonthlyCreditsForPriceId($newPriceId);

        $oldPlanName = $this->getPlanNameFromPriceId($oldPriceId);
        $newPlanName = $this->getPlanNameFromPriceId($newPriceId);

        // Calculate the difference in monthly credits
        $creditDifference = $newPlanMonthlyCredits - $oldPlanMonthlyCredits;

        // If upgrading (creditDifference > 0), add the difference
        if ($creditDifference > 0) {
            $this->addCredits(
                $user,
                $creditDifference,
                'plan_swap_bonus',
                "Credits for upgrading from {$oldPlanName} to {$newPlanName} plan",
                [
                    'old_price_id' => $oldPriceId,
                    'new_price_id' => $newPriceId,
                    'old_plan_name' => $oldPlanName,
                    'new_plan_name' => $newPlanName,
                    'credit_difference' => $creditDifference,
                ]
            );
            // Update last_monthly_refill_at to prevent immediate re-refill by cron
            $user->update(['last_monthly_refill_at' => now()]);
            Log::info("User {$user->id} upgraded from {$oldPlanName} to {$newPlanName}. Added {$creditDifference} credits.", ['user_id' => $user->id]);
        }
        // If downgrading (creditDifference < 0), we don't immediately deduct.
        // The user will simply receive fewer credits (or no credits if free) at the next monthly refill.
        // Any existing credits will expire naturally if they are free credits, or be used up.
        else if ($creditDifference < 0) {
            Log::info("User {$user->id} downgraded from {$oldPlanName} to {$newPlanName}. No immediate credit deduction, new refill amount will apply next cycle.", ['user_id' => $user->id]);
            // Optionally, you could deduct credits here if you want immediate impact on downgrade.
            // For simplicity and better UX, we let the monthly refill/expiration handle it.
        } else {
            Log::info("User {$user->id} swapped plans with no change in monthly credit allocation.", ['user_id' => $user->id]);
        }
    }

    public function processMonthlyRefillsAndExpirations(): void
    {
        Log::info('Starting monthly credit refills and expirations.');

        $this->expireFreeUserCredits(); // Expire free credits from previous month

        User::where('account_status', 'active')->chunkById(100, function ($users) {
            foreach ($users as $user) {
                try {
                    if ($user->subscribed('default')) {
                        // For subscribed users, refill based on their current plan
                        $this->processSubscriptionRefill($user);
                    } else {
                        // For free users, refill free credits
                        $this->processFreeUserRefill($user);
                    }
                } catch (Exception $e) {
                    Log::error("Error processing monthly refill for user {$user->id}: " . $e->getMessage());
                }
            }
        });

        Log::info('Finished monthly credit refills and expirations.');
    }

    private function expireFreeUserCredits(): void
    {
        // Expire credits from 'signup_bonus' and 'free_refill' types
        $typesToExpire = ['signup_bonus', 'free_refill'];
        $endOfLastMonth = now()->subMonth()->endOfMonth();

        $transactionsToExpire = CreditTransaction::whereIn('type', $typesToExpire)
            ->where('expired', false)
            ->whereNotNull('expires_at')
            ->where('expires_at', '<=', $endOfLastMonth)
            ->get();

        foreach ($transactionsToExpire as $transaction) {
            try {
                DB::transaction(function () use ($transaction) {
                    $user = User::where('id', $transaction->user_id)->lockForUpdate()->first();
                    if (!$user) {
                        Log::warning("User not found for expiring transaction: {$transaction->id}");
                        return;
                    }

                    // Only deduct if the user is still on a free plan or has no active subscription
                    // This prevents deducting credits from a user who just upgraded to a paid plan
                    if (!$user->subscribed('default')) {
                        $amountToDeduct = min($transaction->amount, $user->credit_balance);

                        if ($amountToDeduct > 0) {
                            $user->decrement('credit_balance', $amountToDeduct);
                            $user->update(['last_credit_activity' => now()]);

                            CreditTransaction::create([
                                'user_id' => $user->id,
                                'type' => 'expiration',
                                'amount' => -$amountToDeduct,
                                'description' => "Expired unused free credits from {$transaction->created_at->format('Y-m')}",
                                'metadata' => [
                                    'original_transaction_id' => $transaction->id,
                                    'original_amount' => $transaction->amount,
                                ],
                                'reversal_transaction_id' => $transaction->id,
                            ]);
                            Log::info("Expired {$amountToDeduct} credits for user {$user->id} from transaction {$transaction->id}");
                        }
                    } else {
                        Log::info("Skipping expiration for transaction {$transaction->id} as user {$user->id} is now subscribed.");
                    }

                    $transaction->update(['expired' => true]);
                });
            } catch (Exception $e) {
                Log::error("Error expiring credits for transaction {$transaction->id}: " . $e->getMessage());
            }
        }
    }

    private function processFreeUserRefill(User $user): ?CreditTransaction
    {
        // Only refill free credits if the user is NOT currently subscribed
        if ($user->subscribed('default')) {
            Log::info("Skipping free credit refill for user {$user->id} as they are subscribed.");
            return null;
        }

        $freeCredits = config('services.credits.free_plan_monthly');
        $expiresAt = now()->endOfMonth();

        $lastRefill = CreditTransaction::where('user_id', $user->id)
            ->where('type', 'free_refill')
            ->where('created_at', '>=', now()->startOfMonth())
            ->first();

        if ($lastRefill) {
            Log::info("Free credits already refilled for user {$user->id} this month.");
            return null;
        }

        $transaction = $this->addCredits(
            $user,
            $freeCredits,
            'free_refill',
            'Monthly free plan credit refill',
            ['refill_period' => now()->format('Y-m')],
            $expiresAt
        );

        $user->update(['last_monthly_refill_at' => now()]);
        return $transaction;
    }

    /**
     * Helper to get monthly credit amount for a given price ID.
     */
    private function getMonthlyCreditsForPriceId(string $priceId): int
    {
        $paddleConfig = config('services.paddle');
        $creditsConfig = config('services.credits');

        if ($priceId === $paddleConfig['growth_monthly_price_id'] || $priceId === $paddleConfig['growth_annual_price_id']) {
            return $creditsConfig['growth_plan_monthly'];
        } elseif ($priceId === $paddleConfig['scale_monthly_price_id'] || $priceId === $paddleConfig['scale_annual_price_id']) {
            return $creditsConfig['scale_plan_monthly'];
        }
        // If it's not a recognized paid plan, assume 0 credits from a plan perspective
        return 0;
    }

    /**
     * Helper to get plan name from price ID.
     */
    private function getPlanNameFromPriceId(string $priceId): string
    {
        $paddleConfig = config('services.paddle');
        if ($priceId === $paddleConfig['growth_monthly_price_id'] || $priceId === $paddleConfig['growth_annual_price_id']) {
            return 'growth';
        } elseif ($priceId === $paddleConfig['scale_monthly_price_id'] || $priceId === $paddleConfig['scale_annual_price_id']) {
            return 'scale';
        }
        return 'free'; // Default for non-recognized or free users
    }

    private function checkFraudPatterns(User $user, string $type, int $amount): void
    {
        $recentCredits = CreditTransaction::where('user_id', $user->id)
            ->where('amount', '>', 0)
            ->where('created_at', '>', now()->subHour())
            ->sum('amount');

        if ($recentCredits > 5000) {
            $this->createFraudAlert($user, 'rapid_usage', 'high', [
                'recent_credits' => $recentCredits,
                'type' => $type,
                'amount' => $amount
            ]);
        }
    }

    private function checkSelfReferralFraud(User $referrer, User $referred): void
    {
        if (
            $referrer->device_fingerprint &&
            $referrer->device_fingerprint === $referred->device_fingerprint
        ) {
            $this->createFraudAlert($referrer, 'suspicious_referrals', 'high', [
                'referred_user_id' => $referred->id,
                'reason' => 'same_device_fingerprint'
            ]);
            throw new Exception('Fraudulent referral detected');
        }
        if ($this->isSimilarEmail($referrer->email, $referred->email)) {
            $this->createFraudAlert($referrer, 'suspicious_referrals', 'medium', [
                'referred_user_id' => $referred->id,
                'reason' => 'similar_email_pattern'
            ]);
        }
    }

    private function checkRateLimit(User $user, string $actionType): void
    {
        $limits = [
            'ai_usage' => ['count' => 1000, 'window' => 60],
            'email_generation' => ['count' => 500, 'window' => 60],
            'ai_rewrite' => ['count' => 500, 'window' => 60], // Add rate limit for AI rewrite
        ];
        if (!isset($limits[$actionType])) {
            return;
        }
        $limit = $limits[$actionType];
        $windowStart = now()->subMinutes($limit['window']);
        $recentCount = CreditTransaction::where('user_id', $user->id)
            ->where('type', $actionType)
            ->where('created_at', '>', $windowStart)
            ->count();
        if ($recentCount >= $limit['count']) {
            throw new Exception('Rate limit exceeded for ' . $actionType);
        }
    }

    private function monitorUnusualActivity(User $user): void
    {
        $recentTransactions = CreditTransaction::where('user_id', $user->id)
            ->where('created_at', '>', now()->subDay())
            ->count();
        if ($recentTransactions > 100) {
            $this->createFraudAlert($user, 'unusual_pattern', 'medium', [
                'daily_transaction_count' => $recentTransactions
            ]);
        }
    }

    private function createFraudAlert(User $user, string $type, string $severity, array $metadata): void
    {
        FraudAlert::create([
            'user_id' => $user->id,
            'alert_type' => $type,
            'severity' => $severity,
            'metadata' => $metadata,
        ]);
        if ($severity === 'critical') {
            $user->update(['account_status' => 'suspended']);
        }
    }

    private function isSimilarEmail(string $email1, string $email2): bool
    {
        $domain1 = substr(strrchr($email1, "@"), 1);
        $domain2 = substr(strrchr($email2, "@"), 1);
        if ($domain1 === $domain2) {
            $user1 = substr($email1, 0, strpos($email1, '@'));
            $user2 = substr($email2, 0, strpos($email2, '@'));
            if (preg_replace('/\d+$/', '', $user1) === preg_replace('/\d+$/', '', $user2)) {
                return true;
            }
        }
        return false;
    }

    public function getCreditStats(User $user): array
    {
        $totalEarned = CreditTransaction::where('user_id', $user->id)
            ->where('amount', '>', 0)
            ->sum('amount');
        $totalUsed = abs(CreditTransaction::where('user_id', $user->id)
            ->where('amount', '<', 0)
            ->sum('amount'));
        $monthlyUsed = abs(CreditTransaction::where('user_id', $user->id)
            ->where('amount', '<', 0)
            ->where('created_at', '>', now()->startOfMonth())
            ->sum('amount'));
        return [
            'current_balance' => $user->credit_balance,
            'total_earned' => $totalEarned,
            'total_used' => $totalUsed,
            'monthly_used' => $monthlyUsed,
            'referral_credits' => $user->referral_credits ?? 0,
        ];
    }

    public function hasCredits(User $user, string $action = null, int $customAmount = null): bool
    {
        if ($user->account_status !== 'active') {
            return false;
        }
        $requiredCredits = $customAmount ?? $this->getCreditCost($action);
        return $user->credit_balance >= $requiredCredits;
    }

    public function canPerformAction(User $user, string $action): array
    {
        $cost = $this->getCreditCost($action);
        $hasCredits = $this->hasCredits($user, $action);
        return [
            'can_perform' => $hasCredits,
            'cost' => $cost,
            'current_balance' => $user->credit_balance,
            'shortfall' => $hasCredits ? 0 : ($cost - $user->credit_balance),
            'action' => $action,
        ];
    }

    public function getCreditCost(string $action): int
    {
        return self::CREDIT_COSTS[$action] ?? 1;
    }

    public function getAvailableActions(User $user): array
    {
        $actions = [];
        foreach (self::CREDIT_COSTS as $action => $cost) {
            $actions[$action] = [
                'cost' => $cost,
                'available' => $user->credit_balance >= $cost,
                'name' => $this->getActionDisplayName($action),
            ];
        }
        return $actions;
    }

    public function getUserCreditInfo(User $user): array
    {
        $stats = $this->getCreditStats($user);
        $availableActions = $this->getAvailableActions($user);
        return [
            'balance' => $user->credit_balance,
            'has_credits' => $user->credit_balance > 0,
            'account_status' => $user->account_status,
            'stats' => $stats,
            'available_actions' => $availableActions,
            'is_low_balance' => $user->credit_balance <= 10,
            'is_critical_balance' => $user->credit_balance <= 5,
            'next_refill_date' => $this->getNextRefillDate($user),
        ];
    }

    public function attemptCreditUsage(
        User $user,
        string $action,
        int $customAmount = null,
        array $metadata = []
    ): array {
        $cost = $customAmount ?? $this->getCreditCost($action);
        $canPerform = $this->canPerformAction($user, $action);
        if (!$canPerform['can_perform']) {
            return [
                'success' => false,
                'message' => $this->getInsufficientCreditsMessage($action, $cost, $user->credit_balance),
                'error_type' => 'insufficient_credits',
                'required' => $cost,
                'available' => $user->credit_balance,
                'shortfall' => $canPerform['shortfall'],
            ];
        }
        try {
            $transaction = $this->deductCredits(
                $user,
                $cost,
                $action,
                $this->getActionDisplayName($action),
                array_merge($metadata, ['action_performed' => $action])
            );
            return [
                'success' => true,
                'transaction_id' => $transaction->id,
                'credits_used' => $cost,
                'remaining_balance' => $user->fresh()->credit_balance,
                'message' => "Successfully used {$cost} credits for " . $this->getActionDisplayName($action),
            ];
        } catch (Exception $e) {
            return [
                'success' => false,
                'message' => $e->getMessage(),
                'error_type' => 'transaction_failed',
            ];
        }
    }

    /**
     * Get daily credit usage over a specified number of days.
     *
     * @param User $user
     * @param int $days The number of past days to retrieve data for.
     * @return array An array of objects, each with 'date' and 'usage' (credits used)
     */
    public function getUsageOverTime(User $user, int $days = 30): array
    {
        $startDate = now()->subDays($days - 1)->startOfDay();
        $endDate = now()->endOfDay();

        $usageData = CreditTransaction::where('user_id', $user->id)
            ->where('amount', '<', 0) // Only look at deductions
            ->whereBetween('created_at', [$startDate, $endDate])
            ->select(
                DB::raw('DATE(created_at) as date'),
                DB::raw('ABS(SUM(amount)) as daily_usage')
            )
            ->groupBy('date')
            ->orderBy('date', 'asc')
            ->get()
            ->keyBy('date') // Key by date for easier merging
            ->toArray();

        $result = [];
        for ($i = 0; $i < $days; $i++) {
            $date = now()->subDays($days - 1 - $i)->format('Y-m-d');
            $result[] = [
                'date' => $date,
                'usage' => $usageData[$date]['daily_usage'] ?? 0,
            ];
        }

        return $result;
    }


    private function getActionDisplayName(string $action): string
    {
        $names = [
            'email_generation' => 'Email Generation',
            'ai_rewrite' => 'AI Rewrite',
            'ai_subject_line' => 'AI Subject Line',
            'ai_template' => 'AI Template',
            'bulk_email_generation' => 'Bulk Email Generation',
            'premium_template' => 'Premium Template',
            'expiration' => 'Credit Expiration', // Added for display
            'free_refill' => 'Free Refill', // Added for display
            'subscription_refill' => 'Subscription Refill', // Added for display
            'plan_upgrade_bonus' => 'Plan Upgrade Bonus', // Added for display
        ];
        return $names[$action] ?? ucwords(str_replace('_', ' ', $action));
    }

    private function getInsufficientCreditsMessage(string $action, int $required, int $available): string
    {
        $actionName = $this->getActionDisplayName($action);
        $shortfall = $required - $available;
        return "Insufficient credits for {$actionName}. You need {$required} credits but only have {$available}. You're short {$shortfall} credits.";
    }

    private function getNextRefillDate(User $user): ?string
    {
        if ($user->subscribed('default')) {
            $subscription = $user->subscription('default');
            if ($subscription->active() && $subscription->next_bill_date) {
                return $subscription->next_bill_date->format('Y-m-d');
            }
        }
        // For free users, next refill is start of next month
        if (!$user->subscribed('default')) {
            return now()->addMonth()->startOfMonth()->format('Y-m-d');
        }
        return null;
    }
}
