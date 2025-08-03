"use client"
import { useState } from "react"
import { Head, router } from "@inertiajs/react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { CheckCircle, XCircle, Clock, Send, Eye, BarChart3, Users, Mail } from "lucide-react"
import AppLayout from "@/layouts/app-layout"

interface Email {
    id: number
    contact_name: string
    contact_email: string
    contact_company: string
    contact_job_title: string
    subject: string
    body: string
    personalization_score: number
    model_used: string
    status: "pending" | "approved" | "sent" | "failed"
    personalization_metadata: {
        key_personalizations: string[]
        psychological_triggers: string[]
        industry_insights: string[]
        role_adaptations: string[]
    }
    created_at: string
}

interface Props {
    batchId: string
    emails: Email[]
    stats: {
        total: number
        pending: number
        approved: number
        sent: number
        failed: number
        avg_score: number
        models_used: Record<string, number>
    }
    emailTemplate: {
        id: number
        subject: string
        purpose: string
    }
}

export default function EmailReview({ batchId, emails, stats, emailTemplate }: Props) {
    const [selectedEmails, setSelectedEmails] = useState<number[]>([])
    const [previewEmail, setPreviewEmail] = useState<Email | null>(null)
    const [loading, setLoading] = useState(false)

    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            setSelectedEmails(emails.filter((e) => e.status === "pending").map((e) => e.id))
        } else {
            setSelectedEmails([])
        }
    }

    const handleSelectEmail = (emailId: number, checked: boolean) => {
        if (checked) {
            setSelectedEmails([...selectedEmails, emailId])
        } else {
            setSelectedEmails(selectedEmails.filter((id) => id !== emailId))
        }
    }

    const handleApproveSelected = async () => {
        if (selectedEmails.length === 0) return
        setLoading(true)
        try {
            await router.patch(`/emails/review/${batchId}/status`, {
                email_ids: selectedEmails,
                status: "approved",
            })
            setSelectedEmails([])
        } catch (error) {
            console.error("Failed to approve emails:", error)
        } finally {
            setLoading(false)
        }
    }

    const handleSendApproved = async () => {
        setLoading(true)
        try {
            await router.post(`/emails/review/${batchId}/send`)
        } catch (error) {
            console.error("Failed to send emails:", error)
        } finally {
            setLoading(false)
        }
    }

    const getStatusIcon = (status: string) => {
        switch (status) {
            case "approved":
                return <CheckCircle className="h-4 w-4 text-green-600" />
            case "sent":
                return <Send className="h-4 w-4 text-blue-600" />
            case "failed":
                return <XCircle className="h-4 w-4 text-destructive" />
            default:
                return <Clock className="h-4 w-4 text-yellow-600" />
        }
    }

    const getScoreBadge = (score: number) => {
        if (score >= 90) return "default"
        if (score >= 80) return "secondary"
        if (score >= 70) return "outline"
        return "destructive"
    }

    const pendingEmails = emails.filter((e) => e.status === "pending")

    return (
        <AppLayout>
            <Head title="Review Personalized Emails" />

            <div className="min-h-screen bg-muted/30">
                <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
                    {/* Header */}
                    <div className="space-y-2">
                        <h1 className="text-2xl font-bold tracking-tight">Email Review</h1>
                        <p className="text-muted-foreground">
                            Template: <span className="font-medium text-foreground">{emailTemplate.subject}</span>
                        </p>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        <Card className="border-0 shadow-sm">
                            <CardContent className="p-4">
                                <div className="flex items-center space-x-3">
                                    <div className="p-2 bg-blue-100 rounded-lg">
                                        <Users className="h-5 w-5 text-blue-600" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground">Total</p>
                                        <p className="text-xl font-bold">{stats.total}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-0 shadow-sm">
                            <CardContent className="p-4">
                                <div className="flex items-center space-x-3">
                                    <div className="p-2 bg-green-100 rounded-lg">
                                        <BarChart3 className="h-5 w-5 text-green-600" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground">Avg Score</p>
                                        <p className="text-xl font-bold">{stats.avg_score}%</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-0 shadow-sm">
                            <CardContent className="p-4">
                                <div className="flex items-center space-x-3">
                                    <div className="p-2 bg-emerald-100 rounded-lg">
                                        <CheckCircle className="h-5 w-5 text-emerald-600" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground">Approved</p>
                                        <p className="text-xl font-bold">{stats.approved}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-0 shadow-sm">
                            <CardContent className="p-4">
                                <div className="flex items-center space-x-3">
                                    <div className="p-2 bg-purple-100 rounded-lg">
                                        <Send className="h-5 w-5 text-purple-600" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground">Sent</p>
                                        <p className="text-xl font-bold">{stats.sent}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Action Bar */}
                    <Card className="border-0 shadow-sm">
                        <CardContent className="p-4">
                            <div className="flex flex-col sm:flex-row gap-3">
                                <Button
                                    onClick={handleApproveSelected}
                                    disabled={selectedEmails.length === 0 || loading}
                                    className="flex-1 sm:flex-none"
                                >
                                    <CheckCircle className="h-4 w-4 mr-2" />
                                    Approve Selected ({selectedEmails.length})
                                </Button>
                                <Button
                                    onClick={handleSendApproved}
                                    disabled={stats.approved === 0 || loading}
                                    variant="secondary"
                                    className="flex-1 sm:flex-none"
                                >
                                    <Send className="h-4 w-4 mr-2" />
                                    Send Approved ({stats.approved})
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Email List */}
                    <Card className="border-0 shadow-sm">
                        <CardHeader className="pb-4">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <CardTitle className="text-lg">Personalized Emails</CardTitle>
                                {pendingEmails.length > 0 && (
                                    <div className="flex items-center space-x-2">
                                        <Checkbox
                                            checked={selectedEmails.length === pendingEmails.length}
                                            onCheckedChange={handleSelectAll}
                                        />
                                        <span className="text-sm text-muted-foreground">Select All Pending ({pendingEmails.length})</span>
                                    </div>
                                )}
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {emails.map((email) => (
                                <Card key={email.id} className="border border-border/50 hover:border-border transition-colors">
                                    <CardContent className="p-4">
                                        <div className="flex flex-col lg:flex-row lg:items-start gap-4">
                                            {/* Left: Checkbox and Contact Info */}
                                            <div className="flex items-start space-x-3 flex-1">
                                                {email.status === "pending" && (
                                                    <Checkbox
                                                        checked={selectedEmails.includes(email.id)}
                                                        onCheckedChange={(checked) => handleSelectEmail(email.id, checked as boolean)}
                                                        className="mt-1"
                                                    />
                                                )}
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center space-x-2 mb-1">
                                                        <h3 className="font-medium truncate">{email.contact_name}</h3>
                                                        <Badge variant="outline" className="text-xs">
                                                            {email.contact_job_title}
                                                        </Badge>
                                                    </div>
                                                    <p className="text-sm text-muted-foreground truncate">
                                                        {email.contact_email} • {email.contact_company}
                                                    </p>
                                                    <div className="mt-2">
                                                        <p className="text-xs text-muted-foreground mb-1">Subject:</p>
                                                        <p className="text-sm font-medium line-clamp-1">{email.subject}</p>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Right: Badges and Actions */}
                                            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 lg:flex-col lg:items-end">
                                                <div className="flex items-center space-x-2">
                                                    <Badge variant={getScoreBadge(email.personalization_score)}>
                                                        {email.personalization_score}%
                                                    </Badge>
                                                    <Badge variant="secondary" className="text-xs">
                                                        {email.model_used}
                                                    </Badge>
                                                </div>
                                                <div className="flex items-center space-x-2">
                                                    <div className="flex items-center space-x-1">
                                                        {getStatusIcon(email.status)}
                                                        <span className="text-xs capitalize font-medium">{email.status}</span>
                                                    </div>
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        onClick={() => setPreviewEmail(email)}
                                                        className="h-8 w-8 p-0"
                                                    >
                                                        <Eye className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Personalization Tags */}
                                        <div className="mt-3 pt-3 border-t border-border/50">
                                            <div className="flex flex-wrap gap-1">
                                                {email.personalization_metadata.key_personalizations.slice(0, 3).map((tag, index) => (
                                                    <Badge key={index} variant="outline" className="text-xs">
                                                        {tag}
                                                    </Badge>
                                                ))}
                                                {email.personalization_metadata.key_personalizations.length > 3 && (
                                                    <Badge variant="outline" className="text-xs">
                                                        +{email.personalization_metadata.key_personalizations.length - 3} more
                                                    </Badge>
                                                )}
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </CardContent>
                    </Card>

                    {/* Email Preview Dialog */}
                    <Dialog open={!!previewEmail} onOpenChange={() => setPreviewEmail(null)}>
                        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                            <DialogHeader>
                                <DialogTitle className="flex items-center space-x-2">
                                    <Mail className="h-5 w-5" />
                                    <span>Email Preview</span>
                                </DialogTitle>
                            </DialogHeader>

                            {previewEmail && (
                                <div className="space-y-4">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
                                        <div>
                                            <p className="text-xs font-medium text-muted-foreground mb-1">TO</p>
                                            <p className="text-sm font-medium">{previewEmail.contact_name}</p>
                                            <p className="text-xs text-muted-foreground">{previewEmail.contact_email}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs font-medium text-muted-foreground mb-1">SCORE</p>
                                            <Badge variant={getScoreBadge(previewEmail.personalization_score)}>
                                                {previewEmail.personalization_score}%
                                            </Badge>
                                        </div>
                                    </div>

                                    <div>
                                        <p className="text-xs font-medium text-muted-foreground mb-2">SUBJECT</p>
                                        <p className="text-sm font-medium p-3 bg-muted/50 rounded-lg">{previewEmail.subject}</p>
                                    </div>

                                    <div>
                                        <p className="text-xs font-medium text-muted-foreground mb-2">MESSAGE</p>
                                        <div className="text-sm p-4 bg-muted/50 rounded-lg whitespace-pre-wrap leading-relaxed">
                                            {previewEmail.body}
                                        </div>
                                    </div>

                                    <div>
                                        <p className="text-xs font-medium text-muted-foreground mb-2">PERSONALIZATIONS</p>
                                        <div className="flex flex-wrap gap-1">
                                            {previewEmail.personalization_metadata.key_personalizations.map((tag, index) => (
                                                <Badge key={index} variant="secondary" className="text-xs">
                                                    {tag}
                                                </Badge>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </DialogContent>
                    </Dialog>
                </div>
            </div>
        </AppLayout>
    )
}
