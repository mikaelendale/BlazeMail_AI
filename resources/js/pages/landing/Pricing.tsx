"use client"

import { useState, useRef, useEffect } from "react"
import { CircleCheck, ChevronDown, Square, ExternalLink, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import LandingLayout from "./landing-layout"
import { Separator } from "@/components/ui/separator"
import { Link, router, usePage } from "@inertiajs/react"
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
        <Button size={'lg'} className="w-full bg-gradient-to-br from-primary to-orange-400 dark:bg-gradient-to-br dark:from-primary dark:to-orange-400 rounded-lg px-6 py-3 mb-8" onClick={() => onSubscribe(plan)}>
            {children}
        </Button>
    );
}
export default function Pricing() {
    const { auth, customer } = usePage<SharedData>().props;
    const [isMonthly, setIsMonthly] = useState(true)
    const monthlyButtonRef = useRef<HTMLButtonElement>(null)
    const annualButtonRef = useRef<HTMLButtonElement>(null)
    const [sliderStyle, setSliderStyle] = useState<{ width: string; left: string }>({ width: "0px", left: "0px" })

    const handleSubscribe = (planName: string) => {
        // Convert plan name to match controller format
        if (auth?.user && customer.plan !== 'free') {
            router.get('/dashboard');
        } else {
            const planKey = planName.toLowerCase();
            const billingPeriod = isMonthly ? 'monthly' : 'annual';
            const fullPlanName = `${planKey}-${billingPeriod}`;
            router.get('/subscribe', { plan: fullPlanName });
        }
    };

    useEffect(() => {
        if (isMonthly && monthlyButtonRef.current) {
            setSliderStyle({
                width: `${monthlyButtonRef.current.offsetWidth}px`,
                left: `${monthlyButtonRef.current.offsetLeft}px`,
            })
        } else if (!isMonthly && annualButtonRef.current) {
            setSliderStyle({
                width: `${annualButtonRef.current.offsetWidth}px`,
                left: `${annualButtonRef.current.offsetLeft}px`,
            })
        }
    }, [isMonthly]) // Recalculate when isMonthly changes

    const features = {
        free: [
            "Essential event management tools",
            "Basic analytics & reporting",
            "Up to 3 events per month",
            "Community Support",
        ],
        seedling: [
            "Unlimited events",
            "AI-powered insights ",
            "Advanced budget tracking",
            "Priority support",
            "Team collaboration tools",
        ],
        enterprise: [
            "Custom integrations",
            "Dedicated account manager",
            "Advanced security & compliance",
            "API access for automation",
            "VIP onboarding & training",
        ],
    }

    return (
        <div className="max-w-6xl overflow-hidden container mx-auto w-full  px-4">

            <main className="">
                {/* Pricing Header */}
                <div className="text-center mb-12">
                    <h1 className="text-5xl font-bold text-primary mb-4">Flexible pricing plans for every need</h1>
                    <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                        Find the perfect plan—whether you're starting out or scaling up with advanced tools and premium support.
                    </p>
                </div>

                {/* Billing Toggle */}
                <div className="flex justify-center mb-16">
                    <div className="bg-accent border border-primary/10 rounded-full p-1 flex items-center relative">
                        <div
                            className="absolute top-1 bottom-1 bg-primary-foreground rounded-full shadow transition-all duration-300 ease-in-out"
                            style={sliderStyle}
                        />
                        <button
                            ref={monthlyButtonRef}
                            onClick={() => setIsMonthly(true)}
                            className={`relative z-10 px-6 py-2 rounded-full text-sm font-medium transition-colors flex items-center gap-2 ${isMonthly ? "text-primary" : "text-muted-foreground"
                                }`}
                        >
                            monthly
                        </button>
                        <button
                            ref={annualButtonRef}
                            onClick={() => setIsMonthly(false)}
                            className={`relative z-10 px-5 py-2 rounded-full text-sm font-medium transition-colors ${!isMonthly ? "text-primary" : "text-muted-foreground"
                                }`}
                        >
                            annually <span className="border border-primary/10 rounded-2xl px-2 py-1 ">20% off</span>
                        </button>
                    </div>
                </div>

                {/* Pricing Cards */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-24">
                    {/* Free Plan Card */}
                    <div className="bg-gradient-to-br from-orange-100  via-primary-foreground to-primary-foreground dark:bg-gradient-to-br dark:from-orange-500/20 dark:via-primary-foreground dark:to-primary-foreground  rounded-3xl p-8 border border-accent flex flex-col">
                        <div className="flex items-center justify-between mb-6">
                            <div className="w-12 h-12 bg-accent rounded-xl flex items-center justify-center">
                                {/* <Square className="w-6 h-6 text-orange-500 fill-orange-500" /> */}
                                <svg version="1.1" baseProfile="tiny" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 24 24" overflow="visible" xml:space="preserve" fill="#000000"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <g> <g transform="translate(3.000000, 4.000000)"> <path fill-rule="evenodd" fill="#fe810b" d="M3.8,2.8C0.9,2.8,0.6-1,3.8-1C6.1-1,7.1-0.3,9,0.5C11.1-0.3,11.9-1,14.2-1 c3.2,0,2.9,3.8,0,3.8H3.8z"></path> <path fill-rule="evenodd" fill="#d77433" d="M3.8,2.8h10.4C15,2.8,15.7,2.4,16,2L9,2.8L2,2C2.3,2.4,3,2.8,3.8,2.8z"></path> <path fill-rule="evenodd" fill="#e6b084" d="M17.2,8.8H9.8V17h6c0.8,0,1.5-0.7,1.5-1.5V8.8L17.2,8.8z"></path> <path fill-rule="evenodd" fill="#e6b084" d="M0.8,8.8h7.5V17h-6c-0.8,0-1.5-0.7-1.5-1.5V8.8L0.8,8.8z"></path> <path fill-rule="evenodd" fill="#e6b084" d="M8.2,8V2.8H0.8c-0.8,0-1.5,0.7-1.5,1.5V8H8.2z"></path> <path fill-rule="evenodd" fill="#e6b084" d="M18.8,8h-9V2.8h7.5c0.8,0,1.5,0.7,1.5,1.5V8L18.8,8z"></path> <rect x="0.8" y="8" fill-rule="evenodd" fill="#d77433" width="7.5" height="1.5"></rect> <rect x="9.8" y="8" fill-rule="evenodd" fill="#d77433" width="7.5" height="1.5"></rect> <rect x="10.5" y="2.8" fill-rule="evenodd" fill="#d77433" width="0.8" height="14.2"></rect> <rect x="7.5" y="2.8" fill-rule="evenodd" fill="#fe810b" width="3" height="14.2"></rect> </g> </g> </g></svg>
                            </div>
                        </div>
                        <h2 className="text-2xl font-bold text-primary mb-2">Free</h2>
                        <p className="text-muted-foreground text-sm mb-6">Start with the basics and experience LostBag at no cost.</p>
                        <div className="flex items-baseline mb-4">
                            <span className="text-5xl font-bold text-primary">$0</span>
                        </div>
                        <p className="text-muted-foreground text-xs mb-8">Pause and cancel anytime.</p>
                        <SubscriptionButton plan="free" onSubscribe={handleSubscribe}>
                            Select Plan
                        </SubscriptionButton>
                        <Separator decorative className="w-full" />
                        {/* Features List */}
                        <div className="flex-grow mt-6">
                            <h3 className="font-semibold text-primary mb-4">Free plan includes;</h3>
                            <ul className="space-y-3">
                                {features.free.map((feature, index) => (
                                    <li key={index} className="flex items-center gap-3">
                                        <CircleCheck className="w-5 h-5 text-primary" />
                                        <span className="text-muted-foreground text-sm">{feature}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>

                    {/* Growth Plan Card */}
                    <div className="relative w-full max-w-sm">
                        {/* Most Popular Badge - positioned absolutely above the card */}
                        {/* <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10">
                            <span className="font-semibold text-primary bg-accent px-3 py-1 rounded-lg text-mg shadow-sm">
                                Most Popular
                            </span>
                        </div> */}

                        {/* Main Card Content with Gradient Background */}
                        <div className="bg-gradient-to-br from-primary-foreground via-orange-100 to-primary-foreground dark:from-primary-foreground dark:via-orange-500/20 dark:to-primary-foreground rounded-3xl p-8 border border-accent flex flex-col h-full pt-12">
                            <div className="flex items-center justify-between mb-6">
                                <div className="w-12 h-12 bg-accent rounded-xl flex items-center justify-center">
                                    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <path fill-rule="evenodd" clip-rule="evenodd" d="M3.46447 3.46447C2 4.92893 2 7.28595 2 12C2 16.714 2 19.0711 3.46447 20.5355C4.92893 22 7.28595 22 12 22C16.714 22 19.0711 22 20.5355 20.5355C22 19.0711 22 16.714 22 12C22 7.28595 22 4.92893 20.5355 3.46447C19.0711 2 16.714 2 12 2C7.28595 2 4.92893 2 3.46447 3.46447ZM13.75 10C13.75 10.4142 14.0858 10.75 14.5 10.75H15.1893L13.1768 12.7626C13.0791 12.8602 12.9209 12.8602 12.8232 12.7626L11.2374 11.1768C10.554 10.4934 9.44598 10.4934 8.76256 11.1768L6.46967 13.4697C6.17678 13.7626 6.17678 14.2374 6.46967 14.5303C6.76256 14.8232 7.23744 14.8232 7.53033 14.5303L9.82322 12.2374C9.92085 12.1398 10.0791 12.1398 10.1768 12.2374L11.7626 13.8232C12.446 14.5066 13.554 14.5066 14.2374 13.8232L16.25 11.8107V12.5C16.25 12.9142 16.5858 13.25 17 13.25C17.4142 13.25 17.75 12.9142 17.75 12.5V10C17.75 9.58579 17.4142 9.25 17 9.25H14.5C14.0858 9.25 13.75 9.58579 13.75 10Z" fill="#fe810b"></path> </g></svg>
                                </div>
                            </div>
                            <h2 className="text-2xl font-bold text-primary mb-2">Growth</h2>
                            <p className="text-muted-foreground text-sm mb-6">
                                Unlock advanced tools and premium support.
                            </p>
                            <div className="flex items-baseline mb-4">
                                <span className="text-5xl font-bold text-primary">${isMonthly ? "25" : "250"}</span>
                                <span className="text-muted-foreground ml-2">/{isMonthly ? "month" : "year"}</span>
                            </div>
                            <p className="text-muted-foreground text-xs mb-8">Pause and cancel anytime.</p>
                            <SubscriptionButton plan="growth" onSubscribe={handleSubscribe}>
                                Select Plan
                            </SubscriptionButton>
                            <Separator decorative className="w-full" />
                            {/* Features List */}
                            <div className="flex-grow mt-6">
                                <h3 className="font-semibold text-primary mb-4">Growth plan includes;</h3>
                                <ul className="space-y-3">
                                    {features.seedling.map((feature, index) => (
                                        <li key={index} className="flex items-center gap-3">
                                            <CircleCheck className="w-5 h-5 text-primary" />
                                            <span className="text-muted-foreground text-sm">{feature}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </div>
                    {/* Enterprise Plan Card */}
                    <div className="bg-gradient-to-br from-primary-foreground via-primary-foreground to-orange-100 dark:bg-gradient-to-br dark:from-primary-foreground dark:via-primary-foreground dark:to-orange-500/20 rounded-3xl p-8 border border-accent flex flex-col">
                        <div className="flex items-center justify-between mb-6">
                            <div className="w-12 h-12 bg-accent rounded-xl flex items-center justify-center">
                                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <path opacity="0.5" d="M2 12C2 7.28595 2 4.92893 3.46447 3.46447C4.92893 2 7.28595 2 12 2C16.714 2 19.0711 2 20.5355 3.46447C22 4.92893 22 7.28595 22 12C22 16.714 22 19.0711 20.5355 20.5355C19.0711 22 16.714 22 12 22C7.28595 22 4.92893 22 3.46447 20.5355C2 19.0711 2 16.714 2 12Z" fill="#fe810b"></path> <path fill-rule="evenodd" clip-rule="evenodd" d="M16.6562 2.75C16.242 2.75 15.9062 2.41421 15.9062 2C15.9062 1.58579 16.242 1.25 16.6562 1.25H22C22.4142 1.25 22.75 1.58579 22.75 2V7.34375C22.75 7.75796 22.4142 8.09375 22 8.09375C21.5858 8.09375 21.25 7.75796 21.25 7.34375V3.81066L13.8107 11.25H16C16.4142 11.25 16.75 11.5858 16.75 12C16.75 12.4142 16.4142 12.75 16 12.75H12C11.5858 12.75 11.25 12.4142 11.25 12V8C11.25 7.58579 11.5858 7.25 12 7.25C12.4142 7.25 12.75 7.58579 12.75 8V10.1893L20.1893 2.75H16.6562Z" fill="#fe810b"></path> </g></svg>
                            </div>
                            <div className="text-muted-foreground">
                                <Link href="/pricing" target="_blank">
                                    <ExternalLink className="w-6 h-6 text-orange-500/30 " />
                                </Link>
                            </div>
                        </div>
                        <h2 className="text-2xl font-bold text-primary mb-2">Scale</h2>
                        <p className="text-muted-foreground text-sm mb-6">
                            For teams that need custom solutions and dedicated support.
                        </p>
                        <div className="flex items-baseline mb-4">
                            <span className="text-5xl font-bold text-primary">${isMonthly ? "59" : '590'}</span>
                            <span className="text-muted-foreground ml-2">/{isMonthly ? "month" : "year"}</span>
                        </div>
                        <p className="text-muted-foreground text-xs mb-8">Pause and cancel anytime.</p>
                        <SubscriptionButton plan="scale" onSubscribe={handleSubscribe}>
                            Select Plan
                        </SubscriptionButton>
                        <Separator decorative className="w-full" />
                        {/* Features List */}
                        <div className="flex-grow mt-6">
                            <h3 className="font-semibold text-primary mb-4">Scale plan includes;</h3>
                            <ul className="space-y-3">
                                {features.enterprise.map((feature, index) => (
                                    <li key={index} className="flex items-center gap-3">
                                        <CircleCheck className="w-5 h-5 text-primary" />
                                        <span className="text-muted-foreground text-sm">{feature}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    )
}
