'use client';

import AppLogo from '@/components/app-logo';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useMobileNavigation } from '@/hooks/use-mobile-navigation';
import { Link, router, usePage } from '@inertiajs/react';
import { Bell, Contact, Home, LogOut, Mail, Megaphone, NotebookText, StepForwardIcon, Ticket, User } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function Navbar() {
    //logout
    const { url } = usePage();
    const [activeTab, setActiveTab] = useState('Dashboard');
    const navItems = [
        { id: 'Dashboard', icon: Home, label: 'Dashboard', href: '/dashboard' },
        { id: 'MyEmails', icon: Mail, label: 'My Emails', href: '/my-emails' },
        { id: 'Campaign', icon: Megaphone, label: 'Campaign', href: '/email/campaign' },
        { id: 'Contacts', icon: Contact, label: 'Contacts', href: '/contacts' },
        { id: 'Notifications', icon: Bell, label: 'Notifications', href: '/notifications' },
        { id: 'Billing', icon: Ticket, label: 'Billing', href: '/billing' },
        { id: 'Profile', icon: User, label: 'Profile', href: '/settings/profile' },
    ];
    const getActiveIndex = () => {
        return navItems.findIndex((item) => item.id === activeTab);
    };

    const handleTabClick = (tabId: string) => {
        setActiveTab(tabId);
    };
    useEffect(() => {
        const currentItem = navItems.find((item) => {
            if (item.href === '/dashboard' && url === '/') return true;
            if (item.href !== '/' && url.startsWith(item.href)) return true;
            return false;
        });

        // Only set active tab if a matching nav item is found
        if (currentItem) {
            setActiveTab(currentItem.id);
        } else {
            // Clear active tab if current page is not in navigation
            setActiveTab('');
        }
    }, [url]);
    const activeIndex = getActiveIndex();
    const hasActiveTab = activeIndex !== -1;
    const cleanup = useMobileNavigation();

    const handleLogout = () => {
        cleanup();
        router.flushAll();
    };

    return (
        <div className="fixed top-6 left-1/2 z-50 flex -translate-x-1/2 justify-center p-0">
            <TooltipProvider delayDuration={0}>
                <nav className="flex items-center gap-4 rounded-full border border-accent bg-primary-foreground px-4 py-2 shadow-sm backdrop-blur-md dark:bg-primary-foreground dark:shadow-2xl">
                    {/* Logo */}
                    <div className="flex items-center">
                        <div className="flex h-7 w-7 items-center justify-center rounded-lg">
                            <AppLogo />
                        </div>
                    </div>

                    {/* Navigation Items Container with Background */}
                    <div className="relative rounded-full bg-background p-1">
                        <div className="relative flex items-center gap-1">
                            {/* Active Sliding Background - Only show when there's an active tab */}
                            {hasActiveTab && (
                                <div
                                    className="absolute h-10 w-10 rounded-full bg-primary-foreground shadow-sm transition-all duration-300 ease-in-out dark:shadow-lg"
                                    style={{
                                        transform: `translateX(${activeIndex * 44}px)`, // 40px button + 4px gap
                                    }}
                                />
                            )}

                            {navItems.map((item, index) => {
                                const Icon = item.icon;
                                const isActive = activeTab === item.id;

                                return (
                                    <Tooltip key={item.id}>
                                        <TooltipTrigger asChild>
                                            <Link href={item.href} className="relative z-10">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className={`h-10 w-10 rounded-full transition-colors duration-300 ease-in-out hover:bg-transparent ${
                                                        isActive
                                                            ? 'text-gray-900 dark:text-gray-100'
                                                            : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200'
                                                    } `}
                                                    onClick={() => handleTabClick(item.id)}
                                                >
                                                    <Icon className="h-5 w-5" />
                                                    <span className="sr-only">{item.label}</span>
                                                </Button>
                                            </Link>
                                        </TooltipTrigger>
                                        <TooltipContent side="bottom" className="rounded-lg border px-3 py-1.5 text-sm text-background">
                                            {item.label}
                                        </TooltipContent>
                                    </Tooltip>
                                );
                            })}
                        </div>
                    </div> 
                </nav>
            </TooltipProvider>
        </div>
    );
}
