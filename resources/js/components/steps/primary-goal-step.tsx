'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import type { OnboardingData } from '@/types/onboarding';
import { ArrowLeft, ArrowRight, Briefcase, MessageSquare, Plus, Target, Users } from 'lucide-react';
import { useState } from 'react';

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
        icon: Briefcase,
        description: 'Win more clients with compelling proposals',
    },
    {
        id: 'b2b',
        label: 'B2B Outreach',
        icon: Users,
        description: 'Connect with prospects and decision makers',
    },
    {
        id: 'sales',
        label: 'Sales Follow-up',
        icon: Target,
        description: 'Nurture leads and close more deals',
    },
    {
        id: 'networking',
        label: 'Professional Networking',
        icon: MessageSquare,
        description: 'Build meaningful business relationships',
    },
    {
        id: 'custom',
        label: 'Other',
        icon: Plus,
        description: 'Tell us your specific use case',
    },
];

export function PrimaryGoalStep({ onNext, onPrev, onSkip, canSkip, isValid, onboardingData, updateOnboardingData }: PrimaryGoalStepProps) {
    const [showCustomInput, setShowCustomInput] = useState(onboardingData.userGoal === 'custom');

    const handleGoalChange = (value: string) => {
        updateOnboardingData({ userGoal: value });
        setShowCustomInput(value === 'custom');
        if (value !== 'custom') {
            updateOnboardingData({ customGoal: '' });
        }
    };

    return (
        <div className="space-y-8 py-8">
            <div className="space-y-4 text-center">
                <h2 className="text-3xl font-bold">What's your primary goal?</h2>
                <p className="text-muted-foreground">Help us personalize your BlazeMail experience</p>
            </div>

            <div className="space-y-6">
                <RadioGroup value={onboardingData.userGoal} onValueChange={handleGoalChange} className="space-y-3">
                    {goalOptions.map((option) => (
                        <Card
                            key={option.id}
                            className={`cursor-pointer transition-all hover:shadow-md ${
                                onboardingData.userGoal === option.id ? 'bg-primary/5 ring-2 ring-primary' : ''
                            }`}
                        >
                            <CardContent className="p-4">
                                <div className="flex items-start space-x-3">
                                    <RadioGroupItem value={option.id} id={option.id} className="mt-1" />
                                    <div className="flex-1">
                                        <Label htmlFor={option.id} className="flex cursor-pointer items-center gap-3 font-medium">
                                            <option.icon className="h-5 w-5 text-primary" />
                                            {option.label}
                                        </Label>
                                        <p className="mt-1 text-sm text-muted-foreground">{option.description}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </RadioGroup>

                {showCustomInput && (
                    <div className="space-y-2">
                        <Label htmlFor="customGoal">Tell us more about your specific use case</Label>
                        <Input
                            id="customGoal"
                            value={onboardingData.customGoal}
                            onChange={(e) => updateOnboardingData({ customGoal: e.target.value })}
                            placeholder="Describe your specific email goals..."
                            className="w-full"
                        />
                    </div>
                )}
            </div>

            <div className="flex items-center justify-between pt-8">
                <Button variant="ghost" onClick={onPrev}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back
                </Button>

                <div className="flex gap-2">
                    {canSkip && (
                        <Button variant="ghost" onClick={onSkip}>
                            Skip
                            <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                    )}
                    <Button onClick={onNext} disabled={!isValid}>
                        Continue
                        <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                </div>
            </div>
        </div>
    );
}
