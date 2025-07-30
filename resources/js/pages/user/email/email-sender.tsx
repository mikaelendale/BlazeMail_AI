"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip"
import AppLayout from "@/layouts/app-layout" // Assuming this path is correct
import type { SharedData } from "@/types" // Assuming SharedData is defined in "@/types"
import { router, usePage } from "@inertiajs/react"
import { ArrowLeft, ArrowRight, Download, Eye, MailWarning, Search } from "lucide-react"
import { useMemo, useState } from "react"
import { toast } from "sonner"

interface Email {
    id: string
    name: string
    email: string
    provider: string // Added provider field
}

interface UserEmail {
    id: number
    subject: string
    email_content: string
    sender?: string
    recipient?: string
    tone?: string
    purpose?: string
    created_at?: string
    updated_at?: string
}

export default function EmailSender({
    userEmail,
    email_accounts,
    contacts,
}: { userEmail: UserEmail; email_accounts: Email[]; contacts: Email[] }) {
    const { customer, trialStatus } = usePage<SharedData>().props
    const [searchQuery, setSearchQuery] = useState("")
    const [selectedEmails, setSelectedEmails] = useState<string[]>([])
    const [showPreview, setShowPreview] = useState(false)

    const safeAccounts = email_accounts || []
    const [selectedAccount, setSelectedAccount] = useState<string | undefined>(
        safeAccounts.length > 0 ? safeAccounts[0].id.toString() : undefined,
    )

    const getProviderIcon = (provider: string) => {
        switch (provider) {
            case "gmail":
                return <img src="https://api.iconify.design/logos/google-icon.svg" className="h-4 w-4" alt="Gmail" />
            case "outlook":
                return <img src="https://api.iconify.design/logos/microsoft-icon.svg" className="h-4 w-4" alt="Outlook" />
            default:
                return <div className="h-2 w-2 rounded-full bg-gray-400" />
        }
    }

    const filteredEmails = useMemo(() => {
        return contacts.filter(
            (email) =>
                email.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                email.email.toLowerCase().includes(searchQuery.toLowerCase()),
        )
    }, [searchQuery, contacts])

    const availableCredits = customer?.credits || 0
    const creditsRequired = selectedEmails.length

    const handleEmailSelect = (emailId: string, checked: boolean) => {
        if (checked) {
            setSelectedEmails((prev) => [...prev, emailId])
        } else {
            setSelectedEmails((prev) => prev.filter((id) => id !== emailId))
        }
    }

    const handleSelectAll = () => {
        if (selectedEmails.length === filteredEmails.length) {
            setSelectedEmails([])
        } else {
            setSelectedEmails(filteredEmails.map((email) => email.id))
        }
    }

    const handleContinue = () => {
        if (creditsRequired > availableCredits) {
            toast("Insufficient Credits", {
                description: `You need ${creditsRequired} credits but only have ${availableCredits}. Please top up your credits.`,
                action: {
                    label: "Top Up",
                    onClick: () => router.get(route("billing.index")),
                },
            })
            return
        }
        if (!selectedAccount) {
            toast.error("No Email Account Selected", {
                description: "Please select an email account to send from.",
            })
            return
        }

        console.log("Sending email to:", selectedEmails)
        console.log("Email data:", userEmail)
        try {
            router.post(
                route("user.email.generate.send.bulk"),
                {
                    emailId: userEmail.id,
                    recipients: selectedEmails,
                    emailAccount: selectedAccount, // This will now be the ID string of the selected account
                },
                {
                    preserveScroll: true,
                    onSuccess: () => {
                        setSelectedEmails([])
                    },
                    onError: (errors) => {
                        // errors is an object: { field: [messages] }
                        const firstError =
                            typeof errors === "object" && errors !== null
                                ? Object.values(errors).flat()[0]
                                : "Unknown error";
                        toast.error(`Failed to send email: ${firstError}`);
                    }
                },
            )
        } catch (error: any) {
            console.error("Error sending email:", error)
            toast.error(`An error occurred while sending the email: ${error.message || "Unknown error"}.`)
        }
    }

    const shareToMailchimp = () => {
        const emailData = {
            subject: userEmail.subject,
            content: userEmail.email_content,
            recipients: selectedEmails.length,
        }
        const mailchimpUrl = `https://us1.admin.mailchimp.com/campaigns/wizard/neapolitan?id=create`
        const clipboardData = `Subject: ${userEmail.subject}\n\nContent:\n${userEmail.email_content}`
        navigator.clipboard.writeText(clipboardData)
        window.open(mailchimpUrl, "_blank")
        toast("Mailchimp Integration", {
            description: "Email content copied to clipboard. Paste it in Mailchimp campaign editor.",
        })
    }

    const shareToSendGrid = () => {
        const sendGridUrl = `https://app.sendgrid.com/marketing/campaigns`
        const clipboardData = `Subject: ${userEmail.subject}\n\nContent:\n${userEmail.email_content}`
        navigator.clipboard.writeText(clipboardData)
        window.open(sendGridUrl, "_blank")
        toast("SendGrid Integration", {
            description: "Email content copied to clipboard. Create a new campaign in SendGrid.",
        })
    }

    const shareToHubSpot = () => {
        const hubspotUrl = `https://app.hubspot.com/marketing-email/`
        const clipboardData = `Subject: ${userEmail.subject}\n\nContent:\n${userEmail.email_content}`
        navigator.clipboard.writeText(clipboardData)
        window.open(hubspotUrl, "_blank")
        toast("HubSpot Integration", {
            description: "Email content copied to clipboard. Create a new email in HubSpot.",
        })
    }

    const shareToConvertKit = () => {
        const convertKitUrl = `https://app.convertkit.com/campaigns/new`
        const clipboardData = `Subject: ${userEmail.subject}\n\nContent:\n${userEmail.email_content}`
        navigator.clipboard.writeText(clipboardData)
        window.open(convertKitUrl, "_blank")
        toast("ConvertKit Integration", {
            description: "Email data copied as JSON. Create a new broadcast in ConvertKit.",
        })
    }

    const shareToZapier = () => {
        const zapierUrl = `https://zapier.com/app/zaps`
        const webhookData = {
            subject: userEmail.subject,
            content: userEmail.email_content,
            sender: userEmail.sender,
            recipients: selectedEmails.length,
            timestamp: new Date().toISOString(),
        }
        navigator.clipboard.writeText(JSON.stringify(webhookData, null, 2))
        window.open(zapierUrl, "_blank")
        toast("Zapier Integration", {
            description: "Email data copied as JSON. Use it in your Zapier webhook or integration.",
        })
    }

    const exportEmail = () => {
        const emailData = {
            id: userEmail.id,
            subject: userEmail.subject,
            content: userEmail.email_content,
            sender: userEmail.sender,
            tone: userEmail.tone,
            purpose: userEmail.purpose,
            created_at: userEmail.created_at,
            selected_recipients: selectedEmails.length,
            export_date: new Date().toISOString(),
        }
        const dataStr = JSON.stringify(emailData, null, 2)
        const dataUri = "data:application/json;charset=utf-8," + encodeURIComponent(dataStr)
        const exportFileDefaultName = `email-${userEmail.id}-${new Date().toISOString().split("T")[0]}.json`
        const linkElement = document.createElement("a")
        linkElement.setAttribute("href", dataUri)
        linkElement.setAttribute("download", exportFileDefaultName)
        linkElement.click()
        toast("Email Exported", {
            description: `Email data exported as ${exportFileDefaultName}`,
        })
    }

    const isSendDisabled = selectedEmails.length === 0 || creditsRequired > availableCredits || !selectedAccount

    return (
        <AppLayout>
            <TooltipProvider>
                <div className="container mx-auto max-w-lg space-y-4 py-15">
                    {/* Platform Icons - Above Email Preview */}
                    <div className="flex items-center justify-between">
                        {/* Back Button on the left */}
                        <Button
                            variant="outline"
                            size="sm"
                            className="px-3 bg-transparent flex items-center"
                            onClick={() => window.history.back()}
                            title="Back"
                        >
                            <ArrowLeft />
                            <span className="hidden sm:inline ml-1">Back</span>
                        </Button>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                {/* Ensure Button is a valid React element */}
                                <span>
                                    <Button
                                        size="sm"
                                        className="px-3 font-semibold text-white bg-gradient-to-r from-orange-500 via-orange-400 to-orange-600 shadow-lg hover:from-orange-600 hover:via-orange-500 hover:to-orange-700 transition-all duration-200 border-0"
                                        onClick={() => router.get(route("user.email.campaign.create"))}
                                    >
                                        Try Campaign
                                    </Button>
                                </span>
                            </TooltipTrigger>
                            <TooltipContent>Create a campaign instead of sending a single email</TooltipContent>
                        </Tooltip>
                        {/* Platform Icons on the right */}
                        {customer.plan !== "free" && (
                            <div className="flex gap-1.5">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 p-0 hover:bg-yellow-100 dark:hover:bg-yellow-900/20"
                                    title="Share to Mailchimp"
                                    onClick={shareToMailchimp}
                                >
                                    <img
                                        src="https://cdn.simpleicons.org/mailchimp/241C1C"
                                        alt="Mailchimp"
                                        className="h-4 w-4 dark:invert"
                                    />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 p-0 hover:bg-blue-100 dark:hover:bg-blue-900/20"
                                    title="Share to SendGrid"
                                    onClick={shareToSendGrid}
                                >
                                    <img
                                        src="https://cdn.simpleicons.org/sendgrid/00B5E2"
                                        alt="SendGrid"
                                        className="h-4 w-4 dark:invert"
                                    />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 p-0 hover:bg-orange-100 dark:hover:bg-orange-900/20"
                                    title="Share to HubSpot"
                                    onClick={shareToHubSpot}
                                >
                                    <img src="https://cdn.simpleicons.org/hubspot/FF7A59" alt="HubSpot" className="h-4 w-4 dark:invert" />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 p-0 hover:bg-pink-100 dark:hover:bg-pink-900/20"
                                    title="Share to ConvertKit"
                                    onClick={shareToConvertKit}
                                >
                                    <img
                                        src="https://logo.clearbit.com/convertkit.com"
                                        alt="ConvertKit"
                                        className="h-4 w-4 dark:invert"
                                    />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 p-0 hover:bg-orange-100 dark:hover:bg-orange-900/20"
                                    title="Share to Zapier"
                                    onClick={shareToZapier}
                                >
                                    <img src="https://cdn.simpleicons.org/zapier/FF4F00" alt="Zapier" className="h-4 w-4 dark:invert" />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 p-0 hover:bg-green-100 dark:hover:bg-green-900/20 hidden sm:inline-flex"
                                    title="Export Email"
                                    onClick={exportEmail}
                                >
                                    <Download className="h-4 w-4 text-green-600 dark:text-green-400" />
                                </Button>
                            </div>
                        )}
                    </div>
                    {/* Email Preview Card */}
                    <Card className="bg-primary-foreground">
                        <CardContent className="p-3">
                            <div className="space-y-3">
                                <div className="flex items-start justify-between gap-2">
                                    <div className="flex min-w-0 flex-1 items-start gap-2">
                                        <div className="min-w-0 flex-1">
                                            <p className="line-clamp-2 text-sm leading-tight font-medium">
                                                {userEmail.subject || "No Subject"}
                                            </p>
                                            <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                                                {userEmail.email_content?.substring(0, 100)}...
                                            </p>
                                        </div>
                                    </div>
                                    <Dialog open={showPreview} onOpenChange={setShowPreview}>
                                        <DialogTrigger asChild>
                                            <Button variant="ghost" size="sm" className="h-7 w-7 flex-shrink-0 p-0">
                                                <Eye className="h-3.5 w-3.5" />
                                            </Button>
                                        </DialogTrigger>
                                        <DialogContent className="container max-h-[80vh] max-w-2xl">
                                            <DialogHeader>
                                                <DialogTitle className="flex items-center gap-2">Email Preview</DialogTitle>
                                                <DialogDescription>Review your email before sending to recipients</DialogDescription>
                                            </DialogHeader>
                                            <div className="space-y-4">
                                                {/* Email Metadata */}
                                                <div className="flex flex-wrap gap-2">
                                                    {userEmail.tone && (
                                                        <Badge variant="default" className="text-xs">
                                                            {userEmail.tone}
                                                        </Badge>
                                                    )}
                                                    {userEmail.purpose && (
                                                        <Badge variant="outline" className="text-xs">
                                                            {userEmail.purpose}
                                                        </Badge>
                                                    )}
                                                </div>
                                                {/* Subject */}
                                                <div className="space-y-2">
                                                    <label className="text-sm font-medium text-muted-foreground">Subject</label>
                                                    <div className="rounded-lg border bg-muted/50 p-3">
                                                        <p className="font-semibold">{userEmail.subject}</p>
                                                    </div>
                                                </div>
                                                {/* Email Content */}
                                                <div className="space-y-2">
                                                    <label className="text-sm font-medium text-muted-foreground">Email Content</label>
                                                    <ScrollArea className="h-64 rounded-lg border bg-muted/50 p-4">
                                                        <pre className="text-sm leading-relaxed whitespace-pre-wrap">{userEmail.email_content}</pre>
                                                    </ScrollArea>
                                                </div>
                                                {/* Sender Info */}
                                                {userEmail.sender && (
                                                    <div className="space-y-2">
                                                        <label className="text-sm font-medium text-muted-foreground">From</label>
                                                        <p className="text-sm">{userEmail.sender}</p>
                                                    </div>
                                                )}
                                            </div>
                                        </DialogContent>
                                    </Dialog>
                                </div>
                                {selectedEmails.length > 0 && (
                                    <div className="flex items-center justify-between border-t pt-2">
                                        <p className="text-xs text-muted-foreground">
                                            {selectedEmails.length} recipient{selectedEmails.length !== 1 ? "s" : ""} selected
                                        </p>
                                        <Badge variant="outline" className="text-xs">
                                            Ready to send
                                        </Badge>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                    {/* Email Account Selector (Shancn Select) */}
                    <div className="flex items-center gap-2">
                        
                    </div>
                    {/* Search Bar */}
                    <div className="flex gap-2">
                        {/* Search Bar - left half */}
                        <div className="flex-1 relative"> 
                            <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                placeholder="Search contacts..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="h-9 rounded-full pr-3 pl-9 text-sm"
                            />
                        </div>
                        {/* Account Selector - right half */}
                        <div className="flex-1">
                            <Select value={selectedAccount} onValueChange={(value) => setSelectedAccount(value)}>
                                <SelectTrigger className="w-full rounded-2xl">
                                    <SelectValue placeholder="Select an account" />
                                </SelectTrigger>
                                <SelectContent>
                                    {safeAccounts.map((account) => (
                                        <SelectItem key={account.id} value={account.id.toString()}>
                                            <div className="flex items-center gap-2">
                                                {getProviderIcon(account.provider)}
                                                <span className="truncate">{account.email}</span>
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    {/* Select All Option */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                            <Checkbox
                                checked={selectedEmails.length === filteredEmails.length && filteredEmails.length > 0}
                                onCheckedChange={handleSelectAll}
                                className="h-4 w-4"
                            />
                            <label className="text-sm font-medium">Select all ({filteredEmails.length})</label>
                        </div>
                        {selectedEmails.length > 0 && (
                            <Button variant="ghost" size="sm" onClick={() => setSelectedEmails([])} className="h-7 text-xs">
                                Clear selection
                            </Button>
                        )}
                    </div>
                    {/* Contact List */}
                    <Card>
                        <CardContent className="p-0">
                            <ScrollArea className="h-64">
                                <div className="space-y-0.5 p-2">
                                    {filteredEmails.length === 0 ? (
                                        <div className="flex h-32 items-center justify-center text-muted-foreground">
                                            <p className="text-sm">
                                                {contacts.length === 0
                                                    ? "No contacts found. Add some contacts first."
                                                    : "No contacts match your search."}
                                            </p>
                                        </div>
                                    ) : (
                                        filteredEmails.map((contact) => (
                                            <div
                                                key={contact.id}
                                                className="flex items-center space-x-2 rounded-md p-2 transition-colors hover:bg-muted/50"
                                            >
                                                <Checkbox
                                                    checked={selectedEmails.includes(contact.id)}
                                                    onCheckedChange={(checked) => handleEmailSelect(contact.id, checked as boolean)}
                                                    className="h-4 w-4"
                                                />
                                                <div className="min-w-0 flex-1">
                                                    <p className="truncate text-xs text-muted-foreground">{contact.name}</p>
                                                    <p className="truncate text-sm font-medium">{contact.email}</p>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </ScrollArea>
                        </CardContent>
                    </Card>
                    {/* Continue Button and Credit Info */}
                    <div className="flex flex-col gap-2 sm:flex-row sm:justify-between">
                        <div className="flex flex-col gap-2">
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <span>
                                        <Button className="flex h-8 items-center gap-1.5 px-3 text-sm text-white" variant={"destructive"}>
                                            <MailWarning />
                                            Deliverability check (in V2)
                                        </Button>
                                    </span>
                                </TooltipTrigger>
                                <TooltipContent>Coming soon</TooltipContent>
                            </Tooltip>
                            <div className="text-xs text-muted-foreground">
                                <p>Available Credits: {availableCredits}</p>
                                <p>Credits Required: {creditsRequired}</p>
                            </div>
                        </div>
                        <div className="flex">
                            <Tooltip delayDuration={200}>
                                <TooltipTrigger asChild>
                                    <span>
                                        <Button
                                            className="flex h-8 items-center gap-1.5 px-3 text-sm"
                                            disabled={isSendDisabled}
                                            onClick={handleContinue}
                                        >
                                            Send to {selectedEmails.length} recipient{selectedEmails.length !== 1 ? "s" : ""}
                                            <ArrowRight className="h-3.5 w-3.5" />
                                        </Button>
                                    </span>
                                </TooltipTrigger>
                                {isSendDisabled && selectedEmails.length > 0 && creditsRequired > availableCredits && (
                                    <TooltipContent className="bg-red-500 text-white">
                                        Insufficient credits. You need {creditsRequired} but have {availableCredits}.
                                    </TooltipContent>
                                )}
                                {isSendDisabled && selectedEmails.length === 0 && (
                                    <TooltipContent>Select recipients to send emails.</TooltipContent>
                                )}
                                {isSendDisabled && !selectedAccount && (
                                    <TooltipContent>Please select an email account to send from.</TooltipContent>
                                )}
                            </Tooltip>
                        </div>
                    </div>
                    {/* Email Stats */}
                    <div className="text-center">
                        <p className="text-xs text-muted-foreground">
                            Email Created at: {userEmail.created_at ? new Date(userEmail.created_at).toLocaleDateString() : "Unknown"}
                        </p>
                    </div>
                </div>
            </TooltipProvider>
        </AppLayout>
    )
}
