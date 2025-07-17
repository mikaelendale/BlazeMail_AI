import { Head, useForm } from '@inertiajs/react';
import { Github, LoaderCircle } from 'lucide-react';
import { FormEventHandler } from 'react';

import InputError from '@/components/input-error';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AuthLayout from '@/layouts/auth-layout';

type RegisterForm = {
    name: string;
    email: string;
    password: string;
    password_confirmation: string;
};

export default function Register() {
    const { data, setData, post, processing, errors, reset } = useForm<Required<RegisterForm>>({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
        platform: navigator.userAgent || '',
    });
    // console.log(localStorage.getItem('blazemail_ref'));

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('register'), {
            onFinish: () => reset('password', 'password_confirmation'),
        });
    };
    const handleSocialLogin = (provider: 'google' | 'github') => {
        const urlParams = new URLSearchParams(window.location.search);
        const platform = navigator.userAgent.includes('Mobile') ? 'mobile' : 'desktop';

        // Store in sessionStorage (fallback)
        sessionStorage.setItem('platform', platform);

        // Pass as URL parameters
        const redirectUrl = route('auth.redirect', provider) + `?ref=${encodeURIComponent(referralCode)}&platform=${encodeURIComponent(platform)}`;

        window.location.href = redirectUrl;
    };

    // Update the click handlers:
    const handleGoogleLogin = () => handleSocialLogin('google');
    const handleGithubLogin = () => handleSocialLogin('github');

    return (
        <AuthLayout title="Create an account" description="Enter your details below to create your account">
            <Head title="Register" />
            <form className="flex flex-col gap-6" onSubmit={submit}>
                <div className="grid gap-6">
                    <div className="grid gap-2">
                        <Label htmlFor="name">Name</Label>
                        <Input
                            id="name"
                            type="text"
                            required
                            autoFocus
                            tabIndex={1}
                            autoComplete="name"
                            value={data.name}
                            onChange={(e) => setData('name', e.target.value)}
                            disabled={processing}
                            placeholder="Full name"
                        />
                        <InputError message={errors.name} className="mt-2" />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="email">Email address</Label>
                        <Input
                            id="email"
                            type="email"
                            required
                            tabIndex={2}
                            autoComplete="email"
                            value={data.email}
                            onChange={(e) => setData('email', e.target.value)}
                            disabled={processing}
                            placeholder="email@example.com"
                        />
                        <InputError message={errors.email} />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="password">Password</Label>
                        <Input
                            id="password"
                            type="password"
                            required
                            tabIndex={3}
                            autoComplete="new-password"
                            value={data.password}
                            onChange={(e) => setData('password', e.target.value)}
                            disabled={processing}
                            placeholder="Password"
                        />
                        <InputError message={errors.password} />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="password_confirmation">Confirm password</Label>
                        <Input
                            id="password_confirmation"
                            type="password"
                            required
                            tabIndex={4}
                            autoComplete="new-password"
                            value={data.password_confirmation}
                            onChange={(e) => setData('password_confirmation', e.target.value)}
                            disabled={processing}
                            placeholder="Confirm password"
                        />
                        <InputError message={errors.password_confirmation} />
                    </div>

                    <Button type="submit" className="mt-2 w-full" tabIndex={5} disabled={processing}>
                        {processing && <LoaderCircle className="h-4 w-4 animate-spin" />}
                        Create account
                    </Button>
                </div>
                <div
                    onClick={handleGoogleLogin}
                    className="w-full cursor-pointer rounded-xl border border-gray-200 bg-gray-50 p-4 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-white focus:outline-none active:scale-[0.98] dark:border-gray-700 dark:bg-gray-800 dark:focus:ring-offset-gray-900"
                    tabIndex={0}
                    role="button"
                    onKeyDown={(e) => e.key === 'Enter' && handleGoogleLogin()}
                >
                    <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0">
                            <svg className="h-6 w-6" viewBox="0 0 24 24">
                                <path
                                    fill="#4285F4"
                                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                />
                                <path
                                    fill="#34A853"
                                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                />
                                <path
                                    fill="#FBBC05"
                                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                />
                                <path
                                    fill="#EA4335"
                                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                />
                            </svg>
                        </div>
                        <div className="flex-1">
                            <div className="text-sm font-medium text-gray-900 dark:text-white">Continue with Google</div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">Sign in using your Google account</div>
                        </div>
                        <div className="flex-shrink-0">
                            <svg className="h-4 w-4 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </div>
                    </div>
                </div>

                {/* GitHub Login Card */}
                <div
                    onClick={handleGithubLogin}
                    className="w-full cursor-pointer rounded-xl border border-gray-200 bg-gray-50 p-4 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 focus:ring-offset-white focus:outline-none active:scale-[0.98] dark:border-gray-700 dark:bg-gray-800 dark:focus:ring-offset-gray-900"
                    tabIndex={0}
                    role="button"
                    onKeyDown={(e) => e.key === 'Enter' && handleGithubLogin()}
                >
                    <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0">
                            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-900 dark:bg-white">
                                <Github className="h-4 w-4 text-white dark:text-gray-900" />
                            </div>
                        </div>
                        <div className="flex-1">
                            <div className="text-sm font-medium text-gray-900 dark:text-white">Continue with GitHub</div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">Sign in using your GitHub account</div>
                        </div>
                        <div className="flex-shrink-0">
                            <svg className="h-4 w-4 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </div>
                    </div>
                </div>

                <div className="text-center text-sm text-muted-foreground">
                    Already have an account?{' '}
                    <TextLink href={route('login')} tabIndex={6}>
                        Log in
                    </TextLink>
                </div>
            </form>
        </AuthLayout>
    );
}
