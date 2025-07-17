"use client"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import AppLayout from "@/layouts/app-layout"
import SettingsLayout from "@/layouts/settings/layout"
import { router } from "@inertiajs/react"
import {
    AlertTriangle,
    CheckCircle,
    Clock,
    Edit3,
    Eye,
    EyeOff,
    Mail,
    Pause,
    Play,
    RefreshCw,
    Server,
    TrendingUp,
    Zap,
    XCircle,
} from "lucide-react"
import { useState } from "react"

// TypeScript interfaces
interface EmailAccountDetail {
    id: number
    email: string
    provider: "gmail" | "imap" | "outlook" | "yahoo"
    status: "active" | "warming" | "paused" | "error" | "pending"
    isConnected: boolean
    isVerified: boolean
    // Limits & Usage
    dailyLimit: number
    hourlyLimit: number
    dailySent: number
    hourlySent: number
    dailySentDate: string
    hourlySentReset: string
    // Warmup
    warmupProgress: number
    warmupDay: number
    warmupEmailsToday: number
    warmupSchedule?: any
    // Health Metrics
    reputation: "excellent" | "good" | "fair" | "poor" | "unknown"
    bounceRate: number
    complaintRate: number
    successRate: number
    consecutiveErrors: number
    // Connection Details
    imapHost?: string
    imapPort?: number
    smtpHost?: string
    smtpPort?: number
    encryptionType?: string
    // OAuth Details
    oauthProviderId?: string
    tokenExpiresAt?: string
    oauthScopes?: string[]
    // Activity
    lastActivity?: string
    lastSync?: string
    lastHealthCheck?: string
    lastError?: string
    lastErrorAt?: string
    // Security
    connectionHash?: string
    securityFlags?: any
    lastSecurityCheck?: string
    // Metadata
    metadata?: any
    settings?: any
    // Timestamps
    createdAt: string
    updatedAt: string
}

interface Props {
    account: EmailAccountDetail
    healthHistory: any[]
    activityLogs: any[]
    breadcrumbs: Array<{ title: string; href: string }>
}

export default function EmailAccountDetail({ account, healthHistory, activityLogs, breadcrumbs }: Props) {
    const [isEditing, setIsEditing] = useState(false)
    const [showTokens, setShowTokens] = useState(false)
    const [isTestingConnection, setIsTestingConnection] = useState(false)
    const [editData, setEditData] = useState({
        dailyLimit: account.dailyLimit,
        hourlyLimit: account.hourlyLimit,
        imapHost: account.imapHost || "",
        imapPort: account.imapPort || 993,
        smtpHost: account.smtpHost || "",
        smtpPort: account.smtpPort || 587,
        encryptionType: account.encryptionType || "tls",
    })

    // Get provider icon with subtle styling
    const getProviderIcon = (provider: string) => {
        const iconClass = "h-5 w-5 text-muted-foreground"
        switch (provider) {
            case "gmail":
                return (
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-50 dark:bg-red-950/20">
                        <Mail className={iconClass} />
                    </div>
                )
            case "outlook":
                return (
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-950/20">
                        <Mail className={iconClass} />
                    </div>
                )
            case "yahoo":
                return (
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-50 dark:bg-purple-950/20">
                        <Mail className={iconClass} />
                    </div>
                )
            case "imap":
                return (
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-50 dark:bg-slate-950/20">
                        <Server className={iconClass} />
                    </div>
                )
            default:
                return (
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-50 dark:bg-gray-950/20">
                        <Mail className={iconClass} />
                    </div>
                )
        }
    }

    // Get status with subtle colors
    const getStatusBadge = (status: string) => {
        switch (status) {
            case "active":
                return (
                    <Badge
                        variant="outline"
                        className="border-green-200 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-950/20 dark:text-green-400"
                    >
                        <CheckCircle className="mr-1 h-3 w-3" />
                        Active
                    </Badge>
                )
            case "warming":
                return (
                    <Badge
                        variant="outline"
                        className="border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950/20 dark:text-amber-400"
                    >
                        <TrendingUp className="mr-1 h-3 w-3" />
                        Warming
                    </Badge>
                )
            case "paused":
                return (
                    <Badge
                        variant="outline"
                        className="border-gray-200 bg-gray-50 text-gray-700 dark:border-gray-800 dark:bg-gray-950/20 dark:text-gray-400"
                    >
                        <Pause className="mr-1 h-3 w-3" />
                        Paused
                    </Badge>
                )
            case "error":
                return (
                    <Badge
                        variant="outline"
                        className="border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950/20 dark:text-red-400"
                    >
                        <XCircle className="mr-1 h-3 w-3" />
                        Error
                    </Badge>
                )
            case "pending":
                return (
                    <Badge
                        variant="outline"
                        className="border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950/20 dark:text-blue-400"
                    >
                        <Clock className="mr-1 h-3 w-3" />
                        Pending
                    </Badge>
                )
            default:
                return <Badge variant="outline">{status}</Badge>
        }
    }

    // Calculate health score
    const calculateHealthScore = () => {
        let score = 100
        score -= account.bounceRate * 2
        score -= account.complaintRate * 3
        score -= account.consecutiveErrors * 10
        score = (score * account.successRate) / 100
        return Math.max(0, Math.min(100, Math.round(score)))
    }

    // Handle connection test
    const handleTestConnection = async () => {
        setIsTestingConnection(true)
        try {
            const response = await fetch(`/settings/email-accounts/${account.id}/test-connection`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-CSRF-TOKEN": document.querySelector('meta[name="csrf-token"]')?.getAttribute("content") || "",
                },
            })
            const result = await response.json()
            if (result.success) {
                alert("Connection test successful! Both IMAP and SMTP are working.")
            } else {
                alert("Connection test failed: " + result.error)
            }
        } catch (error) {
            alert("❌ Failed to test connection")
        } finally {
            setIsTestingConnection(false)
        }
    }

    // Handle save settings
    const handleSaveSettings = () => {
        router.patch(`/settings/email-accounts/${account.id}`, editData, {
            preserveScroll: true,
            onSuccess: () => {
                setIsEditing(false)
                alert("Settings updated successfully!")
            },
            onError: (errors) => {
                console.error("Update failed:", errors)
                alert("Failed to update settings")
            },
        })
    }

    const healthScore = calculateHealthScore()

    return (
        <AppLayout>
            <SettingsLayout>
                <div className="space-y-8">
                    {/* Clean Header */}
                    <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
                        <div className="flex items-start gap-4">
                            {getProviderIcon(account.provider)}
                            <div className="space-y-2">
                                <div className="flex items-center gap-3">
                                    <h1 className="text-2xl font-semibold tracking-tight">{account.email}</h1>
                                    {account.isVerified && <CheckCircle className="h-5 w-5 text-green-500" />}
                                </div>
                                <div className="flex items-center gap-3">
                                    {getStatusBadge(account.status)}
                                    <Badge variant="secondary" className="text-xs font-medium">
                                        {account.provider.toUpperCase()}
                                    </Badge>
                                </div>
                                <p className="text-sm text-muted-foreground">
                                    Created {new Date(account.createdAt).toLocaleDateString()}
                                </p>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleTestConnection}
                                disabled={isTestingConnection}
                                className="gap-2 bg-transparent"
                            >
                                {isTestingConnection ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
                                Test Connection
                            </Button>

                            <Dialog open={isEditing} onOpenChange={setIsEditing}>
                                <DialogTrigger asChild>
                                    <Button size="sm" className="gap-2">
                                        <Edit3 className="h-4 w-4" />
                                        Edit Settings
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-2xl">
                                    <DialogHeader>
                                        <DialogTitle>Edit Account Settings</DialogTitle>
                                    </DialogHeader>
                                    <div className="space-y-6">
                                        <Tabs defaultValue="limits" className="w-full">
                                            <TabsList className="grid w-full grid-cols-2">
                                                <TabsTrigger value="limits">Sending Limits</TabsTrigger>
                                                <TabsTrigger value="connection">Connection</TabsTrigger>
                                            </TabsList>

                                            <TabsContent value="limits" className="space-y-4 mt-6">
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="space-y-2">
                                                        <Label htmlFor="dailyLimit">Daily Limit</Label>
                                                        <Input
                                                            id="dailyLimit"
                                                            type="number"
                                                            value={editData.dailyLimit}
                                                            onChange={(e) =>
                                                                setEditData((prev) => ({ ...prev, dailyLimit: Number.parseInt(e.target.value) }))
                                                            }
                                                            min="1"
                                                            max="10000"
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label htmlFor="hourlyLimit">Hourly Limit</Label>
                                                        <Input
                                                            id="hourlyLimit"
                                                            type="number"
                                                            value={editData.hourlyLimit}
                                                            onChange={(e) =>
                                                                setEditData((prev) => ({ ...prev, hourlyLimit: Number.parseInt(e.target.value) }))
                                                            }
                                                            min="1"
                                                            max="1000"
                                                        />
                                                    </div>
                                                </div>
                                            </TabsContent>

                                            <TabsContent value="connection" className="space-y-4 mt-6">
                                                {account.provider === "imap" ? (
                                                    <div className="space-y-4">
                                                        <div className="grid grid-cols-2 gap-4">
                                                            <div className="space-y-2">
                                                                <Label htmlFor="imapHost">IMAP Host</Label>
                                                                <Input
                                                                    id="imapHost"
                                                                    value={editData.imapHost}
                                                                    onChange={(e) => setEditData((prev) => ({ ...prev, imapHost: e.target.value }))}
                                                                    placeholder="imap.domain.com"
                                                                />
                                                            </div>
                                                            <div className="space-y-2">
                                                                <Label htmlFor="imapPort">IMAP Port</Label>
                                                                <Input
                                                                    id="imapPort"
                                                                    type="number"
                                                                    value={editData.imapPort}
                                                                    onChange={(e) =>
                                                                        setEditData((prev) => ({
                                                                            ...prev,
                                                                            imapPort: Number.parseInt(e.target.value),
                                                                        }))
                                                                    }
                                                                />
                                                            </div>
                                                        </div>
                                                        <div className="grid grid-cols-2 gap-4">
                                                            <div className="space-y-2">
                                                                <Label htmlFor="smtpHost">SMTP Host</Label>
                                                                <Input
                                                                    id="smtpHost"
                                                                    value={editData.smtpHost}
                                                                    onChange={(e) => setEditData((prev) => ({ ...prev, smtpHost: e.target.value }))}
                                                                    placeholder="smtp.domain.com"
                                                                />
                                                            </div>
                                                            <div className="space-y-2">
                                                                <Label htmlFor="smtpPort">SMTP Port</Label>
                                                                <Input
                                                                    id="smtpPort"
                                                                    type="number"
                                                                    value={editData.smtpPort}
                                                                    onChange={(e) =>
                                                                        setEditData((prev) => ({
                                                                            ...prev,
                                                                            smtpPort: Number.parseInt(e.target.value),
                                                                        }))
                                                                    }
                                                                />
                                                            </div>
                                                        </div>
                                                        <div className="space-y-2">
                                                            <Label htmlFor="encryptionType">Encryption</Label>
                                                            <Select
                                                                value={editData.encryptionType}
                                                                onValueChange={(value) => setEditData((prev) => ({ ...prev, encryptionType: value }))}
                                                            >
                                                                <SelectTrigger>
                                                                    <SelectValue />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    <SelectItem value="tls">TLS</SelectItem>
                                                                    <SelectItem value="ssl">SSL</SelectItem>
                                                                    <SelectItem value="none">None</SelectItem>
                                                                </SelectContent>
                                                            </Select>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <Alert>
                                                        <AlertTriangle className="h-4 w-4" />
                                                        <AlertDescription>
                                                            OAuth connection settings are managed automatically by the provider.
                                                        </AlertDescription>
                                                    </Alert>
                                                )}
                                            </TabsContent>
                                        </Tabs>

                                        <div className="flex justify-end gap-3 pt-4 border-t">
                                            <Button variant="outline" onClick={() => setIsEditing(false)}>
                                                Cancel
                                            </Button>
                                            <Button onClick={handleSaveSettings}>Save Changes</Button>
                                        </div>
                                    </div>
                                </DialogContent>
                            </Dialog>
                        </div>
                    </div>

                    {/* Main Content Grid */}
                    <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
                        {/* Left Column - Main Content */}
                        <div className="space-y-6 lg:col-span-8">
                            {/* Health Metrics */}
                            <Card className="border-0 shadow-sm">
                                <CardHeader className="pb-4">
                                    <CardTitle className="text-lg font-medium">Account Health</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
                                        <div className="text-center space-y-1">
                                            <div className="text-3xl font-bold text-foreground">{healthScore}</div>
                                            <div className="text-sm text-muted-foreground">Health Score</div>
                                        </div>
                                        <div className="text-center space-y-1">
                                            <div className="text-3xl font-bold text-foreground capitalize">{account.reputation}</div>
                                            <div className="text-sm text-muted-foreground">Reputation</div>
                                        </div>
                                        <div className="text-center space-y-1">
                                            <div className="text-3xl font-bold text-foreground">{account.successRate}%</div>
                                            <div className="text-sm text-muted-foreground">Success Rate</div>
                                        </div>
                                        <div className="text-center space-y-1">
                                            <div className="text-3xl font-bold text-foreground">{account.bounceRate}%</div>
                                            <div className="text-sm text-muted-foreground">Bounce Rate</div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Usage Statistics */}
                            <Card className="border-0 shadow-sm">
                                <CardHeader className="pb-4">
                                    <CardTitle className="text-lg font-medium">Usage & Limits</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="space-y-3">
                                        <div className="flex justify-between text-sm">
                                            <span className="font-medium">Daily Usage</span>
                                            <span className="text-muted-foreground">
                                                {account.dailySent} of {account.dailyLimit} emails
                                            </span>
                                        </div>
                                        <Progress value={(account.dailySent / account.dailyLimit) * 100} className="h-2" />
                                    </div>

                                    <div className="space-y-3">
                                        <div className="flex justify-between text-sm">
                                            <span className="font-medium">Hourly Usage</span>
                                            <span className="text-muted-foreground">
                                                {account.hourlySent} of {account.hourlyLimit} emails
                                            </span>
                                        </div>
                                        <Progress value={(account.hourlySent / account.hourlyLimit) * 100} className="h-2" />
                                    </div>

                                    {account.status === "warming" && (
                                        <div className="space-y-3">
                                            <div className="flex justify-between text-sm">
                                                <span className="font-medium">Warmup Progress (Day {account.warmupDay})</span>
                                                <span className="text-muted-foreground">{account.warmupProgress}%</span>
                                            </div>
                                            <Progress value={account.warmupProgress} className="h-2" />
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            {/* Connection Details */}
                            <Card className="border-0 shadow-sm">
                                <CardHeader className="pb-4">
                                    <CardTitle className="text-lg font-medium">Connection Details</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                        {account.provider === "gmail" ? (
                                            <>
                                                <div className="space-y-1">
                                                    <Label className="text-sm font-medium text-muted-foreground">Provider</Label>
                                                    <div className="text-sm">Google OAuth 2.0</div>
                                                </div>
                                                <div className="space-y-1">
                                                    <Label className="text-sm font-medium text-muted-foreground">Token Status</Label>
                                                    <div className="text-sm">
                                                        {account.tokenExpiresAt ? (
                                                            <span className="text-green-600">
                                                                Valid until {new Date(account.tokenExpiresAt).toLocaleDateString()}
                                                            </span>
                                                        ) : (
                                                            <span className="text-muted-foreground">Unknown</span>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="space-y-1 md:col-span-2">
                                                    <Label className="text-sm font-medium text-muted-foreground">Permissions</Label>
                                                    <div className="text-sm">
                                                        {account.oauthScopes?.length ? (
                                                            <div className="flex flex-wrap gap-1">
                                                                {account.oauthScopes.map((scope, index) => (
                                                                    <Badge key={index} variant="secondary" className="text-xs">
                                                                        {scope.split("/").pop()}
                                                                    </Badge>
                                                                ))}
                                                            </div>
                                                        ) : (
                                                            "Gmail Send, Read"
                                                        )}
                                                    </div>
                                                </div>
                                            </>
                                        ) : (
                                            <>
                                                <div className="space-y-1">
                                                    <Label className="text-sm font-medium text-muted-foreground">IMAP Server</Label>
                                                    <div className="text-sm">
                                                        {account.imapHost || "Not configured"}:{account.imapPort || 993}
                                                    </div>
                                                </div>
                                                <div className="space-y-1">
                                                    <Label className="text-sm font-medium text-muted-foreground">SMTP Server</Label>
                                                    <div className="text-sm">
                                                        {account.smtpHost || "Not configured"}:{account.smtpPort || 587}
                                                    </div>
                                                </div>
                                                <div className="space-y-1">
                                                    <Label className="text-sm font-medium text-muted-foreground">Encryption</Label>
                                                    <div className="text-sm">{account.encryptionType?.toUpperCase() || "TLS"}</div>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Right Sidebar */}
                        <div className="space-y-6 lg:col-span-4">
                            {/* Quick Actions */}
                            <Card className="border-0 shadow-sm">
                                <CardHeader className="pb-4">
                                    <CardTitle className="text-lg font-medium">Quick Actions</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    <Button
                                        variant="outline"
                                        className="w-full justify-start gap-3 bg-transparent"
                                        onClick={() => router.patch(`/settings/email-accounts/${account.id}/toggle`)}
                                    >
                                        {account.isConnected ? (
                                            <>
                                                <Pause className="h-4 w-4" />
                                                Pause Account
                                            </>
                                        ) : (
                                            <>
                                                <Play className="h-4 w-4" />
                                                Resume Account
                                            </>
                                        )}
                                    </Button>

                                    <Button
                                        variant="outline"
                                        className="w-full justify-start gap-3 bg-transparent"
                                        onClick={() => setShowTokens(!showTokens)}
                                    >
                                        {showTokens ? (
                                            <>
                                                <EyeOff className="h-4 w-4" />
                                                Hide Details
                                            </>
                                        ) : (
                                            <>
                                                <Eye className="h-4 w-4" />
                                                Show Details
                                            </>
                                        )}
                                    </Button>
                                </CardContent>
                            </Card>

                            {/* Status & Security */}
                            <Card className="border-0 shadow-sm">
                                <CardHeader className="pb-4">
                                    <CardTitle className="text-lg font-medium">Status & Security</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="space-y-3">
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm font-medium text-muted-foreground">Status</span>
                                            {getStatusBadge(account.status)}
                                        </div>

                                        <Separator />

                                        <div className="flex justify-between items-center">
                                            <span className="text-sm font-medium text-muted-foreground">Consecutive Errors</span>
                                            <Badge variant={account.consecutiveErrors > 0 ? "destructive" : "secondary"}>
                                                {account.consecutiveErrors}
                                            </Badge>
                                        </div>

                                        {account.lastError && (
                                            <>
                                                <Separator />
                                                <div className="space-y-2">
                                                    <span className="text-sm font-medium text-muted-foreground">Last Error</span>
                                                    <div className="rounded-md bg-red-50 dark:bg-red-950/20 p-3">
                                                        <div className="text-sm text-red-700 dark:text-red-400">{account.lastError}</div>
                                                        {account.lastErrorAt && (
                                                            <div className="text-xs text-red-600/70 dark:text-red-400/70 mt-1">
                                                                {new Date(account.lastErrorAt).toLocaleString()}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Activity Timeline */}
                            <Card className="border-0 shadow-sm">
                                <CardHeader className="pb-4">
                                    <CardTitle className="text-lg font-medium">Recent Activity</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="space-y-3">
                                        <div className="flex justify-between">
                                            <span className="text-sm font-medium text-muted-foreground">Last Activity</span>
                                            <span className="text-sm">
                                                {account.lastActivity ? new Date(account.lastActivity).toLocaleDateString() : "Never"}
                                            </span>
                                        </div>

                                        <div className="flex justify-between">
                                            <span className="text-sm font-medium text-muted-foreground">Last Sync</span>
                                            <span className="text-sm">
                                                {account.lastSync ? new Date(account.lastSync).toLocaleDateString() : "Never"}
                                            </span>
                                        </div>

                                        <div className="flex justify-between">
                                            <span className="text-sm font-medium text-muted-foreground">Health Check</span>
                                            <span className="text-sm">
                                                {account.lastHealthCheck ? new Date(account.lastHealthCheck).toLocaleDateString() : "Never"}
                                            </span>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Debug Info (only show when showTokens is true) */}
                            {showTokens && account.metadata && (
                                <Card className="border-0 shadow-sm">
                                    <CardHeader className="pb-4">
                                        <CardTitle className="text-lg font-medium">Debug Information</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <pre className="overflow-auto rounded-md bg-muted p-3 text-xs font-mono">
                                            {JSON.stringify(account.metadata, null, 2)}
                                        </pre>
                                    </CardContent>
                                </Card>
                            )}
                        </div>
                    </div>
                </div>
            </SettingsLayout>
        </AppLayout>
    )
}
