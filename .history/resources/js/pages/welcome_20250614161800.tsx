import { Head } from '@inertiajs/react';
import { LoaderCircle, ArrowRight, Users, Sparkles, Shield } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';

export default function Welcome() {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const { toast } = useToast();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 1000));

        toast({
            title: 'Success!',
            description: 'You have been added to the waitlist. We will notify you soon!',
        });

        setEmail('');
        setLoading(false);
    };

    return (
        <div className="min-h-screen bg-background">
            <Head title="Join the Waitlist" />

            <main className="container mx-auto px-4 py-16">
                {/* Hero Section */}
                <div className="mb-16 text-center">
                    <h1 className="mb-4 text-4xl font-bold tracking-tight sm:text-6xl">
                        Join the Future of
                        <span className="bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent">
                            {' '}
                            Innovation
                        </span>
                    </h1>
                    <p className="mx-auto mb-8 max-w-2xl text-lg text-muted-foreground">
                        Be among the first to experience our revolutionary platform. Join our exclusive waitlist and get
                        early access to features that will transform your workflow.
                    </p>

                    {/* Waitlist Form */}
                    <form onSubmit={handleSubmit} className="mx-auto flex max-w-md gap-x-4">
                        <Input
                            type="email"
                            placeholder="Enter your email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="flex-1"
                        />
                        <Button type="submit" disabled={loading}>
                            {loading ? (
                                <LoaderCircle className="h-4 w-4 animate-spin" />
                            ) : (
                                <>
                                    Join Now
                                    <ArrowRight className="ml-2 h-4 w-4" />
                                </>
                            )}
                        </Button>
                    </form>

                    {/* Stats */}
                    <div className="mt-8 text-center text-sm text-muted-foreground">
                        <p>Join 2,000+ people already on the waitlist</p>
                    </div>
                </div>

                {/* Features Section */}
                <div className="grid gap-8 md:grid-cols-3">
                    <Card>
                        <CardHeader>
                            <Users className="mb-2 h-8 w-8 text-blue-600" />
                            <CardTitle>Community First</CardTitle>
                            <CardDescription>
                                Join a thriving community of innovators and creators shaping the future.
                            </CardDescription>
                        </CardHeader>
                    </Card>

                    <Card>
                        <CardHeader>
                            <Sparkles className="mb-2 h-8 w-8 text-violet-600" />
                            <CardTitle>Early Access</CardTitle>
                            <CardDescription>
                                Be the first to experience groundbreaking features and provide valuable feedback.
                            </CardDescription>
                        </CardHeader>
                    </Card>

                    <Card>
                        <CardHeader>
                            <Shield className="mb-2 h-8 w-8 text-green-600" />
                            <CardTitle>Exclusive Benefits</CardTitle>
                            <CardDescription>
                                Get special perks, priority support, and exclusive offers available only to waitlist
                                members.
                            </CardDescription>
                        </CardHeader>
                    </Card>
                </div>
            </main>
        </div>
    );
}