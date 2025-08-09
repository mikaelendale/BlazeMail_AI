'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { OnboardingData } from '@/types/onboarding';
import { useState } from 'react';
import { Mail, Sparkles } from 'lucide-react';

interface WelcomeStepProps {
    onNext: () => void;
    onboardingData: OnboardingData;
    updateOnboardingData: (updates: Partial<OnboardingData>) => void;
    isValid?: boolean;
}

// Validation function for welcome step
export const validateWelcomeStep = (data: OnboardingData): boolean => {
    // Welcome step is always valid - just needs user to click get started
    return true;
};

export function WelcomeStep({ onNext, onboardingData, updateOnboardingData, isValid = true }: WelcomeStepProps) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        updateOnboardingData({
            userInfo: {
                ...onboardingData.userInfo,
                email
            }
        });
        onNext();
    };

    return (
        <div className="space-y-8 pt-20 py-12 text-center">
            <div className="space-y-6">
                <div className="space-y-4">
                    <h1 className="text-4xl font-bold tracking-tight">Welcome to BlazeMail!</h1>
                    <p className="mx-auto max-w-md text-md text-muted-foreground">
                        Create AI-powered emails in seconds and boost your outreach success.
                    </p>
                </div>
                <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                    <span>Takes less than 2 minutes to set up</span>
                </div>
            </div>
            <div className="pt-2">
                <Button variant={'outline'} onClick={onNext} size="sm" className="rounded-xl shadow-sm px-8">
                    Get Started
                </Button>
            </div>
        </div>
    );
}
