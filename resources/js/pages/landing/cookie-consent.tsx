'use client';

import { Button } from '@/components/ui/button';
import { Cookie, X } from 'lucide-react';
import { useEffect, useState } from 'react';

// Configuration - Easy to adjust
const CONFIG = {
    showDelay: 1000,
    animationDuration: 300,
    storageKeys: {
        accepted: 'cookieConsent',
        dismissed: 'cookieDismissed',
    },
    consentUrl: '/privacy',
};

export default function CookieConsent() {
    const [isVisible, setIsVisible] = useState(false);
    const [isExiting, setIsExiting] = useState(false);

    // Check if consent should be shown
    useEffect(() => {
        const hasAccepted = localStorage.getItem(CONFIG.storageKeys.accepted);
        const wasDismissed = sessionStorage.getItem(CONFIG.storageKeys.dismissed);

        if (!hasAccepted && !wasDismissed) {
            const timer = setTimeout(() => setIsVisible(true), CONFIG.showDelay);
            return () => clearTimeout(timer);
        }
    }, []);

    // Handle exit animation then hide
    const handleExit = (callback: () => void) => {
        setIsExiting(true);
        setTimeout(() => {
            callback();
            setIsVisible(false);
            setIsExiting(false);
        }, CONFIG.animationDuration);
    };

    // Accept cookies
    const handleAccept = () => {
        handleExit(() => {
            localStorage.setItem(CONFIG.storageKeys.accepted, 'true');
        });
    };

    // Dismiss for session
    const handleDismiss = () => {
        handleExit(() => {
            sessionStorage.setItem(CONFIG.storageKeys.dismissed, 'true');
        });
    };

    if (!isVisible) return null;

    return (
        <div
            className={`fixed z-50 p-0 transition-all duration-300 sm:right-6 sm:bottom-6   sm:flex sm:justify-center ${
            isExiting ? 'animate-out fade-out slide-out-to-bottom-4' : 'animate-in fade-in slide-in-from-bottom-4'
            } ${!window.matchMedia('(min-width: 640px)').matches ? 'left-1/2 bottom-6 flex justify-center w-full -translate-x-1/2' : ''}`}
        >
            <div className="flex max-w-sm items-center gap-3 rounded-full border border-accent bg-primary-foreground/95 px-4 py-3 shadow-lg backdrop-blur-md">
            {/* Icon */}
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30">
                <Cookie className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
            </div>

            {/* Text with link */}
            <div className="flex-1 text-xs text-foreground/80">
                By continuing to this site you agree to our cookies and{' '}
                <a href={CONFIG.consentUrl} className="text-primary underline underline-offset-2 hover:text-primary/80">
                consent
                </a>
            </div>

            {/* Buttons */}
            <div className="flex items-center gap-1">
                <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 rounded-full text-foreground/60 hover:bg-background/50"
                onClick={handleDismiss}
                disabled={isExiting}
                >
                </Button>

                <Button
                onClick={handleAccept}
                className="rounded-full bg-primary px-4 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90"
                disabled={isExiting}
                >
                Okay
                </Button>
            </div>
            </div>
        </div>
    );
}
