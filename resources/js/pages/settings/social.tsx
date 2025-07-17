import HeadingSmall from '@/components/heading-small';
import { SharedData, type BreadcrumbItem } from '@/types';
import { Head, usePage } from '@inertiajs/react';

import AppLayout from '@/layouts/app-layout';
import SettingsLayout from '@/layouts/settings/layout';

import { Badge } from '@/components/ui/badge';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Connected As',
        href: '/settings/social',
    },
];

export default function Social() {
    const isConnected = true;
    const { auth } = usePage<SharedData>().props;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Social settings" />

            <SettingsLayout>
                <div className="space-y-6">
                    <HeadingSmall title="Social settings" description="Update your account's social settings" />
                    <Card className="w-full max-w-sm">
                        <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-2">
                                    {auth.user.provider_name === 'google' ? (
                                        <img src="https://api.iconify.design/logos/google-icon.svg" alt="Google" />
                                    ) : auth.user.provider_name === 'github' ? (
                                        <img src="https://api.iconify.design/logos/github-icon.svg" alt="GitHub" />
                                    ) : null}
                                    <CardTitle className="text-lg">
                                        {auth.user.provider_name === 'google' ? 'Google' : auth.user.provider_name === 'github' ? 'GitHub' : ''}
                                    </CardTitle>
                                </div>
                                <Badge
                                    variant={isConnected ? 'default' : 'secondary'}
                                    className={isConnected ? 'bg-green-100 text-green-800 hover:bg-green-100' : ''}
                                >
                                    {isConnected ? 'Connected' : 'Disconnected'}
                                </Badge>
                            </div>
                            <CardDescription>
                                {isConnected ? 'Your Google account is successfully connected' : 'Connect your Google account to continue'}
                            </CardDescription>
                        </CardHeader>
                    </Card>
                </div>
            </SettingsLayout>
        </AppLayout>
    );
}
