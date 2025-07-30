"use client"

import type React from "react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useForm } from "@inertiajs/react"
import { AlertCircle, CheckCircle, Clock, HelpCircle, Mail, Save, Settings2, Zap } from "lucide-react"
import { useState } from "react"
import AppLayout from "@/layouts/app-layout"
import SettingsLayout from "@/layouts/settings/layout"

interface EmailAccount {
    id: number
    email: string
    provider: string
    status: string
    daily_limit: number
    user: {
        name: string
        email: string
    }
}

interface SetupData {
    sender_name: string
    from_email: string
    reply_to_email: string
    signature: string
    batch_size: number
    batch_delay_minutes: number
    max_emails_per_day: number
    send_window_start: string
    send_window_end: string
    auto_unsubscribe: boolean
    tracking_enabled: boolean
    compliance_confirmed: boolean
    retry_failed_emails: boolean
    max_retry_attempts: number
    pause_on_errors: boolean
    notify_on_errors: boolean
}

interface BestPractices {
    content: {
        title: string
        items: string[]
    }
    sending: {
        title: string
        items: string[]
    }
    compliance: {
        title: string
        items: string[]
    }
}

interface BatchingGuidelines {
    recommended_settings: {
        title: string
        batch_size: number
        delay_minutes: number
        daily_limit: number
        description: string
    }
    campaign_examples: Array<{
        name: string
        batch_size: number
        batches: number
        total_time: string
        description: string
    }>
    timing_tips: string[]
}

interface Props {
    account: EmailAccount
    setupData: SetupData
    isSetupComplete: boolean
    bestPractices: BestPractices
    batchingGuidelines: BatchingGuidelines
    breadcrumbs: Array<{ title: string; href: string }>
}

export default function EmailAccountSetup({
    account,
    setupData,
    isSetupComplete,
    bestPractices,
    batchingGuidelines,
    breadcrumbs,
}: Props) {
    const { data, setData, post, processing, errors } = useForm<SetupData>(setupData)
    const [showAdvanced, setShowAdvanced] = useState(false)

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        post(`/settings/email-accounts/${account.id}/setup`, {
            preserveScroll: true,
            onSuccess: () => { },
            onError: (errors) => {
                console.error("Setup failed:", errors)
            },
        })
    }

    const isFormValid = () => {
        return (
            data.sender_name &&
            data.reply_to_email &&
            data.compliance_confirmed &&
            data.batch_size > 0 &&
            data.batch_delay_minutes > 0 &&
            data.max_emails_per_day > 0 &&
            data.send_window_start &&
            data.send_window_end
        )
    }

    const calculateCampaignTime = (recipients: number) => {
        const batches = Math.ceil(recipients / data.batch_size)
        const totalMinutes = (batches - 1) * data.batch_delay_minutes
        const hours = Math.floor(totalMinutes / 60)
        const minutes = totalMinutes % 60
        return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`
    }

    return (
        <AppLayout>
            <SettingsLayout>

                <TooltipProvider>
                    <div className="space-y-6">
                        {/* Header */}
                        <div className="flex items-center justify-between">
                            <div>
                                <h1 className="text-2xl font-bold">Gmail Confirmation Email Setup</h1>
                                <p className="text-muted-foreground">Configure {account.email} for batch confirmation emails</p>
                            </div>
                            {isSetupComplete && (
                                <Badge>
                                    <CheckCircle className="mr-1 h-3 w-3" />
                                    Ready for Campaigns
                                </Badge>
                            )}
                        </div>

                        <form onSubmit={handleSubmit}>
                            {/* Main Grid Layout */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {/* Left Column */}
                                <div className="space-y-4">
                                    {/* Basic Settings */}
                                    <Card>
                                        <CardHeader className="pb-3">
                                            <CardTitle className="text-lg flex items-center gap-2">
                                                <Mail className="h-4 w-4" />
                                                Sender Settings
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-4">
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-1">
                                                    <Label htmlFor="sender_name" className="text-sm">
                                                        Sender Name *
                                                    </Label>
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <HelpCircle className="h-3 w-3 text-muted-foreground cursor-help" />
                                                        </TooltipTrigger>
                                                        <TooltipContent>
                                                            <p>Name that appears in the "From" field of confirmation emails</p>
                                                        </TooltipContent>
                                                    </Tooltip>
                                                </div>
                                                <Input
                                                    id="sender_name"
                                                    value={data.sender_name}
                                                    onChange={(e) => setData("sender_name", e.target.value)}
                                                    placeholder="Your Company Name"
                                                    className={errors.sender_name ? "border-destructive" : ""}
                                                />
                                                {errors.sender_name && <p className="text-xs text-destructive">{errors.sender_name}</p>}
                                            </div>

                                            <div className="space-y-1">
                                                <div className="flex items-center gap-1">
                                                    <Label htmlFor="reply_to_email" className="text-sm">
                                                        Reply-To Email *
                                                    </Label>
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <HelpCircle className="h-3 w-3 text-muted-foreground cursor-help" />
                                                        </TooltipTrigger>
                                                        <TooltipContent>
                                                            <p>Email address where replies will be sent</p>
                                                        </TooltipContent>
                                                    </Tooltip>
                                                </div>
                                                <Input
                                                    id="reply_to_email"
                                                    type="email"
                                                    value={data.reply_to_email}
                                                    onChange={(e) => setData("reply_to_email", e.target.value)}
                                                    placeholder="support@yourcompany.com"
                                                    className={errors.reply_to_email ? "border-destructive" : ""}
                                                />
                                                {errors.reply_to_email && <p className="text-xs text-destructive">{errors.reply_to_email}</p>}
                                            </div>

                                            <div className="space-y-1">
                                                <div className="flex items-center gap-1">
                                                    <Label htmlFor="signature" className="text-sm">
                                                        Email Signature
                                                    </Label>
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <HelpCircle className="h-3 w-3 text-muted-foreground cursor-help" />
                                                        </TooltipTrigger>
                                                        <TooltipContent>
                                                            <p>Text automatically added to the end of confirmation emails</p>
                                                        </TooltipContent>
                                                    </Tooltip>
                                                </div>
                                                <Textarea
                                                    id="signature"
                                                    value={data.signature}
                                                    onChange={(e) => setData("signature", e.target.value)}
                                                    placeholder="Best regards,&#10;Your Company Team"
                                                    rows={3}
                                                    className="resize-none"
                                                />
                                            </div>
                                        </CardContent>
                                    </Card>

                                    {/* Batch Configuration */}
                                    <Card>
                                        <CardHeader className="pb-3">
                                            <CardTitle className="text-lg flex items-center gap-2">
                                                <Zap className="h-4 w-4" />
                                                Batch Configuration
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-4">
                                            <div className="grid grid-cols-2 gap-3">
                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-1">
                                                        <Label htmlFor="batch_size" className="text-sm">
                                                            Batch Size *
                                                        </Label>
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <HelpCircle className="h-3 w-3 text-muted-foreground cursor-help" />
                                                            </TooltipTrigger>
                                                            <TooltipContent>
                                                                <p>Number of emails to send in each batch (recommended: 50)</p>
                                                            </TooltipContent>
                                                        </Tooltip>
                                                    </div>
                                                    <Input
                                                        id="batch_size"
                                                        type="number"
                                                        min="10"
                                                        max="100"
                                                        value={data.batch_size}
                                                        onChange={(e) => setData("batch_size", Number.parseInt(e.target.value) || 50)}
                                                        className={errors.batch_size ? "border-destructive" : ""}
                                                    />
                                                    {errors.batch_size && <p className="text-xs text-destructive">{errors.batch_size}</p>}
                                                </div>

                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-1">
                                                        <Label htmlFor="batch_delay_minutes" className="text-sm">
                                                            Delay (minutes) *
                                                        </Label>
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <HelpCircle className="h-3 w-3 text-muted-foreground cursor-help" />
                                                            </TooltipTrigger>
                                                            <TooltipContent>
                                                                <p>Minutes to wait between batches (recommended: 60)</p>
                                                            </TooltipContent>
                                                        </Tooltip>
                                                    </div>
                                                    <Input
                                                        id="batch_delay_minutes"
                                                        type="number"
                                                        min="30"
                                                        max="180"
                                                        value={data.batch_delay_minutes}
                                                        onChange={(e) => setData("batch_delay_minutes", Number.parseInt(e.target.value) || 60)}
                                                        className={errors.batch_delay_minutes ? "border-destructive" : ""}
                                                    />
                                                    {errors.batch_delay_minutes && (
                                                        <p className="text-xs text-destructive">{errors.batch_delay_minutes}</p>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="space-y-1">
                                                <div className="flex items-center gap-1">
                                                    <Label htmlFor="max_emails_per_day" className="text-sm">
                                                        Daily Limit *
                                                    </Label>
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <HelpCircle className="h-3 w-3 text-muted-foreground cursor-help" />
                                                        </TooltipTrigger>
                                                        <TooltipContent>
                                                            <p>Maximum emails per day (Gmail limit: 500, recommended: 400)</p>
                                                        </TooltipContent>
                                                    </Tooltip>
                                                </div>
                                                <Input
                                                    id="max_emails_per_day"
                                                    type="number"
                                                    min="50"
                                                    max="400"
                                                    value={data.max_emails_per_day}
                                                    onChange={(e) => setData("max_emails_per_day", Number.parseInt(e.target.value) || 400)}
                                                    className={errors.max_emails_per_day ? "border-destructive" : ""}
                                                />
                                                <p className="text-xs text-muted-foreground">Gmail safe limit: 400 emails/day</p>
                                            </div>

                                            <div className="grid grid-cols-2 gap-3">
                                                <div className="space-y-1">
                                                    <Label htmlFor="send_window_start" className="text-sm">
                                                        Start Time *
                                                    </Label>
                                                    <Input
                                                        id="send_window_start"
                                                        type="time"
                                                        value={data.send_window_start}
                                                        onChange={(e) => setData("send_window_start", e.target.value)}
                                                        className={errors.send_window_start ? "border-destructive" : ""}
                                                    />
                                                </div>
                                                <div className="space-y-1">
                                                    <Label htmlFor="send_window_end" className="text-sm">
                                                        End Time *
                                                    </Label>
                                                    <Input
                                                        id="send_window_end"
                                                        type="time"
                                                        value={data.send_window_end}
                                                        onChange={(e) => setData("send_window_end", e.target.value)}
                                                        className={errors.send_window_end ? "border-destructive" : ""}
                                                    />
                                                </div>
                                            </div>

                                            {/* Campaign Time Calculator */}
                                            <div className="p-3 bg-muted/50 rounded-lg">
                                                <h4 className="text-sm font-medium mb-2">Campaign Time Estimates</h4>
                                                <div className="grid grid-cols-2 gap-2 text-xs">
                                                    <div>150 emails: {calculateCampaignTime(150)}</div>
                                                    <div>300 emails: {calculateCampaignTime(300)}</div>
                                                    <div>400 emails: {calculateCampaignTime(400)}</div>
                                                    <div>500 emails: {calculateCampaignTime(500)}</div>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>

                                {/* Right Column */}
                                <div className="space-y-4">
                                    {/* Features */}
                                    <Card>
                                        <CardHeader className="pb-3">
                                            <CardTitle className="text-lg">Email Features</CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-4">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-1">
                                                    <div>
                                                        <p className="text-sm font-medium">Auto Unsubscribe</p>
                                                        <p className="text-xs text-muted-foreground">Add unsubscribe links</p>
                                                    </div>
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <HelpCircle className="h-3 w-3 text-muted-foreground cursor-help" />
                                                        </TooltipTrigger>
                                                        <TooltipContent>
                                                            <p>Automatically add unsubscribe links to comply with email regulations</p>
                                                        </TooltipContent>
                                                    </Tooltip>
                                                </div>
                                                <input
                                                    type="checkbox"
                                                    checked={data.auto_unsubscribe}
                                                    onChange={(e) => setData("auto_unsubscribe", e.target.checked)}
                                                    className="rounded"
                                                />
                                            </div>

                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-1">
                                                    <div>
                                                        <p className="text-sm font-medium">Email Tracking</p>
                                                        <p className="text-xs text-muted-foreground">Track opens and clicks</p>
                                                    </div>
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <HelpCircle className="h-3 w-3 text-muted-foreground cursor-help" />
                                                        </TooltipTrigger>
                                                        <TooltipContent>
                                                            <p>Track when recipients open emails and click links for analytics</p>
                                                        </TooltipContent>
                                                    </Tooltip>
                                                </div>
                                                <input
                                                    type="checkbox"
                                                    checked={data.tracking_enabled}
                                                    onChange={(e) => setData("tracking_enabled", e.target.checked)}
                                                    className="rounded"
                                                />
                                            </div>
                                        </CardContent>
                                    </Card>

                                    {/* Best Practices */}
                                    <Card>
                                        <CardHeader className="pb-3">
                                            <CardTitle className="text-lg">Best Practices</CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-4">
                                            {Object.entries(bestPractices).map(([key, section]) => (
                                                <div key={key} className="space-y-2">
                                                    <h4 className="text-sm font-medium">{section.title}</h4>
                                                    <ul className="text-xs text-muted-foreground space-y-1">
                                                        {section.items.slice(0, 3).map((item, index) => (
                                                            <li key={index} className="flex items-start gap-1">
                                                                <span className="text-primary mt-1">•</span>
                                                                <span>{item}</span>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            ))}
                                        </CardContent>
                                    </Card>

                                    {/* Advanced Settings */}
                                    <Card>
                                        <CardHeader className="pb-3">
                                            <div className="flex items-center justify-between">
                                                <CardTitle className="text-lg flex items-center gap-2">
                                                    <Settings2 className="h-4 w-4" />
                                                    Advanced
                                                </CardTitle>
                                                <Button type="button" variant="ghost" size="sm" onClick={() => setShowAdvanced(!showAdvanced)}>
                                                    {showAdvanced ? "Hide" : "Show"}
                                                </Button>
                                            </div>
                                        </CardHeader>
                                        {showAdvanced && (
                                            <CardContent className="space-y-4">
                                                <div className="space-y-3">
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-1">
                                                            <p className="text-sm">Retry Failed</p>
                                                            <Tooltip>
                                                                <TooltipTrigger asChild>
                                                                    <HelpCircle className="h-3 w-3 text-muted-foreground cursor-help" />
                                                                </TooltipTrigger>
                                                                <TooltipContent>
                                                                    <p>Automatically retry sending emails that failed due to temporary issues</p>
                                                                </TooltipContent>
                                                            </Tooltip>
                                                        </div>
                                                        <input
                                                            type="checkbox"
                                                            checked={data.retry_failed_emails}
                                                            onChange={(e) => setData("retry_failed_emails", e.target.checked)}
                                                            className="rounded"
                                                        />
                                                    </div>

                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-1">
                                                            <p className="text-sm">Pause on Errors</p>
                                                            <Tooltip>
                                                                <TooltipTrigger asChild>
                                                                    <HelpCircle className="h-3 w-3 text-muted-foreground cursor-help" />
                                                                </TooltipTrigger>
                                                                <TooltipContent>
                                                                    <p>Stop sending when errors occur to protect your sender reputation</p>
                                                                </TooltipContent>
                                                            </Tooltip>
                                                        </div>
                                                        <input
                                                            type="checkbox"
                                                            checked={data.pause_on_errors}
                                                            onChange={(e) => setData("pause_on_errors", e.target.checked)}
                                                            className="rounded"
                                                        />
                                                    </div>

                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-1">
                                                            <p className="text-sm">Error Notifications</p>
                                                            <Tooltip>
                                                                <TooltipTrigger asChild>
                                                                    <HelpCircle className="h-3 w-3 text-muted-foreground cursor-help" />
                                                                </TooltipTrigger>
                                                                <TooltipContent>
                                                                    <p>Get notified when sending errors happen so you can take action</p>
                                                                </TooltipContent>
                                                            </Tooltip>
                                                        </div>
                                                        <input
                                                            type="checkbox"
                                                            checked={data.notify_on_errors}
                                                            onChange={(e) => setData("notify_on_errors", e.target.checked)}
                                                            className="rounded"
                                                        />
                                                    </div>
                                                </div>

                                                {data.retry_failed_emails && (
                                                    <div className="space-y-1">
                                                        <div className="flex items-center gap-1">
                                                            <Label htmlFor="max_retry_attempts" className="text-sm">
                                                                Max Retries
                                                            </Label>
                                                            <Tooltip>
                                                                <TooltipTrigger asChild>
                                                                    <HelpCircle className="h-3 w-3 text-muted-foreground cursor-help" />
                                                                </TooltipTrigger>
                                                                <TooltipContent>
                                                                    <p>How many times to retry failed emails before giving up</p>
                                                                </TooltipContent>
                                                            </Tooltip>
                                                        </div>
                                                        <Input
                                                            id="max_retry_attempts"
                                                            type="number"
                                                            min="1"
                                                            max="5"
                                                            value={data.max_retry_attempts}
                                                            onChange={(e) => setData("max_retry_attempts", Number.parseInt(e.target.value) || 3)}
                                                            className="w-20"
                                                        />
                                                    </div>
                                                )}
                                            </CardContent>
                                        )}
                                    </Card>
                                </div>
                            </div>

                            {/* Full Width Sections */}
                            <div className="space-y-4 mt-6">
                                {/* Batching Guidelines */}
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Batching Guidelines</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div>
                                                <h4 className="font-medium mb-2">{batchingGuidelines.recommended_settings.title}</h4>
                                                <p className="text-sm text-muted-foreground mb-3">
                                                    {batchingGuidelines.recommended_settings.description}
                                                </p>
                                                <div className="space-y-1 text-sm">
                                                    <div>Batch Size: {batchingGuidelines.recommended_settings.batch_size} emails</div>
                                                    <div>Delay: {batchingGuidelines.recommended_settings.delay_minutes} minutes</div>
                                                    <div>Daily Limit: {batchingGuidelines.recommended_settings.daily_limit} emails</div>
                                                </div>
                                            </div>
                                            <div>
                                                <h4 className="font-medium mb-2">Campaign Examples</h4>
                                                <div className="space-y-2">
                                                    {batchingGuidelines.campaign_examples.map((example, index) => (
                                                        <div key={index} className="p-2 bg-muted/50 rounded text-sm">
                                                            <div className="font-medium">{example.name}</div>
                                                            <div className="text-muted-foreground">{example.description}</div>
                                                            <div className="text-xs mt-1">
                                                                {example.batches} batches • {example.total_time} total time
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Compliance */}
                                <Alert>
                                    <AlertCircle className="h-4 w-4" />
                                    <AlertDescription>
                                        <div className="flex items-start space-x-2">
                                            <Checkbox
                                                id="compliance_confirmed"
                                                checked={data.compliance_confirmed}
                                                onCheckedChange={(checked) => setData("compliance_confirmed", !!checked)}
                                                className={errors.compliance_confirmed ? "border-destructive" : ""}
                                            />
                                            <div className="flex items-start gap-1">
                                                <Label htmlFor="compliance_confirmed" className="text-sm leading-relaxed">
                                                    I confirm compliance with CAN-SPAM, GDPR, and email regulations. I will only send confirmation
                                                    emails to users who explicitly requested them.
                                                </Label>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <HelpCircle className="h-3 w-3 text-muted-foreground cursor-help mt-0.5" />
                                                    </TooltipTrigger>
                                                    <TooltipContent>
                                                        <p>Required legal confirmation for sending confirmation emails</p>
                                                    </TooltipContent>
                                                </Tooltip>
                                            </div>
                                        </div>
                                        {errors.compliance_confirmed && (
                                            <p className="text-xs text-destructive mt-1">{errors.compliance_confirmed}</p>
                                        )}
                                    </AlertDescription>
                                </Alert>

                                {/* Submit */}
                                <div className="flex justify-end">
                                    <Button type="submit" disabled={!isFormValid() || processing}>
                                        {processing ? (
                                            <>
                                                <Clock className="mr-2 h-4 w-4 animate-spin" />
                                                Saving...
                                            </>
                                        ) : (
                                            <>
                                                <Save className="mr-2 h-4 w-4" />
                                                Complete Setup
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </div>
                        </form>
                    </div>
                </TooltipProvider>
            </SettingsLayout>
        </AppLayout>
    )
}
