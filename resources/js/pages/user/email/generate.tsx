'use client';

import { OptimizedAICard } from '@/components/ai-assistant-card';
import AppLogo from '@/components/app-logo';
import { OptimizedEmailCanvas } from '@/components/editorjs-email-canvas';
import { OptimizedSidebar } from '@/components/email-sidebar';
import { GenerationFeedback } from '@/components/generation-feedback';
import { SaveEmailModal } from '@/components/save-email-modal';
import { SidebarModal } from '@/components/sidebar-modal';
import { ThreePanelLayout } from '@/components/three-panel-layout';
import { Button } from '@/components/ui/button';
import { TooltipProvider } from '@/components/ui/tooltip';
import AppLayout from '@/layouts/app-layout';
import { SharedData } from '@/types';
import { router, usePage } from '@inertiajs/react'; 
import { Check, Copy, Save, Wand2 } from 'lucide-react';
import type React from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';

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
    personalized_data?: {
        recipient: string;
        audience: string;
        personalization: boolean;
    };
    prompt_strategy?: string;
    [key: string]: string | boolean | object | undefined;
}

interface PersonalizedData {
    recipient: string;
    audience: string;
    personalization: boolean;
}

interface GeneratedEmailData {
    subject: string;
    body: string;
}

export default function EmailGenerator({ submittedData, generatedEmail, emailSubject, emailBody, error, success, prompt }) {
    const {auth} = usePage<SharedData>().props;
    const [isGenerating, setIsGenerating] = useState(false);
    const [copied, setCopied] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [isProcessingEdit, setIsProcessingEdit] = useState(false);
    const [showSaveModal, setShowSaveModal] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isMobile, setIsMobile] = useState(false);

    const [formData, setFormData] = useState<EmailFormData>({
        sender: '',
        subject: '',
        context: '',
        tone: '',
        recipient: '',
        purpose: '',
        model: 'blazemail-70b',
        cta: '',
        audience: '',
        personalization: false,
    });

    const [currentEmailData, setCurrentEmailData] = useState<GeneratedEmailData>({
        subject: emailSubject || '',
        body: emailBody || '',
    });

    // Memoized computed values with personalization logic
    const hasGeneratedEmail = useMemo(
        () => Boolean((emailSubject && emailBody) || emailSubject || emailBody || generatedEmail),
        [emailSubject, emailBody, generatedEmail],
    );

    const isFormValid = useMemo(() => {
        const basicValid = Boolean(formData.subject && formData.context);
        if (formData.personalization) {
            return basicValid && Boolean(formData.recipient && formData.audience);
        }
        return basicValid;
    }, [formData.subject, formData.context, formData.personalization, formData.recipient, formData.audience]);

    // Mobile detection with debouncing
    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        checkMobile();
        let timeoutId: NodeJS.Timeout;
        const debouncedResize = () => {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(checkMobile, 150);
        };
        window.addEventListener('resize', debouncedResize);
        return () => {
            window.removeEventListener('resize', debouncedResize);
            clearTimeout(timeoutId);
        };
    }, []);

    // Auto-close mobile sidebar when generation starts
    useEffect(() => {
        if (isGenerating && mobileMenuOpen) {
            setMobileMenuOpen(false);
        }
    }, [isGenerating, mobileMenuOpen]);

    // Update email data when props change
    useEffect(() => {
        if (emailSubject || emailBody) {
            setCurrentEmailData({
                subject: emailSubject || '',
                body: emailBody || '',
            });
        } else if (generatedEmail) {
            try {
                const parsed = JSON.parse(generatedEmail);
                if (parsed.subject && parsed.body) {
                    setCurrentEmailData({
                        subject: parsed.subject,
                        body: parsed.body,
                    });
                } else {
                    throw new Error('Not valid JSON structure');
                }
            } catch {
                setCurrentEmailData({
                    subject: formData.subject || 'Generated Email Subject',
                    body: generatedEmail,
                });
            }
        }
    }, [emailSubject, emailBody, generatedEmail, formData.subject]);

    // Optimized handlers
    const handleCopy = useCallback(async () => {
        const emailToCopy = `Subject: ${currentEmailData.subject}\n\n${currentEmailData.body}`;
        try {
            await navigator.clipboard.writeText(emailToCopy);
            setCopied(true);
            // Haptic feedback
            if ('vibrate' in navigator) {
                navigator.vibrate(50);
            }
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    }, [currentEmailData]);

    const handleInputChange = useCallback((field: keyof EmailFormData, value: string | boolean) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    }, []);

    const handleEmailChange = useCallback((field: 'subject' | 'body', value: string) => {
        setCurrentEmailData((prev) => ({ ...prev, [field]: value }));
    }, []);

    const handleSubmit = useCallback(
        (e: React.FormEvent) => {
            e.preventDefault();
            setIsGenerating(true);

            // Prepare data with personalization info
            const submitData = {
                ...formData,
                // Add personalized data when personalization is enabled
                ...(formData.personalization && {
                    personalized_data: {
                        recipient: formData.recipient,
                        audience: formData.audience,
                        personalization: formData.personalization,
                    },
                }),
                // Add prompt strategy selection
                prompt_strategy: 'rgc', // or make this configurable
            };

            router.post(route('user.email.generate.post'), submitData, {
                preserveState: true,
                preserveScroll: true,
                onSuccess: () => setIsGenerating(false),
                onError: () => setIsGenerating(false),
                onFinish: () => setIsGenerating(false),
            });
        },
        [formData],
    );

    const handleAISuggestion = useCallback(
        (suggestion: string, selectedText = '') => {
            setIsProcessingEdit(true);
            setIsGenerating(true);
            const refinementData = {
                currentSubject: currentEmailData.subject,
                currentBody: currentEmailData.body,
                feedback: [], // Array for predefined suggestions
                customFeedback: suggestion, // String for custom input
                selectedText, // Keep this if you use it elsewhere
                prompt: prompt, // Ensure you have this in scope
                // Include personalization data if enabled
                ...(formData.personalization && {
                    personalized_data: {
                        recipient: formData.recipient,
                        audience: formData.audience,
                        personalization: formData.personalization,
                    },
                }),
                prompt_strategy: 'rgc', // or make this configurable
            };

            router.post(route('user.email.generate.refine'), refinementData, {
                preserveState: true,
                onSuccess: () => {
                    setIsProcessingEdit(false);
                    setIsGenerating(false);
                },
                onError: () => {
                    setIsProcessingEdit(false);
                    setIsGenerating(false);
                },
                onFinish: () => setIsGenerating(false),
            });
        },
        [currentEmailData, formData, prompt],
    );

    const handleUseEmail = useCallback(() => {
        setShowSaveModal(true);
    }, []);

    const handleSaveEmail = useCallback(
        (data: { title: string; description: string }) => {
            setIsSaving(true);
            const saveData = {
                email_subject: currentEmailData.subject,
                email_content: currentEmailData.body,
                subject: formData.subject,
                sender: formData.sender,
                recipient: formData.recipient,
                tone: formData.tone,
                purpose: formData.purpose,
                prompt: prompt, // make sure you have this in scope
                audience: formData.audience,
                cta: formData.cta,
                model: formData.model,
                context: formData.context,
                personalization: formData.personalization,
                // Include personalized data if enabled
                ...(formData.personalization && {
                    personalized_data: {
                        recipient: formData.recipient,
                        audience: formData.audience,
                        personalization: formData.personalization,
                    },
                }),
                strategy_used: 'rgc', // Track which strategy was used
                meta: {
                    title: data.title,
                    description: data.description,
                },
            };

            router.post(route('user.email.generate.save'), saveData, {
                preserveState: true,
                onSuccess: () => {
                    setIsSaving(false);
                    setShowSaveModal(false);
                },
                onError: () => setIsSaving(false),
            });
            console.log('Saving email with data:', saveData);
        },
        [currentEmailData, formData, prompt],
    );

    // Memoized components
    const sidebarContent = useMemo(
        () => (
            <OptimizedSidebar
                formData={formData}
                onInputChange={handleInputChange}
                onSubmit={handleSubmit}
                isGenerating={isGenerating}
                isFormValid={isFormValid}
                mobileMenuOpen={mobileMenuOpen}
                setMobileMenuOpen={setMobileMenuOpen}
                isMobile={isMobile}
            />
        ),
        [formData, handleInputChange, handleSubmit, isGenerating, isFormValid, mobileMenuOpen, isMobile],
    );

    const aiPanelContent = useMemo(
        () => <OptimizedAICard onAISuggestion={handleAISuggestion} isProcessing={isProcessingEdit} hasContent={hasGeneratedEmail} />,
        [handleAISuggestion, isProcessingEdit, hasGeneratedEmail],
    );

    const mainContent = useMemo(
        () => (
            <div className="flex h-full flex-col">
                {/* Top Action Bar */}
                {hasGeneratedEmail && (
                    <div className="flex items-center justify-between border-b border-border/50 bg-card/95 p-4 backdrop-blur-sm">
                        <div className="flex items-center gap-2">
                            <span className="font-medium text-foreground">{isGenerating ? '' : 'Email Editor'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleCopy}
                                className="h-8 rounded-xl bg-transparent transition-all duration-200 hover:scale-105"
                            >
                                {copied ? (
                                    <div className="flex items-center gap-1">
                                        <Check className="h-3 w-3 text-green-600" />
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-1">
                                        <Copy className="h-3 w-3" />
                                    </div>
                                )}
                            </Button>
                            <Button size="sm" onClick={handleUseEmail} className="h-8">
                                <div className="flex items-center gap-1">
                                    <Save className="h-3 w-3" />
                                    <span className="text-xs">Save</span>
                                </div>
                            </Button>
                        </div>
                    </div>
                )}

                {/* Generation Feedback */}
                <GenerationFeedback
                    error={error}
                    success={success}
                    strategy={submittedData?.prompt_strategy}
                    onRetry={() => handleSubmit({ preventDefault: () => {} } as React.FormEvent)}
                />
                

                {/* Email Canvas */}
                <div className="custom-scrollbar flex-1 overflow-y-auto bg-gradient-to-br from-background to-accent/10">
                    {isGenerating ? (
                        <div className="mx-auto max-w-4xl p-8">
                            <div className="space-y-6">
                                <div className="mb-8 flex items-center gap-3">
                                    <div className="flex h-8 w-8 items-center justify-center rounded-full border bg-background">
                                        <Wand2 className="h-4 w-4 animate-pulse text-primary" />
                                    </div>
                                    <div>
                                        <p className="font-medium text-foreground">Email is being generated</p>
                                        <p className="text-sm text-muted-foreground">This usually takes a few seconds</p>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <div className="h-4 animate-pulse rounded-xl bg-gradient-to-r from-primary/20 to-primary/40"></div>
                                    <div className="h-4 w-3/4 animate-pulse rounded-xl bg-gradient-to-r from-primary/40 to-primary/20"></div>
                                    <div className="my-8 h-px bg-gradient-to-r from-transparent via-border to-transparent"></div>
                                    <div className="space-y-3">
                                        <div className="h-3 animate-pulse rounded-xl bg-gradient-to-r from-primary/10 to-primary/20"></div>
                                        <div className="h-3 w-5/6 animate-pulse rounded-xl bg-gradient-to-r from-primary/20 to-primary/10"></div>
                                        <div className="h-3 w-4/5 animate-pulse rounded-xl bg-gradient-to-r from-primary/10 to-primary/20"></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : hasGeneratedEmail ? (
                        <OptimizedEmailCanvas
                            subject={currentEmailData.subject}
                            body={currentEmailData.body}
                            onSubjectChange={(value) => handleEmailChange('subject', value)}
                            onBodyChange={(value) => handleEmailChange('body', value)}
                            onAISuggestion={handleAISuggestion}
                            isProcessingEdit={isProcessingEdit}
                        />
                    ) : (
                        <div className="flex h-full items-center justify-center">
                            <div className="max-w-md text-center">
                                <div className="mx-auto mb-6 flex h-8 w-8 items-center justify-center rounded-full">
                                    <AppLogo />
                                </div>
                                <h3 className="mb-2 text-xl font-semibold text-foreground">Ready to Generate</h3>
                                <p className="px-3 text-secondary">
                                    Fill out the form and click <strong>"Generate Email"</strong> to create your professional cold email
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        ),
        [
            hasGeneratedEmail,
            isGenerating,
            currentEmailData,
            handleEmailChange,
            handleAISuggestion,
            isProcessingEdit,
            handleCopy,
            copied,
            handleUseEmail,
            error,
            success,
            submittedData,
            handleSubmit,
        ],
    );

    return (
        <AppLayout>
            <TooltipProvider>
                <div className="h-screen bg-gradient-to-br from-background via-background to-accent/5 p-2 pt-9 pb-9 md:p-4">
                    {isMobile ? (
                        <div className="flex h-full flex-col space-y-4">
                            {/* Mobile Sidebar Modal */}
                            <SidebarModal isOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(!mobileMenuOpen)}>
                                {sidebarContent}
                            </SidebarModal>
                            {/* Main Content */}
                            <div className="flex-1 overflow-hidden rounded-2xl bg-card/95 backdrop-blur-sm">{mainContent}</div>
                            {/* AI Panel - Mobile */}
                            {hasGeneratedEmail && (
                                <div className="h-100 rounded-2xl border border-border/50 bg-card/95 shadow-2xl backdrop-blur-sm">
                                    {aiPanelContent}
                                </div>
                            )}
                        </div>
                    ) : (
                        <ThreePanelLayout sidebar={sidebarContent} main={mainContent} aiPanel={aiPanelContent} />
                    )}
                </div>
                {/* Save Email Modal */}
                <SaveEmailModal
                    isOpen={showSaveModal}
                    onClose={() => setShowSaveModal(false)}
                    emailSubject={currentEmailData.subject}
                    emailBody={currentEmailData.body}
                    onSave={handleSaveEmail}
                    isSaving={isSaving}
                />
            </TooltipProvider>
        </AppLayout>
    );
}
