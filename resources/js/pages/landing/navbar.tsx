'use client';

import AppLogo from '@/components/app-logo';
import { ShinyButton } from '@/components/magicui/shiny-button';
import { Button } from '@/components/ui/button';
import { ModeToggle } from '@/components/ui/mode-toggle';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { SharedData } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import { DollarSignIcon, FeatherIcon, Gem, Home, Library, List, LogIn } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function Navbar() {
    const { auth } = usePage<SharedData>().props;
    //logout
    const { url } = usePage();
    const [activeTab, setActiveTab] = useState('home');
    const navItems = [
        { id: 'home', icon: Home, label: 'Home', href: '/' },
        { id: 'pricing', icon: Gem, label: 'Pricing', href: '/pricing' },
        { id: 'support', icon: Library, label: 'Support', href: '/support' },
    ];

    const getActiveIndex = () => {
        return navItems.findIndex((item) => item.id === activeTab);
    };

    const handleTabClick = (tabId: string) => {
        setActiveTab(tabId);
    };
    useEffect(() => {
        const currentItem = navItems.find((item) => {
            if (item.href === '/' && url === '/') return true;
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
                                                    className={`h-10 w-10 rounded-full transition-colors duration-300 ease-in-out hover:bg-transparent ${isActive
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
                    {/* Separator */}
                    {/* <div className="h-6 w-px bg-gray-200 dark:bg-gray-700"></div> */}

                    {/* Theme Toggle */}
                    {/* Logout Button */}
                    {auth.user ? (
                        <>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <ModeToggle />
                                </TooltipTrigger>
                                <TooltipContent side="bottom" className="rounded-lg border px-3 py-1.5 text-sm text-background">
                                    Theme
                                </TooltipContent>
                            </Tooltip>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Link href="/dashboard" method="post" className="h-10 w-10 rounded-full  bg-accent">
                                        <LogIn className="h-5 w-5 mx-auto text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200" />
                                    </Link>
                                </TooltipTrigger>
                                <TooltipContent side="bottom" className="rounded-lg border px-3 py-1.5 text-sm text-background">
                                    Dashboard
                                </TooltipContent>
                            </Tooltip>
                        </>
                    ) : (
                        <>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Link href="/register">
                                        <ShinyButton className="h-10 w-22 rounded-2xl transition-colors duration-300">Try</ShinyButton>
                                    </Link>
                                </TooltipTrigger>
                                <TooltipContent side="bottom" className="rounded-lg border px-3 py-1.5 text-sm text-background">
                                    Try it now
                                </TooltipContent>
                                </Tooltip>

                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <ModeToggle />
                                    </TooltipTrigger>
                                    <TooltipContent side="bottom" className="rounded-lg border px-3 py-1.5 text-sm text-background">
                                        Theme
                                    </TooltipContent>
                                </Tooltip>
                        </>
                    )}
                </nav>
            </TooltipProvider>
        </div>
    );
}
