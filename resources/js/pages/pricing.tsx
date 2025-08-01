"use client"

import React from "react"

import { useState } from "react"
import { ArrowRight, Check, CheckCircle, CircleCheck, Dot, Info, Minus } from "lucide-react"
import { Button } from "@/components/ui/button"
import AppLayout from "@/layouts/app-layout"
import LandingLayout from "./landing/landing-layout"
import CTA from "./landing/cta"
import Pricing from "./landing/Pricing"
import { router, usePage } from "@inertiajs/react"
import { SharedData } from "@/types"
type SubscriptionButtonProps = {
    plan: string;
    children: React.ReactNode;
    onSubscribe: (plan: string) => void;
    variant?: 'default' | 'outline' | 'secondary';
    className?: string;
};

function SubscriptionButton({ plan, children, onSubscribe, variant = 'default', className = '' }: SubscriptionButtonProps) {
    return (
        <Button size={'lg'} className={`w-full bg-gradient-to-br from-primary to-orange-400 dark:bg-gradient-to-br dark:from-primary dark:to-orange-400 text-muted ${className}`} onClick={() => onSubscribe(plan)}>
            {children}
        </Button>
    );
}

export default function PricingPage() {
    const [isAnnual, setIsAnnual] = useState(true)
    const { auth, customer } = usePage<SharedData>().props;

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

    const features = [
        {
            category: "Core Features",
            items: [
                { name: "AI-Powered Email Generation", basic: true, business: true, enterprise: true },
                { name: "Personalization Engine", basic: true, business: true, enterprise: true },
                { name: "Daily Email Limit", basic: "50", business: "500", enterprise: "Unlimited" },
                { name: "Cold Email Templates", basic: true, business: true, enterprise: true },
                { name: "Deliverability Tools", basic: false, business: true, enterprise: true },
                { name: "A/B Testing", basic: false, business: true, enterprise: true },
            ],
        },
        {
            category: "Integrations & Outreach",
            items: [
                { name: "Gmail/Outlook Integration", basic: true, business: true, enterprise: true },
                { name: "Zapier Integration", basic: false, business: true, enterprise: true },
                { name: "Custom Webhooks", basic: false, business: true, enterprise: true },
                { name: "LinkedIn Sniper Mode", basic: false, business: false, enterprise: true },
                { name: "Team Inbox", basic: false, business: true, enterprise: true },
            ],
        },
        {
            category: "Reporting & Automation",
            items: [
                { name: "Open/Click Tracking", basic: true, business: true, enterprise: true },
                { name: "Reply Detection", basic: true, business: true, enterprise: true },
                { name: "Campaign Scheduler", basic: false, business: true, enterprise: true },
                { name: "Smart Warm-up", basic: false, business: true, enterprise: true },
                { name: "Analytics Dashboard", basic: false, business: true, enterprise: true },
            ],
        },
        {
            category: "Access & Support",
            items: [
                { name: "Email Support", basic: true, business: true, enterprise: true },
                { name: "Live Chat Support", basic: false, business: true, enterprise: true },
                { name: "Dedicated Account Manager", basic: false, business: false, enterprise: true },
                { name: "Team Collaboration", basic: false, business: true, enterprise: true },
            ],
        },
    ];


    const renderFeatureValue = (value: boolean | string) => {
        if (typeof value === "boolean") {
            return value ? <CircleCheck className="w-5 h-5 text-green-500 dark:text-green-600" /> : <Minus className="w-5 h-5 text-muted-foreground" />
        }
        return value
    }

    return (
        <LandingLayout>

            <div className="pt-40 container mx-auto w-full max-w-6xl px-4">
                {/* Pricing Header */}
                <div className="text-center  mb-12">
                    <h1 className="sm:text-7xl text-5xl text-primary font-bold mb-4">Simple, Predictable Pricing.</h1>
                    <div className="flex justify-center">
                        <p className="text-muted-foreground sm:max-w-xl max-w-sm  text-sm sm:text-lg text-center">
                            Whether you're a solo founder or scaling sales team, BlazeMail gives you everything to launch cold emails that convert.
                        </p>
                    </div>
                </div>

                {/* Annual/Monthly Toggle */}
                <div className="flex justify-center mb-12">
                    <div className="bg-accent rounded-2xl p-1 flex">
                        <button
                            onClick={() => setIsAnnual(true)}
                            className={`px-6 py-2 rounded-xl text-sm font-medium transition-colors ${isAnnual ? "bg-primary-foreground shadow text-primary" : "text-muted-foreground hover:text-primary"
                                }`}
                        >
                            Annual pricing
                        </button>
                        <button
                            onClick={() => setIsAnnual(false)}
                            className={`px-6 py-2 rounded-xl text-sm font-medium transition-colors ${!isAnnual ? "bg-primary-foreground shadow text-primary" : "text-muted-foreground hover:text-primary"
                                }`}
                        >
                            Monthly pricing
                        </button>
                    </div>
                </div>

                {/* Pricing Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
                    {/* Basic Plan Card */}
                    <div className="bg-gradient-to-br from-orange-100  via-primary-foreground to-primary-foreground dark:bg-gradient-to-br dark:from-orange-500/20 dark:via-primary-foreground dark:to-primary-foreground  rounded-3xl p-8  border border-accent flex flex-col items-center text-center">
                        <div className="flex items-center justify-center w-12 h-12 bg-accent rounded-xl mb-4">
                            <svg version="1.1" baseProfile="tiny" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 24 24" overflow="visible" xml:space="preserve" fill="#000000"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <g> <g transform="translate(3.000000, 4.000000)"> <path fill-rule="evenodd" fill="#fe810b" d="M3.8,2.8C0.9,2.8,0.6-1,3.8-1C6.1-1,7.1-0.3,9,0.5C11.1-0.3,11.9-1,14.2-1 c3.2,0,2.9,3.8,0,3.8H3.8z"></path> <path fill-rule="evenodd" fill="#d77433" d="M3.8,2.8h10.4C15,2.8,15.7,2.4,16,2L9,2.8L2,2C2.3,2.4,3,2.8,3.8,2.8z"></path> <path fill-rule="evenodd" fill="#e6b084" d="M17.2,8.8H9.8V17h6c0.8,0,1.5-0.7,1.5-1.5V8.8L17.2,8.8z"></path> <path fill-rule="evenodd" fill="#e6b084" d="M0.8,8.8h7.5V17h-6c-0.8,0-1.5-0.7-1.5-1.5V8.8L0.8,8.8z"></path> <path fill-rule="evenodd" fill="#e6b084" d="M8.2,8V2.8H0.8c-0.8,0-1.5,0.7-1.5,1.5V8H8.2z"></path> <path fill-rule="evenodd" fill="#e6b084" d="M18.8,8h-9V2.8h7.5c0.8,0,1.5,0.7,1.5,1.5V8L18.8,8z"></path> <rect x="0.8" y="8" fill-rule="evenodd" fill="#d77433" width="7.5" height="1.5"></rect> <rect x="9.8" y="8" fill-rule="evenodd" fill="#d77433" width="7.5" height="1.5"></rect> <rect x="10.5" y="2.8" fill-rule="evenodd" fill="#d77433" width="0.8" height="14.2"></rect> <rect x="7.5" y="2.8" fill-rule="evenodd" fill="#fe810b" width="3" height="14.2"></rect> </g> </g> </g></svg>
                        </div>
                        <h2 className="text-xl font-bold mb-2">Free plan</h2>
                        <p className="text-muted-foreground text-sm mb-4">Best for individuals and testers.</p>
                        <div className="flex items-baseline mb-6">
                            <span className="text-4xl font-bold">$0</span>
                        </div>
                        <SubscriptionButton plan="free" onSubscribe={handleSubscribe}>
                            Start free trial
                        </SubscriptionButton>
                    </div>

                    {/* Business Plan Card */}
                    <div className="bg-gradient-to-br from-primary-foreground via-orange-100 to-primary-from-primary-foreground dark:bg-gradient-to-br dark:from-primary-foreground dark:via-orange-500/20 dark:to-primary-from-primary-foreground rounded-3xl p-8 border border-accent flex flex-col items-center text-center">
                        <div className="flex items-center justify-center w-12 h-12 bg-accent rounded-xl mb-4">
                            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <path fill-rule="evenodd" clip-rule="evenodd" d="M3.46447 3.46447C2 4.92893 2 7.28595 2 12C2 16.714 2 19.0711 3.46447 20.5355C4.92893 22 7.28595 22 12 22C16.714 22 19.0711 22 20.5355 20.5355C22 19.0711 22 16.714 22 12C22 7.28595 22 4.92893 20.5355 3.46447C19.0711 2 16.714 2 12 2C7.28595 2 4.92893 2 3.46447 3.46447ZM13.75 10C13.75 10.4142 14.0858 10.75 14.5 10.75H15.1893L13.1768 12.7626C13.0791 12.8602 12.9209 12.8602 12.8232 12.7626L11.2374 11.1768C10.554 10.4934 9.44598 10.4934 8.76256 11.1768L6.46967 13.4697C6.17678 13.7626 6.17678 14.2374 6.46967 14.5303C6.76256 14.8232 7.23744 14.8232 7.53033 14.5303L9.82322 12.2374C9.92085 12.1398 10.0791 12.1398 10.1768 12.2374L11.7626 13.8232C12.446 14.5066 13.554 14.5066 14.2374 13.8232L16.25 11.8107V12.5C16.25 12.9142 16.5858 13.25 17 13.25C17.4142 13.25 17.75 12.9142 17.75 12.5V10C17.75 9.58579 17.4142 9.25 17 9.25H14.5C14.0858 9.25 13.75 9.58579 13.75 10Z" fill="#fe810b"></path> </g></svg>                        </div>
                        <h2 className="text-xl font-bold mb-2">Growth plan</h2>
                        <p className="text-muted-foreground text-sm mb-4">Best for growing teams.</p>
                        <div className="flex items-baseline mb-6">
                            <span className="text-4xl font-bold">${isAnnual ? "25" : "250"}</span>
                            <span className="text-primary ml-2">/ {isAnnual ? "month" : "year"}</span>
                        </div>
                        <SubscriptionButton plan="growth" onSubscribe={handleSubscribe}>
                            Get started
                        </SubscriptionButton>
                    </div>

                    {/* Enterprise Plan Card */}
                    <div className="bg-gradient-to-br from-primary-foreground via-primary-foreground to-orange-100 dark:bg-gradient-to-br dark:from-primary-foreground dark:via-primary-foreground dark:to-orange-500/20 rounded-3xl p-8 border border-accent flex flex-col items-center text-center">
                        <div className="flex items-center justify-center w-12 h-12 bg-accent rounded-xl mb-4">
                            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <path opacity="0.5" d="M2 12C2 7.28595 2 4.92893 3.46447 3.46447C4.92893 2 7.28595 2 12 2C16.714 2 19.0711 2 20.5355 3.46447C22 4.92893 22 7.28595 22 12C22 16.714 22 19.0711 20.5355 20.5355C19.0711 22 16.714 22 12 22C7.28595 22 4.92893 22 3.46447 20.5355C2 19.0711 2 16.714 2 12Z" fill="#fe810b"></path> <path fill-rule="evenodd" clip-rule="evenodd" d="M16.6562 2.75C16.242 2.75 15.9062 2.41421 15.9062 2C15.9062 1.58579 16.242 1.25 16.6562 1.25H22C22.4142 1.25 22.75 1.58579 22.75 2V7.34375C22.75 7.75796 22.4142 8.09375 22 8.09375C21.5858 8.09375 21.25 7.75796 21.25 7.34375V3.81066L13.8107 11.25H16C16.4142 11.25 16.75 11.5858 16.75 12C16.75 12.4142 16.4142 12.75 16 12.75H12C11.5858 12.75 11.25 12.4142 11.25 12V8C11.25 7.58579 11.5858 7.25 12 7.25C12.4142 7.25 12.75 7.58579 12.75 8V10.1893L20.1893 2.75H16.6562Z" fill="#fe810b"></path> </g></svg>
                        </div>
                        <h2 className="text-xl font-bold mb-2">Scale plan</h2>
                        <p className="text-muted-foreground text-sm mb-4">Best for Scaling teams.</p>
                        <div className="flex items-baseline mb-6">
                            <span className="text-4xl font-bold">${isAnnual ? "59" : "590"}</span>
                            <span className="text-primary ml-2">/ {isAnnual ? "month" : "year"}</span>
                        </div>
                        <SubscriptionButton plan="scale" onSubscribe={handleSubscribe}>
                            Get started
                        </SubscriptionButton>
                    </div>
                </div>

                {/* Feature Comparison Table */}
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="text-primary text-sm font-medium">
                                <th className="py-4 px-4 w-1/4"></th>
                                <th className="py-4 px-4 w-1/4">Free plan</th>
                                <th className="py-4 px-4 w-1/4">Growth plan</th>
                                <th className="py-4 px-4 w-1/4">Scale plan</th>
                            </tr>
                        </thead>
                        <tbody>
                            {features.map((section, sectionIndex) => (
                                <React.Fragment key={sectionIndex}>
                                    <tr className="border-t border-accent">
                                        <td colSpan={4} className="py-4 px-4 text-primary font-bold text-lg">
                                            {section.category}
                                        </td>
                                    </tr>
                                    {section.items.map((item, itemIndex) => (
                                        <tr key={itemIndex} className="border-t border-accent">
                                            <td className="py-3 px-4 text-primary text-sm flex items-center gap-2">
                                                {item.name}
                                            </td>
                                            <td className="py-3 px-4 text-primary text-sm ">{renderFeatureValue(item.basic)}</td>
                                            <td className="py-3 px-4 text-primary text-sm ">
                                                {renderFeatureValue(item.business)}
                                            </td>
                                            <td className="py-3 px-4 text-primary text-sm ">
                                                {renderFeatureValue(item.enterprise)}
                                            </td>
                                        </tr>
                                    ))}
                                </React.Fragment>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
            <CTA />
        </LandingLayout>
    )
} 