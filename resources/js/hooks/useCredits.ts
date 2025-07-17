import { SharedData } from '@/types';
import { usePage } from '@inertiajs/react';

interface CreditInfo {
    balance: number;
    has_credits: boolean;
    account_status: string;
    is_low_balance: boolean;
    is_critical_balance: boolean;
    available_actions: Record<string, any>;
    stats: any;
}

export function useCredits() {
    const { credits } = usePage<SharedData>().props as { credits: CreditInfo };

    const canPerformAction = (action: string): boolean => {
        if (!credits || !credits.has_credits) return false;
        if (credits.account_status !== 'active') return false;

        const actionInfo = credits.available_actions[action];
        return actionInfo ? actionInfo.available : false;
    };

    const getCreditCost = (action: string): number => {
        if (!credits) return 0;
        const actionInfo = credits.available_actions[action];
        return actionInfo ? actionInfo.cost : 0;
    };

    const getShortfall = (action: string): number => {
        if (!credits) return 0;
        const cost = getCreditCost(action);
        return Math.max(0, cost - credits.balance);
    };

    const requiresUpgrade = (action: string): boolean => {
        return !canPerformAction(action) && credits?.balance < getCreditCost(action);
    };

    return {
        credits,
        hasCredits: credits?.has_credits ?? false,
        balance: credits?.balance ?? 0,
        isLowBalance: credits?.is_low_balance ?? false,
        isCriticalBalance: credits?.is_critical_balance ?? false,
        accountStatus: credits?.account_status ?? 'active',
        canPerformAction,
        getCreditCost,
        getShortfall,
        requiresUpgrade,
        availableActions: credits?.available_actions ?? {},
    };
}
