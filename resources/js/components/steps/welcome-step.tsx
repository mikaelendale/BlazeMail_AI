'use client';

import { Button } from '@/components/ui/button';
import type { OnboardingData } from '@/types/onboarding';
import { Mail, Sparkles } from 'lucide-react';

interface WelcomeStepProps {
    onNext: () => void;
    onboardingData: OnboardingData;
    updateOnboardingData: (updates: Partial<OnboardingData>) => void;
}

export function WelcomeStep({ onNext }: WelcomeStepProps) {
    return (
        <div className="space-y-8 pt-20 py-12 text-center">
            <div className="space-y-6">

                <div className="space-y-4">
                    <h1 className="text-4xl font-bold tracking-tight">Welcome to BlazeMail!</h1>
                    <p className="mx-auto max-w-md text-xl text-muted-foreground">
                        Create AI-powered emails in seconds and boost your outreach success.
                    </p>
                </div>

                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                    <span>Takes less than 2 minutes to set up</span>
                </div>
            </div>

            <div className="pt-8">
                <Button onClick={onNext} size="lg" className="px-8">
                    Get Started
                </Button>
            </div>
        </div>
    );
}
