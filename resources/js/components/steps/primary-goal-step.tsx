'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import type { OnboardingData } from '@/types/onboarding';
import { ArrowLeft, ArrowRight, BadgeDollarSign, Briefcase, EarthLock, Handshake, MessageSquare, Plus, Projector, Target, Users, Video } from 'lucide-react';
import { useState, useEffect } from 'react';

interface PrimaryGoalStepProps {
    onNext: () => void;
    onPrev: () => void;
    onSkip: () => void;
    canSkip: boolean;
    isValid: boolean;
    onboardingData: OnboardingData;
    updateOnboardingData: (updates: Partial<OnboardingData>) => void;
}

const goalOptions = [
    {
        id: 'freelancer',
        label: 'Freelancer Pitching',
        icon: Projector,
        description: 'Win more clients with compelling proposals',
    },
    {
        id: 'b2b',
        label: 'B2B Outreach',
        icon: Handshake,
        description: 'Connect with prospects and decision makers',
    },
    {
        id: 'sales',
        label: 'Sales Follow-up',
        icon: BadgeDollarSign,
        description: 'Nurture leads and close more deals',
    },
    {
        id: 'networking',
        label: 'Professional Networking',
        icon: EarthLock,
        description: 'Build meaningful business relationships',
    },
    {
        id: 'content_creator',
        label: 'Content Creator Outreach',
        icon: Video,
        description: 'Engage your audience with personalized messages',
    },
    {
        id: 'custom',
        label: 'Other',
        icon: Plus,
        description: 'Tell us your specific use case',
    },
];

// Update the validation function to be more strict
export const validatePrimaryGoalStep = (data: OnboardingData): boolean => {
    // Must have a goal selected
    if (!data.userGoal || data.userGoal.trim() === '') {
        return false;
    }

    // If custom goal is selected, must have custom goal text with meaningful content
    if (data.userGoal === 'custom') {
        if (!data.customGoal || data.customGoal.trim().length < 5) {
            return false;
        }
    }

    return true;
};

export function PrimaryGoalStep({ onNext, onPrev, onSkip, canSkip, isValid, onboardingData, updateOnboardingData }: PrimaryGoalStepProps) {
    const [showCustomInput, setShowCustomInput] = useState(onboardingData.userGoal === 'custom');
    const [localIsValid, setLocalIsValid] = useState(isValid);

    // Update local validation when data changes
    useEffect(() => {
        const valid = validatePrimaryGoalStep(onboardingData);
        setLocalIsValid(valid);
    }, [onboardingData]);

    const handleGoalChange = (value: string) => {
        updateOnboardingData({ userGoal: value });
        setShowCustomInput(value === 'custom');
        if (value !== 'custom') {
            updateOnboardingData({ customGoal: '' });
        }
    };

    const handleCustomGoalChange = (value: string) => {
        updateOnboardingData({ customGoal: value });
    };

    return (
        <div className="space-y-8 py-8">
            <div className="space-y-4 flex flex-col items-center text-center">
                <h2 className="text-3xl font-bold">What's your primary goal?</h2>
                <p className="text-muted-foreground max-w-sm">
                    Help us personalize your BlazeMail experience and suggest the best features for you.
                </p>
            </div>

            <div className="space-y-6">
                <RadioGroup
                    value={onboardingData.userGoal}
                    onValueChange={handleGoalChange}
                    className="grid grid-cols-1 sm:grid-cols-2 gap-4"
                >
                    {goalOptions.map((option) => (
                        <Card
                            key={option.id}
                            className={`cursor-pointer transition-all duration-200 hover:shadow-md ${onboardingData.userGoal === option.id
                                    ? 'ring-2 ring-primary shadow-sm'
                                    : 'hover:border-muted-foreground/20'
                                }`}
                        >
                            <CardContent className="p-4">
                                <div className="flex items-start space-x-4">
                                    <RadioGroupItem value={option.id} id={option.id} className="mt-1" />
                                    <div className="flex-1">
                                        <Label htmlFor={option.id} className="flex cursor-pointer items-start gap-3">
                                            <div className={`p-2 rounded-lg bg-accent `}>
                                                <option.icon className={`h-5 w-5`} />
                                            </div>
                                            <div className="space-y-1">
                                                <div className="font-semibold">{option.label}</div>
                                                <p className="text-sm text-muted-foreground">{option.description}</p>
                                            </div>
                                        </Label>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </RadioGroup>

                {showCustomInput && (
                    <div className="space-y-2 animate-in slide-in-from-top-2 duration-200">
                        <Label htmlFor="customGoal">Tell us more about your specific use case *</Label>
                        <Input
                            id="customGoal"
                            value={onboardingData.customGoal}
                            onChange={(e) => handleCustomGoalChange(e.target.value)}
                            placeholder="Describe your specific email goals..."
                            className="w-full"
                        />
                        {onboardingData.userGoal === 'custom' && (!onboardingData.customGoal || onboardingData.customGoal.trim().length < 5) && (
                            <p className="text-sm text-destructive">Please provide at least 5 characters describing your use case</p>
                        )}
                    </div>
                )}

                {/* Validation feedback */}
                {!localIsValid && onboardingData.userGoal && (
                    <div className="text-center">
                        <p className="text-sm text-muted-foreground">
                            {onboardingData.userGoal === 'custom'
                                ? 'Please describe your specific use case to continue'
                                : 'Please select your primary goal to continue'
                            }
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
