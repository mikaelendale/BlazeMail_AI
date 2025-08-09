export interface EmailAccount {
    id: number;
    email: string;
    provider: 'gmail' | 'imap' | 'outlook' | 'yahoo';
    status: 'active' | 'warming' | 'paused' | 'error' | 'pending';
    isConnected: boolean;
    isVerified: boolean;
    dailyLimit: number;
    dailySent: number;
    hourlyLimit: number;
    hourlySent: number;
    warmupProgress: number;
    reputation: 'excellent' | 'good' | 'fair' | 'poor' | 'unknown';
    lastActivity: string;
    createdAt: string;
    healthScore: number;
    canSend: boolean;
    nextWarmupEmail: number | null;
}

export interface Provider {
    id: string;
    name: string;
    enabled: boolean;
    oauth?: boolean;
    comingSoon?: boolean;
    icon?: string;
}

export interface Stats {
    totalAccounts: number;
    activeAccounts: number;
    warmingAccounts: number;
    totalSentToday: number;
    totalLimit: number;
    averageHealthScore: number;
}
export interface UserInfo {
    name: string;
    company: string;
    industry: string;
    phone?: string;
}

export interface UsageAndIntegrations {
    emailVolume?: string;
    campaignGoal?: string;
    crm?: string;
    referralSource?: string;
}

export interface OnboardingData {
    emailConnected: boolean;
    profileCompleted: boolean;
    // New field for usage and integrations
    usageAndIntegrationsCompleted: boolean;
    usageAndIntegrations: UsageAndIntegrations;
    userGoal: string;
    customGoal: string;
    userInfo: UserInfo;
}
 