import { validateCompletionStep } from "@/components/steps/completion-step";
import { validateConnectAccountStep } from "@/components/steps/connect-account-step";
import { validatePersonalInfoStep } from "@/components/steps/personal-info-step";
import { validatePrimaryGoalStep } from "@/components/steps/primary-goal-step";
import { validateUsageAndIntegrationsStep } from "@/components/steps/usage-and-integrations-step";
import { validateWelcomeStep } from "@/components/steps/welcome-step";

export const isStepValid = (stepId: string, data: any, accounts: any[] = []): boolean => {
    switch (stepId) {
        case 'welcome':
            return validateWelcomeStep(data);
        case 'connect':
            return validateConnectAccountStep(data, accounts);
        case 'primary-goal':
            return validatePrimaryGoalStep(data);
        case 'personal-info':
            return validatePersonalInfoStep(data);
        case 'usage-and-integrations':
            return validateUsageAndIntegrationsStep(data);
        case 'completion':
            return validateCompletionStep(data);
        default:
            return true;
    }
};

// Update the step configuration to be more explicit about requirements
export const ONBOARDING_STEPS: StepConfig[] = [
    {
        id: 'welcome',
        title: 'Welcome',
        description: 'Welcome to BlazeMail',
        component: 'WelcomeStep',
        skippable: false,
        required: true,
    },
    {
        id: 'connect',
        title: 'Connect Account',
        description: 'Connect your email account',
        component: 'ConnectAccountStep',
        skippable: true,
        required: false,
    },
    {
        id: 'primary-goal',
        title: 'Primary Goal',
        description: 'Tell us your main objective',
        component: 'PrimaryGoalStep',
        skippable: false,
        required: true,
        validation: (data) => {
            if (!data.userGoal || data.userGoal.trim() === '') return false;
            if (data.userGoal === 'custom' && (!data.customGoal || data.customGoal.trim().length < 5)) return false;
            return true;
        },
    },
    {
        id: 'personal-info',
        title: 'Personal Info',
        description: 'Complete your profile',
        component: 'PersonalInfoStep',
        skippable: false,
        required: true,
        validation: (data) => {
            if (!data.userInfo?.name || data.userInfo.name.trim().length < 2) return false;
            if (!data.userInfo?.phone || data.userInfo.phone.trim().length < 10) return false;
            const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
            const cleanPhone = data.userInfo.phone.replace(/[\s\-$$$$]/g, '');
            if (!phoneRegex.test(cleanPhone)) return false;
            return true;
        },
    },
    {
        id: 'usage-and-integrations',
        title: 'Usage & Integrations',
        description: 'Set up your usage and integrations',
        component: 'UsageAndIntegrationsStep',
        skippable: true,
        required: false,
        validation: (data) => {
            const hasStarted =
                data.usageAndIntegrations?.emailVolume ||
                data.usageAndIntegrations?.campaignGoal ||
                data.usageAndIntegrations?.crm ||
                data.usageAndIntegrations?.referralSource;

            if (!hasStarted) return true; // Skippable if not started

            // If started, require basic completion
            return !!(data.usageAndIntegrations?.emailVolume && data.usageAndIntegrations?.campaignGoal);
        },
    },
    {
        id: 'completion',
        title: 'Complete',
        description: 'Setup complete',
        component: 'CompletionStep',
        skippable: false,
        required: true,
    },
];
