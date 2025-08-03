'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { router } from '@inertiajs/react';
import { Mail, Plus, Settings } from 'lucide-react';

interface Props {
    message: string;
    action_text: string;
    connect_url: string;
}

export default function NoAccountsPage({ message, action_text, connect_url }: Props) {
    return (
        <AppLayout>
            <div className="container mx-auto max-w-2xl px-4 py-12">
                <div className="text-center">
                    {/* Icon */}
                    <div className="mb-6 flex justify-center">
                        <div className="rounded-full bg-muted p-4">
                            <Mail className="h-12 w-12 text-muted-foreground" />
                        </div>
                    </div>

                    {/* Message */}
                    <h1 className="mb-2 text-2xl font-bold text-foreground">{message}</h1>
                    <p className="mb-8 text-lg text-muted-foreground">{action_text}</p>

                    {/* Action Button */}
                    <Button size="lg" onClick={() => router.get(connect_url)}>
                        <Plus className="mr-2 h-5 w-5" />
                        Connect Email Account
                    </Button>

                    {/* Help Card */}
                    <Card className="mt-8 bg-muted/50">
                        <CardContent className="p-6">
                            <div className="flex items-start gap-4">
                                <div className="rounded-full bg-blue-100 p-2">
                                    <Settings className="h-5 w-5 text-blue-600" />
                                </div>
                                <div className="text-left">
                                    <h3 className="mb-1 font-semibold">Getting Started</h3>
                                    <p className="text-sm text-muted-foreground">
                                        Connect your Gmail, Outlook, or other email accounts to start managing your cold email campaigns and inbox
                                        from one central location.
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card> 
                </div>
            </div>
        </AppLayout>
    );
}
