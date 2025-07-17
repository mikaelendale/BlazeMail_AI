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
        <div className="w-full border-b rounded-2xl bg-accent">
            <div className="mx-auto max-w-2xl p-4">
                <div className="mb-2 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">
                            Step {currentStep + 1} of {totalSteps}
                        </span>
                        {currentStepConfig.skippable && (
                            <Badge variant="default"  className="text-xs size-min">
                                Optional
                            </Badge>
                        )}
                    </div>
                    <span className="text-sm font-medium">{Math.round(progress)}%</span>
                </div>
                <Progress value={progress} className="h-2" /> 
            </div>
        </div>
    );
}
