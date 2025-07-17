import AppLogo from '@/components/app-logo';
import { type SharedData } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import { useEffect, type PropsWithChildren } from 'react';
import { toast } from 'sonner';

interface AuthLayoutProps {
    title?: string;
    description?: string;
}

export default function OnboardingSplitLayout({ children, title, description }: PropsWithChildren<AuthLayoutProps>) {
    const { name, quote } = usePage<SharedData>().props;
    const { flash } = usePage().props as any;

    useEffect(() => {
        if (flash?.success) toast.success(flash.success);
        if (flash?.error) toast.error(flash.error);
    }, [flash]);
    return (
        <div className="relative grid flex-col items-center justify-center px-8 sm:px-0 lg:max-w-none lg:grid-cols-2 lg:px-0">
            <div className="relative hidden h-full flex-col bg-muted p-10 text-white lg:flex dark:border-r">
                <div className="absolute inset-0 bg-zinc-900" />
                <Link href={route('home')} className="relative z-20 flex items-center text-lg font-medium">
                    <AppLogo />
                    &nbsp;
                    {name}
                </Link>
                {quote && (
                    <div className="relative z-20 mt-auto">
                        <blockquote className="space-y-2">
                            <p className="text-lg">&ldquo;{quote.message}&rdquo;</p>
                            <footer className="text-sm text-neutral-300">{quote.author}</footer>
                        </blockquote>
                    </div>
                )}
            </div>
            <div className="custom-scrollbar w-full lg:h-screen lg:overflow-y-auto lg:p-8">
                <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[550px]">
                    <p className="relative z-20 flex items-center justify-center lg:hidden">{/* <AppLogo/> */}</p>
                    {children}
                </div>
            </div>
            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 8px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #a1a1aa;
                    border-radius: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: #18181b;
                }
                .custom-scrollbar {
                    scrollbar-width: thin;
                    scrollbar-color: #a1a1aa #18181b;
                }
            `}</style>
        </div>
    );
}
