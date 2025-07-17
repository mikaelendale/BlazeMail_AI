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
        <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
            <Navbar />
            <main className="relative">{children}</main>
            <Footer />
            <CookieConsent />
            <FloatingLandiing/>
        </div>
    );
};

export default LandingLayout;
