"use client"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import AppLayout from "@/layouts/app-layout"
import SettingsLayout from "@/layouts/settings/layout"
import { router } from "@inertiajs/react"
import {
    ArrowRight,
    CheckCircle,
    Clock,
    Edit,
    Eye,
    Inbox,
    Mail,
    Plus,
    Server,
    Settings,
    Trash2,
    AlertTriangle,
} from "lucide-react"
import { useState } from "react"

// TypeScript interfaces for type safety
interface EmailAccount {
    id: number
    email: string
    provider: "gmail" | "imap" | "outlook" | "yahoo"
    status: "active" | "warming" | "paused" | "error" | "pending"
    isConnected: boolean
    dailyLimit: number
    dailySent: number
    warmupProgress: number
    reputation: "excellent" | "good" | "fair" | "poor"
    lastActivity: string
    createdAt: string
    messageCount?: number
    unreadCount?: number
    // NEW: Setup status fields
    isSetupComplete?: boolean
    setupCompletedAt?: string
    needsSetup?: boolean
}

interface Provider {
    name: string
    enabled: boolean
    oauth?: boolean
    coming_soon?: boolean
}

interface Props {
    accounts: EmailAccount[]
    providers: Record<string, Provider>
    breadcrumbs: Array<{ title: string; href: string }>
}

export default function EmailAccountsSettings({ accounts, providers, breadcrumbs }: Props) {
    const [isAddAccountOpen, setIsAddAccountOpen] = useState(false)
    const [selectedProvider, setSelectedProvider] = useState<string>("")
    const [isSubmitting, setIsSubmitting] = useState(false)

    // Get provider icon based on provider type
    const getProviderIcon = (provider: string) => {
        switch (provider) {
            case "gmail":
                return <img src="https://api.iconify.design/logos/google-icon.svg" className="h-4 w-4" alt="Google" />
            case "outlook":
                return <img src="https://api.iconify.design/logos/microsoft-icon.svg" className="h-4 w-4" alt="Outlook" />
            case "yahoo":
                return <img src="https://api.iconify.design/logos/yahoo.svg" className="h-4 w-4" alt="Yahoo" />
            case "imap":
                return <Server className="h-4 w-4" />
            default:
                return <Mail className="h-4 w-4" />
        }
    }

    // Get status badge color - UPDATED WITH SETUP STATUS
    const getStatusColor = (status: string, needsSetup?: boolean) => {
        if (needsSetup) {
            return "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400"
        }

        switch (status) {
            case "active":
                return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
            case "warming":
                return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
            case "paused":
                return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400"
            case "error":
                return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
            case "pending":
                return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
            default:
                return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400"
        }
    }

    // Get status text - UPDATED WITH SETUP STATUS
    const getStatusText = (account: EmailAccount) => {
        if (account.needsSetup) {
            return "Setup Required"
        }
        return account.status.charAt(0).toUpperCase() + account.status.slice(1)
    }

    // Format date for display
    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
        })
    }

    // Handle account toggle (enable/disable) - UPDATED WITH SETUP CHECK
    const handleAccountToggle = (accountId: number, enabled: boolean) => {
        const account = accounts.find((acc) => acc.id === accountId)
        if (account?.needsSetup) {
            // Redirect to setup instead of toggling
            router.get(`/settings/email-accounts/${accountId}/setup`)
            return
        }

        router.patch(
            `/settings/email-accounts/${accountId}/toggle`,
            {},
            {
                preserveScroll: true,
                onSuccess: () => {
                    // Success message will be shown via Laravel flash message
                },
                onError: (errors) => {
                    console.error("Toggle failed:", errors)
                },
            },
        )
    }

    // Handle account deletion
    const handleDeleteAccount = (accountId: number) => {
        if (confirm("Are you sure you want to delete this email account? This action cannot be undone.")) {
            router.delete(`/settings/email-accounts/${accountId}`, {
                preserveScroll: true,
                onSuccess: () => {
                    // Success message will be shown via Laravel flash message
                },
            })
        }
    }

    // Handle view inbox
    const handleViewInbox = (accountId: number) => {
        router.get(`/inbox?account_id=${accountId}`, {
            preserveState: false, // Fresh page load for inbox
        })
    }

    // NEW: Handle setup redirect
    const handleSetupAccount = (accountId: number) => {
        router.get(`/settings/email-accounts/${accountId}/setup`)
    }

    // Handle adding new account
    const handleAddAccount = () => {
        if (!selectedProvider) {
            return
        }

        // For Gmail OAuth - DIRECT REDIRECT!
        if (selectedProvider === "gmail") {
            setIsSubmitting(true)
            // Just redirect directly to the Laravel route that handles OAuth
            // Pass the current page's URL as return_url
            const currentUrl = encodeURIComponent(window.location.href)
            window.location.href = `/oauth/gmail/start?return_url=${currentUrl}`
            return
        }

        // Add other providers here if needed
    }

    return (
        <AppLayout>
            <SettingsLayout>
                <div className="space-y-6">
                    {/* Header */}
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-foreground">Connected Accounts</h1>
                            <p className="text-muted-foreground">Manage your email accounts for sending campaigns</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <Dialog open={isAddAccountOpen} onOpenChange={setIsAddAccountOpen}>
                                <DialogTrigger asChild>
                                    <Button>
                                        <Plus className="mr-2 h-4 w-4" />
                                        Add Account
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-md">
                                    <DialogHeader>
                                        <DialogTitle>Add Email Account</DialogTitle>
                                    </DialogHeader>
                                    <div className="space-y-4">
                                        <div>
                                            <Label className="text-sm font-medium">Provider</Label>
                                            <div className="mt-2 grid grid-cols-2 gap-2">
                                                {Object.entries(providers).map(([key, provider]) => (
                                                    <button
                                                        key={key}
                                                        className={`relative flex flex-col items-center gap-2 rounded-lg border p-3 transition-colors ${selectedProvider === key
                                                            ? "border-primary bg-primary/5"
                                                            : "border-border hover:bg-muted/50"
                                                            } ${!provider.enabled ? "cursor-not-allowed opacity-50" : ""}`}
                                                        onClick={() => provider.enabled && setSelectedProvider(key)}
                                                        disabled={!provider.enabled}
                                                    >
                                                        {getProviderIcon(key)}
                                                        <span className="text-xs font-medium">{provider.name}</span>
                                                        {provider.coming_soon && (
                                                            <span className="absolute -top-1 -right-1 rounded bg-orange-500 px-1 py-0.5 text-xs text-[10px] text-white">
                                                                Soon
                                                            </span>
                                                        )}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                        {/* Gmail OAuth - NO FIELDS NEEDED! */}
                                        {selectedProvider === "gmail" && (
                                            <Alert className="mt-4">
                                                <AlertDescription>
                                                    You'll be redirected to Google to authorize access to your account.
                                                </AlertDescription>
                                            </Alert>
                                        )}
                                        <div className="flex justify-end gap-2 pt-4">
                                            <Button variant="outline" onClick={() => setIsAddAccountOpen(false)} disabled={isSubmitting}>
                                                Cancel
                                            </Button>
                                            <Button
                                                onClick={handleAddAccount}
                                                disabled={!selectedProvider || isSubmitting || !providers[selectedProvider]?.enabled}
                                            >
                                                {isSubmitting ? (
                                                    <>
                                                        <Clock className="mr-2 h-4 w-4 animate-spin" />
                                                        Connecting...
                                                    </>
                                                ) : (
                                                    <>
                                                        <CheckCircle className="mr-2 h-4 w-4" />
                                                        Connect
                                                    </>
                                                )}
                                            </Button>
                                        </div>
                                    </div>
                                </DialogContent>
                            </Dialog>
                        </div>
                    </div>

                    {/* NEW: Setup Required Alert */}
                    {accounts.some((account) => account.needsSetup) && (
                        <Alert className="bg-primary-foreground">
                            <AlertTriangle className="h-4 w-4 text-red-600" />
                            <AlertDescription className="text-red-800 dark:text-red-200">
                                <div className="flex items-center justify-between">
                                    <span>
                                        {accounts.filter((account) => account.needsSetup).length} account(s) require setup to start sending
                                        emails.
                                    </span>
                                </div>
                            </AlertDescription>
                        </Alert>
                    )}

                    {/* Accounts List */}
                    <div className="space-y-3">
                        {accounts.map((account) => (
                            <Card
                                key={account.id}
                                className={`border ${account.needsSetup ? "border-accent shadow-none" : "border-border"}`}
                            >
                                <CardContent className="p-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex min-w-0 flex-1 items-center gap-3">
                                            <div className="flex items-center gap-2">
                                                {getProviderIcon(account.provider)}
                                                <div className="min-w-0">
                                                    <div className="mb-1 flex items-center gap-2">
                                                        <p className="truncate font-medium text-foreground">{account.email}</p>
                                                        <Badge className={`text-xs ${getStatusColor(account.status, account.needsSetup)}`}>
                                                            {account.needsSetup && <AlertTriangle className="mr-1 h-3 w-3" />}
                                                            <span className="ml-1">{getStatusText(account)}</span>
                                                        </Badge>
                                                        {account.isSetupComplete && (
                                                            <Badge variant="secondary" className="text-xs">
                                                                <CheckCircle className="mr-1 h-3 w-3" />
                                                                Configured
                                                            </Badge>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                                        <span>Added {formatDate(account.createdAt)}</span>
                                                        <span className="hidden sm:inline">•</span>
                                                        <span className="hidden sm:inline">
                                                            {account.dailySent}/{account.dailyLimit} today
                                                        </span>
                                                        {account.messageCount !== undefined && (
                                                            <>
                                                                <span className="hidden sm:inline">•</span>
                                                                <span className="hidden sm:inline">
                                                                    {account.messageCount} messages
                                                                    {account.unreadCount && account.unreadCount > 0 && (
                                                                        <span className="ml-1 font-medium text-blue-600">
                                                                            ({account.unreadCount} unread)
                                                                        </span>
                                                                    )}
                                                                </span>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="ml-4 flex items-center gap-2">
                                            {/* NEW: Setup Button - PRIORITY ACTION! */}
                                            {account.needsSetup && (
                                                <Button
                                                    variant="destructive"
                                                    size="sm"
                                                    onClick={() => handleSetupAccount(account.id)}
                                                    className="hidden sm:flex "
                                                >
                                                    <Settings className="mr-2 h-4 w-4" />
                                                    Complete Setup
                                                </Button>
                                            )}

                                            {/* View Inbox Button - Only show if setup is complete */}
                                            {!account.needsSetup && (
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => handleViewInbox(account.id)}
                                                    className="hidden sm:flex"
                                                    disabled={account.status === "error" || !account.isConnected}
                                                >
                                                    <Inbox className="mr-2 h-4 w-4" />
                                                    Inbox
                                                    {account.unreadCount && account.unreadCount > 0 && (
                                                        <Badge variant="secondary" className="ml-2 text-xs">
                                                            {account.unreadCount}
                                                        </Badge>
                                                    )}
                                                </Button>
                                            )}

                                            <div className="hidden sm:block">
                                                <Switch
                                                    checked={account.isConnected && account.status !== "error" && !account.needsSetup}
                                                    onCheckedChange={(checked) => handleAccountToggle(account.id, checked)}
                                                    disabled={account.status === "error"}
                                                />
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => router.get(`/settings/email-accounts/${account.id}`)}
                                            >
                                                <Eye className="h-4 w-4" />
                                            </Button>
                                            <Button variant="ghost" size="sm" onClick={() => handleSetupAccount(account.id)}>
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="text-red-500 hover:text-red-700"
                                                onClick={() => handleDeleteAccount(account.id)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                    {/* Mobile Actions */}
                                    <div className="mt-3 border-t border-border pt-3 sm:hidden">
                                        <div className="mb-3 flex items-center justify-between">
                                            <span className="text-sm text-muted-foreground">
                                                {account.dailySent}/{account.dailyLimit} emails today
                                                {account.messageCount !== undefined && (
                                                    <span className="ml-2">• {account.messageCount} messages</span>
                                                )}
                                            </span>
                                            <Switch
                                                checked={account.isConnected && account.status !== "error" && !account.needsSetup}
                                                onCheckedChange={(checked) => handleAccountToggle(account.id, checked)}
                                                disabled={account.status === "error"}
                                            />
                                        </div>

                                        {/* NEW: Mobile Setup Button - PRIORITY! */}
                                        {account.needsSetup ? (
                                            <Button
                                                variant="default"
                                                size="sm"
                                                onClick={() => handleSetupAccount(account.id)}
                                                className="w-full bg-orange-600 hover:bg-orange-700"
                                            >
                                                <Settings className="mr-2 h-4 w-4" />
                                                Complete Setup Required
                                                <ArrowRight className="ml-auto h-4 w-4" />
                                            </Button>
                                        ) : (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleViewInbox(account.id)}
                                                className="w-full"
                                                disabled={account.status === "error" || !account.isConnected}
                                            >
                                                <Inbox className="mr-2 h-4 w-4" />
                                                View Inbox
                                                {account.unreadCount && account.unreadCount > 0 && (
                                                    <>
                                                        <span className="ml-2">•</span>
                                                        <span className="ml-1 font-medium text-blue-600">{account.unreadCount} unread</span>
                                                    </>
                                                )}
                                                <ArrowRight className="ml-auto h-4 w-4" />
                                            </Button>
                                        )}
                                    </div>
                                    {/* Warmup Progress */}
                                    {account.status === "warming" && !account.needsSetup && (
                                        <div className="mt-3 border-t border-border pt-3">
                                            <div className="mb-2 flex items-center justify-between text-xs">
                                                <span className="text-muted-foreground">Warmup Progress</span>
                                                <span className="font-medium">{account.warmupProgress}%</span>
                                            </div>
                                            <div className="h-1.5 rounded-full bg-muted">
                                                <div
                                                    className="h-1.5 rounded-full bg-primary transition-all duration-300"
                                                    style={{ width: `${account.warmupProgress}%` }}
                                                />
                                            </div>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    {/* Empty State */}
                    {accounts.length === 0 && (
                        <div className="rounded-lg border-0 p-8 text-center shadow-none">
                            <h3 className="mb-2 text-lg font-medium text-foreground">No accounts connected</h3>
                            <p className="mb-4 text-muted-foreground">Connect your first email account to start sending campaigns</p>
                            <div className="flex flex-col justify-center gap-2 sm:flex-row">
                                <Button onClick={() => setIsAddAccountOpen(true)}>
                                    <Plus className="mr-2 h-4 w-4" />
                                    Connect Account
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* Quick Actions Footer */}
                    {accounts.length > 0 && (
                        <div className="border-t border-border pt-6">
                            <div className="flex flex-col justify-center gap-3 sm:flex-row">
                                <Button variant="outline" onClick={() => setIsAddAccountOpen(true)} className="flex-1 sm:flex-none">
                                    <Plus className="mr-2 h-4 w-4" />
                                    Add Another Account
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </SettingsLayout>
        </AppLayout>
    )
}
