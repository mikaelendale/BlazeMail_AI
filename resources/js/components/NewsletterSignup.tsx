'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useForm } from '@inertiajs/react';
import { CheckCircle, Mail } from 'lucide-react';
import type React from 'react';
import AppLogo from './app-logo';

interface Props {
    className?: string;
}

export default function NewsletterSignup({ className = '' }: Props) {
    const { data, setData, post, processing, errors, wasSuccessful, reset } = useForm({
        email: '',
        name: '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('newsletter.subscribe'), {
            onSuccess: () => reset(),
        });
    };

    if (wasSuccessful) {
        return (
            <Card className='bg-accent border-b-4 border-b-orange-500 shadow-md rounded-lg p-6 space-y-4'>
                <CardContent className="pt-6">
                    <div className="text-center">
                        <h3 className="mb-2 text-lg font-semibold text-primary">Almost there!</h3>
                        <p className="text-secondary">
                            We've sent a confirmation email to your inbox. Please click the link to complete your subscription.
                        </p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className='bg-accent border-b-4 border-b-orange-500'>
            <CardHeader>
                <CardTitle>
                    <div className="flex flex-col items-center space-y-2 justify-center">
                        <AppLogo />
                        <p className="mb-2">Subscribe to Newsletter</p>
                    </div>
                </CardTitle>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <Input type="text" className='border-orange-200 dark:border-primary-foreground border-2' placeholder="Your name (optional)" value={data.name} onChange={(e) => setData('name', e.target.value)} />
                    </div>
                    <div>
                        <Input
                            type="email"
                            placeholder="Your email address"
                            value={data.email}
                            onChange={(e) => setData('email', e.target.value)}
                            className={errors.email ? 'border-red-500' : 'border-orange-200 dark:border-primary-foreground border-2'}
                            required
                        />
                        {errors.email && <p className="mt-1 text-sm text-red-500">{errors.email}</p>}
                    </div>
                    <Button type="submit" className="w-full" disabled={processing}>
                        {processing ? 'Subscribing...' : 'Subscribe'}
                    </Button>
                    <p className="text-center text-xs text-gray-500">Get notified about new posts and updates. Unsubscribe anytime.</p>
                </form>
            </CardContent>
        </Card>
    );
}
