<?php

namespace App\Services;

use App\Models\Contact;
use App\Models\User;
use Illuminate\Support\Facades\Auth;

class ContactLimitService
{
    /**
     * Get contact limits based on plan from environment
     */
    public function getContactLimits(): array
    {
        return [
            'free' => (int) env('CONTACT_LIMIT_FREE', 200),
            'growth-monthly' => (int) env('CONTACT_LIMIT_GROWTH', 2000),
            'growth-annual' => (int) env('CONTACT_LIMIT_GROWTH', 2000),
            'scale-monthly' => (int) env('CONTACT_LIMIT_SCALE', 10000),
            'scale-annual' => (int) env('CONTACT_LIMIT_SCALE', 10000),
        ];
    }

    /**
     * Get user's current contact limit based on their plan
     */
    public function getUserContactLimit(User $user): int
    {
        $limits = $this->getContactLimits();
        $plan = $this->getUserPlan($user);

        return $limits[$plan] ?? $limits['free'];
    }

    /**
     * Get user's current plan
     */
    public function getUserPlan(User $user): string
    {
        // Check if user has a paid subscription
        if ($user->subscribedToPrice(config('services.paddle.growth_monthly_price_id'))) {
            return 'growth-monthly';
        } elseif ($user->subscribedToPrice(config('services.paddle.scale_monthly_price_id'))) {
            return 'scale-monthly';
        } elseif ($user->subscribedToPrice(config('services.paddle.growth_annual_price_id'))) {
            return 'growth-annual';
        } elseif ($user->subscribedToPrice(config('services.paddle.scale_annual_price_id'))) {
            return 'scale-annual';
        }

        return 'free';
    }

    /**
     * Get user's current contact usage
     */
    public function getUserContactUsage(User $user): int
    {
        return Contact::where('user_id', $user->id)->count();
    }

    /**
     * Check if user can add more contacts
     */
    public function canAddContacts(User $user, int $additionalContacts = 1): bool
    {
        $currentUsage = $this->getUserContactUsage($user);
        $limit = $this->getUserContactLimit($user);

        return ($currentUsage + $additionalContacts) <= $limit;
    }

    /**
     * Get remaining contact slots for user
     */
    public function getRemainingContacts(User $user): int
    {
        $currentUsage = $this->getUserContactUsage($user);
        $limit = $this->getUserContactLimit($user);

        return max(0, $limit - $currentUsage);
    }

    /**
     * Get usage statistics for user
     */
    public function getUsageStats(User $user): array
    {
        $currentUsage = $this->getUserContactUsage($user);
        $limit = $this->getUserContactLimit($user);
        $remaining = $this->getRemainingContacts($user);
        $percentage = $limit > 0 ? round(($currentUsage / $limit) * 100, 1) : 0;
        $plan = $this->getUserPlan($user);

        return [
            'used' => $currentUsage,
            'limit' => $limit,
            'remaining' => $remaining,
            'percentage' => $percentage,
            'plan' => $plan,
            'can_add' => $remaining > 0,
            'is_near_limit' => $percentage >= 80,
            'is_at_limit' => $percentage >= 100,
        ];
    }

    /**
     * Validate import file size against user's remaining limit
     */
    public function validateImportSize(User $user, int $importCount): array
    {
        $remaining = $this->getRemainingContacts($user);
        $plan = $this->getUserPlan($user);
        $limit = $this->getUserContactLimit($user);

        if ($importCount > $remaining) {
            return [
                'valid' => false,
                'message' => "Import contains {$importCount} contacts but you only have {$remaining} slots remaining on your {$plan} plan (limit: {$limit}). Please upgrade your plan or reduce the import size.",
                'remaining' => $remaining,
                'import_count' => $importCount,
                'plan' => $plan,
                'limit' => $limit,
            ];
        }

        return [
            'valid' => true,
            'message' => "Import validated successfully. Adding {$importCount} contacts.",
            'remaining' => $remaining,
            'import_count' => $importCount,
            'plan' => $plan,
            'limit' => $limit,
        ];
    }

    /**
     * Get plan upgrade suggestions
     */
    public function getUpgradeSuggestions(User $user): array
    {
        $currentPlan = $this->getUserPlan($user);
        $limits = $this->getContactLimits();
        $suggestions = [];

        if ($currentPlan === 'free') {
            $suggestions[] = [
                'plan' => 'growth',
                'limit' => $limits['growth-monthly'],
                'price' => config('services.paddle.growth_monthly_amount'),
                'recommended' => true,
            ];
            $suggestions[] = [
                'plan' => 'scale',
                'limit' => $limits['scale-monthly'],
                'price' => config('services.paddle.scale_monthly_amount'),
                'recommended' => false,
            ];
        } elseif (str_contains($currentPlan, 'growth')) {
            $suggestions[] = [
                'plan' => 'scale',
                'limit' => $limits['scale-monthly'],
                'price' => config('services.paddle.scale_monthly_amount'),
                'recommended' => true,
            ];
        }

        return $suggestions;
    }
}
