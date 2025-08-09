import { ModeToggle } from '@/components/ui/mode-toggle';
import AuthLayoutTemplate from '@/layouts/auth/auth-simple-layout';
import { SharedData } from '@/types';
import { usePage } from '@inertiajs/react';
import { useEffect } from 'react';
import { toast, Toaster } from 'sonner';

export default function AuthLayout({ children, title, description, ...props }: { children: React.ReactNode; title: string; description: string }) {
    const { flash } = usePage<SharedData>().props as any;

    useEffect(() => {
        if (flash?.success) toast.success(flash.success);
        if (flash?.error) toast.error(flash.error);
    }, [flash]);
    return (
        <AuthLayoutTemplate title={title} description={description} {...props}>
            <ModeToggle className='fixed right-4 top-4 z-50' />
            {children}
            <Toaster  expand 
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
        </AuthLayoutTemplate>
    );
}
