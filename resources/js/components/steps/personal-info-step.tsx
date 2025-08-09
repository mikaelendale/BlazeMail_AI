'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { OnboardingData } from '@/types/onboarding';
import { ArrowLeft, ArrowRight, BarChart3, Database, User } from 'lucide-react';
import { useState, useEffect } from 'react';

interface PersonalInfoStepProps {
    onNext: () => void;
    onPrev: () => void;
    onSkip: () => void;
    canSkip: boolean;
    isValid: boolean;
    onboardingData: OnboardingData;
    updateOnboardingData: (updates: Partial<OnboardingData>) => void;
}

// Update the validation function to be more comprehensive
export const validatePersonalInfoStep = (data: OnboardingData): boolean => {
    // Name is required and must be meaningful
    if (!data.userInfo?.name || data.userInfo.name.trim().length < 2) {
        return false;
    }

    // Phone is required and must be valid format
    if (!data.userInfo?.phone || data.userInfo.phone.trim().length < 10) {
        return false;
    }

    // Validate phone number format (basic validation)
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    const cleanPhone = data.userInfo.phone.replace(/[\s\-$$$$]/g, '');
    if (!phoneRegex.test(cleanPhone)) {
        return false;
    }

    return true;
};

export function PersonalInfoStep({ onNext, onPrev, onSkip, canSkip, isValid, onboardingData, updateOnboardingData }: PersonalInfoStepProps) {
    const [localIsValid, setLocalIsValid] = useState(isValid);
    const [errors, setErrors] = useState<{ [key: string]: string }>({});

    // Update local validation when data changes
    useEffect(() => {
        const valid = validatePersonalInfoStep(onboardingData);
        setLocalIsValid(valid);

        // Update the component to show more detailed validation
        // In the useEffect, update the errors object:
        const newErrors: { [key: string]: string } = {};

        if (!onboardingData.userInfo?.name || onboardingData.userInfo.name.trim().length < 2) {
            newErrors.name = 'Full name is required (minimum 2 characters)';
        }

        if (!onboardingData.userInfo?.phone) {
            newErrors.phone = 'Phone number is required';
        } else if (onboardingData.userInfo.phone.trim().length < 10) {
            newErrors.phone = 'Phone number must be at least 10 digits';
        } else {
            const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
            const cleanPhone = onboardingData.userInfo.phone.replace(/[\s\-$$$$]/g, '');
            if (!phoneRegex.test(cleanPhone)) {
                newErrors.phone = 'Please enter a valid phone number';
            }
        }

        setErrors(newErrors);
    }, [onboardingData]);

    const handleUserInfoChange = (field: string, value: string) => {
        updateOnboardingData({
            userInfo: { ...onboardingData.userInfo, [field]: value },
        });
    };

    const handleNext = () => {
        if (localIsValid) {
            updateOnboardingData({ profileCompleted: true });
            onNext();
        }
    };

    return (
        <div className="space-y-8 py-8">
            <div className="space-y-4 flex flex-col items-center text-center">
                <h2 className="text-3xl font-bold">Complete Your Profile</h2>
                <p className="text-muted-foreground max-w-sm">Help us personalize your experience and email signatures</p>
            </div>

            {/* Personal Information */}
            <Card className='rounded-3xl'>
                <CardHeader className=''>
                    <CardTitle className="flex items-center gap-2">
                        Personal Information
                    </CardTitle>
                    <CardDescription>Basic information for personalized communication</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="name">Full Name *</Label>
                            <Input
                                id="name"
                                value={onboardingData.userInfo.name}
                                onChange={(e) => handleUserInfoChange('name', e.target.value)}
                                placeholder="John Doe"
                                className={`rounded-lg shadow-none border ${errors.name ? 'border-destructive' : 'border-accent'}`}
                            />
                            {errors.name && (
                                <p className="text-sm text-destructive">{errors.name}</p>
                            )}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="phone">Phone Number *</Label>
                            <Input
                                id="phone"
                                value={onboardingData.userInfo.phone || ''}
                                onChange={(e) => handleUserInfoChange('phone', e.target.value)}
                                placeholder="+1 (555) 123-4567"
                                className={`rounded-lg shadow-none border ${errors.phone ? 'border-destructive' : 'border-accent'}`}
                            />
                            {errors.phone && (
                                <p className="text-sm text-destructive">{errors.phone}</p>
                            )}
                        </div>
                    </div>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="company">Company</Label>
                            <Input
                                id="company"
                                value={onboardingData.userInfo.company}
                                onChange={(e) => handleUserInfoChange('company', e.target.value)}
                                placeholder="Your Company"
                                className='rounded-lg shadow-none border border-accent '
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="industry">Industry</Label>
                            <Select value={onboardingData.userInfo.industry} onValueChange={(value) => handleUserInfoChange('industry', value)}>
                                <SelectTrigger className='rounded-lg shadow-none border border-accent '>
                                    <SelectValue placeholder="Select industry" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="technology">Technology</SelectItem>
                                    <SelectItem value="marketing">Marketing</SelectItem>
                                    <SelectItem value="consulting">Consulting</SelectItem>
                                    <SelectItem value="finance">Finance</SelectItem>
                                    <SelectItem value="healthcare">Healthcare</SelectItem>
                                    <SelectItem value="education">Education</SelectItem>
                                    <SelectItem value="retail">Retail</SelectItem>
                                    <SelectItem value="other">Other</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Validation feedback */}
                    {!localIsValid && (
                        <div className="text-center pt-4">
                            <p className="text-sm text-muted-foreground">
                                Please fill in all required fields to continue
                            </p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
