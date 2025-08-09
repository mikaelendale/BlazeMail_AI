'use client';

import FloatingActionButtons from '@/components/floating-logout';
import { ProgressBar } from '@/components/progress-bar';
import { CompletionStep } from '@/components/steps/completion-step';
import { ConnectAccountStep } from '@/components/steps/connect-account-step';
import { EmailCreationStep } from '@/components/steps/email-creation-step';
import { PersonalInfoStep } from '@/components/steps/personal-info-step';
import { PrimaryGoalStep } from '@/components/steps/primary-goal-step';
import { WelcomeStep } from '@/components/steps/welcome-step';
import { ONBOARDING_STEPS, isStepValid } from '@/config/onboarding-config';
import OnboardingLayout from '@/layouts/onboarding-layout';
import type { OnboardingData } from '@/types/onboarding';
import { useEffect, useState } from 'react';

const STORAGE_KEY = 'blazemail_onboarding';

// Component mapping
const stepComponents = {
    WelcomeStep,
    ConnectAccountStep,
    PrimaryGoalStep,
    PersonalInfoStep,
    EmailCreationStep,
    CompletionStep,
};

export default function OnboardingWizard({ accounts, providers }: { accounts: any[]; providers: any[] }) {
    const [currentStepIndex, setCurrentStepIndex] = useState(0);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [onboardingData, setOnboardingData] = useState<OnboardingData>({
        emailConnected: false,
        profileCompleted: false,
        firstEmailSent: false,
        userGoal: '',
        customGoal: '',
        userInfo: {
            name: '',
            company: '',
            industry: '',
        },
        emailData: {
            recipientName: '',
            subject: '',
            content: '',
            tone: 'professional',
        },
    });

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

    // 🔥 MAIN FORM SUBMISSION HANDLER
    const handleFinalSubmission = async (formData: FormData) => {
        // setIsSubmitting(true);
        // Get additional form data from the completion step
        // const additionalData = {
        //     newsletter: formData.get('newsletter') === 'on',
        //     feedback: formData.get('feedback')?.toString() || '',
        //     rating: formData.get('rating')?.toString() || '',
        //     completedAt: new Date().toISOString(),
        // };
        // Combine all onboarding data (flattened for FormDataConvertible)
        // const finalSubmissionData = {
        //     // User Information (flattened)
        //     ...onboardingData.userInfo,
        //     // Goals and Preferences
        //     userGoal: onboardingData.userGoal,
        //     customGoal: onboardingData.customGoal,
        //     // Email Data (flattened)
        //     ...onboardingData.emailData,
        //     // Progress Flags
        //     emailConnected: onboardingData.emailConnected,
        //     profileCompleted: onboardingData.profileCompleted,
        //     firstEmailSent: onboardingData.firstEmailSent,
        //     // Connected Accounts Data (stringify arrays/objects)
        //     connectedAccounts: JSON.stringify(accounts),
        //     availableProviders: JSON.stringify(providers),
        //     // Additional Completion Data
        //     ...additionalData,
        //     // Metadata
        //     onboardingVersion: '1.0',
        //     userAgent: navigator.userAgent,
        //     completionTime: new Date().toISOString(),
        //     stepsCompleted: currentStepIndex + 1,
        //     totalSteps: ONBOARDING_STEPS.length,
        // };
        // 🚀 CONSOLE LOG ALL THE DATA
        // console.log('='.repeat(80));
        // console.log('🎯 FINAL ONBOARDING SUBMISSION DATA');
        // console.log('='.repeat(80));
        // console.log('📊 Complete Data Object:', finalSubmissionData);
        // console.log('');
        // console.log('👤 User Information:');
        // console.log('  Name:', finalSubmissionData.userInfo.name);
        // console.log('  Company:', finalSubmissionData.userInfo.company);
        // console.log('  Industry:', finalSubmissionData.userInfo.industry);
        // console.log('  Phone:', finalSubmissionData.userInfo.phone);
        // console.log('  Email Volume:', finalSubmissionData.userInfo.emailVolume);
        // console.log('  Campaign Goal:', finalSubmissionData.userInfo.campaignGoal);
        // console.log('  CRM:', finalSubmissionData.userInfo.crm);
        // console.log('  Referral Source:', finalSubmissionData.userInfo.referralSource);
        // console.log('');
        // console.log('🎯 Goals & Preferences:');
        // console.log('  Primary Goal:', finalSubmissionData.userGoal);
        // console.log('  Custom Goal:', finalSubmissionData.customGoal);
        // console.log('');
        // console.log('📧 Email Data:');
        // console.log('  Recipient Name:', finalSubmissionData.emailData.recipientName);
        // console.log('  Subject:', finalSubmissionData.emailData.subject);
        // console.log('  Content Length:', finalSubmissionData.emailData.content.length, 'characters');
        // console.log('  Tone:', finalSubmissionData.emailData.tone);
        // console.log('');
        // console.log('🔗 Connected Accounts:', finalSubmissionData.connectedAccounts.length);
        // finalSubmissionData.connectedAccounts.forEach((account, index) => {
        //     console.log(`  Account ${index + 1}:`, {
        //         email: account.email,
        //         provider: account.provider,
        //         status: account.status,
        //         isConnected: account.isConnected,
        //     });
        // });
        // console.log('');
        // console.log('✅ Progress Status:');
        // console.log('  Email Connected:', finalSubmissionData.emailConnected);
        // console.log('  Profile Completed:', finalSubmissionData.profileCompleted);
        // console.log('  First Email Sent:', finalSubmissionData.firstEmailSent);
        // console.log('');
        // console.log('📝 Completion Feedback:');
        // console.log('  Newsletter Signup:', finalSubmissionData.newsletter);
        // console.log('  User Rating:', finalSubmissionData.rating);
        // console.log('  User Feedback:', finalSubmissionData.feedback);
        // console.log('');
        // console.log('🔧 Technical Data:');
        // console.log('  Steps Completed:', `${finalSubmissionData.stepsCompleted}/${finalSubmissionData.totalSteps}`);
        // console.log('  Completion Time:', finalSubmissionData.completionTime);
        // console.log('  User Agent:', finalSubmissionData.userAgent.substring(0, 50) + '...');
        // console.log('='.repeat(80));
        // try {
        //     router.post(
        //         '/onboarding/submit',
        //         {
        //             finalSubmissionData,
        //         },
        //         {
        //             onSuccess: () => {
        //                 localStorage.removeItem(STORAGE_KEY); // Clear localStorage on success
        //             },
        //         },
        //     );
        // } catch (error) {
        //     console.error('❌ Error submitting onboarding data:', error);
        // } finally {
        //     setIsSubmitting(false);
        // }
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

    return (
        <OnboardingLayout>
            <div className="flex flex-col">
                {/* Progress Bar */}
                <ProgressBar
                    currentStep={currentStepIndex}
                    totalSteps={ONBOARDING_STEPS.length}
                    onboardingData={onboardingData}
                    steps={ONBOARDING_STEPS}
                />

                {/* Step Content */}
                <div className="flex flex-1 items-center justify-center p-4">
                    <div className="w-full max-w-2xl">
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
                            // Pass form submission handler to completion step
                            onFinalSubmit={handleFinalSubmission}
                            isSubmitting={isSubmitting}
                        />
                    </div>
                </div>
            </div>
            <FloatingActionButtons />
        </OnboardingLayout>
    );
}
