import { MainDashboard } from '@/components/dashboard';  
import AppLayout from '@/layouts/app-layout';
import { SharedData } from '@/types';
import { usePage } from '@inertiajs/react';

type DashboardProps = {
    user: any; // Replace 'any' with the actual user type if available
    usageStats: any; // Replace 'any' with the actual usageStats type if available
    recentEmails: any; // Replace 'any' with the actual recentEmails type if available
};

export default function Dashboard({ user, usageStats, recentEmails }: DashboardProps) {
        const { auth } = usePage<SharedData>().props;
    return (
        <AppLayout> 
            <MainDashboard user={user} usageStats={usageStats} recentEmails={recentEmails} />
        </AppLayout>
    );
} 