import OnboardingSplitLayout from '@/layouts/auth/onboarding-split-layout';
import { usePage } from '@inertiajs/react';
import { useEffect } from 'react';
import { toast } from 'sonner';

export default function OnboardingLayout({ children, ...props }: { children: React.ReactNode;}) {
    const { flash } = usePage().props as any;
    
        useEffect(() => {
            if (flash?.success) toast.success(flash.success);
            if (flash?.error) toast.error(flash.error);
        }, [flash]);
    return (
        <OnboardingSplitLayout  {...props}>
            {children}
        </OnboardingSplitLayout>
    );
}
