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
    emailVolume?: string;
    campaignGoal?: string;
    crm?: string;
    referralSource?: string;
}

export interface EmailData {
    recipientName: string;
    subject: string;
    content: string;
    tone: 'professional' | 'friendly' | 'casual' | 'formal';
}

export interface OnboardingData {
    emailConnected: boolean;
    profileCompleted: boolean;
    firstEmailSent: boolean;
    userGoal: string;
    customGoal: string;
    userInfo: UserInfo;
    emailData: EmailData;
}

export type OnboardingStep = 'welcome' | 'survey' | 'email-creation' | 'completion';
