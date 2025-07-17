'use client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { SharedData } from '@/types';
import { router, usePage } from '@inertiajs/react';
import { ArrowRight, Building, Check, Snowflake, Users } from 'lucide-react';
import type React from 'react';
import { useState } from 'react';

type SubscriptionButtonProps = {
    plan: string;
    children: React.ReactNode;
    onSubscribe: (plan: string) => void;
    variant?: 'default' | 'outline' | 'secondary';
    className?: string;
};

function SubscriptionButton({ plan, children, onSubscribe, variant = 'default', className = '' }: SubscriptionButtonProps) {
    return (
        <Button className={`group w-full ${className}`} size="lg" variant={variant} onClick={() => onSubscribe(plan)}>
            {children}
            <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
        </Button>
    );
}

export default function Pricing() {
    const [isAnnual, setIsAnnual] = useState(false);
    const {auth, customer} = usePage<SharedData>().props;

    const handleSubscribe = (planName: string) => {
        // Convert plan name to match controller format
        if (auth?.user && customer.plan !== 'free') {
            router.get('/dashboard');
        } else {
            const planKey = planName.toLowerCase();
            const billingPeriod = isAnnual ? 'annual' : 'monthly';
            const fullPlanName = `${planKey}-${billingPeriod}`;
            router.get('/subscribe', { plan: fullPlanName });
        } 
    };

    const plans = [
        {
            name: 'Free',
            key: 'free', // This won't be used for subscription
            monthlyPrice: 'Free',
            annualPrice: 'Free',
            period: '',
            popular: false,
            enterprise: false,
            icon: Snowflake,
            description: 'Perfect for getting started with cold email',
            features: [
                '50 AI-generated emails/mo',
                'Basic personalization (name & company)',
                'Basic analytics (open rates)',
                '200 contacts',
                'Single user access',
                'Email export not supported',
            ],
            buttonText: 'Get started for free',
        },
        {
            name: 'Growth',
            key: 'growth', // This will be used to generate growth_monthly or growth_annual
            monthlyPrice: '$25',
            annualPrice: '$250',
            period: '/mo',
            popular: false,
            enterprise: false,
            icon: Users,
            description: 'Scale your outreach with advanced features',
            features: [
                '6,000 AI-generated emails/mo',
                '500 saved email drafts',
                '2,000 contacts',
                'Advanced personalization (job title, context, etc.)',
                'AI-assisted refinement support',
                'Email export (PDF & CSV)',
                'Email warm-up (2 accounts)',
                'Basic sender rotation (2 accounts)',
                'CRM integrations (basic — HubSpot only)',
            ],
            buttonText: 'Start 7-day free trial',
        },
        {
            name: 'Scale',
            key: 'scale', // This will be used to generate scale_monthly or scale_annual
            monthlyPrice: '$59',
            annualPrice: '$590',
            period: '/mo',
            popular: true,
            enterprise: false,
            icon: Building,
            description: 'Advanced tools for high-volume campaigns',
            features: [
                '20,000 AI-generated emails/mo',
                '5,000 saved email drafts',
                '10,000 contacts', 
                'AI spam detection & deliverability scoring (under dev)',
                'Advanced analytics (open, click, reply rates)',
                'Priority support',
                'Email warm-up (5 accounts)',
                'Advanced sender rotation (5 accounts)',
                'CRM integrations (HubSpot, Salesforce, Pipedrive)',
            ],
            buttonText: 'Start 7-day free trial',
        },
    ];

    return (
        <div className="container mx-auto px-4 py-16 md:py-24">
            {/* Billing Toggle */}
            <div className="mb-12 flex justify-center md:mb-16">
                <div className="relative rounded-full border bg-muted p-1 shadow-sm">
                    <div className="relative flex">
                        {/* Background slider */}
                        <div
                            className={`absolute rounded-full bg-background pb-9 shadow-sm transition-all duration-300 ease-in-out ${
                                isAnnual ? 'right-1 left-[calc(50%-1px)]' : 'right-[calc(50%-1px)] left-1'
                            }`}
                        />
                        <button
                            onClick={() => setIsAnnual(false)}
                            className={`relative z-10 rounded-full px-4 py-2 text-sm font-medium whitespace-nowrap transition-all md:px-6 ${
                                !isAnnual ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
                            }`}
                        >
                            Monthly
                        </button>
                        <button
                            onClick={() => setIsAnnual(true)}
                            className={`relative z-10 rounded-full px-4 py-2 text-sm font-medium whitespace-nowrap transition-all md:px-6 ${
                                isAnnual ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
                            }`}
                        >
                            <span className="flex items-center gap-2">Annually</span>
                        </button>
                    </div>
                </div>
                <Badge variant="outline" className="border-none">
                    20% off
                </Badge>
            </div>

            {/* Pricing Grid */}
            <div className="mx-auto max-w-7xl">
                <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
                    {plans.map((plan, index) => {
                        const IconComponent = plan.icon;
                        const isPopular = plan.popular;
                        return (
                            <div key={plan.name} className={`relative ${isPopular ? 'lg:-mt-4 lg:scale-105' : ''}`}>
                                {isPopular && (
                                    <div className="absolute -top-4 left-1/2 z-10 -translate-x-1/2">
                                        <Badge
                                            variant={'outline'}
                                            className="border-orange-200 bg-background px-4 py-1.5 text-primary shadow-lg dark:border-orange-800"
                                        >
                                            Most Popular
                                        </Badge>
                                    </div>
                                )}
                                <div
                                    className={`relative h-full rounded-3xl border-2 bg-background p-8 transition-all duration-300 hover:shadow-xl ${
                                        isPopular
                                            ? 'border-orange-200 bg-gradient-to-br from-orange-50/50 to-background shadow-lg dark:border-orange-800 dark:from-orange-950/20'
                                            : 'border-border hover:border-orange-200 dark:hover:border-orange-800'
                                    }`}
                                >
                                    {/* Plan Header */}
                                    <div className="mb-8">
                                        <div
                                            className={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl ${
                                                isPopular ? 'bg-orange-100 dark:bg-orange-900/50' : 'bg-muted'
                                            }`}
                                        >
                                            <IconComponent
                                                className={`h-6 w-6 ${isPopular ? 'text-orange-600 dark:text-orange-400' : 'text-muted-foreground'}`}
                                            />
                                        </div>
                                        <h3 className="mb-2 text-xl font-bold text-foreground">{plan.name}</h3>
                                        <p className="text-sm text-muted-foreground">{plan.description}</p>
                                    </div>

                                    {/* Pricing */}
                                    <div className="mb-8">
                                        <div className="flex items-baseline gap-1">
                                            <span className="text-4xl font-bold text-foreground">
                                                {isAnnual ? plan.annualPrice : plan.monthlyPrice}
                                            </span>
                                            <span className="text-muted-foreground">{isAnnual ? '/yr' : plan.period}</span>
                                        </div>
                                        {isAnnual && plan.name !== 'Free' && <p className="mt-1 text-sm text-muted-foreground">Billed annually</p>}
                                    </div>

                                    {/* CTA Button */}
                                    <div className="mb-8">
                                        {plan.name !== 'Free' ? (
                                            <SubscriptionButton
                                                plan={plan.key}
                                                onSubscribe={handleSubscribe}
                                                variant={isPopular ? 'default' : 'outline'}
                                                className={
                                                    isPopular
                                                        ? 'bg-orange-500 hover:bg-orange-600'
                                                        : 'border-orange-200 hover:bg-orange-50 dark:border-orange-800 dark:hover:bg-orange-950/20'
                                                }
                                            >
                                                {plan.buttonText}
                                            </SubscriptionButton>
                                        ) : (
                                            <Button className="group w-full bg-transparent" size="lg" variant="outline">
                                                {plan.buttonText}
                                            </Button>
                                        )}
                                    </div>

                                    {/* Features */}
                                    <div className="space-y-4">
                                        <h4 className="font-semibold text-foreground">What's included:</h4>
                                        <ul className="space-y-3">
                                            {plan.features.map((feature, featureIndex) => (
                                                <li key={featureIndex} className="flex items-start gap-3">
                                                    <div
                                                        className={`mt-0.5 flex h-5 w-5 items-center justify-center rounded-full p-1 ${
                                                            isPopular ? 'bg-orange-100 dark:bg-orange-900/50' : 'bg-muted'
                                                        }`}
                                                    >
                                                        <Check
                                                            className={`h-3 w-3 ${isPopular ? 'text-orange-600 dark:text-orange-400' : 'text-muted-foreground'}`}
                                                        />
                                                    </div>
                                                    <span className="text-sm leading-relaxed text-muted-foreground">{feature}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        );
                    })}

                    {/* Enterprise Card */}
                    <div className="relative">
                        <div className="relative h-full rounded-3xl border-2 border-orange-200 bg-gradient-to-br from-orange-500 to-orange-600 p-8 text-white shadow-xl dark:border-orange-800">
                            {/* Plan Header */}
                            <div className="mb-8">
                                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20">
                                    <Building className="h-6 w-6 text-white" />
                                </div>
                                <h3 className="mb-2 text-xl font-bold text-white">Enterprise</h3>
                                <p className="text-sm text-orange-100">Custom solutions for large teams</p>
                            </div>

                            {/* Pricing */}
                            <div className="mb-8">
                                <div className="flex items-baseline gap-1">
                                    <span className="text-4xl font-bold text-white">Custom</span>
                                </div>
                                <p className="mt-1 text-sm text-orange-100">Tailored pricing for your needs</p>
                            </div>

                            {/* CTA Button */}
                            <div className="mb-8">
                                <Button variant="secondary" className="group w-full bg-white text-orange-600 hover:bg-orange-50" size="lg">
                                    Request Early Access
                                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                                </Button>
                            </div>

                            {/* Coming Soon */}
                            <div className="rounded-2xl bg-white/10 p-6 text-center">
                                <h4 className="mb-2 font-semibold text-white">Coming Soon</h4>
                                <p className="text-sm text-orange-100">
                                    We're building something amazing for enterprise customers. Be the first to know when it's ready.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom CTA */}
            <div className="mt-20 rounded-3xl p-12 text-center">
                <h3 className="mb-4 text-2xl font-bold text-foreground">Still have questions?</h3>
                <p className="mb-6 text-muted-foreground">Our team is here to help you choose the right plan for your business.</p>
                <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
                    <Button
                        variant="outline"
                        size="lg"
                        className="border-orange-200 bg-transparent hover:bg-orange-50 dark:border-orange-800 dark:hover:bg-orange-950/20"
                    >
                        Schedule a Demo
                    </Button>
                    <Button size="lg" className="">
                        Contact Sales
                    </Button>
                </div>
            </div>
        </div>
    );
}
