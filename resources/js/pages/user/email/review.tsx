"use client"

import { useState } from "react"
import { Head, router } from "@inertiajs/react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { CheckCircle, XCircle, Clock, Send, Eye, BarChart3, Users } from "lucide-react"
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
                return <CheckCircle className="h-4 w-4 text-green-500" />
            case "sent":
                return <Send className="h-4 w-4 text-blue-500" />
            case "failed":
                return <XCircle className="h-4 w-4 text-red-500" />
            default:
                return <Clock className="h-4 w-4 text-yellow-500" />
        }
    }

    const getScoreColor = (score: number) => {
        if (score >= 90) return "bg-green-500"
        if (score >= 80) return "bg-blue-500"
        if (score >= 70) return "bg-yellow-500"
        return "bg-red-500"
    }

    return (
        <>
            <AppLayout>
                <Head title="Review Personalized Emails" />

                <div className="container mx-auto py-8 px-4">
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold mb-2">Review Personalized Emails</h1>
                        <p className="text-gray-600">
                            Template: <span className="font-medium">{emailTemplate.subject}</span>
                        </p>
                    </div>

                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                        <Card>
                            <CardContent className="p-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-gray-600">Total Emails</p>
                                        <p className="text-2xl font-bold">{stats.total}</p>
                                    </div>
                                    <Users className="h-8 w-8 text-blue-500" />
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="p-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-gray-600">Avg Score</p>
                                        <p className="text-2xl font-bold">{stats.avg_score}%</p>
                                    </div>
                                    <BarChart3 className="h-8 w-8 text-green-500" />
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="p-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-gray-600">Approved</p>
                                        <p className="text-2xl font-bold">{stats.approved}</p>
                                    </div>
                                    <CheckCircle className="h-8 w-8 text-green-500" />
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="p-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-gray-600">Sent</p>
                                        <p className="text-2xl font-bold">{stats.sent}</p>
                                    </div>
                                    <Send className="h-8 w-8 text-blue-500" />
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-4 mb-6">
                        <Button
                            onClick={handleApproveSelected}
                            disabled={selectedEmails.length === 0 || loading}
                            className="bg-green-600 hover:bg-green-700"
                        >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Approve Selected ({selectedEmails.length})
                        </Button>

                        <Button
                            onClick={handleSendApproved}
                            disabled={stats.approved === 0 || loading}
                            className="bg-blue-600 hover:bg-blue-700"
                        >
                            <Send className="h-4 w-4 mr-2" />
                            Send Approved ({stats.approved})
                        </Button>
                    </div>

                    {/* Email List */}
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardTitle>Personalized Emails</CardTitle>
                                <div className="flex items-center gap-2">
                                    <Checkbox
                                        checked={selectedEmails.length === emails.filter((e) => e.status === "pending").length}
                                        onCheckedChange={handleSelectAll}
                                    />
                                    <span className="text-sm text-gray-600">Select All Pending</span>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {emails.map((email) => (
                                    <div key={email.id} className="border rounded-lg p-4">
                                        <div className="flex items-start justify-between mb-3">
                                            <div className="flex items-center gap-3">
                                                {email.status === "pending" && (
                                                    <Checkbox
                                                        checked={selectedEmails.includes(email.id)}
                                                        onCheckedChange={(checked) => handleSelectEmail(email.id, checked as boolean)}
                                                    />
                                                )}
                                                <div>
                                                    <h3 className="font-medium">{email.contact_name}</h3>
                                                    <p className="text-sm text-gray-600">
                                                        {email.contact_email} • {email.contact_company}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2">
                                                <Badge className={`${getScoreColor(email.personalization_score)} text-white`}>
                                                    {email.personalization_score}%
                                                </Badge>
                                                <Badge variant="outline">{email.model_used}</Badge>
                                                <div className="flex items-center gap-1">
                                                    {getStatusIcon(email.status)}
                                                    <span className="text-sm capitalize">{email.status}</span>
                                                </div>
                                                <Button size="sm" variant="outline" onClick={() => setPreviewEmail(email)}>
                                                    <Eye className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>

                                        <div className="mb-2">
                                            <p className="font-medium text-sm mb-1">Subject:</p>
                                            <p className="text-sm bg-gray-50 p-2 rounded">{email.subject}</p>
                                        </div>

                                        <div className="text-sm text-gray-600">
                                            <p className="mb-1">
                                                <strong>Personalizations:</strong>{" "}
                                                {email.personalization_metadata.key_personalizations.join(", ")}
                                            </p>
                                            <p>
                                                <strong>Triggers:</strong> {email.personalization_metadata.psychological_triggers.join(", ")}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Email Preview Modal */}
                    {previewEmail && (
                        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto">
                                <div className="p-6">
                                    <div className="flex items-center justify-between mb-4">
                                        <h2 className="text-xl font-bold">Email Preview</h2>
                                        <Button variant="outline" onClick={() => setPreviewEmail(null)}>
                                            Close
                                        </Button>
                                    </div>

                                    <div className="space-y-4">
                                        <div>
                                            <p className="font-medium text-sm mb-1">To:</p>
                                            <p className="text-sm">
                                                {previewEmail.contact_name} &lt;{previewEmail.contact_email}&gt;
                                            </p>
                                        </div>

                                        <div>
                                            <p className="font-medium text-sm mb-1">Subject:</p>
                                            <p className="text-sm bg-gray-50 p-2 rounded">{previewEmail.subject}</p>
                                        </div>

                                        <div>
                                            <p className="font-medium text-sm mb-1">Body:</p>
                                            <div className="text-sm bg-gray-50 p-4 rounded whitespace-pre-wrap">{previewEmail.body}</div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4 text-sm">
                                            <div>
                                                <p className="font-medium mb-1">Personalization Score:</p>
                                                <Badge className={`${getScoreColor(previewEmail.personalization_score)} text-white`}>
                                                    {previewEmail.personalization_score}%
                                                </Badge>
                                            </div>
                                            <div>
                                                <p className="font-medium mb-1">Model Used:</p>
                                                <Badge variant="outline">{previewEmail.model_used}</Badge>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </AppLayout>
        </>
    )
}
