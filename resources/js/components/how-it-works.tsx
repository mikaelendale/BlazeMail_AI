import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowDown, ArrowRight, MailCheck, PenLine, Squircle, UserRoundCheckIcon } from 'lucide-react';

const steps = [
    {
        title: 'Tell us what you do',
        description: 'Share your business details and target audience in seconds',
        icon: PenLine,
    },
    {
        title: 'Choose your target',
        description: 'Select your ideal prospects from our smart recommendations',
        icon: UserRoundCheckIcon,
    },
    {
        title: 'Get your email. Instantly.',
        description: 'Receive personalized, high-converting cold emails ready to send',
        icon: MailCheck,
    },
];

export default function HowItWorks() {
    return (
        <section className="max-w-6xl overflow-hidden container mx-auto w-full bg-background px-4 py-20 sm:px-6 lg:px-8">
            <div className="mx-auto ">
                {/* Header */}
                <div className="mb-20 text-center">
                    <h2 className="mb-6 text-3xl font-bold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
                        How BlazeMail Works in 15 Seconds
                    </h2>
                    <p className="mx-auto max-w-2xl text-lg leading-relaxed text-muted-foreground sm:text-xl">
                        From blank to booked — no templates, no fluff. Just fast, converting cold emails.
                    </p>
                </div>

                {/* Steps */}
                <div className="relative">
                    {/* Desktop: Horizontal Layout */}
                    <div className="mb-16 hidden gap-12 md:grid md:grid-cols-3">
                        {steps.map((step, index) => {
                            const Icon = step.icon;
                            return (
                                <div key={index} className="relative flex flex-col items-center">
                                    {/* Icon Circle */}
                                    <div className="relative mb-8">
                                        <div className="flex h-20 w-20 items-center justify-center rounded-full border-2 border-primary/20 bg-primary/10 backdrop-blur-sm">
                                            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary">
                                                <Icon className="h-8 w-8 text-primary-foreground" />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Content */}
                                    <div className="max-w-xs text-center">
                                        <h3 className="mb-3 text-xl font-semibold text-foreground">{step.title}</h3>
                                        <p className="text-sm leading-relaxed text-muted-foreground">{step.description}</p>
                                    </div>

                                    {/* Arrow for desktop */}
                                    {index < steps.length - 1 && (
                                        <div className="absolute top-10 -right-6 -translate-y-1/2 transform">
                                            <div className="h-0.5 w-12 bg-border"></div>
                                            <ArrowRight className="absolute -top-2 -right-1 h-4 w-4 text-muted-foreground" />
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    {/* Mobile: Vertical Layout */}
                    <div className="mb-16 space-y-12 md:hidden">
                        {steps.map((step, index) => {
                            const Icon = step.icon;
                            return (
                                <div key={index} className="relative">
                                    <Card className="shadow-none border-0 bg-background">
                                        <CardContent className="p-8">
                                            <div className="flex items-start gap-6">
                                                {/* Icon Circle */}
                                                <div className="flex-shrink-0">
                                                    <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-primary/20 bg-primary/10">
                                                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary">
                                                            <Icon className="h-6 w-6 text-primary-foreground" />
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Content */}
                                                <div className="flex-1 pt-2">
                                                    <h3 className="mb-2 text-lg font-semibold text-foreground">{step.title}</h3>
                                                    <p className="text-sm leading-relaxed text-muted-foreground">{step.description}</p>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>

                                    {/* Arrow for mobile */}
                                    {index < steps.length - 1 && (
                                        <div className="my-6 flex justify-center">
                                            <div className="flex flex-col items-center">
                                                <div className="h-8 w-0.5 bg-border"></div>
                                                <ArrowDown className="-mt-1 h-4 w-4 text-muted-foreground" />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* CTA */}
                <div className="text-center">
                    <div className="inline-flex flex-col items-center gap-4 sm:flex-row">
                        <Button size="lg" className="rounded-full px-8 py-3 text-base font-medium shadow-lg">
                            Try It Free
                            <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                        <span className="text-sm text-muted-foreground">No credit card required</span>
                    </div>
                </div>
            </div>
        </section>
    );
}
