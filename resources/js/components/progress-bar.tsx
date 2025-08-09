'use client';

import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import type { StepConfig } from '@/config/onboarding-config';
import type { OnboardingData } from '@/types/onboarding';

interface ProgressBarProps {
    currentStep: number;
    totalSteps: number;
    onboardingData: OnboardingData;
    steps: StepConfig[];
}

export function ProgressBar({ currentStep, totalSteps, steps }: ProgressBarProps) {
    const progress = ((currentStep + 1) / totalSteps) * 100;
    const currentStepConfig = steps[currentStep];

    return (
        <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
            <div className="mx-auto max-w-7xl px-4 py-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold">BlazeMail Setup</span>
                            {currentStepConfig.skippable && (
                                <Badge variant="secondary" className="text-xs">
                                    Optional
                                </Badge>
                            )}
                        </div>
                        <div className="hidden sm:flex items-center gap-2 text-sm text-muted-foreground">
                            <span>Step {currentStep + 1} of {totalSteps}</span>
                            <span>•</span>
                            <span>{currentStepConfig.title}</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="text-sm font-medium">{Math.round(progress)}%</span>
                        <Progress value={progress} className="w-24 h-2" />
                    </div>
                </div>
            </div>
        </div>
    );
}
