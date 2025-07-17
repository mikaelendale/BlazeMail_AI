export interface StepConfig {
    id: string
    title: string
    description: string
    component: string
    skippable: boolean
    required: boolean
    validation?: (data: any) => boolean
  }
  
  export const ONBOARDING_STEPS: StepConfig[] = [
    {
      id: "welcome",
      title: "Welcome",
      description: "Welcome to BlazeMail",
      component: "WelcomeStep",
      skippable: false,
      required: true,
    },
    {
      id: "connect",
      title: "Connect Account",
      description: "Connect your email account",
      component: "ConnectAccountStep",
      skippable: true,
      required: false,
    },
    {
      id: "primary-goal",
      title: "Primary Goal",
      description: "Tell us your main objective",
      component: "PrimaryGoalStep",
      skippable: false,
      required: true,
      validation: (data) => !!data.userGoal && (data.userGoal !== "custom" || !!data.customGoal),
    },
    {
      id: "personal-info",
      title: "Personal Info",
      description: "Complete your profile",
      component: "PersonalInfoStep",
      skippable: true,
      required: false,
      validation: (data) => !!data.userInfo?.name,
    },
    // Add your custom steps here easily!
    // {
    //   id: "custom-step",
    //   title: "Custom Step",
    //   description: "Your custom step",
    //   component: "CustomStep",
    //   skippable: true,
    //   required: false,
    // },
    {
      id: "email-creation",
      title: "Create Email",
      description: "Create your first AI email",
      component: "EmailCreationStep",
      skippable: false,
      required: true,
      validation: (data) => !!data.emailData?.recipientName && !!data.emailData?.subject && !!data.emailData?.content,
    },
    {
      id: "completion",
      title: "Complete",
      description: "Setup complete",
      component: "CompletionStep",
      skippable: false,
      required: true,
    },
  ]
  
  export const getStepConfig = (stepId: string): StepConfig | undefined => {
    return ONBOARDING_STEPS.find((step) => step.id === stepId)
  }
  
  export const getStepIndex = (stepId: string): number => {
    return ONBOARDING_STEPS.findIndex((step) => step.id === stepId)
  }
  
  export const isStepValid = (stepId: string, data: any): boolean => {
    const config = getStepConfig(stepId)
    if (!config?.validation) return true
    return config.validation(data)
  }
  