import AppNavbar from '@/components/app-navbar';
import FloatingActionButtons from '@/components/floating-logout';
import JobTracker from '@/components/JobTracker';
import { ModeToggle } from '@/components/ui/mode-toggle';
import AppLayoutTemplate from '@/layouts/app/app-sidebar-layout';
import { type BreadcrumbItem } from '@/types';
import { usePage } from '@inertiajs/react';
import { useEffect, type ReactNode } from 'react';
import { toast } from 'sonner';

interface AppLayoutProps {
    children: ReactNode;
    breadcrumbs?: BreadcrumbItem[];
}

export default ({ children, breadcrumbs, ...props }: AppLayoutProps) => {
    const { flash } = usePage().props as any;

    useEffect(() => {
        if (flash?.success) toast.success(flash.success);
        if (flash?.error) toast.error(flash.error);
    }, [flash]);
    return (
        <AppLayoutTemplate breadcrumbs={breadcrumbs} {...props}>
            <AppNavbar />
            <ModeToggle />
            <div style={{ paddingLeft: 24, paddingRight: 24, marginTop: 80 }}>{children}</div>
            <FloatingActionButtons />
            <JobTracker />
        </AppLayoutTemplate>
    );
};
