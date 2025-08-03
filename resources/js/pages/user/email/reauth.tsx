"use client"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import AppLayout from "@/layouts/app-layout"
import SettingsLayout from "@/layouts/settings/layout"
import { router } from "@inertiajs/react"
import {
    AlertTriangle,
    CheckCircle,
    Clock,
    RefreshCw,
    Shield,
    Trash2,
    Zap,
    ArrowLeft,
    ExternalLink,
} from "lucide-react"
import { useState } from "react"

interface ReauthAccount {
    id: number
    email: string
    provider: string
    status: string
    is_connected: boolean
    last_error: string | null
    last_health_check: string | null
    token_expires_at: string | null
    consecutive_errors: number
    created_at: string
    needs_reauth: {
        reason: string
        message: string
        severity: "low" | "medium" | "high"
        action: string
    }
    health_score: number
    can_reauth: boolean
}

interface Props {
    accounts: ReauthAccount[]
    stats: {
        total_accounts: number
        needs_reauth: number
        token_expired: number
        connection_failed: number
        error?: string
    }
    breadcrumbs: Array<{ title: string; href: string }>
}

export default function ReauthPage({ accounts, stats, breadcrumbs }: Props) {
    const [loadingAccounts, setLoadingAccounts] = useState<Set<number>>(new Set())
    const [testingAccounts, setTestingAccounts] = useState<Set<number>>(new Set())

    // Handle reauth start
    const handleStartReauth = (accountId: number) => {
        setLoadingAccounts((prev) => new Set(prev).add(accountId))

        router.post(
            `/email-accounts/${accountId}/reauth`,
            {
                return_url: window.location.href,
            },
            {
                onFinish: () => {
                    setLoadingAccounts((prev) => {
                        const newSet = new Set(prev)
                        newSet.delete(accountId)
                        return newSet
                    })
                },
            },
        )
    }

    // Handle connection test
    const handleTestConnection = async (accountId: number) => {
        setTestingAccounts((prev) => new Set(prev).add(accountId))

        try {
            const response = await fetch(`/email-accounts/${accountId}/test-connection`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-CSRF-TOKEN": document.querySelector('meta[name="csrf-token"]')?.getAttribute("content") || "",
                },
            })

            const result = await response.json()

            if (result.success) {
                // Refresh the page to show updated status
                router.reload({ only: ["accounts"] })
            } else {
                console.error("Connection test failed:", result.error)
            }
        } catch (error) {
            console.error("Connection test error:", error)
        } finally {
            setTestingAccounts((prev) => {
                const newSet = new Set(prev)
                newSet.delete(accountId)
                return newSet
            })
        }
    }

    // Handle account removal
    const handleRemoveAccount = (accountId: number) => {
        if (confirm("Are you sure you want to remove this account? This action cannot be undone.")) {
            router.delete(`/email-accounts/${accountId}`, {
                preserveScroll: true,
            })
        }
    }

    // Get severity color
    const getSeverityColor = (severity: string) => {
        switch (severity) {
            case "high":
                return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
            case "medium":
                return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
            case "low":
                return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
            default:
                return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400"
        }
    }

    // Get provider icon
    const getProviderIcon = (provider: string) => {
        switch (provider) {
            case "gmail":
                return <img src="https://api.iconify.design/logos/google-icon.svg" className="h-5 w-5" alt="Gmail" />
            case "outlook":
                return <img src="https://api.iconify.design/logos/microsoft-icon.svg" className="h-5 w-5" alt="Outlook" />
            default:
                return <Shield className="h-5 w-5" />
        }
    }

    if (stats.error) {
        return (
            <AppLayout>
                <SettingsLayout>
                    <div className="space-y-6">
                        <Alert>
                            <AlertTriangle className="h-4 w-4" />
                            <AlertDescription>{stats.error}</AlertDescription>
                        </Alert>
                    </div>
                </SettingsLayout>
            </AppLayout>
        )
    }

    return (
        <AppLayout>
            <SettingsLayout>
                <div className="space-y-6">
                    {/* Header */}
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="space-y-1">
                            <div className="flex items-center gap-3">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => router.get("/settings/email-accounts")}
                                    className="p-0 h-auto"
                                >
                                    <ArrowLeft className="h-4 w-4 mr-2" />
                                    Back to Accounts
                                </Button>
                            </div>
                            <h1 className="text-2xl font-bold">Account Re-authentication</h1>
                            <p className="text-muted-foreground">Reconnect accounts that need re-authorization</p>
                        </div>
                    </div>

                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        <Card>
                            <CardContent className="p-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-blue-100 rounded-lg dark:bg-blue-900/30">
                                        <Shield className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                    </div>
                                    <div>
                                        <p className="text-2xl font-bold">{stats.total_accounts}</p>
                                        <p className="text-sm text-muted-foreground">Total Accounts</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="p-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-red-100 rounded-lg dark:bg-red-900/30">
                                        <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
                                    </div>
                                    <div>
                                        <p className="text-2xl font-bold">{stats.needs_reauth}</p>
                                        <p className="text-sm text-muted-foreground">Need Reauth</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="p-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-yellow-100 rounded-lg dark:bg-yellow-900/30">
                                        <Clock className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                                    </div>
                                    <div>
                                        <p className="text-2xl font-bold">{stats.token_expired}</p>
                                        <p className="text-sm text-muted-foreground">Token Expired</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="p-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-orange-100 rounded-lg dark:bg-orange-900/30">
                                        <Zap className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                                    </div>
                                    <div>
                                        <p className="text-2xl font-bold">{stats.connection_failed}</p>
                                        <p className="text-sm text-muted-foreground">Connection Issues</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Accounts List */}
                    {accounts.length === 0 ? (
                        <Card>
                            <CardContent className="p-8 text-center">
                                <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                                <h3 className="text-lg font-medium mb-2">All accounts are healthy!</h3>
                                <p className="text-muted-foreground mb-4">No accounts currently need re-authentication.</p>
                                <Button variant="outline" onClick={() => router.get("/settings/email-accounts")}>
                                    Back to Email Accounts
                                </Button>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="space-y-4">
                            {accounts.map((account) => (
                                <Card key={account.id} className="border-l-4 border-l-red-500">
                                    <CardContent className="p-6">
                                        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                                            {/* Account Info */}
                                            <div className="flex items-start gap-4">
                                                {getProviderIcon(account.provider)}
                                                <div className="min-w-0 flex-1">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <h3 className="font-medium truncate">{account.email}</h3>
                                                        <Badge className={getSeverityColor(account.needs_reauth.severity)}>
                                                            {account.needs_reauth.severity.toUpperCase()}
                                                        </Badge>
                                                    </div>
                                                    <p className="text-sm text-muted-foreground mb-2">{account.needs_reauth.message}</p>
                                                    <p className="text-sm font-medium text-foreground">{account.needs_reauth.action}</p>

                                                    {/* Health Score */}
                                                    <div className="mt-3">
                                                        <div className="flex items-center justify-between text-sm mb-1">
                                                            <span>Health Score</span>
                                                            <span className="font-medium">{account.health_score}%</span>
                                                        </div>
                                                        <Progress value={account.health_score} className="h-2" />
                                                    </div>

                                                    {/* Error Details */}
                                                    {account.last_error && (
                                                        <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                                                            <p className="text-sm text-red-800 dark:text-red-200">
                                                                <strong>Last Error:</strong> {account.last_error}
                                                            </p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Actions */}
                                            <div className="flex flex-col gap-2 sm:flex-row lg:flex-col xl:flex-row">
                                                {account.can_reauth && (
                                                    <Button
                                                        onClick={() => handleStartReauth(account.id)}
                                                        disabled={loadingAccounts.has(account.id)}
                                                        className="w-full sm:w-auto"
                                                    >
                                                        {loadingAccounts.has(account.id) ? (
                                                            <>
                                                                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                                                                Connecting...
                                                            </>
                                                        ) : (
                                                            <>
                                                                <ExternalLink className="mr-2 h-4 w-4" />
                                                                Reconnect
                                                            </>
                                                        )}
                                                    </Button>
                                                )}

                                                <Button
                                                    variant="outline"
                                                    onClick={() => handleTestConnection(account.id)}
                                                    disabled={testingAccounts.has(account.id)}
                                                    className="w-full sm:w-auto"
                                                >
                                                    {testingAccounts.has(account.id) ? (
                                                        <>
                                                            <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                                                            Testing...
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Zap className="mr-2 h-4 w-4" />
                                                            Test
                                                        </>
                                                    )}
                                                </Button>

                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleRemoveAccount(account.id)}
                                                    className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>
            </SettingsLayout>
        </AppLayout>
    )
}
