'use client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import type { SharedData } from '@/types';
import { usePage } from '@inertiajs/react';
import { Check, HelpCircle, Mail, Paperclip, Plus, Settings, Trash2, User, X } from 'lucide-react';
import type React from 'react';
import { memo, useCallback, useEffect, useState } from 'react';
import { StrategySelector } from './strategy-selector';
import { Separator } from './ui/separator';

interface EmailFormData {
    sender: string;
    subject: string;
    context: string;
    tone: string;
    recipient: string;
    purpose: string;
    model: string;
    cta: string;
    audience: string;
    personalization: boolean;
    prompt_strategy: string;
}

interface OptimizedSidebarProps {
    formData: EmailFormData;
    onInputChange: (field: keyof EmailFormData, value: string | boolean) => void;
    onSubmit: (e: React.FormEvent) => void;
    isGenerating: boolean;
    isFormValid: boolean;
    mobileMenuOpen: boolean;
    setMobileMenuOpen: (open: boolean) => void;
    isMobile: boolean;
}

// localStorage utilities with expiration
const STORAGE_KEY = 'email_generator_form';
const EXPIRATION_TIME = 24 * 60 * 60 * 1000; // 24 hours

const saveToLocalStorage = (data: EmailFormData) => {
    const item = {
        data,
        timestamp: Date.now(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(item));
};

const loadFromLocalStorage = (): EmailFormData | null => {
    try {
        const item = localStorage.getItem(STORAGE_KEY);
        if (!item) return null;
        const parsed = JSON.parse(item);
        const now = Date.now();
        if (now - parsed.timestamp > EXPIRATION_TIME) {
            localStorage.removeItem(STORAGE_KEY);
            return null;
        }
        return parsed.data;
    } catch {
        return null;
    }
};

// Enhanced Select Component with custom option support and discard functionality
const EnhancedSelect = ({
    value,
    onValueChange,
    options,
    placeholder,
    label,
    customPlaceholder,
    required = false,
}: {
    value: string;
    onValueChange: (value: string) => void;
    options: { value: string; label: string }[];
    placeholder: string;
    label: string;
    customPlaceholder: string;
    required?: boolean;
}) => {
    const [showCustomInput, setShowCustomInput] = useState(false);
    const [customValue, setCustomValue] = useState('');

    const isCustomValue = value && !options.some((opt) => opt.value === value);

    const handleSelectChange = (selectedValue: string) => {
        if (selectedValue === '__custom__') {
            setShowCustomInput(true);
            setCustomValue('');
        } else {
            setShowCustomInput(false);
            onValueChange(selectedValue);
        }
    };

    const handleCustomSubmit = () => {
        if (customValue.trim()) {
            onValueChange(customValue.trim());
            setShowCustomInput(false);
            setCustomValue('');
        }
    };

    const handleDiscardCustom = () => {
        onValueChange('');
        setShowCustomInput(false);
        setCustomValue('');
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleCustomSubmit();
        } else if (e.key === 'Escape') {
            setShowCustomInput(false);
            setCustomValue('');
        }
    };

    return (
        <div className="space-y-2">
            <div className="flex items-center gap-1">
                <Label className="text-xs font-medium text-muted-foreground">
                    {label} {required && <span className="text-destructive">*</span>}
                </Label>
            </div>

            {showCustomInput ? (
                <div className="flex gap-2">
                    <Input
                        value={customValue}
                        onChange={(e) => setCustomValue(e.target.value)}
                        placeholder={customPlaceholder}
                        className="h-10 flex-1 rounded-xl border-border text-sm"
                        onKeyDown={handleKeyDown}
                        autoFocus
                    />
                    <Button size="sm" onClick={handleCustomSubmit} className="h-10 px-3" disabled={!customValue.trim()}>
                        <Check className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setShowCustomInput(false)} className="h-10 px-3">
                        <X className="h-4 w-4" />
                    </Button>
                </div>
            ) : (
                <div className="space-y-2">
                    <Select value={isCustomValue ? '' : value} onValueChange={handleSelectChange}>
                        <SelectTrigger className="h-10 rounded-xl border-border text-sm">
                            <SelectValue placeholder={isCustomValue ? value : placeholder} />
                        </SelectTrigger>
                        <SelectContent>
                            {options.map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                    {option.label}
                                </SelectItem>
                            ))}
                            <SelectItem value="__custom__">
                                <div className="flex items-center gap-2 text-primary">
                                    <Plus className="h-3 w-3" />
                                    <span>Add custom {label.toLowerCase()}</span>
                                </div>
                            </SelectItem>
                        </SelectContent>
                    </Select>

                    {isCustomValue && (
                        <div className="flex items-center gap-2">
                            <Badge variant="secondary" className="flex-1 text-xs">
                                Custom: {value}
                            </Badge>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                    setShowCustomInput(true);
                                    setCustomValue(value);
                                }}
                                className="h-6 px-2 text-xs"
                            >
                                Edit
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleDiscardCustom}
                                className="h-6 px-2 text-xs text-destructive hover:text-destructive"
                            >
                                <Trash2 className="h-3 w-3" />
                            </Button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export const OptimizedSidebar = memo(function OptimizedSidebar({
    formData,
    onInputChange,
    onSubmit,
    isGenerating,
    isFormValid,
    mobileMenuOpen,
    setMobileMenuOpen,
    isMobile,
}: OptimizedSidebarProps) {
    // Save to localStorage whenever formData changes
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            saveToLocalStorage(formData);
        }, 500); // Debounce saves
        return () => clearTimeout(timeoutId);
    }, [formData]);

    // Load from localStorage on mount
    useEffect(() => {
        const savedData = loadFromLocalStorage();
        if (savedData) {
            Object.entries(savedData).forEach(([key, value]) => {
                onInputChange(key as keyof EmailFormData, value);
            });
        }
    }, [onInputChange]);

    const { auth } = usePage<SharedData>().props;

    const handleInputChange = useCallback(
        (field: keyof EmailFormData) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
            onInputChange(field, e.target.value);
        },
        [onInputChange],
    );

    const handleSelectChange = useCallback(
        (field: keyof EmailFormData) => (value: string) => {
            onInputChange(field, value);
        },
        [onInputChange],
    );

    const handleSwitchChange = useCallback(
        (field: keyof EmailFormData) => (checked: boolean) => {
            onInputChange(field, checked);
        },
        [onInputChange],
    );

    const handleSubmit = useCallback(
        (e: React.FormEvent) => {
            e.preventDefault();
            onSubmit(e);
            // Haptic feedback on mobile
            if ('vibrate' in navigator) {
                navigator.vibrate([50, 50, 50]);
            }
        },
        [onSubmit],
    );

    const toneOptions = [
        { value: 'professional', label: 'Professional' },
        { value: 'friendly', label: 'Friendly' },
        { value: 'casual', label: 'Casual' },
        { value: 'persuasive', label: 'Persuasive' },
        { value: 'formal', label: 'Formal' },
        { value: 'conversational', label: 'Conversational' },
        { value: 'confident', label: 'Confident' },
        { value: 'empathetic', label: 'Empathetic' },
        { value: 'enthusiastic', label: 'Enthusiastic' },
        { value: 'humorous', label: 'Humorous' },
        { value: 'optimistic', label: 'Optimistic' },
        { value: 'respectful', label: 'Respectful' },
        { value: 'urgent', label: 'Urgent' },
        { value: 'direct', label: 'Direct' },
        { value: 'apologetic', label: 'Apologetic' },
        { value: 'motivational', label: 'Motivational' },
        { value: 'appreciative', label: 'Appreciative' },
        { value: 'neutral', label: 'Neutral' },
        { value: 'supportive', label: 'Supportive' },
        { value: 'witty', label: 'Witty' },
        { value: 'polite', label: 'Polite' },
        { value: 'sincere', label: 'Sincere' },
        { value: 'authoritative', label: 'Authoritative' },
        { value: 'informative', label: 'Informative' },
        { value: 'reassuring', label: 'Reassuring' },
    ];
    const purposeOptions = [
        { value: 'follow-up', label: 'Follow-up' },
        { value: 'introduction', label: 'Introduction' },
        { value: 'sales-pitch', label: 'Sales Pitch' },
        { value: 'demo-request', label: 'Demo Request' },
        { value: 'networking', label: 'Networking' },
        { value: 'thank-you', label: 'Thank You' },
        { value: 'partnership', label: 'Partnership' },
        { value: 'feedback', label: 'Feedback Request' },
        { value: 'invitation', label: 'Invitation' },
        { value: 'announcement', label: 'Announcement' },
        { value: 'reminder', label: 'Reminder' },
        { value: 'apology', label: 'Apology' },
        { value: 'congratulations', label: 'Congratulations' },
        { value: 'job-application', label: 'Job Application' },
        { value: 'reference-request', label: 'Reference Request' },
        { value: 'testimonial-request', label: 'Testimonial Request' },
        { value: 'event-followup', label: 'Event Follow-up' },
        { value: 'onboarding', label: 'Onboarding' },
        { value: 'offboarding', label: 'Offboarding' },
        { value: 'renewal', label: 'Renewal' },
        { value: 'cancellation', label: 'Cancellation' },
        { value: 'support', label: 'Support Request' },
        { value: 'update', label: 'Update' },
        { value: 'survey', label: 'Survey' },
        { value: 'cold-outreach', label: 'Cold Outreach' },
        { value: 're-engagement', label: 'Re-engagement' },
        { value: 'payment-request', label: 'Payment Request' },
        { value: 'newsletter', label: 'Newsletter' },
        { value: 'press-release', label: 'Press Release' },
        { value: 'other', label: 'Other' },
    ];

    return (
        <>
            {/* Sidebar Content */}
            <TooltipProvider>
                <div className={`${isMobile ? (mobileMenuOpen ? 'block' : 'hidden') : 'block'} flex h-full flex-col`}>
                    {/* Header */}
                    <div className=" p-6">
                        <div className="flex items-center gap-3">
                            <div>
                                <h1 className="font-semibold text-foreground">Email Generator</h1>
                                <p className="text-xs text-muted-foreground">
                                    Fill {formData.personalization ? 'all required fields' : 'basic fields'} to generate
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Scrollable Content */}
                    <div className="custom-scrollbar flex-1 space-y-6 overflow-y-auto p-6">
                        {/* Personalization Toggle */}
                        <div className="flex items-center justify-between rounded-xl bg-muted/30 p-3">
                            <div className="flex items-center gap-2">
                                <Label className="text-sm font-medium">Personalization</Label>
                                <Tooltip>
                                    <TooltipTrigger>
                                        <HelpCircle className="h-3 w-3 text-muted-foreground" />
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>Enable for individual, personalized emails</p>
                                        <p>Disable for generic, one-size-fits-all emails</p>
                                    </TooltipContent>
                                </Tooltip>
                            </div>
                            <Switch checked={formData.personalization} onCheckedChange={handleSwitchChange('personalization')} />
                        </div>

                        {/* Basic Info */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-2">
                                <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-background">
                                    <User className="h-3 w-3 text-primary" />
                                </div>
                                <h3 className="text-sm font-medium text-foreground">Basic Info</h3>
                            </div>
                            <div className="space-y-4">
                                {/* Sender - Always visible */}
                                <div className="space-y-2">
                                    <div className="flex items-center gap-1">
                                        <Label className="text-xs font-medium text-muted-foreground">Your Name</Label>
                                        <Tooltip>
                                            <TooltipTrigger>
                                                <HelpCircle className="h-3 w-3 text-muted-foreground" />
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                <p>Your name or company name</p>
                                            </TooltipContent>
                                        </Tooltip>
                                    </div>
                                    <Input
                                        placeholder="John Smith"
                                        value={formData.sender}
                                        onChange={handleInputChange('sender')}
                                        className="h-10 rounded-xl border-border text-sm transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                                    />
                                </div>

                                {/* Conditional fields based on personalization */}
                                {formData.personalization && (
                                    <>
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-1">
                                                <Label className="text-xs font-medium text-muted-foreground">
                                                    Recipient <span className="text-destructive">*</span>
                                                </Label>
                                                <Tooltip>
                                                    <TooltipTrigger>
                                                        <HelpCircle className="h-3 w-3 text-muted-foreground" />
                                                    </TooltipTrigger>
                                                    <TooltipContent>
                                                        <p>Who you're writing to (required for personalized emails)</p>
                                                    </TooltipContent>
                                                </Tooltip>
                                            </div>
                                            <Input
                                                placeholder="Sarah Johnson"
                                                value={formData.recipient}
                                                onChange={handleInputChange('recipient')}
                                                className={`h-10 rounded-xl border-border text-sm transition-all duration-200 focus:ring-2 focus:ring-primary/20 ${
                                                    formData.personalization && !formData.recipient ? 'border-destructive/50' : ''
                                                }`}
                                                required={formData.personalization}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-1">
                                                <Label className="text-xs font-medium text-muted-foreground">
                                                    Target Audience <span className="text-destructive">*</span>
                                                </Label>
                                                <Tooltip>
                                                    <TooltipTrigger>
                                                        <HelpCircle className="h-3 w-3 text-muted-foreground" />
                                                    </TooltipTrigger>
                                                    <TooltipContent>
                                                        <p>Type of person you're targeting (required for personalized emails)</p>
                                                    </TooltipContent>
                                                </Tooltip>
                                            </div>
                                            <Input
                                                placeholder="SaaS founders"
                                                value={formData.audience}
                                                onChange={handleInputChange('audience')}
                                                className={`h-10 rounded-xl border-border text-sm transition-all duration-200 focus:ring-2 focus:ring-primary/20 ${
                                                    formData.personalization && !formData.audience ? 'border-destructive/50' : ''
                                                }`}
                                                required={formData.personalization}
                                            />
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>

                        <Separator />

                        {/* Email Content */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-2">
                                <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-background">
                                    <Mail className="h-3 w-3 text-primary" />
                                </div>
                                <h3 className="text-sm font-medium text-foreground">Email Content</h3>
                            </div>
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <div className="flex items-center gap-1">
                                        <Label className="text-xs font-medium text-muted-foreground">
                                            Subject Line <span className="text-destructive">*</span>
                                        </Label>
                                        <Tooltip>
                                            <TooltipTrigger>
                                                <HelpCircle className="h-3 w-3 text-muted-foreground" />
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                <p>The main topic of your email</p>
                                            </TooltipContent>
                                        </Tooltip>
                                    </div>
                                    <Input
                                        placeholder="Follow-up on our meeting"
                                        value={formData.subject}
                                        onChange={handleInputChange('subject')}
                                        className="h-10 rounded-xl border-border text-sm transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <div className="flex items-center gap-1">
                                        <Label className="text-xs font-medium text-muted-foreground">
                                            Main Message <span className="text-destructive">*</span>
                                        </Label>
                                        <Tooltip>
                                            <TooltipTrigger>
                                                <HelpCircle className="h-3 w-3 text-muted-foreground" />
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                <p>What you want to communicate</p>
                                            </TooltipContent>
                                        </Tooltip>
                                    </div>
                                    <Textarea
                                        placeholder="Describe your message..."
                                        value={formData.context}
                                        onChange={handleInputChange('context')}
                                        className="min-h-[100px] resize-none rounded-xl border-border text-sm transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs font-medium text-muted-foreground">Call to Action</Label>
                                    <Input
                                        placeholder="Schedule a demo"
                                        value={formData.cta}
                                        onChange={handleInputChange('cta')}
                                        className="h-10 rounded-xl border-border text-sm transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                                    />
                                </div>
                                {/* Minimal Attachment Button */}
                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        disabled
                                        className="h-8 cursor-not-allowed bg-transparent px-3 text-xs opacity-50"
                                    >
                                        <Paperclip className="mr-1 h-3 w-3" />
                                        Attach
                                    </Button>
                                    <span className="text-xs text-muted-foreground">Coming Soon</span>
                                </div>
                            </div>
                        </div>

                        {/* Style Settings */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-2">
                                <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-background">
                                    <Settings className="h-3 w-3 text-primary" />
                                </div>
                                <h3 className="text-sm font-medium text-foreground">Style & Model</h3>
                            </div>
                            <div className="space-y-4">
                                <EnhancedSelect
                                    value={formData.tone}
                                    onValueChange={handleSelectChange('tone')}
                                    options={toneOptions}
                                    placeholder="Choose tone"
                                    label="Tone"
                                    customPlaceholder="Enter custom tone (e.g., witty, urgent)"
                                />

                                <EnhancedSelect
                                    value={formData.purpose}
                                    onValueChange={handleSelectChange('purpose')}
                                    options={purposeOptions}
                                    placeholder="Choose purpose"
                                    label="Purpose"
                                    customPlaceholder="Enter custom purpose (e.g., partnership proposal)"
                                />

                                <div className="space-y-2">
                                    <Label className="text-xs font-medium text-muted-foreground">AI Model</Label>
                                    <Select value={formData.model} onValueChange={handleSelectChange('model')}>
                                        <SelectTrigger className="h-10 rounded-xl border-border text-sm">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="blazemail-70b">
                                                <div className="flex items-center gap-2">
                                                    <div className="h-2 w-2 rounded-full bg-primary"></div>
                                                    BlazeMail-70B (Fast + Smart)
                                                </div>
                                            </SelectItem>
                                            {/* <SelectItem value="blazemail-lite">
                                                <div className="flex items-center gap-2">
                                                    <div className="h-2 w-2 rounded-full bg-muted-foreground"></div>
                                                    BlazeMail Lite (Quick & Cost-effective)
                                                </div>
                                            </SelectItem> */}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <StrategySelector
                                    value={formData.prompt_strategy}
                                    onChange={handleSelectChange('prompt_strategy')}
                                    disabled={isGenerating}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Generate Button */}
                    <div className="border-t border-border/50 p-6">
                        <form onSubmit={handleSubmit}>
                            <Button
                                type="submit"
                                variant={'outline'}
                                className="h-10 w-full rounded-xl font-medium transition-all duration-200"
                                disabled={isGenerating || !isFormValid}
                            >
                                {isGenerating ? (
                                    <div className="flex items-center gap-2">
                                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
                                        Generating...
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2">Generate</div>
                                )}
                            </Button>
                        </form>
                    </div>
                </div>
            </TooltipProvider>
        </>
    );
});
