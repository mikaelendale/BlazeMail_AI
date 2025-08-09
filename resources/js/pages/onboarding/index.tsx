'use client';

import AppLogo from '@/components/app-logo';
import FloatingActionButtons from '@/components/floating-logout';
import { CompletionStep } from '@/components/steps/completion-step';
import { ConnectAccountStep } from '@/components/steps/connect-account-step';
import { PersonalInfoStep } from '@/components/steps/personal-info-step';
import { PrimaryGoalStep } from '@/components/steps/primary-goal-step';
import { UsageAndIntegrationsStep } from '@/components/steps/usage-and-integrations-step';
import { WelcomeStep } from '@/components/steps/welcome-step';
import { Button } from '@/components/ui/button';
import { ModeToggle } from '@/components/ui/mode-toggle';
import { Toaster } from '@/components/ui/sonner';
import { ONBOARDING_STEPS, isStepValid } from '@/config/onboarding-config';
import { useMobileNavigation } from '@/hooks/use-mobile-navigation';
import { SharedData } from '@/types';
import type { OnboardingData } from '@/types/onboarding';
import { Link, router, usePage } from '@inertiajs/react';
import { ArrowLeft, ArrowRight, FileIcon as FileUser, Goal, Mail, PackageCheck, PencilLine, Rocket, Unplug, User, UserCog, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { FormValidationIndicator } from '@/components/steps/form-validation-indicator';

const STORAGE_KEY = 'blazemail_onboarding';

// Component mapping
const stepComponents = {
    WelcomeStep,
    ConnectAccountStep,
    PrimaryGoalStep,
    PersonalInfoStep,
    UsageAndIntegrationsStep,
    CompletionStep,
};

// Step configuration matching your original functionality
const stepConfig = [
    {
        id: 'welcome',
        title: 'Welcome',
        subtitle: 'Get started with BlazeMail',
        icon: UserCog,
        active: false
    },
    {
        id: 'connect',
        title: 'Connect Email',
        subtitle: 'Link your email account',
        icon: Unplug,
        active: false
    },
    {
        id: 'primary-goal',
        title: 'Primary Goal',
        subtitle: 'Choose your objective',
        icon: Goal,
        active: false
    },
    {
        id: 'personal-info',
        title: 'Personal Info',
        subtitle: 'Complete your profile',
        icon: FileUser,
        active: false
    },
    {
        id: 'usage-and-integrations',
        title: 'Usage & Integrations',
        subtitle: 'Set up your usage and integrations',
        icon: Users,
        active: false
    },
    {
        id: 'completion',
        title: 'Complete',
        subtitle: 'Finish setup',
        icon: PackageCheck,
        active: false
    },
];

export default function OnboardingWizard({ accounts, providers }: { accounts: any[]; providers: any[] }) {
    const [currentStepIndex, setCurrentStepIndex] = useState(0);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const cleanup = useMobileNavigation()

    const handleLogout = () => {
        cleanup()
        router.flushAll()
    }

    const [onboardingData, setOnboardingData] = useState<OnboardingData>({
        emailConnected: false,
        profileCompleted: false,
        usageAndIntegrationsCompleted: false,
        userGoal: '',
        customGoal: '',
        userInfo: {
            name: '',
            company: '',
            industry: '',
        },
        usageAndIntegrations: {
            emailVolume: '',
            campaignGoal: '',
            crm: '',
            referralSource: '',
        },
    });

    const { flash } = usePage<SharedData>().props as any;

    useEffect(() => {
        if (flash?.success) toast.success(flash.success);
        if (flash?.error) toast.error(flash.error);
    }, [flash]);

    // Load data from localStorage
    useEffect(() => {
        const savedData = localStorage.getItem(STORAGE_KEY);
        if (savedData) {
            try {
                const parsed = JSON.parse(savedData);
                setOnboardingData(parsed.data || onboardingData);
                setCurrentStepIndex(parsed.currentStepIndex || 0);
            } catch (error) {
                console.error('Error loading onboarding data:', error);
            }
        }
    }, []);

    // Save data to localStorage
    useEffect(() => {
        localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify({
                data: onboardingData,
                currentStepIndex,
            }),
        );
    }, [onboardingData, currentStepIndex]);

    const updateOnboardingData = (updates: Partial<OnboardingData>) => {
        setOnboardingData((prev) => ({ ...prev, ...updates }));
    };

    // 🔥 MAIN FORM SUBMISSION HANDLER - Your original functionality
    const handleFinalSubmission = async (formData: FormData) => {
        setIsSubmitting(true);
        // Get additional form data from the completion step
        const additionalData = {
            newsletter: formData.get('newsletter') === 'on',
            feedback: formData.get('feedback')?.toString() || '',
            rating: formData.get('rating')?.toString() || '',
            completedAt: new Date().toISOString(),
        };

        // Combine all onboarding data (flattened for FormDataConvertible)
        const finalSubmissionData = {
            // User Information (flattened)
            ...onboardingData.userInfo,
            // Usage and Integrations (flattened)
            ...onboardingData.usageAndIntegrations,
            // Goals and Preferences
            userGoal: onboardingData.userGoal,
            customGoal: onboardingData.customGoal,
            // Email Data (flattened)
            // Progress Flags
            emailConnected: onboardingData.emailConnected,
            profileCompleted: onboardingData.profileCompleted,
            usageAndIntegrationsCompleted: onboardingData.usageAndIntegrationsCompleted,
            // Connected Accounts Data (stringify arrays/objects)
            connectedAccounts: JSON.stringify(accounts),
            availableProviders: JSON.stringify(providers),
            // Additional Completion Data
            ...additionalData,
            // Metadata
            onboardingVersion: '1.0',
            userAgent: navigator.userAgent,
            completionTime: new Date().toISOString(),
            stepsCompleted: currentStepIndex + 1,
            totalSteps: ONBOARDING_STEPS.length,
        };

        try {
            router.post(
                '/onboarding/submit',
                {
                    finalSubmissionData,
                },
                {
                    onSuccess: () => {
                        localStorage.removeItem(STORAGE_KEY); // Clear localStorage on success
                    },
                    onError: (error) => {
                        toast.error('Error submitting onboarding data:', error);
                    }
                },
            );
        } catch (error) {
            toast.error('Error submitting onboarding data');
        } finally {
            setIsSubmitting(false);
        }
    };

    const nextStep = () => {
        if (currentStepIndex < ONBOARDING_STEPS.length - 1) {
            setCurrentStepIndex(currentStepIndex + 1);
        }
    };

    const prevStep = () => {
        if (currentStepIndex > 0) {
            setCurrentStepIndex(currentStepIndex - 1);
        }
    };

    const goToStep = (index: number) => {
        setCurrentStepIndex(index);
    };

    const skipStep = () => {
        const currentStep = ONBOARDING_STEPS[currentStepIndex];
        if (currentStep.skippable) {
            nextStep();
        }
    };

    const currentStep = ONBOARDING_STEPS[currentStepIndex];
    const CurrentStepComponent = stepComponents[currentStep.component as keyof typeof stepComponents];
    const canSkip = currentStep.skippable;
    const isValid = isStepValid(currentStep.id, onboardingData);
    const isRequired = currentStep.required;
    const isLastStep = currentStepIndex === ONBOARDING_STEPS.length - 1;

    // Button logic
    const getButtonConfig = () => {
        // Last step - always show completion button
        if (isLastStep) {
            return null; // Handle in completion step
        }

        // Check if current step is valid
        const stepIsValid = isValid;

        // For required steps that are not valid, show disabled Continue
        if (isRequired && !stepIsValid) {
            return {
                text: 'Complete Required Fields',
                variant: 'default' as const,
                onClick: () => { }, // No action when disabled
                disabled: true
            };
        }

        // For valid steps (required or optional), show enabled Continue
        if (stepIsValid) {
            return {
                text: 'Continue',
                variant: 'default' as const,
                onClick: nextStep,
                disabled: false
            };
        }

        // For optional steps that are not valid but skippable, show Skip
        if (canSkip && !stepIsValid) {
            return {
                text: 'Skip',
                variant: 'ghost' as const,
                onClick: skipStep,
                disabled: false
            };
        }

        // Default case - disabled continue
        return {
            text: 'Complete Form to Continue',
            variant: 'default' as const,
            onClick: () => { },
            disabled: true
        };
    };

    const buttonConfig = getButtonConfig();

    return (
        <>
            <div className="min-h-screen bg-background">
                <ModeToggle className="fixed top-4 right-4" />
                <div className="flex min-h-screen">
                    {/* Left Sidebar */}
                    <div className="p-8 hidden border-r border-accent lg:flex w-1/3 flex-col items-center bg-primary-foreground justify-center">
                        {/* Steps */}
                        <div className="space-y-6 p-6 rounded-3xl">
                            {stepConfig.map((step, index) => {
                                const Icon = step.icon;
                                const isActive = index === currentStepIndex;
                                const isCompleted = index < currentStepIndex;
                                const isLastStep = index === stepConfig.length - 1;

                                return (
                                    <div
                                        key={step.id}
                                        className="relative flex items-start gap-4"
                                    >
                                        {/* Icon and Line Container */}
                                        <div className="relative">
                                            <div className={`flex items-center justify-center w-12 h-12 rounded-full mt-0.5 z-10 relative transition-all duration-300
                                                ${isActive
                                                    ? 'bg-accent text-primary'
                                                    : isCompleted
                                                        ? 'bg-primary text-primary-foreground'
                                                        : 'bg-muted text-muted-foreground'
                                                }`}
                                            >
                                                <Icon className="w-5 h-5" />
                                            </div>
                                            {/* Connecting line */}
                                            {!isLastStep && (
                                                <div
                                                    className={`absolute left-[25px] top-[26px] -translate-x-1/2 w-0.5 h-[48px] transition-all duration-300
                                                        ${(isCompleted || isActive) ? 'bg-orange-500' : 'bg-accent'}
                                                    `}
                                                />
                                            )}
                                        </div>
                                        <div className="flex-1">
                                            <h3 className={`font-medium text-md transition-all duration-300 ${isActive ? 'text-primary' : isCompleted ? 'text-primary' : 'text-primary/50'
                                                }`}>
                                                {step.title}
                                            </h3>
                                            <p className="text-xs text-muted-foreground mt-1">
                                                {step.subtitle}
                                            </p>
                                            {isActive && (
                                                <div className="mt-2">
                                                    <FormValidationIndicator
                                                        isValid={isValid}
                                                        isRequired={currentStep.required}
                                                        isSkippable={currentStep.skippable}
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                            <Link
                                method="post"
                                href={route("logout")}
                                as="button"
                                onClick={handleLogout}
                                className='text-muted-foreground text-sm underline underline-offset-1 hover:text-destructive ml-1'
                            >
                                logout
                            </Link>
                        </div>
                    </div>

                    {/* Right Content Area */}
                    <div className="flex-1 flex flex-col min-h-screen">
                        {/* Progress Dots */}
                        <div className="p-8 pt-8">
                            <div className="flex justify-center gap-2">
                                {stepConfig.map((_, index) => (
                                    <div
                                        key={index}
                                        className={`w-2 h-2 rounded-full transition-all duration-300 ${index === currentStepIndex
                                                ? 'bg-orange-500 w-6'
                                                : index < currentStepIndex
                                                    ? 'bg-orange-400'
                                                    : 'bg-accent'
                                            }`}
                                    />
                                ))}
                            </div>
                        </div>

                        {/* Main Content */}
                        <div className="flex-1 flex items-center justify-center p-8">
                            <div className="w-full max-w-2xl">
                                <div className="animate-in slide-in-from-right-5 duration-300">
                                    <CurrentStepComponent
                                        onboardingData={onboardingData}
                                        updateOnboardingData={updateOnboardingData}
                                        onNext={nextStep}
                                        onPrev={prevStep}
                                        onSkip={skipStep}
                                        goToStep={goToStep}
                                        currentStepIndex={currentStepIndex}
                                        canSkip={canSkip}
                                        isValid={isValid}
                                        stepConfig={currentStep}
                                        accounts={accounts}
                                        providers={providers}
                                        onFinalSubmit={handleFinalSubmission}
                                        setIsSubmitting={setIsSubmitting}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Bottom Navigation */}
                        <div className="w-full flex justify-center px-4 py-4">
                            <div className="max-w-lg w-full flex justify-between items-center">
                                {/* Back Button */}
                                {currentStepIndex > 0 && (
                                    <Button variant="ghost" onClick={prevStep}>
                                        <ArrowLeft className="mr-2 h-4 w-4" />
                                        Back
                                    </Button>
                                )}

                                <div className="flex-1" />

                                {/* Next/Skip/Continue Button */}
                                {buttonConfig && (
                                    <Button
                                        variant={buttonConfig.variant}
                                        onClick={buttonConfig.onClick}
                                        disabled={buttonConfig.disabled}
                                        className={`${buttonConfig.disabled ? 'opacity-50 cursor-not-allowed bg-muted text-muted-foreground' : ''} transition-all duration-200`}
                                    >
                                        {buttonConfig.text}
                                        {!buttonConfig.disabled && <ArrowRight className="ml-2 h-4 w-4" />}
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <Toaster expand
                toastOptions={{
                    style: {
                        background: 'var(--primary-foreground)',
                        borderColor: 'var(--accent)',
                        color: 'var(--primary)',
                        borderRadius: '20px', // Modern, moderately rounded corners
                    },
                }
                }
                theme="system"
            />
        </>
    );
}
