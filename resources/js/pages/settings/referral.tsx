"use client"

import { Head, Link, usePage } from "@inertiajs/react"
import { useState } from "react"
import { ArrowLeft, Copy, Mail, X, Linkedin, CheckCircle, RefreshCw, Lock, Gift, Sparkles, CopyCheck } from "lucide-react"
import AppLayout from "@/layouts/app-layout"
import SettingsLayout from "@/layouts/settings/layout"
import { SharedData } from "@/types"

interface ReferralData {
    referralCode: string
    referralLink: string
    stats: {
        totalReferrals: number
        payingReferrals: number
        totalCreditsEarned: number
    }
    milestones: Array<{
        id: number
        name: string
        status: "complete" | "in_progress" | "locked"
        reward: string
    }>
    howItWorks: string
    hasReferrals: boolean
}

interface ReferralsProps {
    referralData: ReferralData
    pageTitle: string
    pageDescription: string
}

export default function Referrals({ referralData, pageTitle, pageDescription }: ReferralsProps) {
    const { auth } = usePage<SharedData>().props;
    const [copied, setCopied] = useState(false)

    const copyToClipboard = async (text: string) => {
        try {
            await navigator.clipboard.writeText(text)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        } catch (err) {
            console.error("Failed to copy text: ", err)
        }
    }

    const getMilestoneIcon = (status: "complete" | "in_progress" | "locked") => {
        switch (status) {
            case "complete":
                return <CheckCircle className="h-5 w-5 text-green-500" />
            case "in_progress":
                return <RefreshCw className="h-5 w-5 text-primary" />
            case "locked":
                return <Lock className="h-5 w-5 text-muted-foreground" />
            default:
                return null
        }
    }

    const getMilestoneStatusClass = (status: "complete" | "in_progress" | "locked") => {
        switch (status) {
            case "complete":
                return "border-green-400 bg-green-50/50 dark:bg-green-900/20"
            case "in_progress":
                return "border-primary/50 bg-primary/5 dark:bg-primary/10"
            case "locked":
                return "border-border bg-muted/30"
            default:
                return ""
        }
    }

    const shareOnX = () => {
        const text = encodeURIComponent(
            `Earn free AI email credits with BlazeMail! Sign up using my referral link: ${referralData.referralLink}`,
        )
        window.open(`https://twitter.com/intent/tweet?text=${text}`, "_blank")
    }

    const shareOnLinkedIn = () => {
        const url = encodeURIComponent(referralData.referralLink)
        const title = encodeURIComponent("Earn AI Email Credits with BlazeMail!")
        const summary = encodeURIComponent(
            "BlazeMail is an amazing email marketing platform. Join using my link and get free credits!",
        )
        window.open(
            `https://www.linkedin.com/shareArticle?mini=true&url=${url}&title=${title}&summary=${summary}`,
            "_blank",
        )
    }

    const shareViaTelegram = () => {
        const url = encodeURIComponent(referralData.referralLink)
        window.open(`https://t.me/share/url?url=${url}&text=${text}`, "_blank")
    }

    return (
        <>
            <Head>
                <title>{pageTitle}</title>
                <meta name="description" content={pageDescription} />
                <meta property="og:title" content={pageTitle} />
                <meta property="og:description" content={pageDescription} />
                <meta name="twitter:title" content={pageTitle} />
                <meta name="twitter:description" content={pageDescription} />
            </Head>

            <AppLayout>
                <SettingsLayout>
                    <div className="mx-auto  space-y-10">
                        {/* Section 1: Your Referral Stats */}
                        <div className="rounded-xl     ">
                            <h2 className="mb-6 text-xl font-bold text-foreground">Your Referral Stats</h2>
                            <div className="mb-6">
                                <label htmlFor="referral-link" className="mb-2 block text-sm font-medium text-muted-foreground">
                                    Referral link:
                                </label>
                                <div className="flex flex-col gap-3 sm:flex-row">
                                    <div className="flex flex-1 rounded-lg border bg-muted">
                                        <input
                                            id="referral-link"
                                            type="text"
                                            value={referralData.referralLink}
                                            readOnly
                                            className="flex-1  px-4 py-3 text-sm text-primary focus:outline-none"
                                        />
                                        <button
                                            onClick={() => copyToClipboard(referralData.referralLink)}
                                            className="flex items-center space-x-2 rounded-r-lg bg-accent px-4 py-3 text-sm font-medium text-primary hover:bg-accent transition-colors"
                                        >
                                            {copied ? <CopyCheck className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                                            <span>{copied ? "Copied!" : "Copy"}</span>
                                        </button>
                                    </div>
                                    <div className="flex justify-center space-x-3 sm:justify-start">
                                        <button
                                            onClick={shareOnX}
                                            className="inline-flex h-12 w-12 items-center justify-center   rounded-full"
                                            aria-label="Share on X / Twitter"
                                        >
                                            <svg className=" w-6 text-primary " xmlns="http://www.w3.org/2000/svg" viewBox="0 0 14 14"><g fill="none"><g clip-path="url(#primeTwitter0)"><path fill="currentColor" d="M11.025.656h2.147L8.482 6.03L14 13.344H9.68L6.294 8.909l-3.87 4.435H.275l5.016-5.75L0 .657h4.43L7.486 4.71zm-.755 11.4h1.19L3.78 1.877H2.504z" /></g><defs><clipPath id="primeTwitter0"><path fill="#fff" d="M0 0h14v14H0z" /></clipPath></defs></g></svg>
                                        </button>
                                        <button
                                            onClick={shareOnLinkedIn}
                                            className="inline-flex h-12 w-12 items-center justify-center rounded-full transition-colors"
                                            aria-label="Share on LinkedIn"
                                        >
                                            <img src="https://api.iconify.design/logos/linkedin-icon.svg" className="w-6" />
                                        </button>
                                        <button
                                            onClick={shareViaTelegram}
                                            className="inline-flex h-12 w-12 items-center justify-center rounded-full  transition-colors"
                                            aria-label="Share via Email"
                                        >
                                            <img src="https://api.iconify.design/logos/telegram.svg" className="w-6" />
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="grid gap-4 sm:grid-cols-3">
                                <div className="p-4 text-center">
                                    <p className="text-sm text-secondary">Total referrals</p>
                                    <p className="text-xl font-bold text-primary">{referralData.stats.totalReferrals} users</p>
                                </div>
                                <div className="p-4 text-center">
                                    <p className="text-sm text-secondary">Paying referrals</p>
                                    <p className="text-xl font-bold text-primary">{referralData.stats.payingReferrals} user</p>
                                </div>
                                <div className="p-4 text-center">
                                    <p className="text-sm text-secondary">Total credits earned</p>
                                    <p className="text-xl font-bold text-primary">{referralData.stats.totalCreditsEarned} emails</p>
                                </div>
                            </div>
                        </div>

                        {/* Section 3: How It Works */}
                        <div className="rounded-xl ">
                            <h2 className="mb-6 text-xl font-bold text-foreground">How It Works</h2>
                            <p className="text-sm leading-relaxed text-secondary">{referralData.howItWorks}</p>
                        </div>
                    </div>

                        {/* Optional Alert */}
                        {!referralData.hasReferrals && (
                        <div className="pt-3 text-center justify-center items-center flex ">
                                <p className="text-lg border-4 w-3xl justify-center items-center border-accent rounded-2xl font-medium">
                                    You haven’t invited anyone yet. Share your link and start earning credits instantly!
                                </p>
                            </div>
                        )}
                </SettingsLayout>
            </AppLayout>
        </>
    )
}
