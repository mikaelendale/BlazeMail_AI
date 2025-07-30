"use client"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/Components/ui/label"
import AppLayout from "@/layouts/app-layout"
import SettingsLayout from "@/layouts/settings/layout"
import { router } from "@inertiajs/react"
import {
    ArrowRight,
    CheckCircle,
    Edit,
    Eye,
    Inbox,
    Mail,
    Plus,
    Server,
    Settings,
    Trash2,
    AlertTriangle,
    Trash,
    Clock,
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
    const [isDeleteAccountOpen, setIsDeleteAccountOpen] = useState(false)

    // Get provider icon based on provider type
    const getProviderIcon = (provider: string) => {
        switch (provider) {
            case "gmail":
                return (
                    <img src="https://api.iconify.design/logos/google-icon.svg" className="h-4 w-4 sm:h-5 sm:w-5" alt="Google" />
                )
            case "outlook":
                return (
                    <img
                        src="https://api.iconify.design/logos/microsoft-icon.svg"
                        className="h-4 w-4 sm:h-5 sm:w-5"
                        alt="Outlook"
                    />
                )
            case "yahoo":
                return <img src="https://api.iconify.design/logos/yahoo.svg" className="h-4 w-4 sm:h-5 sm:w-5" alt="Yahoo" />
            case "imap":
                return <Server className="h-4 w-4 sm:h-5 sm:w-5" />
            default:
                return <Mail className="h-4 w-4 sm:h-5 sm:w-5" />
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

    // Handle account deletion
    const handleDeleteAccount = (accountId: number) => {
        router.delete(`/settings/email-accounts/${accountId}`, {
            preserveScroll: true,
            onSuccess: () => {
                // Success message will be shown via Laravel flash message
                setIsDeleteAccountOpen(false);
            },
        })
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
                <div className="space-y-4 sm:space-y-6">
                    {/* Header */}
                    <div className="flex flex-col gap-2 sm:gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="space-y-1">
                            <h1 className="text-lg sm:text-2xl font-bold text-foreground">Email Accounts</h1>
                            <p className="text-xs sm:text-base text-muted-foreground hidden sm:block">
                                Manage your email accounts for sending campaigns
                            </p>
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
                        <Alert className="bg-primary-foreground ">
                            <AlertTriangle className="h-4 w-4 text-red-600 flex-shrink-0" />
                            <AlertDescription className="text-red-800 dark:text-red-200">
                                <span className="text-xs sm:text-sm">
                                    {accounts.filter((account) => account.needsSetup).length} account(s) need setup
                                </span>
                            </AlertDescription>
                        </Alert>
                    )}

                    {/* Accounts List */}
                    <div className="space-y-3 sm:space-y-4">
                        {accounts.map((account) => (
                            <Card
                                key={account.id}
                                className={`border  sm:mx-0 ${account.needsSetup ? "border-accent shadow-none" : "border-border"}`}
                            >
                                <CardContent className="p-3 sm:p-4">
                                    {/* Desktop Layout */}
                                    <div className="hidden sm:flex items-center justify-between">
                                        <div className="flex min-w-0 flex-1 items-center gap-3">
                                            <div className="flex items-center gap-3">
                                                {getProviderIcon(account.provider)}
                                                <div className="min-w-0">
                                                    <div className="mb-1 flex items-center gap-2">
                                                        <p className="truncate font-medium text-foreground">{account.email}</p>
                                                        <Badge className={`text-xs ${getStatusColor(account.status, account.needsSetup)}`}>
                                                            <span>{getStatusText(account)}</span>
                                                        </Badge>
                                                        {account.isSetupComplete && (
                                                            <Badge variant="outline" className="text-xs">
                                                                <CheckCircle className="mr-1 h-3 w-3" />
                                                                Configured
                                                            </Badge>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                                        <span>Added {formatDate(account.createdAt)}</span>
                                                        <span>•</span>
                                                        <span>
                                                            {account.dailySent}/{account.dailyLimit} today
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="ml-4 flex items-center gap-2">
                                            {/* Setup Button - PRIORITY ACTION! */}
                                            {account.needsSetup && (
                                                <Button variant={"outline"} size="sm" onClick={() => handleSetupAccount(account.id)}>
                                                    Complete Setup
                                                </Button>
                                            )}
                                            {/* View Inbox Button - Only show if setup is complete */}
                                            {!account.needsSetup && (
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => handleViewInbox(account.id)}
                                                    disabled={account.status === "error" || !account.isConnected}
                                                >
                                                    <Inbox className="mr-2 h-4 w-4" />
                                                    Inbox
                                                </Button>
                                            )}
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => router.get(`/settings/email-accounts/${account.id}`)}
                                            >
                                                <Eye className="h-4 w-4" />
                                            </Button>
                                            {account.status !== "pending" && (
                                                <Button variant="ghost" size="sm" onClick={() => handleSetupAccount(account.id)}>
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                            )}
                                            <Button variant="ghost" size="sm" onClick={() => setIsDeleteAccountOpen(true)}>
                                                <Trash className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>

                                    {/* Mobile Layout - MINIMAL */}
                                    <div className="sm:hidden space-y-2">
                                        {/* Header Row - Compact */}
                                        <div className="flex items-center justify-between gap-2">
                                            <div className="flex items-center gap-2 min-w-0 flex-1">
                                                {getProviderIcon(account.provider)}
                                                <div className="min-w-0 flex-1">
                                                    <p className="truncate font-medium text-foreground text-sm">{account.email}</p>
                                                    <div className="flex items-center gap-1.5 mt-0.5">
                                                        <Badge className={`text-xs ${getStatusColor(account.status, account.needsSetup)}`}>
                                                            {getStatusText(account)}
                                                        </Badge>
                                                    </div>
                                                </div>
                                            </div>
                                            {/* Single Action Button */}
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => router.get(`/settings/email-accounts/${account.id}`)}
                                                className="h-8 w-8 p-0 flex-shrink-0"
                                            >
                                                <ArrowRight className="h-4 w-4" />
                                            </Button>
                                        </div>

                                        {/* Primary Action - Only if setup needed */}
                                        {account.needsSetup && (
                                            <Button
                                                variant="default"
                                                size="sm"
                                                onClick={() => handleSetupAccount(account.id)}
                                                className="w-full"
                                            >
                                                <Settings className="mr-2 h-4 w-4" />
                                                Complete Setup
                                            </Button>
                                        )}
                                    </div>

                                    {/* Warmup Progress - Hidden on mobile */}
                                    {account.status === "warming" && !account.needsSetup && (
                                        <div className="mt-3 border-t border-border pt-3 hidden sm:block">
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
                        <div className="rounded-lg border-0 p-6 sm:p-8 text-center shadow-none mx-4 sm:mx-0">
                            <h3 className="mb-2 text-lg font-medium text-foreground">No accounts connected</h3>
                            <p className="mb-4 text-sm sm:text-base text-muted-foreground">
                                Connect your first email account to start sending campaigns
                            </p>
                            <div className="flex flex-col justify-center gap-2 sm:flex-row">
                                <Button onClick={() => setIsAddAccountOpen(true)} className="w-full sm:w-auto">
                                    <Plus className="mr-2 h-4 w-4" />
                                    Connect Account
                                </Button>
                            </div>
                        </div>
                    )}
                </div>

                <Dialog open={isDeleteAccountOpen} onOpenChange={setIsDeleteAccountOpen}>
                    <DialogContent className="mx-4 max-w-[calc(100vw-2rem)] sm:mx-auto sm:max-w-md rounded-lg">
                        <DialogHeader className="space-y-2">
                            <DialogTitle className="text-lg sm:text-xl">Delete Email Account</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                            <div className="text-sm sm:text-base">
                                Are you sure you want to delete this account? This action cannot be undone.
                            </div>
                            <Input type="text" placeholder="Type 'DELETE' to confirm" className="text-sm sm:text-base" />
                            <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3 pt-2">
                                <Button
                                    variant="outline"
                                    onClick={() => setIsDeleteAccountOpen(false)}
                                    disabled={isSubmitting}
                                    className="w-full sm:w-auto order-2 sm:order-1"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    variant="destructive"
                                    onClick={() => handleDeleteAccount(accounts[0].id)}
                                    disabled={isSubmitting}
                                    className="w-full sm:w-auto order-1 sm:order-2 flex items-center justify-center"
                                >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Delete Account
                                </Button>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>
            </SettingsLayout>
        </AppLayout>
    )
}
