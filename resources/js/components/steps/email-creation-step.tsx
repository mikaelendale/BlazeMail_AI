'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import type { OnboardingData } from '@/types/onboarding';
import { ArrowLeft, Lightbulb, Loader2, Send, Sparkles } from 'lucide-react';
import { useState } from 'react';

interface EmailCreationStepProps {
    onNext: () => void;
    onPrev: () => void;
    onboardingData: OnboardingData;
    updateOnboardingData: (updates: Partial<OnboardingData>) => void;
}

const toneOptions = [
    { value: 'professional', label: 'Professional' },
    { value: 'friendly', label: 'Friendly' },
    { value: 'casual', label: 'Casual' },
    { value: 'formal', label: 'Formal' },
];

export function EmailCreationStep({ onNext, onPrev, onboardingData, updateOnboardingData }: EmailCreationStepProps) {
    const [generating, setGenerating] = useState(false);
    const [sending, setSending] = useState(false);

    const handleEmailDataChange = (field: string, value: string) => {
        updateOnboardingData({
            emailData: { ...onboardingData.emailData, [field]: value },
        });
    };

    const generateEmail = async () => {
        setGenerating(true);
        // Console log the data that would be sent to backend
        const emailGenerationData = {
            recipientName: onboardingData.emailData.recipientName,
            subject: onboardingData.emailData.subject,
            tone: onboardingData.emailData.tone,
            userGoal: onboardingData.userGoal,
            customGoal: onboardingData.customGoal,
            userInfo: onboardingData.userInfo,
        };
        console.log('🚀 Email Generation Request Data:', emailGenerationData);

        try {
            // Simulate API delay
            await new Promise((resolve) => setTimeout(resolve, 2000));
            // Mock response data
            const mockResponse = {
                content: `Hi ${onboardingData.emailData.recipientName || 'there'},

I hope this email finds you well. I came across your profile and was impressed by your work in the ${onboardingData.userInfo.industry || 'industry'}.

${onboardingData.userGoal === 'freelancer'
                        ? "I'd love to discuss potential freelance opportunities and how my skills could benefit your projects."
                        : onboardingData.userGoal === 'b2b'
                            ? "I'd love to explore potential collaboration opportunities between our companies."
                            : onboardingData.userGoal === 'sales'
                                ? 'I wanted to reach out regarding our solution that could help streamline your operations.'
                                : "I'd love to connect and explore how we might work together."
                    }

Would you be available for a brief 15-minute call next week to discuss this further?

Best regards,
${onboardingData.userInfo.name || 'Your Name'}${onboardingData.userInfo.company ? `\n${onboardingData.userInfo.company}` : ''}`,
                subject:
                    onboardingData.emailData.subject ||
                    `${onboardingData.userGoal === 'freelancer' ? 'Freelance Services' : onboardingData.userGoal === 'b2b' ? 'Partnership Opportunity' : onboardingData.userGoal === 'sales' ? 'Solution for Your Business' : "Let's Connect"} - ${onboardingData.userInfo.name || 'Your Name'}`,
            };

            console.log('✅ Mock Email Generation Response:', mockResponse);
            handleEmailDataChange('content', mockResponse.content);
            if (!onboardingData.emailData.subject) {
                handleEmailDataChange('subject', mockResponse.subject);
            }
        } catch (error) {
            console.error('❌ Email generation failed:', error);
        } finally {
            setGenerating(false);
        }
    };

    const handleAutoFill = () => {
        const demoData = {
            recipientName: 'Sarah Johnson',
            subject: "Partnership Opportunity - Let's Connect",
            content: `Hi Sarah,

I hope this email finds you well. I came across your profile and was impressed by your work in the marketing industry.

I'd love to explore potential collaboration opportunities between our companies. Our AI-powered email solution has helped businesses like yours increase their outreach success by 40%.

Would you be available for a brief 15-minute call next week to discuss how we might work together?

Best regards,
${onboardingData.userInfo.name || 'Your Name'}`,
            tone: 'professional' as const,
        };
        updateOnboardingData({ emailData: demoData });
    };

    const sendTestEmail = async () => {
        setSending(true);
        // Console log the data that would be sent to backend
        const testEmailData = {
            to: onboardingData.emailData.recipientName,
            subject: onboardingData.emailData.subject,
            content: onboardingData.emailData.content,
            userInfo: onboardingData.userInfo,
            timestamp: new Date().toISOString(),
        };
        console.log('📧 Test Email Send Request Data:', testEmailData);

        try {
            // Simulate API delay
            await new Promise((resolve) => setTimeout(resolve, 1500));
            console.log('✅ Test email sent successfully!');
            updateOnboardingData({ firstEmailSent: true });
            onNext();
        } catch (error) {
            console.error('❌ Test email sending failed:', error);
        } finally {
            setSending(false);
        }
    };

    const isValid = onboardingData.emailData.recipientName && onboardingData.emailData.subject && onboardingData.emailData.content;

    return (
        <div className="space-y-8 py-8">
            <div className="space-y-4 flex flex-col items-center text-center">
                <h2 className="text-3xl font-bold">Create Your First Email</h2>
                <p className="text-muted-foreground max-w-sm">Let's create a personalized email using AI</p>
                <Button onClick={handleAutoFill} variant="outline" size="sm" className="bg-accent/50 hover:bg-accent">
                    <Sparkles className="mr-2 h-4 w-4" />
                    Auto Fill for Test
                </Button>
            </div>

            <div className="space-y-6">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                        <Label htmlFor="recipientName">Recipient Name</Label>
                        <Input
                            id="recipientName"
                            value={onboardingData.emailData.recipientName}
                            onChange={(e) => handleEmailDataChange('recipientName', e.target.value)}
                            placeholder="e.g., Sarah Johnson"
                        />
                        {!onboardingData.emailData.recipientName && (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Lightbulb className="h-4 w-4" />
                                <span>Enter the recipient's name to personalize your email</span>
                            </div>
                        )}
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="tone">Email Tone</Label>
                        <Select value={onboardingData.emailData.tone} onValueChange={(value) => handleEmailDataChange('tone', value)}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {toneOptions.map((option) => (
                                    <SelectItem key={option.value} value={option.value}>
                                        {option.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="subject">Email Subject</Label>
                    <Input
                        id="subject"
                        value={onboardingData.emailData.subject}
                        onChange={(e) => handleEmailDataChange('subject', e.target.value)}
                        placeholder="e.g., Partnership Opportunity"
                    />
                    {onboardingData.emailData.recipientName && !onboardingData.emailData.subject && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Lightbulb className="h-4 w-4" />
                            <span>Add a compelling subject line</span>
                        </div>
                    )}
                </div>

                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <Label htmlFor="content">Email Content</Label>
                        <Button onClick={generateEmail} disabled={!onboardingData.emailData.recipientName || generating} variant="outline" size="sm">
                            {generating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                            Generate with AI
                        </Button>
                    </div>
                    <Textarea
                        id="content"
                        value={onboardingData.emailData.content}
                        onChange={(e) => handleEmailDataChange('content', e.target.value)}
                        placeholder="Your AI-generated email will appear here..."
                        className="min-h-[200px]"
                    />
                    {onboardingData.emailData.subject && !onboardingData.emailData.content && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Lightbulb className="h-4 w-4" />
                            <span>Click "Generate with AI" to create your email content</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
