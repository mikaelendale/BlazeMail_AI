import Heading from '@/components/heading';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { NavItem, SharedData } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import { Separator } from '@radix-ui/react-select';
import { Link2, Link2Icon, Link2Off, Lock, Palette, User } from 'lucide-react';
import type { PropsWithChildren } from 'react';

interface SettingsLayoutProps extends PropsWithChildren {
    className?: string;
}

const sidebarNavItems: NavItem[] = [
    {
        title: 'Profile',
        href: '/settings/profile',
        icon: User,
        description: 'Manage your personal information',
    },
    {
        title: 'Connected Email & Sender Identity',
        href: '/settings/email-accounts',
        icon: Link2,
        description: 'Manage your connected accounts',
    },
    {
        title: 'Password',
        href: '/settings/password',
        icon: Lock,
        description: 'Update your password',
    },
    {
        title: 'Connected As',
        href: '/settings/social',
        icon: Link2,
        description: 'Manage social connections',
    },
    {
        title: 'Appearance',
        href: '/settings/appearance',
        icon: Palette,
        description: 'Customize your experience',
    },
];
const affiliateNavItems: NavItem[] = [
    {
        title: 'Referral',
        href: '/settings/referral',
        icon: Link2Icon,
        description: 'Manage your referrals',
    },  
];

export default function SettingsLayout({ className, children }: SettingsLayoutProps) {
    // When server-side rendering, we only render the layout on the client...
    const { auth } = usePage<SharedData>().props;
    const hadSocial = auth.user.provider_id !== null;

    const filteredSidebarNavItems = sidebarNavItems.filter((item) => {
        if (hadSocial) {
            return item.title !== 'Password';
        } else {
            return item.title !== 'Connected As';
        }
    });

    if (typeof window === 'undefined') {
        return null;
    }

    const currentPath = window.location.pathname;

    return (
        <div className="min-h-screen bg-background">
            <div className="container mx-auto px-1 py-8">
                <div className="mb-8">
                    <Heading title="Settings" description="Manage your profile and account settings" />
                </div>

                <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
                    {/* Sidebar Navigation */}
                    <div className="lg:col-span-1">
                        <Card className="sticky top-8">
                            <CardContent className="p-4">
                                <nav className="space-y-2">
                                    {filteredSidebarNavItems.map((item) => {
                                        const Icon = item.icon;
                                        const isActive = currentPath === item.href;

                                        return (
                                            <Link
                                                key={item.href}
                                                href={item.href}
                                                prefetch
                                                className={cn(
                                                    'flex items-center gap-3 rounded-lg px-3 py-3 text-sm transition-all hover:bg-accent hover:text-accent-foreground',
                                                    isActive ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground',
                                                )}
                                            >
                                                {Icon && <Icon className="h-4 w-4" />}
                                                <div className="flex-1">
                                                    <div className="font-medium">{item.title}</div>
                                                    <div className={cn('text-xs', isActive ? '' : 'text-muted-foreground')}>
                                                        {item.description}
                                                    </div>
                                                </div>
                                            </Link>
                                        );
                                    })}
                                </nav>
                            </CardContent>
                        </Card>
                        <div className='pt-4 pl-1 pb-4 font-bold text-primary'>Affiliate Links<hr/></div>
                        
                        <Card className=" sticky top-8">
                            <CardContent className="p-4">
                                <nav className="space-y-2">
                                    {affiliateNavItems.map((item) => {
                                        const Icon = item.icon;
                                        const isActive = currentPath === item.href;

                                        return (
                                            <Link
                                                key={item.href}
                                                href={item.href}
                                                prefetch
                                                className={cn(
                                                    'flex items-center gap-3 rounded-lg px-3 py-3 text-sm transition-all hover:bg-accent hover:text-accent-foreground',
                                                    isActive ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground',
                                                )}
                                            >
                                                {Icon && <Icon className="h-4 w-4" />}
                                                <div className="flex-1">
                                                    <div className="font-medium">{item.title}</div>
                                                    <div className={cn('text-xs', isActive ? '' : 'text-muted-foreground')}>
                                                        {item.description}
                                                    </div>
                                                </div>
                                            </Link>
                                        );
                                    })}
                                </nav>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Main Content */}
                    <div className="lg:col-span-3">
                        <Card>
                            <CardContent className="p-4">{children}</CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
}
