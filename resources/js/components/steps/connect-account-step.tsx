'use client';

import type React from 'react';

import { Alert, AlertDescription } from '@/components/ui/alert';

import { Badge } from '@/components/ui/badge';

import { Button } from '@/components/ui/button';

import { Card, CardContent } from '@/components/ui/card'; 

import { AlertCircle, ArrowLeft, ArrowRight, CheckCircle, Clock, Server, Trash2 } from 'lucide-react';

import { useEffect, useState } from 'react';

interface OnboardingData {   emailConnected?: boolean;
}

interface ConnectAccountStepProps {
    onNext: () => void;
    onPrev: () => void;
    onboardingData: OnboardingData;
    updateOnboardingData: (updates: Partial<OnboardingData>) => void;
    // Add these props to get real data from Laravel
    connectedAccounts?: EmailConnection[];
    flashMessage?: { type: 'success' | 'error'; message: string };
}

interface EmailConnection {
    id: number;
    email: string;
    provider: 'gmail' | 'imap' | 'outlook' | 'yahoo';
    status: 'active' | 'warming' | 'paused' | 'error' | 'pending';
    is_connected: boolean;
    created_at: string;
    daily_limit: number;
    daily_sent: number;
    warmup_progress: number;
    reputation: 'excellent' | 'good' | 'fair' | 'poor' | 'unknown';
}

export function ConnectAccountStep({
    onNext,
    onPrev,
    onboardingData,
    updateOnboardingData,
    connectedAccounts = [],
    flashMessage,
    accounts = [], 
    providers = [],
}: ConnectAccountStepProps) { 
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [isConnecting, setIsConnecting] = useState<string | null>(null); 

    const oauthProviders = [
        {
            id: 'gmail',
            name: 'Gmail',
            img: 'https://api.iconify.design/logos/google-icon.svg',
            enabled: true,
            oauth: true,
        },
        {
            id: 'outlook',
            name: 'Outlook',
            img: 'https://api.iconify.design/logos/microsoft-icon.svg',
            enabled: false,
            coming_soon: true,
        },
        {
            id: 'yahoo',
            name: 'Yahoo',
            img: 'https://api.iconify.design/logos/yahoo.svg',
            enabled: false,
            coming_soon: true,
        },
        {
            id: 'imap',
            name: 'IMAP/SMTP',
            img: 'https://api.iconify.design/logos/server.svg',
            enabled: false,
            oauth: false,
            coming_soon: true,
        },
    ];

    // Handle Gmail OAuth - REAL REDIRECT WITH RETURN URL! 🔥
    const handleGmailConnect = () => {
        console.log("Starting Gmail OAuth...")
        setIsConnecting("gmail")
        setError(null)
        // Pass the current page's URL as return_url
        const currentUrl = encodeURIComponent(window.location.href)
        window.location.href = `/oauth/gmail/start?return_url=${currentUrl}`
        return
    }


   const getProviderIcon = (provider: string) => {
        switch (provider) {
            case 'gmail':
                return <img src="https://api.iconify.design/logos/google-icon.svg" className="h-5 w-5" alt="Gmail" />;
            case 'outlook':
                return <img src="https://api.iconify.design/logos/microsoft-icon.svg" className="h-5 w-5" alt="Outlook" />;
            case 'yahoo':
                return <img src="https://api.iconify.design/logos/yahoo.svg" className="h-5 w-5" alt="Yahoo" />;
            case 'imap':
                return <Server className="h-5 w-5" />;
            default:
                return <Server className="h-5 w-5" />;
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'active':
                return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
            case 'warming':
                return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
            case 'paused':
                return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
            case 'error':
                return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
            case 'pending':
                return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
            default:
                return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
        });
    };

    const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
        e.currentTarget.src = 'https://cdn-icons-png.flaticon.com/128/622/622397.png'; // Fallback image
    };

    return (
        
        <div className="mx-auto max-w-md px-4 py-8">
            <div className="mb-8 text-center">
                <h2 className="mb-2 text-2xl font-semibold">Connect Email</h2>
                <p className="text-sm text-muted-foreground">Connect your email to continue</p>
            </div> 
            {/* Connected Accounts - REAL DATA! */}
            {accounts.length > 0 && (
                <div className="mb-8">
                    <h3 className="mb-4 text-sm font-medium">Connected Accounts ({accounts.length})</h3>
                    <div className="space-y-3">
                        {accounts.map((account) => (
                            <Card key={account.id} className="border border-border">
                                <CardContent className="p-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex min-w-0 flex-1 items-center gap-3">
                                            <div className="flex items-center gap-2">
                                                {getProviderIcon(account.provider)}
                                                <div className="min-w-0">
                                                    <div className="mb-1 flex items-center gap-2">
                                                        <p className="truncate font-medium text-foreground">{account.email}</p>
                                                        <Badge className={`text-xs ${getStatusColor(account.status)}`}>
                                                            <span className="ml-1 capitalize">{account.status}</span>
                                                        </Badge>
                                                    </div>
                                                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                                        <span>Added {formatDate(account.createdAt)}</span> 
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            )}

            {/* OAuth Providers */}
            <div className="grid grid-cols-2 gap-3">
                {oauthProviders.map((provider) => (
                    <Button
                        key={provider.id}
                        variant="outline"
                        className={`relative h-12 w-full justify-start bg-transparent ${!provider.enabled ? 'cursor-not-allowed opacity-50' : ''}`}
                        onClick={() => provider.id === 'gmail' && provider.enabled && handleGmailConnect()}
                        disabled={!provider.enabled || isConnecting === provider.id}
                    >
                        {isConnecting === provider.id ? (
                            <Clock className="mr-3 h-5 w-5 animate-spin" />
                        ) : (
                            <img
                                src={provider.img || 'https://cdn-icons-png.flaticon.com/128/622/622397.png'}
                                className="mr-3 h-5 w-5"
                                alt={provider.name}
                                onError={handleImageError}
                            />
                        )}
                        {isConnecting === provider.id ? 'Connecting...' : provider.name}

                        {provider.coming_soon && (
                            <span className="absolute -top-1 -right-1 rounded bg-orange-500 px-1 py-0.5 text-[10px] text-white">Soon</span>
                        )}
                    </Button>
                ))}
            </div>

            <Alert variant={'default'} className="mt-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                    <p>
                        To send cold emails, we need access to your email account. We never read your personal emails and only send campaigns you
                        create.{' '}
                        <a href="/privacy" className="text-blue-600 underline">
                            Privacy policy
                    </a>
                        .
                    </p>
                </AlertDescription>
            </Alert>

            <div className="flex justify-between pt-8">
                <Button variant="ghost" onClick={onPrev}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back
                </Button>
                <Button onClick={onNext}>
                    {accounts.length > 0 ? 'Continue' : 'Skip'}
                    <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
            </div>
        </div>
    );
}
