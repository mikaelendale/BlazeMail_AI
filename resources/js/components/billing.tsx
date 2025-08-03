"use client"

import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table"
import type { SharedData } from "@/types"
import { router, usePage } from "@inertiajs/react"
import { AlertTriangle, CreditCard, Download } from "lucide-react"
import { useState } from "react"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "./ui/accordion"

interface UsageStats {
    used: number
    limit: number
    remaining: number
    percentage: number
    plan: string
    can_add: boolean
    is_near_limit: boolean
    is_at_limit: boolean
}

interface SubscriptionState {
    valid: boolean
    active: boolean
    onTrial: boolean
    expiredTrial: boolean
    notOnTrial: boolean
    recurring: boolean
    pastDue: boolean
    paused: boolean
    notPaused: boolean
    onPausedGracePeriod: boolean
    notOnPausedGracePeriod: boolean
    canceled: boolean
    notCanceled: boolean
    onGracePeriod: boolean
    notOnGracePeriod: boolean
    subscribed: boolean
    subscribedToDefault: boolean
    onGenericTrial: boolean
    hasExpiredTrial: boolean
}

interface SubscriptionData {
    id: string
    type: string
    paddle_id: string
    status: string
    trial_ends_at?: string
    ends_at?: string
    paused_at?: string
    created_at: string
    updated_at: string
    states: Omit<SubscriptionState, "subscribed" | "subscribedToDefault" | "onGenericTrial" | "hasExpiredTrial">
}

interface Transaction {
    id: string
    paddle_id: string
    paddle_subscription_id?: string
    invoice_number: string
    status: string
    total: number
    tax: number
    currency: string
    billed_at?: string
    created_at: string
}

interface Receipt {
    id: string
    paddle_id: string
    amount: number
    currency: string
    status: string
    created_at: string
}

interface PageProps {
    subscription: {
        hasSubscription: boolean
        defaultSubscription?: SubscriptionData
        states: SubscriptionState
        subscriptions: SubscriptionData[]
        trialEndsAt?: string
    }
    billing: {
        transactions: Transaction[]
        receipts: Receipt[]
    }
    usage: UsageStats // Add the usage prop with the new type
}

export default function Billing({ usage }: { usage: UsageStats }) {
    // Accept usage as a prop
    const { customer, price, subscription, billing } = usePage<SharedData & PageProps>().props // Ensure usage is part of props from usePage

    const [modal, setModal] = useState<null | { plan: string; billing: string; name: string; price: string }>(null)
    const openModal = (plan: string, billing: string, name: string, price: string) => {
        setModal({ plan, billing, name, price })
    }
    const closeModal = () => setModal(null)
    const handleConfirm = () => {
        if (modal) {
            router.post("/subscription/swap", { plan: modal.plan, billing: modal.billing })
            closeModal()
        }
    }

    // Keep mock data for apiCalls if not provided by backend, as per instruction "dont fucking touch any thing"
    // The 'usage' prop now directly represents the contacts usage.
    const mockApiCalls = { current: 12500, limit: 50000 }

    const plans = [
        {
            id: "free",
            name: "Free",
            price: "$0",
            period: "month",
            description: "For individuals and shot term",
            popular: false,
        },
        {
            id: "growth-monthly",
            name: "Growth monthly",
            price: price.growth_monthly,
            period: "month",
            description: "Perfect for small teams getting started",
            popular: false,
        },
        {
            id: "growth-annual",
            name: "Growth annual",
            price: price.growth_annual,
            period: "year",
            description: "Perfect for small teams getting started",
            popular: false,
        },
        {
            id: "scale-monthly",
            name: "Scale monthly",
            price: price.scale_monthly,
            period: "month",
            description: "Best for growing businesses",
            popular: true,
        },
        {
            id: "scale-annual",
            name: "Scale annualy",
            price: price.scale_annual,
            period: "year",
            description: "Best for growing businesses",
            popular: false,
        },
    ]
    const handleCancelSubscription = () => {
        router.post(route("subscription.cancel"))
    }

    const formatCurrency = (amount: number, currency = "USD") => {
        return new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: currency,
        }).format(amount / 100)
    }
    const formatDate = (dateString?: string) => {
        if (!dateString) return "N/A"
        return new Date(dateString).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        })
    }
    return (
        <div className="container mx-auto max-w-6xl px-4 py-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold">Billing & Subscription</h1>
                <p className="mt-2 text-muted-foreground">Manage your subscription, billing, and usage</p>
            </div>
            {/* Current Plan & Usage */}
            {subscription.states.onGracePeriod && (
                <Card className="mb-6 border-yellow-400 bg-yellow-50 dark:border-yellow-600 dark:bg-yellow-950">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-yellow-700 dark:text-yellow-300">
                            <AlertTriangle className="h-5 w-5" />
                            You are on a grace period
                        </CardTitle>
                        <CardDescription className="dark:text-yellow-200">
                            Your subscription is currently in a grace period. Please update your payment method or renew your
                            subscription to avoid losing access to premium features. It will end at{" "}
                            <strong>{formatDate(subscription.defaultSubscription?.ends_at)}</strong>.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="flex gap-2">
                        <Button onClick={() => router.post("/subscription/stop-cancellation")}>Resume Subscription</Button>
                    </CardContent>
                </Card>
            )}
            <div className="mb-8 grid gap-6 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">Current Plan</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-2xl font-bold">{customer.plan}</p>
                                    <p className="text-sm text-muted-foreground">{customer.subscriptionAmount}</p>
                                </div>
                                {customer.plan !== "free" && (
                                    <Badge variant={subscription.status === "active" ? "default" : "secondary"}>
                                        {subscription.hasSubscription ? "Active" : "None"}
                                    </Badge>
                                )}
                            </div>
                            {customer.plan !== "free" && (
                                <>
                                    <Separator />
                                    <div className="flex justify-between space-y-1">
                                        {subscription.states.onPausedGracePeriod ? (
                                            <>
                                                <Badge variant={"destructive"} className="text-sm">
                                                    Paused
                                                </Badge>
                                                <Button
                                                    onClick={() => router.post(route("subscription.resume"))}
                                                    variant={"neutral"}
                                                    size={"sm"}
                                                    className="text-sm"
                                                >
                                                    Resume
                                                </Button>
                                            </>
                                        ) : (
                                            <>
                                                <Badge variant={"outline"} className="text-sm">
                                                    Active
                                                </Badge>
                                                <Button
                                                    onClick={() => router.post(route("subscription.pause"))}
                                                    variant={"neutral"}
                                                    size={"sm"}
                                                    className="text-sm"
                                                >
                                                    Pause
                                                </Button>
                                            </>
                                        )}
                                    </div>
                                </>
                            )}
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">Usage Summary</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div>
                                <div className="mb-1 flex justify-between text-sm">
                                    <span>Contacts</span> {/* Changed from Storage to Contacts */}
                                    <span>
                                        {usage.used}/{usage.limit}
                                    </span>
                                </div>
                                <Progress value={usage.percentage} className="h-2" /> {/* Use usage.percentage */}
                            </div>
                            <div>
                                <div className="mb-1 flex justify-end text-sm">
                                    <Button
                                        variant="outline"
                                        onClick={() => router.get("/credits")}
                                    >
                                    Check Credits
                                </Button>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
            {/* Pricing Plans */}
            <Card className="mb-8">
                <CardHeader>
                    <CardTitle>Choose Your Plan</CardTitle>
                    <CardDescription>
                        Upgrade or downgrade your plan at any time. Changes take effect immediately.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-6 md:grid-cols-3">
                        {plans.map((plan) => (
                            <div
                                key={plan.id}
                                className={`relative rounded-lg border p-6 ${plan.popular ? "border-primary shadow-md" : "border-border"
                                    } ${customer.plan === plan.id ? "ring-2 ring-secondary" : ""}`}
                            >
                                {customer.plan === plan.id && (
                                    <Badge className="absolute -top-2 left-1/2 bg-primary -translate-x-1/2">Current Plan</Badge>
                                )}
                                {plan.popular && <Badge className="absolute -top-2 left-1/2 -translate-x-1/2">Most Popular</Badge>}
                                <div className="mb-4 text-center">
                                    <h3 className="text-xl font-semibold">{plan.name}</h3>
                                    <div className="mt-2">
                                        <span className="text-3xl font-bold">{plan.price}</span>
                                        <span className="text-muted-foreground">/{plan.period}</span>
                                    </div>
                                    <p className="mt-2 text-sm text-muted-foreground">{plan.description}</p>
                                    {customer.plan === "free" && (
                                        <div className="mt-4">
                                            {plan.id === "free" ? (
                                                <Button variant="outline" disabled>
                                                    Current Plan
                                                </Button>
                                            ) : (
                                                <Button variant="outline" onClick={() => router.get("/subscribe", { plan: plan.id })}>
                                                    Switch to {plan.name}
                                                </Button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
            {/* Switch Plan Advanced Options */}
            {customer.plan !== "free" && (
                <Card className="mb-8 ">
                    <CardHeader>
                        <CardTitle>Switch Plan (Advanced)</CardTitle>
                        <CardDescription>Choose how you want your plan change to be billed.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                            {plans
                                .filter((plan) => plan.id !== "free")
                                .map((plan) => (
                                    <div key={plan.id} className=" border-dashed rounded-lg border-b-2 p-3">
                                        <h5 className="font-medium">{plan.name} Plan</h5>
                                        <p className="text-sm text-gray-600">
                                            {plan.price}/{plan.period}
                                        </p>
                                        <div className="sm:flex sm:justify-between mt-2 space-y-2 sm:space-x-2">
                                            <Button
                                                className="w-full bg-transparent"
                                                variant="outline"
                                                onClick={() => openModal(plan.id, "next_cycle", plan.name, plan.price)}
                                                disabled={customer.plan === plan.id}
                                            >
                                                Switch (Next Cycle)
                                            </Button>
                                            <Button
                                                className="w-full"
                                                variant="default"
                                                onClick={() => openModal(plan.id, "immediate", plan.name, plan.price)}
                                                disabled={customer.plan === plan.id}
                                            >
                                                Switch Now (Immediate Charge)
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                        </div>
                        {/* Advanced Billing Options */}
                        <div className="mt-3">
                            <Accordion type="single" collapsible>
                                <AccordionItem value="advanced-billing">
                                    <AccordionTrigger className="text-sm text-gray-600 hover:text-gray-900">
                                        Advanced Billing Options
                                    </AccordionTrigger>
                                    <AccordionContent>
                                        <div className="mt-2 flex flex-wrap gap-2 text-xs">
                                            {plans
                                                .filter((plan) => plan.id !== "free")
                                                .map((plan) => (
                                                    <Button
                                                        key={plan.id}
                                                        variant={"outline"}
                                                        onClick={() => openModal(plan.id, "no_prorate", plan.name, plan.price)}
                                                        disabled={customer.plan === plan.id}
                                                    >
                                                        {plan.name} (Next Cycle)
                                                    </Button>
                                                ))}
                                        </div>
                                    </AccordionContent>
                                </AccordionItem>
                            </Accordion>
                        </div>
                    </CardContent>
                </Card>
            )}
            {/* Modal for confirmation */}
            <Dialog open={!!modal} onOpenChange={closeModal}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Confirm Plan Change</DialogTitle>
                    </DialogHeader>
                    <div>
                        Are you sure you want to switch to the <b>{modal?.name}</b> plan ({modal?.price}/month)?
                        {modal?.billing === "immediate" && (
                            <div className="mt-2 text-sm text-yellow-600">
                                You will be charged immediately with proration (Switch).
                            </div>
                        )}
                        {modal?.billing === "no_prorate" && (
                            <div className="mt-2 text-sm text-yellow-600">This will switch your plan in the next cycle.</div>
                        )}
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={closeModal}>
                            Cancel
                        </Button>
                        <Button onClick={handleConfirm}>Confirm</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            {/* Payment Method */}
            {customer.plan !== "free" && (
                <Card className="mb-8">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <CreditCard className="h-5 w-5" />
                            Payment Method
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="flex h-8 w-12 items-center justify-center rounded bg-gradient-to-r from-blue-600 to-purple-600">
                                    <CreditCard className="h-4 w-4 text-white" />
                                </div>
                                <div>
                                    <p className="font-medium">Change Payment info</p>
                                </div>
                            </div>
                            <a href="/subscription/payment-method">
                                <Button variant="outline">Update</Button>
                            </a>
                        </div>
                    </CardContent>
                </Card>
            )}
            {/* Billing History */}
            <Card className="mb-8">
                <CardHeader>
                    <CardTitle>Billing History</CardTitle>
                    <CardDescription>Latest {billing.transactions.length} invoices</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableBody>
                            {billing.transactions.length > 0 ? (
                                billing.transactions.map((transaction) => (
                                    <TableRow key={transaction.id}>
                                        <TableCell>{transaction.invoice_number}</TableCell>
                                        <TableCell>
                                            <Badge variant={transaction.status === "Paid" ? "default" : "secondary"}>
                                                {transaction.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>{formatCurrency(transaction.total, transaction.currency)}</TableCell>
                                        <TableCell>{formatCurrency(transaction.tax, transaction.currency)}</TableCell>
                                        <TableCell>{formatDate(transaction.billed_at)}</TableCell>
                                        <TableCell>
                                            <span className="font-mono text-xs">{transaction.paddle_id}</span>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <a href={`/download-invoice?transaction_id=${transaction.id}`}>
                                                <Button size="icon" variant="ghost" title="Download Invoice">
                                                    <Download className="h-4 w-4" />
                                                </Button>
                                            </a>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={7} className="py-8 text-center">
                                        <CreditCard className="mx-auto mb-4 h-12 w-12 text-gray-400" />
                                        <p className="text-gray-600">No transactions found</p>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
            {/* Cancel Subscription */}
            {customer.plan !== "free" && !subscription.states.onGracePeriod && (
                <Card className="border-destructive/20">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-destructive">
                            <AlertTriangle className="h-5 w-5" />
                            Danger Zone
                        </CardTitle>
                        <CardDescription>
                            Once you cancel your subscription, you'll lose access to all premium features.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="destructive">Cancel Subscription</Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Are you sure you want to cancel?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        This action cannot be undone. You'll lose access to all premium features at the end of your current
                                        billing period ({subscription.nextBilling}). Your data will be preserved for 30 days in case you
                                        want to reactivate.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Keep Subscription</AlertDialogCancel>
                                    <AlertDialogAction
                                        onClick={handleCancelSubscription}
                                        className="bg-destructive hover:bg-destructive/90"
                                    >
                                        Yes, Cancel Subscription
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
