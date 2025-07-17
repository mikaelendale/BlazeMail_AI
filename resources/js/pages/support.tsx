'use client';

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Link } from '@inertiajs/react';
import { ChevronDown } from 'lucide-react';
import type React from 'react';
import { useEffect, useState } from 'react';
import LandingLayout from './landing/landing-layout';

export default function SupportPage() {
    const [searchOpen, setSearchOpen] = useState(false);
    const [showAllFaqs, setShowAllFaqs] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        company: '',
        subject: '',
        message: '',
        priority: 'medium',
        category: 'general',
    });

    // Keyboard shortcut for search
    useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                setSearchOpen((open) => !open);
            }
        };
        document.addEventListener('keydown', down);
        return () => document.removeEventListener('keydown', down);
    }, []);

    const searchItems = [
        { title: 'Enterprise API Rate Limits & Scaling', category: 'API' },
        { title: 'GDPR Compliance & Data Processing', category: 'Compliance' },
        { title: 'SSO Integration (SAML/OIDC)', category: 'Security' },
        { title: 'Dedicated IP Pool Setup', category: 'Deliverability' },
        { title: 'Custom Domain Configuration', category: 'Setup' },
        { title: 'Webhook Event Processing', category: 'Integration' },
        { title: 'Enterprise SLA & Support Tiers', category: 'Account' },
        { title: 'Schedule Technical Architecture Review', category: 'Enterprise' },
        { title: 'Request Dedicated Account Manager', category: 'Enterprise' },
        { title: 'Book Implementation Consultation', category: 'Onboarding' },
    ];

    const supportOptions = [
        {
            title: 'Dedicated Success Manager',
            description: 'Your personal point of contact for strategic guidance and account management',
            availability: '24/7',
            responseTime: '< 30 min',
            bgImage:
                'https://sdmntprnorthcentralus.oaiusercontent.com/files/00000000-1cc4-622f-b69c-e6b84bed84c8/raw?se=2025-07-10T15%3A53%3A42Z&sp=r&sv=2024-08-04&sr=b&scid=81b676f8-8759-5d2f-9e20-d01a6e1b3dad&skoid=add8ee7d-5fc7-451e-b06e-a82b2276cf62&sktid=a48cca56-e6da-484e-a814-9c849652bcb3&skt=2025-07-09T20%3A08%3A21Z&ske=2025-07-10T20%3A08%3A21Z&sks=b&skv=2024-08-04&sig=gfwyyILdoOwJNz/53IRnQljN5rP5kjOTc0pVglnoGlI%3D',
        },
        {
            title: 'Technical Architecture Review',
            description: 'Deep-dive sessions with our engineering team for optimal implementation',
            availability: 'Scheduled',
            responseTime: 'Same day',
            bgImage: 'https://tse4.mm.bing.net/th/id/OIP._8TEcZk4-6xIt6R3qFvhqQHaEK?rs=1&pid=ImgDetMain&o=7&rm=3',
        },
        {
            title: 'Priority Phone Support',
            description: 'Direct line to senior technical specialists for urgent issues',
            availability: '24/7/365',
            responseTime: '< 2 min',
            bgImage: 'https://th.bing.com/th/id/OIP.YhVVf0r3nlPPNTMr9OiG_QHaEK?o=7rm=3&rs=1&pid=ImgDetMain&o=7&rm=3',
        },
        {
            title: 'Video Implementation Sessions',
            description: 'Screen-share setup and optimization sessions with experts',
            availability: 'Business hours',
            responseTime: '< 15 min',
            bgImage: 'https://th.bing.com/th/id/OIP.0UHknpQaaovm8G06FE3rrgHaEK?o=7rm=3&rs=1&pid=ImgDetMain&o=7&rm=3',
        },
    ];

    const faqs = [
        {
            question: 'How do we ensure 99.99% uptime SLA for enterprise customers?',
            answer: "Our enterprise infrastructure runs on multi-region AWS with automatic failover, real-time monitoring, and dedicated resources. We maintain hot standby systems across 3 availability zones, with sub-second failover times. Enterprise customers get dedicated IP pools, priority queue processing, and guaranteed resource allocation. Our SLA includes financial penalties if we don't meet uptime commitments, with detailed incident reports and post-mortems for any service disruptions.",
        },
        {
            question: 'What compliance certifications do you maintain for enterprise security?',
            answer: 'We maintain SOC 2 Type II, ISO 27001, GDPR compliance, CCPA compliance, and HIPAA readiness. Our platform undergoes quarterly penetration testing by third-party security firms. We provide detailed compliance reports, data processing agreements, and can accommodate custom security requirements. Enterprise customers get access to our security portal with real-time compliance dashboards and audit logs.',
        },
        {
            question: 'How does the enterprise API handle high-volume email campaigns?',
            answer: 'Our enterprise API supports up to 10,000 requests per minute with burst capacity up to 50,000 RPM. We use intelligent rate limiting, queue prioritization, and dedicated processing clusters for enterprise accounts. Bulk operations are optimized with batch processing, async webhooks, and real-time status tracking. Enterprise customers get dedicated API endpoints, custom rate limits, and priority processing queues.',
        },
        {
            question: 'What level of customization is available for enterprise integrations?',
            answer: 'Enterprise customers get access to our professional services team for custom integrations, white-label solutions, and bespoke API development. We support custom webhooks, dedicated database connections, and can build custom connectors for proprietary systems. Our engineering team provides technical consultation, code reviews, and ongoing integration support with dedicated Slack channels.',
        },
        {
            question: 'How do you handle data residency and international compliance?',
            answer: 'We operate data centers in US, EU, and APAC regions with full data residency compliance. Enterprise customers can specify data location requirements, and we ensure all processing stays within designated regions. We provide detailed data flow documentation, cross-border transfer agreements, and can accommodate specific regulatory requirements like GDPR Article 28 processing agreements.',
        },
        {
            question: "What's included in the enterprise onboarding and migration process?",
            answer: 'Enterprise onboarding includes dedicated implementation manager, technical architecture review, custom integration development, data migration assistance, team training sessions, and go-live support. We provide project timelines, milestone tracking, and dedicated Slack channels. Migration from other platforms includes data export assistance, configuration replication, and parallel testing environments.',
        },
    ];

    const displayedFaqs = showAllFaqs ? faqs : faqs.slice(0, 4);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const ticketId = 'ENT-' + Math.random().toString(36).substr(2, 9).toUpperCase();
        console.log('Enterprise support ticket submitted:', formData);
        alert(
            `Enterprise support ticket created successfully! Ticket ${ticketId}\n\nExpected response time: < 30 minutes\nAssigned to: Senior Technical Specialist`,
        );
        setFormData({
            name: '',
            email: '',
            company: '',
            subject: '',
            message: '',
            priority: 'medium',
            category: 'general',
        });
    };

    return (
        <LandingLayout>
            <div className="min-h-screen bg-background">
                {/* Hero Section */}
                <div className="relative pt-20 overflow-hidden sm:pt-6  ">
                    <div className="relative container mx-auto px-4 py-16 sm:px-6 sm:py-24 lg:px-8 lg:py-32">
                        <div className="text-center">
                            {/* Main Heading */}
                            <div className="space-y-6 sm:space-y-8">
                                <h1 className="text-4xl leading-tight font-bold tracking-tight text-primary sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl">
                                    Enterprise-Grade Support <br className="hidden sm:block" />
                                    <span className="block sm:inline">for Mission-Critical</span>{' '}
                                    <span className="block sm:inline">Email Infrastructure</span>
                                </h1>
                                <div className="mx-auto max-w-2xl space-y-3 sm:max-w-3xl sm:space-y-4 lg:max-w-4xl">
                                    <p className="px-2 text-base leading-relaxed font-medium text-secondary sm:px-0 sm:text-lg md:text-xl lg:text-xl">
                                        BlazeMail powers high-volume outreach with 24/7 support, SLA-backed reliability, and expert integration help —
                                        trusted by fast-scaling B2B teams.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* CTA Buttons */}
                        <div className="flex w-full flex-col items-center justify-center gap-3 px-4 pt-8 sm:flex-row sm:gap-4 sm:px-0 sm:pt-10 lg:pt-12">
                            <Link href="/register" className="w-full sm:w-auto">
                                <Button
                                    className="w-full min-w-[200px] px-6 py-3 text-base font-semibold shadow-md sm:w-auto sm:px-8 sm:py-3 sm:text-lg"
                                    size="lg"
                                >
                                    Get Started Free
                                </Button>
                            </Link>
                            <a href="https://youtube.com" target="_blank" className="w-full sm:w-auto" rel="noreferrer">
                                <Button
                                    variant="outline"
                                    className="w-full min-w-[200px] bg-transparent px-6 py-3 text-base font-semibold shadow sm:w-auto sm:px-8 sm:py-3 sm:text-lg"
                                    size="lg"
                                >
                                    See Live Demo
                                </Button>
                            </a>
                        </div>
                    </div>
                </div>

                <div className="container mx-auto space-y-32 px-4 pb-32">
                    {/* FAQ */}
                    <div className="mx-auto max-w-5xl">
                        <div className="mb-20 text-center">
                            <h2 className="mb-6 rounded-3xl sm:text-5xl text-3xl font-bold">FAQ</h2>
                            <p className="text-2xl text-muted-foreground">Technical and strategic questions from customers</p>
                        </div>
                        <div className="space-y-6">
                            {displayedFaqs.map((faq, index) => (
                                <div
                                    key={index}
                                    className="group overflow-hidden rounded-3xl border border-t-2 border-l-4 border-t-orange-500 border-l-orange-500 bg-gradient-to-br from-background to-muted/5 transition-all duration-300 "
                                >
                                    <Accordion type="single" collapsible>
                                        <AccordionItem value={`item-${index}`} className="border-none">
                                            <AccordionTrigger className="px-9 py-6 text-left hover:no-underline">
                                                <div className="text-xl leading-relaxed font-semibold">{faq.question}</div>
                                            </AccordionTrigger>
                                            <AccordionContent className="px-8 pb-8 text-lg leading-relaxed text-muted-foreground">
                                                {faq.answer}
                                            </AccordionContent>
                                        </AccordionItem>
                                    </Accordion>
                                </div>
                            ))}
                        </div>
                        {!showAllFaqs && faqs.length > 4 && (
                            <div className="mt-16 text-center">
                                <Button
                                    variant="outline"
                                    onClick={() => setShowAllFaqs(true)}
                                    className="gap-2 rounded-full px-10 py-4 text-lg transition-all duration-200 hover:shadow-lg"
                                >
                                    View All Enterprise FAQ <ChevronDown className="h-5 w-5" />
                                </Button>
                            </div>
                        )}
                    </div>
                    {/* support  */}
                    <div className="mx-auto max-w-7xl px-4">
                        <div className="mb-20 text-center">
                            <h2 className="mb-6 text-5xl font-bold">Enterprise Support Tiers</h2>
                            <p className="text-2xl text-muted-foreground">Tailored support for every stage of your growth</p>
                        </div>
                        <div className="grid gap-8 lg:grid-cols-2">
                            {supportOptions.map((option, index) => (
                                <div key={index} className="rounded-3xl bg-accent p-1">
                                    <div className="group relative overflow-hidden rounded-3xl border border-t-4 border-r-4 border-l-4 bg-background p-8 transition-all duration-300">
                                        <div className="relative">
                                            <h3 className="mb-4 text-2xl font-semibold">{option.title}</h3>
                                            <p className="mb-6 text-lg leading-relaxed text-muted-foreground">{option.description}</p>
                                            <div className="flex items-center justify-between">
                                                <div className="space-y-1 text-sm text-muted-foreground">
                                                    <div>{option.availability}</div>
                                                    <div>{option.responseTime}</div>
                                                </div>
                                                <Button className="transition-transform duration-200 hover:scale-105">Get Started</Button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Contact */}
                    <div className="mx-auto max-w-7xl">
                        <div className="mb-20 text-center">
                            <h2 className="mb-6 text-5xl font-bold">Get Enterprise Support</h2>
                            <p className="text-2xl text-muted-foreground">Direct access to our senior technical team</p>
                        </div>
                        <div className="grid gap-12 lg:grid-cols-2">
                            {/* Contact Info */}
                            <div className="space-y-8">
                                <div className="overflow-hidden rounded-3xl border border-t-4 border-r-4 border-t-orange-500 border-r-orange-500 bg-gradient-to-br from-background to-muted/10 p-8">
                                    <h3 className="mb-8 text-2xl font-semibold">Enterprise Priority Support</h3>
                                    <div className="space-y-6">
                                        {[
                                            {
                                                title: 'Dedicated Success Manager',
                                                desc: 'Your personal enterprise contact',
                                                action: 'Connect',
                                            },
                                            {
                                                title: 'Priority Phone Line',
                                                desc: '+1 (555) 100-ENTERPRISE',
                                                action: 'Call Now',
                                            },
                                            {
                                                title: 'Architecture Review',
                                                desc: 'Technical deep-dive session',
                                                action: 'Schedule',
                                            },
                                        ].map((item, index) => (
                                            <div key={index} className="flex items-center justify-between rounded-2xl bg-muted/20 p-6">
                                                <div>
                                                    <div className="font-semibold">{item.title}</div>
                                                    <div className="text-sm text-muted-foreground">{item.desc}</div>
                                                </div>
                                                <Button size="sm" variant={index === 0 ? 'default' : 'outline'}>
                                                    {item.action}
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="overflow-hidden rounded-3xl border border-t-4 border-r-4 border-t-orange-500 border-r-orange-500 bg-gradient-to-br from-background to-muted/10 p-8">
                                    <h3 className="mb-6 text-2xl font-semibold">Enterprise SLA Guarantee</h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="rounded-2xl border bg-accent p-6 text-center">
                                            <div className="text-3xl font-bold">99.99%</div>
                                            <div className="text-sm text-muted-foreground">Uptime SLA</div>
                                        </div>
                                        <div className="rounded-2xl border bg-accent p-6 text-center">
                                            <div className="text-3xl font-bold">&lt; 30s</div>
                                            <div className="text-sm text-muted-foreground">Response Time</div>
                                        </div>
                                    </div>
                                    <div className="mt-6 text-sm leading-relaxed text-muted-foreground">
                                        Financial penalties apply if SLA commitments are not met. Detailed incident reports provided for all service
                                        disruptions.
                                    </div>
                                </div>
                            </div>

                            {/* Contact Form */}
                            <div className="overflow-hidden rounded-3xl border border-t-4 border-l-4 border-t-orange-500 border-l-orange-500 bg-gradient-to-br from-background to-muted/10 p-8">
                                <h3 className="mb-8 text-2xl font-semibold">Create Enterprise Ticket</h3>
                                <form onSubmit={handleSubmit} className="space-y-6">
                                    <div className="grid gap-6 sm:grid-cols-2">
                                        <div className="space-y-2">
                                            <Label htmlFor="name" className="text-sm font-medium">
                                                Contact Name
                                            </Label>
                                            <Input
                                                id="name"
                                                name="name"
                                                value={formData.name}
                                                onChange={handleInputChange}
                                                placeholder="Your full name"
                                                className="h-12 rounded-xl"
                                                required
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="email" className="text-sm font-medium">
                                                Enterprise Email
                                            </Label>
                                            <Input
                                                id="email"
                                                name="email"
                                                type="email"
                                                value={formData.email}
                                                onChange={handleInputChange}
                                                placeholder="you@company.com"
                                                className="h-12 rounded-xl"
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="company" className="text-sm font-medium">
                                            Company Name
                                        </Label>
                                        <Input
                                            id="company"
                                            name="company"
                                            value={formData.company}
                                            onChange={handleInputChange}
                                            placeholder="Your company name"
                                            className="h-12 rounded-xl"
                                            required
                                        />
                                    </div>

                                    <div className="grid gap-6 sm:grid-cols-2">
                                        <div className="space-y-2">
                                            <Label htmlFor="category" className="text-sm font-medium">
                                                Issue Category
                                            </Label>
                                            <Select
                                                value={formData.category}
                                                onValueChange={(value) => setFormData((prev) => ({ ...prev, category: value }))}
                                            >
                                                <SelectTrigger className="h-12 rounded-xl">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="technical">Technical Integration</SelectItem>
                                                    <SelectItem value="performance">Performance & Scaling</SelectItem>
                                                    <SelectItem value="security">Security & Compliance</SelectItem>
                                                    <SelectItem value="billing">Enterprise Billing</SelectItem>
                                                    <SelectItem value="api">API & Development</SelectItem>
                                                    <SelectItem value="strategic">Strategic Consultation</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="priority" className="text-sm font-medium">
                                                Priority Level
                                            </Label>
                                            <Select
                                                value={formData.priority}
                                                onValueChange={(value) => setFormData((prev) => ({ ...prev, priority: value }))}
                                            >
                                                <SelectTrigger className="h-12 rounded-xl">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="low">Low - General inquiry</SelectItem>
                                                    <SelectItem value="medium">Medium - Standard issue</SelectItem>
                                                    <SelectItem value="high">High - Business impact</SelectItem>
                                                    <SelectItem value="critical">Critical - Service down</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="subject" className="text-sm font-medium">
                                            Subject
                                        </Label>
                                        <Input
                                            id="subject"
                                            name="subject"
                                            value={formData.subject}
                                            onChange={handleInputChange}
                                            placeholder="Brief description of the issue"
                                            className="h-12 rounded-xl"
                                            required
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="message" className="text-sm font-medium">
                                            Detailed Description
                                        </Label>
                                        <Textarea
                                            id="message"
                                            name="message"
                                            value={formData.message}
                                            onChange={handleInputChange}
                                            placeholder="Please provide detailed information about your issue, including any error messages, steps to reproduce, and business impact..."
                                            className="min-h-[120px] resize-none rounded-xl"
                                            required
                                        />
                                    </div>

                                    <Button type="submit" className="h-14 w-full gap-2 rounded-xl text-lg transition-transform duration-200">
                                        Create Enterprise Ticket
                                    </Button>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </LandingLayout>
    );
}
