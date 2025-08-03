'use client';

import { Link } from '@inertiajs/react';
import LandingLayout from './landing/landing-layout';
import { Button } from "@/components/ui/button"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import {
    Smile,
    CreditCard,
    Mail,
    Headphones,
    BookOpen,
    LayoutGrid,
    UserPlus,
    Lock,
    XCircle,
    Sparkles,
    Send,
} from "lucide-react"
import CTA from './landing/cta';

export default function SupportPage() {

    return (
        <LandingLayout>
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                {/* FAQ Section */}
                <div className="pt-40 container mx-auto w-full max-w-6xl px-4">
                    {/* Pricing Header */}
                    <div className="text-center  mb-12">
                        <h1 className="sm:text-7xl text-5xl text-primary font-bold mb-4">Frequently Asked Questions</h1>
                        <div className="flex justify-center">
                            <p className="text-muted-foreground sm:max-w-xl max-w-sm  text-sm sm:text-lg text-center">
                                Have a question? We&apos;re here to help! Check out our FAQs below or contact us directly for more
                                information.
                            </p>
                        </div>
                    </div> 

                    <div className="mt-12 max-w-3xl mx-auto">
                        <Accordion type="single" collapsible className="w-full">
                            {/* 1 - Free Trial */}
                            <AccordionItem value="item-1" className="border-b-0 bg-primary-foreground px-4 mb-2 rounded-2xl">
                                <AccordionTrigger className="flex items-center justify-between py-4 text-lg font-medium hover:no-underline">
                                    <div className="flex items-center space-x-4">
                                        <div className="w-10 h-10 flex items-center justify-center rounded-lg border border-accent bg-primary-foreground">
                                            <Smile className="h-6 w-6 text-muted-foreground" />
                                        </div>
                                        <span>Is there a free trial?</span>
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent className="pb-4 text-left text-muted-foreground pl-14">
                                    Yes. BlazeMail offers a 7-day free trial with full access—no credit card required. You’ll be able to generate, preview, and test up to 20 cold emails during this period.
                                </AccordionContent>
                            </AccordionItem>

                            {/* 2 - Deliverability */}
                            <AccordionItem value="item-2" className="border-b-0 bg-primary-foreground px-4 mb-2 rounded-2xl">
                                <AccordionTrigger className="flex items-center justify-between py-4 text-lg font-medium hover:no-underline">
                                    <div className="flex items-center space-x-4">
                                        <div className="w-10 h-10 flex items-center justify-center rounded-lg border border-accent bg-primary-foreground">
                                            <Send className="h-6 w-6 text-muted-foreground" />
                                        </div>
                                        <span>How does BlazeMail ensure high email deliverability?</span>
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent className="pb-4 text-left text-muted-foreground pl-14">
                                    BlazeMail uses human-like AI generation, SPF/DKIM domain checks, inbox rotation logic, and optional warm-up features to ensure high deliverability. Emails are optimized to bypass spam filters while maintaining authenticity.
                                </AccordionContent>
                            </AccordionItem>

                            {/* 3 - AI Quality */}
                            <AccordionItem value="item-3" className="border-b-0 bg-primary-foreground px-4 mb-2 rounded-2xl">
                                <AccordionTrigger className="flex items-center justify-between py-4 text-lg font-medium hover:no-underline">
                                    <div className="flex items-center space-x-4">
                                        <div className="w-10 h-10 flex items-center justify-center rounded-lg border border-accent bg-primary-foreground">
                                            <Sparkles className="h-6 w-6 text-muted-foreground" />
                                        </div>
                                        <span>How is BlazeMail different from other cold email tools?</span>
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent className="pb-4 text-left text-muted-foreground pl-14">
                                    BlazeMail focuses on **ultra-fast**, **personalized**, and **natural-sounding** email generation. Unlike robotic-sounding alternatives, our AI uses human-trained patterns to adapt to your target’s tone and context. You also get lightning-fast generation speeds powered by Groq.
                                </AccordionContent>
                            </AccordionItem>

                            {/* 4 - Email Limits & Pricing */}
                            <AccordionItem value="item-4" className="border-b-0 bg-primary-foreground px-4 mb-2 rounded-2xl">
                                <AccordionTrigger className="flex items-center justify-between py-4 text-lg font-medium hover:no-underline">
                                    <div className="flex items-center space-x-4">
                                        <div className="w-10 h-10 flex items-center justify-center rounded-lg border border-accent bg-primary-foreground">
                                            <CreditCard className="h-6 w-6 text-muted-foreground" />
                                        </div>
                                        <span>How does pricing work?</span>
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent className="pb-4 text-left text-muted-foreground pl-14">
                                    Plans start at **$19/month** or **$1/email** with pay-as-you-go. You can switch between plans anytime. Every email generated is counted only once—no BS.
                                </AccordionContent>
                            </AccordionItem>

                            {/* 5 - Cancellation */}
                            <AccordionItem value="item-5" className="border-b-0 bg-primary-foreground px-4 mb-2 rounded-2xl">
                                <AccordionTrigger className="flex items-center justify-between py-4 text-lg font-medium hover:no-underline">
                                    <div className="flex items-center space-x-4">
                                        <div className="w-10 h-10 flex items-center justify-center rounded-lg border border-accent bg-primary-foreground">
                                            <XCircle className="h-6 w-6 text-muted-foreground" />
                                        </div>
                                        <span>What’s your refund or cancellation policy?</span>
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent className="pb-4 text-left text-muted-foreground pl-14">
                                    You can cancel anytime. We don’t lock you in. If you're not satisfied within the first 7 days of your paid plan, we offer a no-questions-asked full refund.
                                </AccordionContent>
                            </AccordionItem>

                            {/* 6 - Privacy & Data */}
                            <AccordionItem value="item-6" className="border-b-0 bg-primary-foreground px-4 mb-2 rounded-2xl">
                                <AccordionTrigger className="flex items-center justify-between py-4 text-lg font-medium hover:no-underline">
                                    <div className="flex items-center space-x-4">
                                        <div className="w-10 h-10 flex items-center justify-center rounded-lg border border-accent bg-primary-foreground">
                                            <Lock className="h-6 w-6 text-muted-foreground" />
                                        </div>
                                        <span>How do you handle my data?</span>
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent className="pb-4 text-left text-muted-foreground pl-14">
                                    Your data is encrypted at rest and in transit. We never share, sell, or train our models on your email data. You own your data, and you can delete it anytime.
                                </AccordionContent>
                            </AccordionItem>

                            {/* 7 - Support */}
                            <AccordionItem value="item-7" className="border-b-0 bg-primary-foreground px-4 mb-2 rounded-2xl">
                                <AccordionTrigger className="flex items-center justify-between py-4 text-lg font-medium hover:no-underline">
                                    <div className="flex items-center space-x-4">
                                        <div className="w-10 h-10 flex items-center justify-center rounded-lg border border-accent bg-primary-foreground">
                                            <Headphones className="h-6 w-6 text-muted-foreground" />
                                        </div>
                                        <span>Do you offer customer support?</span>
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent className="pb-4 text-left text-muted-foreground pl-14">
                                    Yep. Our support is fast and human. Reach us via in-app chat or email 24/7. Premium plans get priority responses and direct Slack access.
                                </AccordionContent>
                            </AccordionItem>

                            {/* 8 - Tutorials */}
                            <AccordionItem value="item-8" className="border-b-0 bg-primary-foreground px-4 mb-2 rounded-2xl">
                                <AccordionTrigger className="flex items-center justify-between py-4 text-lg font-medium hover:no-underline">
                                    <div className="flex items-center space-x-4">
                                        <div className="w-10 h-10 flex items-center justify-center rounded-lg border border-accent bg-primary-foreground">
                                            <BookOpen className="h-6 w-6 text-muted-foreground" />
                                        </div>
                                        <span>Do you provide onboarding or tutorials?</span>
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent className="pb-4 text-left text-muted-foreground pl-14">
                                    Yes. We’ve got short-form videos, example templates, and guides. You’ll be sending quality emails in under 10 minutes—zero fluff.
                                </AccordionContent>
                            </AccordionItem>
                        </Accordion>
                    </div>

                </div>
            </div>
            <CTA />
        </LandingLayout>
    );
}
