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
    TrendingUp,
    Zap,
    XCircle,
    CircleCheck,
} from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

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

    // Get status with semantic colors
    const getStatusBadge = (status: string) => {
        switch (status) {
            case "active":
                return (
                    <Badge variant="success" className="capitalize font-medium">
                        <CircleCheck className="mr-1 h-3 w-3" />
                        Active
                    </Badge>
                )
            case "warming":
                return (
                    <Badge variant="warning" className="capitalize font-medium">
                        <TrendingUp className="mr-1 h-3 w-3" />
                        Warming
                    </Badge>
                )
            case "paused":
                return (
                    <Badge variant="secondary" className="capitalize font-medium">
                        <Pause className="mr-1 h-3 w-3" />
                        Paused
                    </Badge>
                )
            case "error":
                return (
                    <Badge variant="destructive" className="capitalize font-medium">
                        <XCircle className="mr-1 h-3 w-3" />
                        Error
                    </Badge>
                )
            case "pending":
                return (
                    <Badge variant="info" className="capitalize font-medium">
                        <Clock className="mr-1 h-3 w-3" />
                        Pending
                    </Badge>
                )
            default:
                return (
                    <Badge variant="outline" className="capitalize font-medium">
                        {status}
                    </Badge>
                )
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
        try {
            setIsTestingConnection(true)
            router.post(
                `/email-accounts/${account.id}/test-connection`,
                { email: account.email },
                {
                    onSuccess: () => {
                        toast.success("Connection test successful!")
                        setIsTestingConnection(false)
                    },
                    onError: () => {
                        toast.error("Connection test failed.")
                        setIsTestingConnection(false)
                    },
                },
            )
        } catch (error) {
            toast.error("An unexpected error occurred during connection test.")
            setIsTestingConnection(false)
        }
    }

    // Handle save settings
    const handleSaveSettings = () => {
        router.patch(`/settings/email-accounts/${account.id}`, editData, {
            preserveScroll: true,
            onSuccess: () => {
                setIsEditing(false)
                toast.success("Settings updated successfully!")
            },
            onError: (errors) => {
                console.error("Update failed:", errors)
                toast.error("Failed to update settings. Please check your inputs.")
            },
        })
    }

    const healthScore = calculateHealthScore()

    return (
        <AppLayout>
            <SettingsLayout>
                <div className="mx-auto px-1 py-2 space-y-4">
                    {/* Clean Header */}
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-start gap-4">
                            <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                    <h1 className="text-lg sm:text-3xl font-medium tracking-tight">{account.email}</h1>
                                    {account.isVerified && <span className="bg-emerald-500 rounded-full"><CircleCheck className="h-5 w-5 text-white " /></span>}
                                </div>
                                <div className="flex items-center gap-2 flex-wrap">
                                    {getStatusBadge(account.status)}
                                    <Badge variant="outline" className="text-xs font-medium">
                                        {account.provider.toUpperCase()}
                                    </Badge>
                                    <p className="text-sm text-muted-foreground">
                                        Created {new Date(account.createdAt).toLocaleDateString()}
                                    </p>
                                </div>
                            </div>
                        </div> 
                    </div>

                    {/* Main Content Grid - Adjusted for md screens */}
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-3 lg:grid-cols-12 lg:gap-8">
                        {/* Left Column - Main Content */}
                        <div className="space-y-6 md:col-span-2 lg:col-span-8">
                            {/* Health Metrics */}
                            <Card className="shadow-none border border-accent">
                                <CardHeader className="pb-4">
                                    <CardTitle className="text-lg font-medium">Account Health</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    {/* Adjusted grid for health metrics to prevent squishing on md */}
                                    <div className="grid grid-cols-2 gap-4 md:grid-cols-2 lg:grid-cols-4">
                                        <div className="text-center space-y-1 bg-accent p-4 rounded-xl">
                                            <div className="text-2xl sm:text-3xl font-medium text-foreground">{healthScore}</div>
                                            <div className="text-sm text-muted-foreground">Health Score</div>
                                        </div>
                                        <div className="text-center space-y-1 bg-accent p-4 rounded-xl">
                                            <div className="text-2xl sm:text-3xl font-medium text-foreground capitalize">
                                                {account.reputation}
                                            </div>
                                            <div className="text-sm text-muted-foreground">Reputation</div>
                                        </div>
                                        <div className="text-center space-y-1 bg-accent p-4 rounded-xl">
                                            <div className="text-2xl sm:text-3xl font-medium text-foreground">{account.successRate}%</div>
                                            <div className="text-sm text-muted-foreground">Success Rate</div>
                                        </div>
                                        <div className="text-center space-y-1 bg-accent p-4 rounded-xl">
                                            <div className="text-2xl sm:text-3xl font-medium text-foreground">{account.bounceRate}%</div>
                                            <div className="text-sm text-muted-foreground">Bounce Rate</div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Usage Statistics */}
                            {/* <Card className="shadow-none border border-accent">
                                <CardHeader className="pb-4">
                                    <CardTitle className="text-lg font-medium">Usage & Limits</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-5">
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-sm">
                                            <span className="font-medium">Daily Usage</span>
                                            <span className="text-muted-foreground">
                                                {account.dailySent} of {account.dailyLimit} emails
                                            </span>
                                        </div>
                                        <Progress value={(account.dailySent / account.dailyLimit) * 100} className="h-2" />
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-sm">
                                            <span className="font-medium">Hourly Usage</span>
                                            <span className="text-muted-foreground">
                                                {account.hourlySent} of {account.hourlyLimit} emails
                                            </span>
                                        </div>
                                        <Progress value={(account.hourlySent / account.hourlyLimit) * 100} className="h-2" />
                                    </div>
                                    {account.status === "warming" && (
                                        <div className="space-y-2">
                                            <div className="flex justify-between text-sm">
                                                <span className="font-medium">Warmup Progress (Day {account.warmupDay})</span>
                                                <span className="text-muted-foreground">{account.warmupProgress}%</span>
                                            </div>
                                            <Progress value={account.warmupProgress} className="h-2" />
                                        </div>
                                    )}
                                </CardContent>
                            </Card> */}

                            {/* Connection Details */}
                            <Card className="shadow-none border border-accent">
                                <CardHeader className="pb-4">
                                    <CardTitle className="text-lg font-medium">Connection Details</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                        {account.provider === "gmail" ? (
                                            <>
                                                <div className="space-y-1">
                                                    <Label className="text-sm font-medium text-muted-foreground">Provider</Label>
                                                    <div className="text-sm font-medium">Google OAuth 2.0</div>
                                                </div>
                                                <div className="space-y-1">
                                                    <Label className="text-sm font-medium text-muted-foreground">Token Status</Label>
                                                    <div className="text-sm font-medium">
                                                        {account.tokenExpiresAt ? (
                                                            <span className="text-success">
                                                                Valid until {new Date(account.tokenExpiresAt).toLocaleDateString()}
                                                            </span>
                                                        ) : (
                                                            <span className="text-muted-foreground">Unknown</span>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="space-y-1 col-span-1 md:col-span-2">
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
                                                    <div className="text-sm font-medium">
                                                        {account.imapHost || "Not configured"}:{account.imapPort || 993}
                                                    </div>
                                                </div>
                                                <div className="space-y-1">
                                                    <Label className="text-sm font-medium text-muted-foreground">SMTP Server</Label>
                                                    <div className="text-sm font-medium">
                                                        {account.smtpHost || "Not configured"}:{account.smtpPort || 587}
                                                    </div>
                                                </div>
                                                <div className="space-y-1">
                                                    <Label className="text-sm font-medium text-muted-foreground">Encryption</Label>
                                                    <div className="text-sm font-medium">{account.encryptionType?.toUpperCase() || "TLS"}</div>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Right Sidebar */}
                        <div className="space-y-6 md:col-span-1 lg:col-span-4">
                            {/* Quick Actions */}
                            <Card className="shadow-none border border-accent">
                                <CardHeader className="pb-4">
                                    <CardTitle className="text-lg font-medium">Quick Actions</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    <Button
                                        variant="outline"
                                        className="w-full justify-start gap-3"
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
                                        className="w-full justify-start gap-3"
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
                            <Card className="shadow-none border border-accent">
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
                                            <Badge variant={account.consecutiveErrors > 0 ? "destructive" : "default"}>
                                                {account.consecutiveErrors}
                                            </Badge>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Activity Timeline */}
                            <Card className="shadow-none border border-accent">
                                <CardHeader className="pb-4">
                                    <CardTitle className="text-lg font-medium">Recent Activity</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="space-y-3 text-sm">
                                        <div className="flex justify-between">
                                            <span className="font-medium text-muted-foreground">Last Activity</span>
                                            <span>
                                                {account.lastActivity ? new Date(account.lastActivity).toLocaleDateString() : "Never"}
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="font-medium text-muted-foreground">Last Sync</span>
                                            <span>{account.lastSync ? new Date(account.lastSync).toLocaleDateString() : "Never"}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="font-medium text-muted-foreground">Health Check</span>
                                            <span>
                                                {account.lastHealthCheck ? new Date(account.lastHealthCheck).toLocaleDateString() : "Never"}
                                            </span>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Debug Info (only show when showTokens is true) */}
                            {showTokens && account.metadata && (
                                <Card className="shadow-sm">
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
