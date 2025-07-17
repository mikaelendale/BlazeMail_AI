"use client"

import type React from "react"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import AppLayout from "@/layouts/app-layout"
import SettingsLayout from "@/layouts/settings/layout"
import { useForm } from "@inertiajs/react"
import { AlertCircle, CheckCircle, Clock, Mail, Save, Settings, Shield, TrendingUp, Zap } from "lucide-react"
import { useState } from "react"

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
    warmup_enabled: boolean
    warmup_daily_volume: number
    warmup_timezone: string
    warmup_template_style: string
    auto_unsubscribe: boolean
    tracking_enabled: boolean
    compliance_confirmed: boolean
    max_emails_per_day: number
    send_window_start: string
    send_window_end: string
    retry_failed_emails: boolean
    max_retry_attempts: number
    pause_on_errors: boolean
    notify_on_errors: boolean
}

interface Props {
    account: EmailAccount
    setupData: SetupData
    isSetupComplete: boolean
    timezones: Record<string, string>
    templateStyles: Record<string, { name: string; description: string }>
    breadcrumbs: Array<{ title: string; href: string }>
}

export default function EmailAccountSetup({
    account,
    setupData,
    isSetupComplete,
    timezones,
    templateStyles,
    breadcrumbs,
}: Props) {
    const [currentStep, setCurrentStep] = useState(1)
    const totalSteps = 5

    const { data, setData, post, processing, errors, reset } = useForm<SetupData>(setupData)

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        post(`/settings/email-accounts/${account.id}/setup`, {
            preserveScroll: true,
            onSuccess: () => {
                // Will redirect to accounts page with success message
            },
            onError: (errors) => {
                console.error("Setup failed:", errors)
            },
        })
    }

    const getStepIcon = (step: number) => {
        switch (step) {
            case 1:
                return <Mail className="h-5 w-5" />
            case 2:
                return <TrendingUp className="h-5 w-5" />
            case 3:
                return <Shield className="h-5 w-5" />
            case 4:
                return <Settings className="h-5 w-5" />
            case 5:
                return <Zap className="h-5 w-5" />
            default:
                return <Settings className="h-5 w-5" />
        }
    }

    const getStepTitle = (step: number) => {
        switch (step) {
            case 1:
                return "Sender Profile"
            case 2:
                return "Warm-up Settings"
            case 3:
                return "Compliance & Safety"
            case 4:
                return "Sending Limits"
            case 5:
                return "Fallback Behavior"
            default:
                return "Setup"
        }
    }

    const isStepComplete = (step: number) => {
        switch (step) {
            case 1:
                return data.sender_name && data.reply_to_email
            case 2:
                return data.warmup_timezone && data.warmup_template_style
            case 3:
                return data.compliance_confirmed
            case 4:
                return data.max_emails_per_day > 0 && data.send_window_start && data.send_window_end
            case 5:
                return data.max_retry_attempts > 0
            default:
                return false
        }
    }

    const canProceedToNext = () => {
        return isStepComplete(currentStep)
    }

    const allStepsComplete = () => {
        for (let i = 1; i <= totalSteps; i++) {
            if (!isStepComplete(i)) return false
        }
        return true
    }

    return (
        <AppLayout>
            <SettingsLayout>
                <div className="max-w-4xl mx-auto space-y-6">
                    {/* Header */}
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-foreground">Email Account Setup</h1>
                            <p className="text-muted-foreground">
                                Configure your email account: <span className="font-medium">{account.email}</span>
                            </p>
                        </div>
                        {isSetupComplete && (
                            <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                                <CheckCircle className="mr-1 h-3 w-3" />
                                Setup Complete
                            </Badge>
                        )}
                    </div>

                    {/* Progress Steps */}
                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between mb-6">
                                {Array.from({ length: totalSteps }, (_, i) => i + 1).map((step) => (
                                    <div key={step} className="flex items-center">
                                        <button
                                            onClick={() => setCurrentStep(step)}
                                            className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors ${step === currentStep
                                                    ? "border-primary bg-primary text-primary-foreground"
                                                    : isStepComplete(step)
                                                        ? "border-green-500 bg-green-500 text-white"
                                                        : "border-muted bg-background text-muted-foreground hover:border-primary/50"
                                                }`}
                                        >
                                            {isStepComplete(step) ? <CheckCircle className="h-5 w-5" /> : getStepIcon(step)}
                                        </button>
                                        {step < totalSteps && (
                                            <div className={`w-16 h-0.5 mx-2 ${isStepComplete(step) ? "bg-green-500" : "bg-muted"}`} />
                                        )}
                                    </div>
                                ))}
                            </div>
                            <div className="text-center">
                                <h3 className="font-medium text-foreground">{getStepTitle(currentStep)}</h3>
                                <p className="text-sm text-muted-foreground">
                                    Step {currentStep} of {totalSteps}
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Setup Form */}
                    <form onSubmit={handleSubmit}>
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    {getStepIcon(currentStep)}
                                    {getStepTitle(currentStep)}
                                </CardTitle>
                                <CardDescription>
                                    {currentStep === 1 && "Configure your sender identity and email signature"}
                                    {currentStep === 2 && "Set up email warm-up to improve deliverability"}
                                    {currentStep === 3 && "Ensure compliance with email regulations"}
                                    {currentStep === 4 && "Define your sending limits and schedule"}
                                    {currentStep === 5 && "Configure error handling and retry behavior"}
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                {/* Step 1: Sender Profile */}
                                {currentStep === 1 && (
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="sender_name">Sender Name *</Label>
                                                <Input
                                                    id="sender_name"
                                                    value={data.sender_name}
                                                    onChange={(e) => setData("sender_name", e.target.value)}
                                                    placeholder="Your Name or Company"
                                                    className={errors.sender_name ? "border-red-500" : ""}
                                                />
                                                {errors.sender_name && <p className="text-sm text-red-500">{errors.sender_name}</p>}
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="from_email">From Email</Label>
                                                <Input id="from_email" value={data.from_email} disabled className="bg-muted" />
                                                <p className="text-xs text-muted-foreground">This is your connected email address</p>
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="reply_to_email">Reply-To Email *</Label>
                                            <Input
                                                id="reply_to_email"
                                                type="email"
                                                value={data.reply_to_email}
                                                onChange={(e) => setData("reply_to_email", e.target.value)}
                                                placeholder="replies@yourdomain.com"
                                                className={errors.reply_to_email ? "border-red-500" : ""}
                                            />
                                            {errors.reply_to_email && <p className="text-sm text-red-500">{errors.reply_to_email}</p>}
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="signature">Email Signature (Optional)</Label>
                                            <Textarea
                                                id="signature"
                                                value={data.signature}
                                                onChange={(e) => setData("signature", e.target.value)}
                                                placeholder="Best regards,&#10;Your Name&#10;Your Company"
                                                rows={4}
                                                className={errors.signature ? "border-red-500" : ""}
                                            />
                                            {errors.signature && <p className="text-sm text-red-500">{errors.signature}</p>}
                                        </div>
                                    </div>
                                )}

                                {/* Step 2: Warm-up Settings */}
                                {currentStep === 2 && (
                                    <div className="space-y-6">
                                        <div className="flex items-center justify-between p-4 border rounded-lg">
                                            <div>
                                                <h4 className="font-medium">Enable Email Warm-up</h4>
                                                <p className="text-sm text-muted-foreground">
                                                    Gradually increase sending volume to improve deliverability
                                                </p>
                                            </div>
                                            <Switch
                                                checked={data.warmup_enabled}
                                                onCheckedChange={(checked) => setData("warmup_enabled", checked)}
                                            />
                                        </div>

                                        {data.warmup_enabled && (
                                            <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <div className="space-y-2">
                                                        <Label htmlFor="warmup_daily_volume">Daily Warm-up Volume</Label>
                                                        <Input
                                                            id="warmup_daily_volume"
                                                            type="number"
                                                            min="5"
                                                            max="200"
                                                            value={data.warmup_daily_volume}
                                                            onChange={(e) => setData("warmup_daily_volume", Number.parseInt(e.target.value) || 30)}
                                                            className={errors.warmup_daily_volume ? "border-red-500" : ""}
                                                        />
                                                        <p className="text-xs text-muted-foreground">
                                                            Start with 5-10 emails, gradually increase to this amount
                                                        </p>
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label htmlFor="warmup_timezone">Timezone</Label>
                                                        <Select
                                                            value={data.warmup_timezone}
                                                            onValueChange={(value) => setData("warmup_timezone", value)}
                                                        >
                                                            <SelectTrigger className={errors.warmup_timezone ? "border-red-500" : ""}>
                                                                <SelectValue placeholder="Select timezone" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                {Object.entries(timezones).map(([key, label]) => (
                                                                    <SelectItem key={key} value={key}>
                                                                        {label}
                                                                    </SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                </div>
                                                <div className="space-y-2">
                                                    <Label>Email Template Style</Label>
                                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                                        {Object.entries(templateStyles).map(([key, style]) => (
                                                            <button
                                                                key={key}
                                                                type="button"
                                                                onClick={() => setData("warmup_template_style", key)}
                                                                className={`p-3 border rounded-lg text-left transition-colors ${data.warmup_template_style === key
                                                                        ? "border-primary bg-primary/5"
                                                                        : "border-border hover:bg-muted/50"
                                                                    }`}
                                                            >
                                                                <h5 className="font-medium">{style.name}</h5>
                                                                <p className="text-xs text-muted-foreground">{style.description}</p>
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Step 3: Compliance & Safety */}
                                {currentStep === 3 && (
                                    <div className="space-y-6">
                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between p-4 border rounded-lg">
                                                <div>
                                                    <h4 className="font-medium">Auto-append Unsubscribe Link</h4>
                                                    <p className="text-sm text-muted-foreground">
                                                        Automatically add unsubscribe links to all emails
                                                    </p>
                                                </div>
                                                <Switch
                                                    checked={data.auto_unsubscribe}
                                                    onCheckedChange={(checked) => setData("auto_unsubscribe", checked)}
                                                />
                                            </div>

                                            <div className="flex items-center justify-between p-4 border rounded-lg">
                                                <div>
                                                    <h4 className="font-medium">Email Tracking</h4>
                                                    <p className="text-sm text-muted-foreground">Track email opens and link clicks</p>
                                                </div>
                                                <Switch
                                                    checked={data.tracking_enabled}
                                                    onCheckedChange={(checked) => setData("tracking_enabled", checked)}
                                                />
                                            </div>
                                        </div>

                                        <Alert>
                                            <AlertCircle className="h-4 w-4" />
                                            <AlertDescription>
                                                <div className="space-y-3">
                                                    <p className="font-medium">Email Compliance Confirmation</p>
                                                    <div className="flex items-start space-x-2">
                                                        <Checkbox
                                                            id="compliance_confirmed"
                                                            checked={data.compliance_confirmed}
                                                            onCheckedChange={(checked) => setData("compliance_confirmed", !!checked)}
                                                            className={errors.compliance_confirmed ? "border-red-500" : ""}
                                                        />
                                                        <Label htmlFor="compliance_confirmed" className="text-sm leading-relaxed">
                                                            I confirm that my email sending complies with applicable laws including CAN-SPAM Act,
                                                            GDPR, and other email regulations. I will only send emails to recipients who have given
                                                            consent to receive them.
                                                        </Label>
                                                    </div>
                                                    {errors.compliance_confirmed && (
                                                        <p className="text-sm text-red-500">{errors.compliance_confirmed}</p>
                                                    )}
                                                </div>
                                            </AlertDescription>
                                        </Alert>
                                    </div>
                                )}

                                {/* Step 4: Sending Limits */}
                                {currentStep === 4 && (
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="max_emails_per_day">Maximum Emails Per Day</Label>
                                            <Input
                                                id="max_emails_per_day"
                                                type="number"
                                                min="10"
                                                max="1000"
                                                value={data.max_emails_per_day}
                                                onChange={(e) => setData("max_emails_per_day", Number.parseInt(e.target.value) || 50)}
                                                className={errors.max_emails_per_day ? "border-red-500" : ""}
                                            />
                                            <p className="text-xs text-muted-foreground">
                                                Recommended: Gmail (50-150), Outlook (100-300), Custom SMTP (varies)
                                            </p>
                                            {errors.max_emails_per_day && <p className="text-sm text-red-500">{errors.max_emails_per_day}</p>}
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="send_window_start">Send Window Start</Label>
                                                <Input
                                                    id="send_window_start"
                                                    type="time"
                                                    value={data.send_window_start}
                                                    onChange={(e) => setData("send_window_start", e.target.value)}
                                                    className={errors.send_window_start ? "border-red-500" : ""}
                                                />
                                                {errors.send_window_start && <p className="text-sm text-red-500">{errors.send_window_start}</p>}
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="send_window_end">Send Window End</Label>
                                                <Input
                                                    id="send_window_end"
                                                    type="time"
                                                    value={data.send_window_end}
                                                    onChange={(e) => setData("send_window_end", e.target.value)}
                                                    className={errors.send_window_end ? "border-red-500" : ""}
                                                />
                                                {errors.send_window_end && <p className="text-sm text-red-500">{errors.send_window_end}</p>}
                                            </div>
                                        </div>
                                        <p className="text-xs text-muted-foreground">
                                            Emails will only be sent during this time window (in your account timezone)
                                        </p>
                                    </div>
                                )}

                                {/* Step 5: Fallback Behavior */}
                                {currentStep === 5 && (
                                    <div className="space-y-6">
                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between p-4 border rounded-lg">
                                                <div>
                                                    <h4 className="font-medium">Retry Failed Emails</h4>
                                                    <p className="text-sm text-muted-foreground">Automatically retry sending failed emails</p>
                                                </div>
                                                <Switch
                                                    checked={data.retry_failed_emails}
                                                    onCheckedChange={(checked) => setData("retry_failed_emails", checked)}
                                                />
                                            </div>

                                            {data.retry_failed_emails && (
                                                <div className="space-y-2 ml-4">
                                                    <Label htmlFor="max_retry_attempts">Maximum Retry Attempts</Label>
                                                    <Input
                                                        id="max_retry_attempts"
                                                        type="number"
                                                        min="1"
                                                        max="10"
                                                        value={data.max_retry_attempts}
                                                        onChange={(e) => setData("max_retry_attempts", Number.parseInt(e.target.value) || 3)}
                                                        className={`max-w-32 ${errors.max_retry_attempts ? "border-red-500" : ""}`}
                                                    />
                                                    {errors.max_retry_attempts && (
                                                        <p className="text-sm text-red-500">{errors.max_retry_attempts}</p>
                                                    )}
                                                </div>
                                            )}

                                            <div className="flex items-center justify-between p-4 border rounded-lg">
                                                <div>
                                                    <h4 className="font-medium">Pause on Errors</h4>
                                                    <p className="text-sm text-muted-foreground">
                                                        Automatically pause campaigns when errors occur
                                                    </p>
                                                </div>
                                                <Switch
                                                    checked={data.pause_on_errors}
                                                    onCheckedChange={(checked) => setData("pause_on_errors", checked)}
                                                />
                                            </div>

                                            <div className="flex items-center justify-between p-4 border rounded-lg">
                                                <div>
                                                    <h4 className="font-medium">Error Notifications</h4>
                                                    <p className="text-sm text-muted-foreground">
                                                        Receive notifications when sending errors occur
                                                    </p>
                                                </div>
                                                <Switch
                                                    checked={data.notify_on_errors}
                                                    onCheckedChange={(checked) => setData("notify_on_errors", checked)}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Navigation */}
                        <div className="flex items-center justify-between">
                            <div className="flex gap-2">
                                {currentStep > 1 && (
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => setCurrentStep(currentStep - 1)}
                                        disabled={processing}
                                    >
                                        Previous
                                    </Button>
                                )}
                            </div>

                            <div className="flex gap-2">
                                {currentStep < totalSteps ? (
                                    <Button
                                        type="button"
                                        onClick={() => setCurrentStep(currentStep + 1)}
                                        disabled={!canProceedToNext() || processing}
                                    >
                                        Next
                                    </Button>
                                ) : (
                                    <Button type="submit" disabled={!allStepsComplete() || processing} className="min-w-32">
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
                                )}
                            </div>
                        </div>
                    </form>
                </div>
            </SettingsLayout>
        </AppLayout>
    )
}
