"use client"

import { useEffect, useState } from "react"
import { Head } from "@inertiajs/react"
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout"
import type { PageProps } from "@/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Lock, CheckCircle, AlertCircle } from "lucide-react"
import AppLayout from "@/layouts/app-layout"

interface CheckoutData {
    options: () => any // This will return the object needed for Paddle.Checkout.open
}

interface BillingPageProps extends PageProps {
    checkout?: CheckoutData
    plan?: string
    error?: string
    info?: string
    success?: string
    // No need for paddleClientToken or isSandbox here, as Paddle.Setup is global for V1
}

declare global {
    interface Window {
        Paddle: {
            Checkout: {
                open: (options: any) => void
            }
            // Paddle.Setup is assumed to be called globally by app.blade.php
        }
    }
}

export default function Billing({ auth, checkout, plan, error, info, success }: BillingPageProps) {
    const [isLoading, setIsLoading] = useState(false)
    const [paddleReady, setPaddleReady] = useState(false)
    const [checkoutError, setCheckoutError] = useState<string | null>(null)

    useEffect(() => {
        // Check if Paddle is already available (loaded by app.blade.php)
        if (window.Paddle) {
            setPaddleReady(true)
        } else {
            // Fallback if Paddle.js isn't globally loaded for some reason
            // In a typical Inertia setup with @paddleJS, this block might not be hit.
            const checkPaddleInterval = setInterval(() => {
                if (window.Paddle) {
                    setPaddleReady(true)
                    clearInterval(checkPaddleInterval)
                }
            }, 100) // Check every 100ms
            const timeout = setTimeout(() => {
                if (!window.Paddle) {
                    setCheckoutError("Paddle.js did not load. Please ensure it's correctly included in your main layout.")
                }
            }, 5000) // Timeout after 5 seconds
            return () => {
                clearInterval(checkPaddleInterval)
                clearTimeout(timeout)
            }
        }
    }, [])

    useEffect(() => {
        // Auto-open checkout if we have checkout data and Paddle is ready
        if (checkout && paddleReady && window.Paddle) {
            try {
                setIsLoading(true)
                const options = checkout.options()

                // Add success and error callbacks for Paddle Classic
                options.successCallback = () => {
                    setIsLoading(false)
                    // Laravel's returnTo will handle the redirect
                }

                options.closeCallback = () => {
                    setIsLoading(false)
                }

                window.Paddle.Checkout.open(options)
            } catch (err) {
                setIsLoading(false)
                setCheckoutError("Failed to initialize checkout. Please try again.")
                console.error("Paddle checkout error:", err)
            }
        }
    }, [checkout, paddleReady])

    const planNames: Record<string, string> = {
        scale_monthly: "Scale Monthly",
        scale_yearly: "Scale Yearly",
        pro_monthly: "Pro Monthly",
        pro_yearly: "Pro Yearly",
        starter_monthly: "Starter Monthly",
        starter_yearly: "Starter Yearly",
    }

    const getPlanDisplayName = (planKey?: string) => {
        return planKey ? planNames[planKey] || planKey : "Selected Plan"
    }

    return (
        <AppLayout
            user={auth.user}
            header={<h2 className="font-semibold text-xl text-gray-800 leading-tight">Complete Your Subscription</h2>}
        >
            <Head title="Complete Your Subscription" />

            <div className="py-12">
                <div className="max-w-4xl mx-auto sm:px-6 lg:px-8">
                    {/* Status Messages */}
                    {error && (
                        <Alert className="mb-6 border-red-200 bg-red-50">
                            <AlertCircle className="h-4 w-4 text-red-600" />
                            <AlertDescription className="text-red-800">{error}</AlertDescription>
                        </Alert>
                    )}

                    {info && (
                        <Alert className="mb-6 border-blue-200 bg-blue-50">
                            <AlertCircle className="h-4 w-4 text-blue-600" />
                            <AlertDescription className="text-blue-800">{info}</AlertDescription>
                        </Alert>
                    )}

                    {success && (
                        <Alert className="mb-6 border-green-200 bg-green-50">
                            <CheckCircle className="h-4 w-4 text-green-600" />
                            <AlertDescription className="text-green-800">{success}</AlertDescription>
                        </Alert>
                    )}

                    {checkoutError && (
                        <Alert className="mb-6 border-red-200 bg-red-50">
                            <AlertCircle className="h-4 w-4 text-red-600" />
                            <AlertDescription className="text-red-800">{checkoutError}</AlertDescription>
                        </Alert>
                    )}

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Plan Information */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <CheckCircle className="h-5 w-5 text-green-600" />
                                    Subscription Details
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <h3 className="font-medium text-gray-900">Selected Plan</h3>
                                    <p className="text-lg font-semibold text-blue-600">{getPlanDisplayName(plan)}</p>
                                </div>

                                <div className="border-t pt-4">
                                    <h4 className="font-medium text-gray-900 mb-2">What's included:</h4>
                                    <ul className="space-y-1 text-sm text-gray-600">
                                        <li>✓ Full access to all features</li>
                                        <li>✓ Priority customer support</li>
                                        <li>✓ Regular updates and improvements</li>
                                        <li>✓ Cancel anytime</li>
                                    </ul>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Checkout Section */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Secure Checkout</CardTitle>
                                <p className="text-sm text-gray-600">Powered by Paddle - Secure payment processing</p>
                            </CardHeader>
                            <CardContent>
                                {!paddleReady ? (
                                    <div className="flex items-center justify-center py-8">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                                        <span className="ml-2 text-gray-600">Loading payment system...</span>
                                    </div>
                                ) : checkout ? (
                                    <div className="space-y-4">
                                        {isLoading && (
                                            <div className="flex items-center justify-center py-4">
                                                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                                                <span className="ml-2 text-gray-600">Processing...</span>
                                            </div>
                                        )}

                                        <div id="paddle-checkout" className="min-h-[400px]">
                                            {/* Paddle checkout will be injected here */}
                                        </div>

                                        <div className="flex items-center justify-center space-x-1 text-xs text-gray-500 pt-4 border-t">
                                            <Lock className="w-3 h-3" />
                                            <span>Your payment information is secure and encrypted</span>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-center py-8">
                                        <p className="text-gray-600 mb-4">No checkout session found. Please try selecting a plan again.</p>
                                        <Button
                                            onClick={() => (window.location.href = "/pricing")}
                                            className="bg-blue-600 hover:bg-blue-700"
                                        >
                                            View Plans
                                        </Button>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Additional Information */}
                    <Card className="mt-8">
                        <CardContent className="pt-6">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
                                <div>
                                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                                        <Lock className="w-6 h-6 text-blue-600" />
                                    </div>
                                    <h3 className="font-medium text-gray-900">Secure Payment</h3>
                                    <p className="text-sm text-gray-600">256-bit SSL encryption</p>
                                </div>
                                <div>
                                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                                        <CheckCircle className="w-6 h-6 text-green-600" />
                                    </div>
                                    <h3 className="font-medium text-gray-900">Instant Access</h3>
                                    <p className="text-sm text-gray-600">Start using immediately</p>
                                </div>
                                <div>
                                    <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-2">
                                        <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192L5.636 18.364M12 2.25a9.75 9.75 0 110 19.5 9.75 9.75 0 010-19.5z"
                                            />
                                        </svg>
                                    </div>
                                    <h3 className="font-medium text-gray-900">24/7 Support</h3>
                                    <p className="text-sm text-gray-600">We're here to help</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AppLayout>
    )
}
