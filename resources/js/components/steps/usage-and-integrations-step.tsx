'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { OnboardingData } from '@/types/onboarding';
import { ArrowLeft, ArrowRight, BarChart3, Database, User } from 'lucide-react';
import { useState, useEffect } from 'react';

interface UsageAndIntegrationsStepProps {
    onNext: () => void;
    onPrev: () => void;
    onSkip: () => void;
    canSkip: boolean;
    isValid: boolean;
    onboardingData: OnboardingData;
    updateOnboardingData: (updates: Partial<OnboardingData>) => void;
}

// Update validation to be more specific about completion
export const validateUsageAndIntegrationsStep = (data: OnboardingData): boolean => {
    // Since this step is skippable, we need to check if user started filling it
    // If they started, they should complete the basic required fields

    const hasStarted = data.usageAndIntegrations?.emailVolume ||
        data.usageAndIntegrations?.campaignGoal ||
        data.usageAndIntegrations?.crm ||
        data.usageAndIntegrations?.referralSource;

    // If they haven't started, it's valid (skippable)
    if (!hasStarted) {
        return true;
    }

    // If they started, they should at least fill email volume and campaign goal
    if (!data.usageAndIntegrations?.emailVolume || !data.usageAndIntegrations?.campaignGoal) {
        return false;
    }

    return true;
};

export function UsageAndIntegrationsStep({ onNext, onPrev, onSkip, canSkip, isValid, onboardingData, updateOnboardingData }: UsageAndIntegrationsStepProps) {
    const [localIsValid, setLocalIsValid] = useState(isValid);

    // Update local validation when data changes
    useEffect(() => {
        const valid = validateUsageAndIntegrationsStep(onboardingData);
        setLocalIsValid(valid);
    }, [onboardingData]);

    const handleUsageIntegrationChange = (field: string, value: string) => {
        updateOnboardingData({
            usageAndIntegrations: { ...onboardingData.usageAndIntegrations, [field]: value },
        });
    };

    const handleNext = () => {
        updateOnboardingData({ usageAndIntegrationsCompleted: true });
        onNext();
    };

    const hasAnyData = onboardingData.usageAndIntegrations?.emailVolume ||
        onboardingData.usageAndIntegrations?.campaignGoal ||
        onboardingData.usageAndIntegrations?.crm ||
        onboardingData.usageAndIntegrations?.referralSource;

    return (
        <div className="space-y-8 py-8">
            <div className="space-y-4 flex flex-col items-center text-center">
                <h2 className="text-3xl font-bold">Usage and Integrations</h2>
                <p className="text-muted-foreground max-w-sm">Help us understand your usage and integration needs</p>
            </div>

            <div className="space-y-6">
                {/* Usage Preferences */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            Usage Preferences
                        </CardTitle>
                        <CardDescription>Help us suggest relevant features and pricing</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="emailVolume">Expected Email Volume</Label>
                                <Select
                                    value={onboardingData.usageAndIntegrations?.emailVolume || ''}
                                    onValueChange={(value) => handleUsageIntegrationChange('emailVolume', value)}
                                >
                                    <SelectTrigger className='rounded-lg shadow-none border border-accent '>
                                        <SelectValue placeholder="Select volume" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="low">1-50 emails/month</SelectItem>
                                        <SelectItem value="medium">51-200 emails/month</SelectItem>
                                        <SelectItem value="high">200+ emails/month</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="campaignGoal">Primary Campaign Goal</Label>
                                <Select
                                    value={onboardingData.usageAndIntegrations?.campaignGoal || ''}
                                    onValueChange={(value) => handleUsageIntegrationChange('campaignGoal', value)}
                                >
                                    <SelectTrigger className='rounded-lg shadow-none border border-accent '>
                                        <SelectValue placeholder="Select goal" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="lead-gen">Lead Generation</SelectItem>
                                        <SelectItem value="networking">Professional Networking</SelectItem>
                                        <SelectItem value="sales">Sales Outreach</SelectItem>
                                        <SelectItem value="partnerships">Partnership Building</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Integrations & Source */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            Integrations & More
                        </CardTitle>
                        <CardDescription>Optional integrations and tracking information</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="crm">CRM Platform</Label>
                                <Select value={onboardingData.usageAndIntegrations?.crm || ''} onValueChange={(value) => handleUsageIntegrationChange('crm', value)}>
                                    <SelectTrigger className='rounded-lg shadow-none border border-accent '>
                                        <SelectValue placeholder="Select CRM" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">No CRM</SelectItem>
                                        <SelectItem value="hubspot">HubSpot</SelectItem>
                                        <SelectItem value="salesforce">Salesforce</SelectItem>
                                        <SelectItem value="pipedrive">Pipedrive</SelectItem>
                                        <SelectItem value="zoho">Zoho CRM</SelectItem>
                                        <SelectItem value="monday">Monday.com</SelectItem>
                                        <SelectItem value="other">Other</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="referralSource">How did you find us?</Label>
                                <Select
                                    value={onboardingData.usageAndIntegrations?.referralSource || ''}
                                    onValueChange={(value) => handleUsageIntegrationChange('referralSource', value)}
                                >
                                    <SelectTrigger className='rounded-lg shadow-none border border-accent '>
                                        <SelectValue placeholder="Select source" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="google">Google Search</SelectItem>
                                        <SelectItem value="social">Social Media</SelectItem>
                                        <SelectItem value="referral">Friend/Colleague</SelectItem>
                                        <SelectItem value="ad">Advertisement</SelectItem>
                                        <SelectItem value="other">Other</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Optional completion feedback */}
                {canSkip && !hasAnyData && (
                    <div className="text-center">
                        <p className="text-sm text-muted-foreground">
                            This step is optional - you can skip it or fill in any information to help us personalize your experience
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
