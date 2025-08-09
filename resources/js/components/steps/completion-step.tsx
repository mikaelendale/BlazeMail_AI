'use client';

import type React from 'react';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import type { OnboardingData } from '@/types/onboarding';
import { router } from '@inertiajs/react';
import { ArrowRight, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';

const STORAGE_KEY = 'blazemail_onboarding';

interface CompletionStepProps {
    onboardingData: OnboardingData;
    onFinalSubmit?: (formData: FormData) => Promise<void>;
    isSubmitting?: boolean;
    isValid?: boolean;
}

// Validation function for completion step
export const validateCompletionStep = (data: OnboardingData): boolean => {
    // Completion step is always valid - user just needs to submit
    return true;
};

export function CompletionStep({ onboardingData, onFinalSubmit, isSubmitting = false, isValid = true }: CompletionStepProps) {
    const [newsletter, setNewsletter] = useState(true);
    const [rating, setRating] = useState('');
    const [localIsValid, setLocalIsValid] = useState(isValid);

    // Update local validation when data changes
    useEffect(() => {
        const valid = validateCompletionStep(onboardingData);
        setLocalIsValid(valid);
    }, [onboardingData]);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (!localIsValid) {
            toast.error('Please complete all required steps before submitting');
            return;
        }

        const formData = new FormData();
        Object.entries(onboardingData).forEach(([key, value]) => {
            if (typeof value === 'object' && value !== null) {
                formData.append(key, JSON.stringify(value));
            } else {
                formData.append(key, String(value));
            }
        });
        formData.append('newsletter', String(newsletter));
        formData.append('rating', rating);

        router.post(route('user.onboarding.submit'), formData, {
            isSubmitting: true,
            preserveState: true,
            onSuccess: () => {
                if (onFinalSubmit) {
                    onFinalSubmit(formData);
                }
                localStorage.removeItem(STORAGE_KEY);
                router.visit(route('dashboard'), {
                    replace: true,
                });
            },
            onError: (error) => {
                toast.error('Error submitting onboarding data');
            },
            onFinish: () => {
                // Optionally handle any cleanup or final actions
            },
            preserveScroll: true,
        });
    };

    return (
        <div className="space-y-8 py-12">
            <div className="space-y-4 flex flex-col items-center text-center">
                <div className="space-y-4">
                    <h1 className="text-3xl font-bold"> You're All Set!</h1>
                    <p className="mx-auto max-w-sm text-muted-foreground">
                        Welcome to BlazeMail! You're ready to create amazing AI-powered emails.
                    </p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-4 flex flex-col items-center text-center">
                    <h3 className="text-lg font-semibold">Before you go...</h3>

                    {/* Newsletter Signup */}
                    <div className="flex items-center space-x-2">
                        <Checkbox id="newsletter" name="newsletter" checked={newsletter} onCheckedChange={setNewsletter} />
                        <Label htmlFor="newsletter" className="text-sm">
                            Subscribe to our newsletter for tips and updates
                        </Label>
                    </div>

                    {/* Rating */}
                    <div className="space-y-3">
                        <Label className="text-sm font-medium">How was your onboarding experience?</Label>
                        <RadioGroup value={rating} onValueChange={setRating} name="rating">
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="excellent" id="excellent" />
                                <Label htmlFor="excellent" className="text-sm">
                                    Excellent
                                </Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="good" id="good" />
                                <Label htmlFor="good" className="text-sm">
                                    Good
                                </Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="okay" id="okay" />
                                <Label htmlFor="okay" className="text-sm">
                                    Okay
                                </Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="poor" id="poor" />
                                <Label htmlFor="poor" className="text-sm">
                                    Needs improvement
                                </Label>
                            </div>
                        </RadioGroup>
                    </div>
                </div>

                <div className="flex justify-center">
                    <Button
                        type="submit"
                        size="default"
                        className="mt-5 items-center text-center"
                        disabled={isSubmitting || !localIsValid}
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Completing Setup...
                            </>
                        ) : (
                            <>
                                Complete & Go to Dashboard
                                <ArrowRight className="ml-2 h-4 w-4" />
                            </>
                        )}
                    </Button>
                </div> 
            </form>
        </div>
    );
}
