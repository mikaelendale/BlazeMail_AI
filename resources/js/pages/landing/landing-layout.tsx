import React, { ReactNode } from 'react';
import CookieConsent from './cookie-consent';
import Navbar from './navbar';
import Footer from '@/components/footer';
import FloatingLandiing from '@/components/floating-landing';

interface LandingLayoutProps {
    children: ReactNode;
}

const LandingLayout: React.FC<LandingLayoutProps> = ({ children }) => {
    return (
        <>
            {/* Background Pattern */}
            {/* <div className="fixed inset-0 overflow-hidden">
                <svg
                    className="absolute inset-0 h-full w-full opacity-5 dark:opacity-8 text-orange-500 dark:text-orange-300"
                    xmlns="http://www.w3.org/2000/svg"
                    aria-hidden="true"
                >
                    <defs>
                        <pattern id="grid-pattern" width="60" height="60" patternUnits="userSpaceOnUse">
                            <path d="M 60 0 L 0 0 0 60" fill="none" stroke="currentColor" strokeWidth="1.5" />
                        </pattern>
                        <pattern id="dot-pattern" width="20" height="20" patternUnits="userSpaceOnUse">
                            <circle cx="10" cy="10" r="1.5" fill="currentColor" />
                        </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill="url(#grid-pattern)" />
                    <rect width="100%" height="100%" fill="url(#dot-pattern)" />
                </svg>
            </div > */}
            <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
                <Navbar />
                <main className="relative">{children}</main>
                <Footer />
                <CookieConsent />
                <FloatingLandiing />
            </div>
        </>
    );
};

export default LandingLayout;
