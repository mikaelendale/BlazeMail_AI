import AuthLayoutTemplate from '@/layouts/auth/auth-split-layout';
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
    console.log('fla`sh', flash);
    // toast.success('Welcome back!');
    return (
        <AuthLayoutTemplate title={title} description={description} {...props}>
            {children}
            <Toaster/>
        </AuthLayoutTemplate>
    );
}
