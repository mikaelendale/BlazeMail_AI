'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { router } from '@inertiajs/react';
import { Mail, RefreshCw, Settings, Zap } from 'lucide-react';
import { useState } from 'react';

interface EmailAccount {
    id: number;
    email: string;
    provider: string;
    status: string;
    last_sync: string | null;
    created_at: string;
}

interface Props {
    email_accounts: EmailAccount[];
    message: string;
    subtitle: string;
}

export default function SelectAccountPage({ email_accounts, message, subtitle }: Props) {
    const [syncingAccount, setSyncingAccount] = useState<number | null>(null);

    // Handle account sync
    const handleSyncAccount = (accountId: number) => {
        setSyncingAccount(accountId);
        router.post(
            '/inbox/sync-account',
            {
                account_id: accountId,
            },
            {
                onFinish: () => setSyncingAccount(null),
            },
        );
    };

    // Get provider icon
    const getProviderIcon = (provider: string) => {
        switch (provider) {
            case 'gmail':
                return <img src="https://api.iconify.design/logos/google-icon.svg" className="h-8 w-8" alt="Gmail" />;
            case 'outlook':
                return <img src="https://api.iconify.design/logos/microsoft-icon.svg" className="h-8 w-8" alt="Outlook" />;
            default:
                return <Mail className="h-8 w-8" />;
        }
    };

    // Format date
    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    return (
        <AppLayout>
            <div className="container mx-auto max-w-4xl px-4 py-8">
                {/* Header */}
                <div className="mb-8 text-center">
                    <div className="mb-4 flex justify-center">
                        <div className="rounded-full bg-blue-100 p-3">
                            <Mail className="h-8 w-8 text-blue-600" />
                        </div>
                    </div>
                    <h1 className="mb-2 text-3xl font-bold text-foreground">{message}</h1>
                    <p className="mx-auto max-w-2xl text-lg text-muted-foreground">{subtitle}</p>
                </div>

                {/* Account Selection */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {email_accounts.map((account) => (
                        <Card key={account.id} className="transition-shadow hover:shadow-lg">
                            <CardHeader className="pb-3">
                                <div className="flex items-center gap-3">
                                    {getProviderIcon(account.provider)}
                                    <div className="min-w-0 flex-1">
                                        <CardTitle className="truncate text-lg">{account.email}</CardTitle>
                                        <CardDescription className="capitalize">
                                            {account.provider} • Connected {formatDate(account.created_at)}
                                        </CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="pt-0">
                                <div className="space-y-3">
                                    {/* Account Status */}
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-muted-foreground">Status:</span>
                                        <span
                                            className={`rounded-full px-2 py-1 text-xs font-medium ${
                                                account.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                                            }`}
                                        >
                                            {account.status}
                                        </span>
                                    </div>

                                    {/* Last Sync */}
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-muted-foreground">Last Sync:</span>
                                        <span className="text-foreground">{account.last_sync ? formatDate(account.last_sync) : 'Never'}</span>
                                    </div>

                                    {/* Sync Button */}
                                    <Button
                                        onClick={() => handleSyncAccount(account.id)}
                                        disabled={syncingAccount === account.id}
                                        className="w-full"
                                        size="sm"
                                    >
                                        {syncingAccount === account.id ? (
                                            <>
                                                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                                                Syncing...
                                            </>
                                        ) : (
                                            <>
                                                <Zap className="mr-2 h-4 w-4" />
                                                Sync & View Inbox
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Help Section */}
                <div className="mt-12 text-center">
                    <Card className="bg-muted/50">
                        <CardContent className="p-6">
                            <h3 className="mb-2 text-lg font-semibold">Need to connect more accounts?</h3>
                            <p className="mb-4 text-muted-foreground">
                                You can connect additional email accounts to manage all your emails in one place.
                            </p>
                            <Button variant="outline" onClick={() => router.get('/email-accounts')}>
                                <Settings className="mr-2 h-4 w-4" />
                                Manage Email Accounts
                            </Button>
                        </CardContent>
                    </Card>
                </div>

                {/* Features Preview */}
                <div className="mt-8 grid gap-4 md:grid-cols-3">
                    <div className="p-4 text-center">
                        <div className="mx-auto mb-2 w-fit rounded-full bg-blue-100 p-2">
                            <Mail className="h-5 w-5 text-blue-600" />
                        </div>
                        <h4 className="mb-1 font-medium">Unified Inbox</h4>
                        <p className="text-sm text-muted-foreground">Manage all your emails from multiple accounts in one place</p>
                    </div>
                    <div className="p-4 text-center">
                        <div className="mx-auto mb-2 w-fit rounded-full bg-orange-100 p-2">
                            <Zap className="h-5 w-5 text-orange-600" />
                        </div>
                        <h4 className="mb-1 font-medium">Cold Email Detection</h4>
                        <p className="text-sm text-muted-foreground">Automatically identify and organize cold emails</p>
                    </div>
                    <div className="p-4 text-center">
                        <div className="mx-auto mb-2 w-fit rounded-full bg-green-100 p-2">
                            <RefreshCw className="h-5 w-5 text-green-600" />
                        </div>
                        <h4 className="mb-1 font-medium">Real-time Sync</h4>
                        <p className="text-sm text-muted-foreground">Keep your emails synchronized across all platforms</p>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
