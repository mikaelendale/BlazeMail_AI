"use client"
import { useState } from "react"
import { Head, Link } from "@inertiajs/react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
    CheckCircle,
    XCircle,
    Clock,
    Zap,
    Eye,
    Send,
    BarChart3,
    Users,
    AlertCircle,
    ChevronDown,
    ChevronUp,
    ListChecksIcon as ListCheck,
    AlarmClockCheck,
    GanttChartIcon as ChartGantt,
    Activity,
    CloudIcon as CloudAlert,
} from "lucide-react"
import AppLayout from "@/layouts/app-layout"

interface Job {
    id: number
    job_id: string
    batch_id: string
    job_type: string
    status: "started" | "processing" | "completed" | "failed"
    progress_percentage: number
    processed_items: number
    successful_items: number
    failed_items: number
    total_items: number
    current_item: any
    metadata: {
        email_template_subject?: string
        email_template_id?: number
    }
    started_at: string
    completed_at: string | null
    error_message: string | null
    duration: number | null
}

interface Stats {
    total_jobs: number
    active_jobs: number
    completed_jobs: number
    failed_jobs: number
}

interface Props {
    jobs: {
        data: Job[]
        links: any[]
        meta: any
    }
    stats: Stats
}

export default function JobsIndex({ jobs, stats }: Props) {
    const [filter, setFilter] = useState<string>("all")
    const [expandedJobs, setExpandedJobs] = useState<Set<number>>(new Set())

    const toggleJobExpansion = (jobId: number) => {
        const newExpanded = new Set(expandedJobs)
        if (newExpanded.has(jobId)) {
            newExpanded.delete(jobId)
        } else {
            newExpanded.add(jobId)
        }
        setExpandedJobs(newExpanded)
    }

    const getStatusIcon = (status: string) => {
        switch (status) {
            case "completed":
                return <AlarmClockCheck className="h-5 w-5 text-success" />
            case "failed":
                return <XCircle className="h-5 w-5 text-destructive" />
            case "processing":
                return <Zap className="h-5 w-5 text-primary animate-pulse" />
            default:
                return <Clock className="h-5 w-5 text-warning" />
        }
    }

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "completed":
                return (
                    <Badge variant="success" className="capitalize font-medium">
                        Completed
                    </Badge>
                )
            case "failed":
                return (
                    <Badge variant="destructive" className="capitalize font-medium">
                        Failed
                    </Badge>
                )
            case "processing":
                return (
                    <Badge variant="default" className="capitalize font-medium">
                        Processing
                    </Badge>
                )
            case "started":
                return (
                    <Badge variant="secondary" className="capitalize font-medium">
                        Started
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

    const getJobTypeLabel = (jobType: string) => {
        switch (jobType) {
            case "bulk_email_preparation":
                return "Email Preparation"
            case "bulk_email_sending":
                return "Email Sending"
            default:
                return jobType.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())
        }
    }

    const formatDuration = (seconds: number | null) => {
        if (seconds === null) return "N/A"
        if (seconds < 60) return `${seconds}s`
        const minutes = Math.floor(seconds / 60)
        const remainingSeconds = seconds % 60
        return `${minutes}m ${remainingSeconds}s`
    }

    const filteredJobs = jobs.data.filter((job) => {
        if (filter === "all") return true
        return job.status === filter
    })

    return (
        <AppLayout>
            <Head title="Jobs" />
            <div className="min-h-screen bg-background">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16">
                    {/* Header Section */}
                    <div className="mb-8 sm:mb-12">
                        <div className="space-y-3">
                            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">Job Management</h1>
                            <p className="text-base sm:text-lg text-muted-foreground max-w-2xl">
                                Monitor and manage your background jobs with real-time progress tracking.
                            </p>
                        </div>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8 mb-8 sm:mb-12">
                        <Card className="border-b-4 border-primary shadow-sm">
                            <CardContent className="p-4 sm:p-6">
                                <div className="flex items-center justify-between">
                                    <div className="space-y-1">
                                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Total Jobs</p>
                                        <p className="text-2xl sm:text-3xl font-bold text-primary">{stats.total_jobs}</p>
                                    </div>
                                    <div className="p-2 bg-primary/10 rounded-lg">
                                        <ChartGantt className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-b-4 border-blue-500 shadow-sm">
                            <CardContent className="p-4 sm:p-6">
                                <div className="flex items-center justify-between">
                                    <div className="space-y-1">
                                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Active</p>
                                        <p className="text-2xl sm:text-3xl font-bold text-blue-600">{stats.active_jobs}</p>
                                    </div>
                                    <div className="p-2 bg-blue-100 rounded-lg">
                                        <Activity className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-b-4 border-success shadow-sm">
                            <CardContent className="p-4 sm:p-6">
                                <div className="flex items-center justify-between">
                                    <div className="space-y-1">
                                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Completed</p>
                                        <p className="text-2xl sm:text-3xl font-bold text-success">{stats.completed_jobs}</p>
                                    </div>
                                    <div className="p-2 bg-success/10 rounded-lg">
                                        <AlarmClockCheck className="h-6 w-6 sm:h-8 sm:w-8 text-success" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-b-4 border-destructive shadow-sm">
                            <CardContent className="p-4 sm:p-6">
                                <div className="flex items-center justify-between">
                                    <div className="space-y-1">
                                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Failed</p>
                                        <p className="text-2xl sm:text-3xl font-bold text-destructive">{stats.failed_jobs}</p>
                                    </div>
                                    <div className="p-2 bg-destructive/10 rounded-lg">
                                        <CloudAlert className="h-6 w-6 sm:h-8 sm:w-8 text-destructive" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Filter Section */}
                    <div className="mb-8">
                        <div className="flex flex-wrap gap-2 sm:gap-3">
                            {["all", "processing", "completed", "failed"].map((status) => (
                                <Button
                                    key={status}
                                    variant={filter === status ? "default" : "outline"}
                                    size="sm" // Smaller size for better responsiveness
                                    onClick={() => setFilter(status)}
                                    className="capitalize px-4 py-2 text-sm font-medium" // Adjusted padding
                                >
                                    {status === "all" ? "All Jobs" : status}
                                </Button>
                            ))}
                        </div>
                    </div>

                    {/* Jobs List */}
                    <Card className="shadow-sm">
                        <CardHeader className="pb-4">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                <CardTitle className="text-xl sm:text-2xl font-bold">Jobs Overview</CardTitle>
                                <Badge variant="outline" className="px-3 py-1 text-sm font-medium">
                                    {filteredJobs.length} {filteredJobs.length === 1 ? "job" : "jobs"}
                                </Badge>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-0">
                            <div className="space-y-4">
                                {filteredJobs.map((job) => {
                                    const isExpanded = expandedJobs.has(job.id)
                                    return (
                                        <Card
                                            key={job.id}
                                            className="bg-card shadow-none border border-muted hover:border-border transition-colors"
                                        >
                                            <CardContent className="p-4 sm:p-6">
                                                {/* Job Header - Always Visible */}
                                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                                    <div className="flex items-center gap-3">
                                                        <div className="p-2 bg-muted rounded-lg flex-shrink-0">{getStatusIcon(job.status)}</div>
                                                        <div className="space-y-0.5">
                                                            <h3 className="text-base sm:text-lg font-semibold text-foreground">
                                                                {getJobTypeLabel(job.job_type)}
                                                            </h3>
                                                            {job.metadata.email_template_subject && (
                                                                <p className="text-muted-foreground text-sm">
                                                                    <span className="font-medium">{job.metadata.email_template_subject}</span>
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2 sm:gap-3 flex-wrap sm:flex-nowrap">
                                                        {getStatusBadge(job.status)}
                                                        <Badge variant="outline" className="text-xs font-mono px-2 py-0.5">
                                                            {job.batch_id.slice(0, 8)}
                                                        </Badge>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon" // Use icon size for smaller button
                                                            onClick={() => toggleJobExpansion(job.id)}
                                                            className="flex-shrink-0"
                                                        >
                                                            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                                        </Button>
                                                    </div>
                                                </div>

                                                {/* Quick Stats - Always Visible */}
                                                <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-sm text-muted-foreground">
                                                    <span className="flex items-center gap-1">
                                                        <Users className="h-4 w-4" />
                                                        {job.total_items} total
                                                    </span>
                                                    <span className="flex items-center gap-1 text-success">
                                                        <ListCheck className="h-4 w-4" />
                                                        {job.successful_items} success
                                                    </span>
                                                    <span className="flex items-center gap-1 text-destructive">
                                                        <XCircle className="h-4 w-4" />
                                                        {job.failed_items} failed
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        <Clock className="h-4 w-4" />
                                                        {formatDuration(job.duration)}
                                                    </span>
                                                </div>

                                                {/* Progress Bar for Processing Jobs - Always Visible */}
                                                {job.status === "processing" && (
                                                    <div className="mt-4 p-3 bg-primary/5 rounded-lg">
                                                        <div className="flex justify-between items-center mb-2">
                                                            <span className="font-medium text-primary text-sm">Progress</span>
                                                            <span className="text-xs font-medium text-primary">
                                                                {job.processed_items} of {job.total_items} completed
                                                            </span>
                                                        </div>
                                                        <Progress value={job.progress_percentage} className="h-2" />
                                                        <div className="mt-1 text-right">
                                                            <span className="text-xs font-medium text-primary">{job.progress_percentage}%</span>
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Collapsible Details */}
                                                {isExpanded && (
                                                    <div className="mt-6 space-y-4 border-t pt-4">
                                                        {/* Current Processing Info */}
                                                        {job.current_item && job.status === "processing" && (
                                                            <div className="p-3 bg-primary/5 rounded-lg">
                                                                <div className="flex items-center gap-2 mb-1">
                                                                    <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                                                                    <span className="font-medium text-primary text-sm">Currently Processing</span>
                                                                </div>
                                                                <p className="text-foreground font-semibold text-sm">{job.current_item.contact_name}</p>
                                                                {job.current_item.step && (
                                                                    <p className="text-muted-foreground text-xs mt-0.5 capitalize">
                                                                        {job.current_item.step.replace(/_/g, " ")}
                                                                    </p>
                                                                )}
                                                            </div>
                                                        )}

                                                        {/* Error Message */}
                                                        {job.error_message && (
                                                            <div className="p-3 bg-destructive/5 rounded-lg">
                                                                <div className="flex items-start gap-2">
                                                                    <AlertCircle className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
                                                                    <div>
                                                                        <p className="font-medium text-destructive text-sm mb-0.5">Error Occurred</p>
                                                                        <p className="text-destructive/80 text-xs">{job.error_message}</p>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        )}

                                                        {/* Detailed Timestamps */}
                                                        <div className="flex flex-col gap-2 text-xs text-muted-foreground">
                                                            <span className="flex items-center gap-2">
                                                                <Clock className="h-4 w-4" />
                                                                Started: {new Date(job.started_at).toLocaleString()}
                                                            </span>
                                                            {job.completed_at && (
                                                                <span className="flex items-center gap-2">
                                                                    <CheckCircle className="h-4 w-4" />
                                                                    Completed: {new Date(job.completed_at).toLocaleString()}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Actions - Always Visible for Completed Jobs */}
                                                {job.status === "completed" && job.successful_items > 0 && (
                                                    <div className="mt-6 pt-4 border-t border-border/50 flex flex-col sm:flex-row gap-3">
                                                        <Link href={`/emails/review/${job.batch_id}`} className="w-full sm:w-auto">
                                                            <Button className="w-full rounded-lg">
                                                                <Eye className="h-4 w-4 mr-2" />
                                                                Review Results ({job.successful_items})
                                                            </Button>
                                                        </Link>
                                                        <Button variant="outline" className="w-full sm:w-auto bg-transparent rounded-lg">
                                                            <Send className="h-4 w-4 mr-2" />
                                                            Send All
                                                        </Button>
                                                    </div>
                                                )}
                                            </CardContent>
                                        </Card>
                                    )
                                })}
                                {filteredJobs.length === 0 && (
                                    <div className="text-center py-12">
                                        <div className="p-4 bg-muted rounded-xl inline-block mb-4">
                                            <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto" />
                                        </div>
                                        <h3 className="text-lg font-semibold text-foreground mb-1">No jobs found</h3>
                                        <p className="text-muted-foreground text-sm">No jobs match the selected filter criteria.</p>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Pagination */}
                    {jobs.links && (
                        <div className="mt-8 flex justify-center">
                            <div className="flex flex-wrap justify-center gap-2">
                                {jobs.links.map((link: any, index: number) => (
                                    <Link
                                        key={index}
                                        href={link.url || "#"}
                                        className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${link.active ? "bg-primary text-primary-foreground" : "bg-card text-foreground hover:bg-muted"
                                            } ${!link.url ? "opacity-50 cursor-not-allowed" : ""}`}
                                        dangerouslySetInnerHTML={{ __html: link.label }}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    )
}
