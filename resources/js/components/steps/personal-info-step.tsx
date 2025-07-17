'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { OnboardingData } from '@/types/onboarding';
import { ArrowLeft, ArrowRight, BarChart3, Database, User } from 'lucide-react';

interface PersonalInfoStepProps {
    onNext: () => void;
    onPrev: () => void;
    onSkip: () => void;
    canSkip: boolean;
    isValid: boolean;
    onboardingData: OnboardingData;
    updateOnboardingData: (updates: Partial<OnboardingData>) => void;
}

export function PersonalInfoStep({ onNext, onPrev, onSkip, canSkip, onboardingData, updateOnboardingData }: PersonalInfoStepProps) {
    const handleUserInfoChange = (field: string, value: string) => {
        updateOnboardingData({
            userInfo: { ...onboardingData.userInfo, [field]: value },
        });
    };

    const handleNext = () => {
        updateOnboardingData({ profileCompleted: true });
        onNext();
    };

    return (
        <div className="space-y-8 py-8">
            <div className="space-y-4 text-center">
                <h2 className="text-3xl font-bold">Complete Your Profile</h2>
                <p className="text-muted-foreground">Help us personalize your experience and email signatures</p>
            </div>

            <div className="space-y-6">
                {/* Personal Information */}
                <Card className='shadow-none border-none'>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <User className="h-5 w-5" />
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
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="phone">Phone Number</Label>
                                <Input
                                    id="phone"
                                    value={onboardingData.userInfo.phone || ''}
                                    onChange={(e) => handleUserInfoChange('phone', e.target.value)}
                                    placeholder="+1 (555) 123-4567"
                                />
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
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="industry">Industry</Label>
                                <Select value={onboardingData.userInfo.industry} onValueChange={(value) => handleUserInfoChange('industry', value)}>
                                    <SelectTrigger>
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
                    </CardContent>
                </Card>

                {/* Usage Preferences */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <BarChart3 className="h-5 w-5" />
                            Usage Preferences
                        </CardTitle>
                        <CardDescription>Help us suggest relevant features and pricing</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="emailVolume">Expected Email Volume</Label>
                                <Select
                                    value={onboardingData.userInfo.emailVolume || ''}
                                    onValueChange={(value) => handleUserInfoChange('emailVolume', value)}
                                >
                                    <SelectTrigger>
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
                                    value={onboardingData.userInfo.campaignGoal || ''}
                                    onValueChange={(value) => handleUserInfoChange('campaignGoal', value)}
                                >
                                    <SelectTrigger>
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
                            <Database className="h-5 w-5" />
                            Integrations & More
                        </CardTitle>
                        <CardDescription>Optional integrations and tracking information</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="crm">CRM Platform</Label>
                                <Select value={onboardingData.userInfo.crm || ''} onValueChange={(value) => handleUserInfoChange('crm', value)}>
                                    <SelectTrigger>
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
                                    value={onboardingData.userInfo.referralSource || ''}
                                    onValueChange={(value) => handleUserInfoChange('referralSource', value)}
                                >
                                    <SelectTrigger>
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
                    <Button onClick={handleNext}>
                        Continue
                        <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                </div>
            </div>
        </div>
    );
}
