// Components
import { Head, useForm } from '@inertiajs/react';
import { LoaderCircle, X } from 'lucide-react';
import { FormEventHandler } from 'react';

import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import AuthLayout from '@/layouts/auth-layout';
import { toast } from 'sonner';

export default function VerifyEmail({ status }: { status?: string }) {
    const { post, processing } = useForm({});

    const submit: FormEventHandler = (e) => {
        e.preventDefault();

        post(route('verification.send'), {
            onSuccess: () => {
                toast.success('A new verification link has been sent to your email address.');
            },
            onError: () => {
                toast.error('Failed to send verification email. Please try again later.');
            },
        });
    }; 

    return (
        <AuthLayout title="Verify email" description="Please verify your email address by clicking on the link we just emailed to you.">
            <Head title="Email verification" /> 
            <form onSubmit={submit} className="space-y-6 text-center">
                <Button disabled={processing} size="lg">
                    {processing && <LoaderCircle className="h-4 w-4 animate-spin" />}
                    Resend verification email
                </Button>

                <TextLink href={route('logout')} method="post" className="mx-auto block text-sm">
                    Log out
                </TextLink>
            </form>
        </AuthLayout>
    );
}