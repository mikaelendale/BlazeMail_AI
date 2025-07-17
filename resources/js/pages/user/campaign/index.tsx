"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog" // Import AlertDialog components
import AppLayout from "@/layouts/app-layout"
import { router } from "@inertiajs/react"
import { debounce } from "lodash"
import {
    AlertCircle,
    BarChart3,
    Calendar,
    CheckCircle,
    ChevronDown,
    ChevronUp,
    Clock,
    Edit,
    Eye,
    EyeOff,
    Filter,
    Loader2,
    Mail,
    Pause,
    Play,
    Plus,
    Rocket,
    Search,
    Settings,
    TrendingUp,
    Trash2,
    User,
    Users,
} from "lucide-react"
import { useCallback, useState } from "react"

interface AssignedAccount {
    id: number
    name: string
    email: string
    avatar?: string
    role: string
}

interface Campaign {
    id: number
    name: string
    status: "active" | "scheduled" | "completed" | "paused" | "draft"
    startDate: string
    endDate: string
    totalEmails: number
    emailsSent: number
    subscribers: number
    openRate: number
    clickRate: number
    groups: number
    createdAt: string
    description: string
    tags: string[]
    assignedAccount: AssignedAccount
    progress: number
    daysRemaining: number
    needsSetup: boolean // Add needsSetup
    canLaunch: boolean // Add canLaunch
}

interface EmailAccount {
    id: number | string
    name: string
    email: string
    provider: string
    status: string
}

interface Stats {
    activeCampaigns: number
    totalSubscribers: number
    avgOpenRate: number
    avgClickRate: number
}

interface FilterOptions {
    status: Array<{ value: string; label: string }>
    assignees: EmailAccount[]
    sortOptions: Array<{ value: string; label: string }>
}

interface Filters {
    search: string
    status: string
    assignee: string
    sortBy: string
    sortOrder: string
}

interface Props {
    campaigns: Campaign[]
    emailAccounts: EmailAccount[]
    stats: Stats
    filters: Filters
    filterOptions: FilterOptions
}

const INITIAL_DISPLAY_COUNT = 3

export default function CampaignsTimeline({
    campaigns: initialCampaigns,
    emailAccounts,
    stats,
    filters: initialFilters,
    filterOptions,
}: Props) {
    const [campaigns, setCampaigns] = useState<Campaign[]>(initialCampaigns)
    const [isLoading, setIsLoading] = useState(false)
    const [filterStatus, setFilterStatus] = useState<string>(initialFilters.status)
    const [filterAssignee, setFilterAssignee] = useState<string>(initialFilters.assignee)
    const [searchQuery, setSearchQuery] = useState(initialFilters.search)
    const [sortBy, setSortBy] = useState<string>(initialFilters.sortBy)
    const [sortOrder, setSortOrder] = useState<string>(initialFilters.sortOrder)
    const [expandedCards, setExpandedCards] = useState<Set<number>>(new Set())
    const [displayCount, setDisplayCount] = useState(INITIAL_DISPLAY_COUNT)

    // Debounced filter function
    const debouncedFilter = useCallback(
        debounce(async (filters: Partial<Filters>) => {
            setIsLoading(true)
            try {
                const response = await fetch(route("user.email.campaign.filter"), {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "X-CSRF-TOKEN": document.querySelector('meta[name="csrf-token"]')?.getAttribute("content") || "",
                    },
                    body: JSON.stringify(filters),
                })
                if (response.ok) {
                    const data = await response.json()
                    setCampaigns(data.campaigns)
                    setDisplayCount(INITIAL_DISPLAY_COUNT) // Reset display count
                    setExpandedCards(new Set()) // Close all expanded cards
                }
            } catch (error) {
                console.error("Filter error:", error)
            } finally {
                setIsLoading(false)
            }
        }, 300),
        [],
    )

    // Update URL and apply filters
    const applyFilters = useCallback(
        (newFilters: Partial<Filters>) => {
            const updatedFilters = {
                search: searchQuery,
                status: filterStatus,
                assignee: filterAssignee,
                sort: sortBy,
                order: sortOrder,
                ...newFilters,
            }

            // Update URL without page reload
            const url = new URL(window.location.href)
            Object.entries(updatedFilters).forEach(([key, value]) => {
                if (value && value !== "all" && value !== "") {
                    url.searchParams.set(key, value)
                } else {
                    url.searchParams.delete(key)
                }
            })
            window.history.replaceState({}, "", url.toString())

            // Apply filters
            debouncedFilter(updatedFilters)
        },
        [searchQuery, filterStatus, filterAssignee, sortBy, sortOrder, debouncedFilter],
    )

    // Handle search change
    const handleSearchChange = (value: string) => {
        setSearchQuery(value)
        applyFilters({ search: value })
    }

    // Handle status filter change
    const handleStatusChange = (value: string) => {
        setFilterStatus(value)
        applyFilters({ status: value })
    }

    // Handle assignee filter change
    const handleAssigneeChange = (value: string) => {
        setFilterAssignee(value)
        applyFilters({ assignee: value })
    }

    // Handle sort change
    const handleSortChange = (value: string) => {
        setSortBy(value)
        applyFilters({ sort: value })
    }

    // Handle sort order toggle
    const toggleSortOrder = () => {
        const newOrder = sortOrder === "asc" ? "desc" : "asc"
        setSortOrder(newOrder)
        applyFilters({ order: newOrder })
    }

    // Clear all filters
    const clearFilters = () => {
        setSearchQuery("")
        setFilterStatus("all")
        setFilterAssignee("all")
        setSortBy("startDate")
        setSortOrder("desc")

        // Clear URL params
        const url = new URL(window.location.href)
        url.search = ""
        window.history.replaceState({}, "", url.toString())

        // Reset to initial campaigns
        setCampaigns(initialCampaigns)
        setDisplayCount(INITIAL_DISPLAY_COUNT)
        setExpandedCards(new Set())
    }

    const toggleCardExpansion = (campaignId: number) => {
        const newExpanded = new Set(expandedCards)
        if (newExpanded.has(campaignId)) {
            newExpanded.delete(campaignId)
        } else {
            newExpanded.add(campaignId)
        }
        setExpandedCards(newExpanded)
    }

    const getStatusColor = (status: Campaign["status"]) => {
        switch (status) {
            case "active":
                return "bg-primary text-primary-foreground"
            case "scheduled":
                return "bg-secondary text-secondary-foreground"
            case "completed":
                return "bg-accent text-accent-foreground"
            case "paused":
                return "bg-muted text-muted-foreground"
            case "draft":
                return "bg-muted text-muted-foreground"
            default:
                return "bg-muted text-muted-foreground"
        }
    }

    const getStatusIcon = (status: Campaign["status"]) => {
        switch (status) {
            case "active":
                return <Play className="h-3 w-3" />
            case "scheduled":
                return <Clock className="h-3 w-3" />
            case "completed":
                return <CheckCircle className="h-3 w-3" />
            case "paused":
                return <Pause className="h-3 w-3" />
            case "draft":
                return <AlertCircle className="h-3 w-3" />
            default:
                return <Clock className="h-3 w-3" />
        }
    }

    const getInitials = (name: string) => {
        return name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase()
    }

    const displayedCampaigns = campaigns.slice(0, displayCount)
    const hasMoreCampaigns = displayCount < campaigns.length
    const canShowLess = displayCount > INITIAL_DISPLAY_COUNT

    const handleViewMore = () => {
        setDisplayCount((prev) => Math.min(prev + INITIAL_DISPLAY_COUNT, campaigns.length))
    }

    const handleShowLess = () => {
        setDisplayCount(INITIAL_DISPLAY_COUNT)
        setExpandedCards(new Set())
    }

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
        })
    }

    const calculateProgress = (campaign: Campaign) => {
        return campaign.progress || 0
    }

    const getDaysRemaining = (campaign: Campaign) => {
        if (campaign.status === "active") {
            return campaign.daysRemaining > 0 ? campaign.daysRemaining : 0
        }
        return 0
    }

    const handleEditCampaign = (campaignId: number) => {
        router.get(route("user.email.campaign.setup", { campaign: campaignId }))
    }

    const handleViewCampaign = (campaignId: number) => {
        router.get(route("user.email.campaign.show", { campaign: campaignId }))
    }

    const handleDeleteCampaign = (campaignId: number) => {
        router.delete(route("user.email.campaign.destroy", { campaign: campaignId }), {
            onSuccess: () => {
                // Filter out the deleted campaign from the state
                setCampaigns((prevCampaigns) => prevCampaigns.filter((c) => c.id !== campaignId))
                // Optionally, show a success toast
                // toast({ title: "Campaign deleted successfully!" });
            },
            onError: (errors) => {
                console.error("Failed to delete campaign:", errors)
                // Optionally, show an error toast
                // toast({ title: "Failed to delete campaign.", description: errors.error || "An unknown error occurred.", variant: "destructive" });
            },
        })
    }

    return (
        <AppLayout>
            <div className="min-h-screen bg-background p-4 md:p-6 lg:p-8">
                <div className="mx-auto max-w-7xl">
                    {/* Header */}
                    <div className="mb-8">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <h1 className="mb-3 text-3xl font-bold text-primary lg:text-4xl">Campaign Timeline</h1>
                                <p className="text-lg text-secondary">Monitor and manage your email campaigns</p>
                            </div>
                            <Button
                                className="w-full rounded-2xl sm:w-auto"
                                onClick={() => router.get(route("user.email.campaign.create"))}
                            >
                                <Plus className="mr-2 h-4 w-4" />
                                New Campaign
                            </Button>
                        </div>
                    </div>

                    {/* Stats Cards */}
                    <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        <Card className="rounded-3xl border border-accent bg-card">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground">Active Campaigns</p>
                                        <p className="text-2xl font-bold text-primary">{stats.activeCampaigns}</p>
                                    </div>
                                    <div className="rounded-2xl bg-primary/10 p-3">
                                        <Play className="h-6 w-6 text-primary" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                        <Card className="rounded-3xl border border-accent bg-card">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground">Total Subscribers</p>
                                        <p className="text-2xl font-bold text-primary">{stats.totalSubscribers.toLocaleString()}</p>
                                    </div>
                                    <div className="rounded-2xl bg-secondary/10 p-3">
                                        <Users className="h-6 w-6 text-secondary-foreground" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                        <Card className="rounded-3xl border border-accent bg-card">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground">Avg Open Rate</p>
                                        <p className="text-2xl font-bold text-primary">{stats.avgOpenRate}%</p>
                                    </div>
                                    <div className="rounded-2xl bg-accent/10 p-3">
                                        <Mail className="h-6 w-6 text-accent-foreground" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                        <Card className="rounded-3xl border border-accent bg-card">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground">Avg Click Rate</p>
                                        <p className="text-2xl font-bold text-primary">{stats.avgClickRate}%</p>
                                    </div>
                                    <div className="rounded-2xl bg-muted/10 p-3">
                                        <TrendingUp className="h-6 w-6 text-muted-foreground" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Filters and Search */}
                    <Card className="mb-8 rounded-3xl border border-accent bg-card">
                        <CardContent className="p-6">
                            <div className="flex flex-col gap-4">
                                <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                                    <div className="relative flex-1">
                                        <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                        {isLoading && (
                                            <Loader2 className="absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
                                        )}
                                        <Input
                                            placeholder="Search campaigns..."
                                            value={searchQuery}
                                            onChange={(e) => handleSearchChange(e.target.value)}
                                            className="w-full rounded-2xl pr-10 pl-10"
                                        />
                                    </div>
                                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                                        <Select value={filterStatus} onValueChange={handleStatusChange}>
                                            <SelectTrigger className="w-full rounded-2xl sm:w-40">
                                                <Filter className="mr-2 h-4 w-4" />
                                                <SelectValue placeholder="Filter by status" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {filterOptions.status.map((option) => (
                                                    <SelectItem key={option.value} value={option.value}>
                                                        {option.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <Select value={filterAssignee} onValueChange={handleAssigneeChange}>
                                            <SelectTrigger className="w-full rounded-2xl sm:w-48">
                                                <User className="mr-2 h-4 w-4" />
                                                <SelectValue placeholder="Filter by assignee" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {filterOptions.assignees.map((account) => (
                                                    <SelectItem key={account.id} value={account.id.toString()}>
                                                        {account.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <div className="flex items-center gap-2">
                                            <Select value={sortBy} onValueChange={handleSortChange}>
                                                <SelectTrigger className="w-full rounded-2xl sm:w-48">
                                                    <BarChart3 className="mr-2 h-4 w-4" />
                                                    <SelectValue placeholder="Sort by" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {filterOptions.sortOptions.map((option) => (
                                                        <SelectItem key={option.value} value={option.value}>
                                                            {option.label}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={toggleSortOrder}
                                                className="rounded-xl bg-transparent"
                                                title={`Sort ${sortOrder === "asc" ? "ascending" : "descending"}`}
                                            >
                                                {sortOrder === "asc" ? "↑" : "↓"}
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                                {/* Active Filters & Clear Button */}
                                {(searchQuery || filterStatus !== "all" || filterAssignee !== "all" || sortBy !== "startDate") && (
                                    <div className="flex flex-wrap items-center gap-2">
                                        <span className="text-sm text-muted-foreground">Active filters:</span>
                                        {searchQuery && (
                                            <Badge variant="outline" className="rounded-xl">
                                                Search: "{searchQuery}"
                                            </Badge>
                                        )}
                                        {filterStatus !== "all" && (
                                            <Badge variant="outline" className="rounded-xl">
                                                Status: {filterOptions.status.find((s) => s.value === filterStatus)?.label}
                                            </Badge>
                                        )}
                                        {filterAssignee !== "all" && (
                                            <Badge variant="outline" className="rounded-xl">
                                                Assignee: {filterOptions.assignees.find((a) => a.id.toString() === filterAssignee)?.name}
                                            </Badge>
                                        )}
                                        {sortBy !== "startDate" && (
                                            <Badge variant="outline" className="rounded-xl">
                                                Sort: {filterOptions.sortOptions.find((s) => s.value === sortBy)?.label} ({sortOrder})
                                            </Badge>
                                        )}
                                        <Button variant="ghost" size="sm" onClick={clearFilters} className="rounded-xl text-xs">
                                            Clear All
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Loading State */}
                    {isLoading && (
                        <div className="flex items-center justify-center py-8">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            <span className="ml-2 text-muted-foreground">Filtering campaigns...</span>
                        </div>
                    )}

                    {/* Timeline */}
                    <div className="space-y-6">
                        <div className="relative space-y-6">
                            {/* Timeline Line */}
                            {displayedCampaigns.length > 0 && (
                                <div className="absolute top-6 bottom-6 left-6 w-0.5 bg-border md:left-12"></div>
                            )}
                            {displayedCampaigns.map((campaign, index) => (
                                <div key={campaign.id} className="relative">
                                    {/* Timeline Node */}
                                    <div className="absolute top-6 left-4 z-10 h-4 w-4 rounded-full bg-primary md:left-10"></div>
                                    {/* Campaign Card */}
                                    <Card className="ml-12 rounded-3xl border border-accent bg-card transition-all duration-300 hover:shadow-lg md:ml-20">
                                        <CardContent className="p-6">
                                            <div className="space-y-4">
                                                {/* Header */}
                                                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                                                    <div className="space-y-2">
                                                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
                                                            <h3 className="text-xl font-bold text-primary">{campaign.name}</h3>
                                                            <Badge
                                                                className={`w-fit rounded-xl px-3 py-1 text-xs font-medium ${getStatusColor(campaign.status)}`}
                                                            >
                                                                {getStatusIcon(campaign.status)}
                                                                <span className="ml-1 capitalize">{campaign.status}</span>
                                                            </Badge>
                                                        </div>
                                                        <p className="text-sm text-muted-foreground">{campaign.description}</p>
                                                        <div className="flex flex-wrap gap-2">
                                                            {campaign.tags.map((tag) => (
                                                                <Badge key={tag} variant="outline" className="rounded-xl text-xs">
                                                                    {tag}
                                                                </Badge>
                                                            ))}
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        {campaign.needsSetup && (
                                                            <Button onClick={() => handleEditCampaign(campaign.id)} className="rounded-2xl">
                                                                <Settings className="mr-2 h-4 w-4" />
                                                                Complete Setup
                                                            </Button>
                                                        )}
                                                        {/* {campaign.canLaunch && ( */}
                                                            <Button
                                                                onClick={() => router.patch(route("user.email.campaign.launch", campaign.id))}
                                                                className="rounded-2xl"
                                                            >
                                                                <Rocket className="mr-2 h-4 w-4" />
                                                                Launch Campaign
                                                            </Button>
                                                        {/* )} */}
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="h-8 w-8 rounded-xl p-0"
                                                            onClick={() => handleEditCampaign(campaign.id)}
                                                        >
                                                            <Edit className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="h-8 w-8 rounded-xl p-0"
                                                            onClick={() => handleViewCampaign(campaign.id)}
                                                        >
                                                            <Eye className="h-4 w-4" />
                                                        </Button>
                                                        <AlertDialog>
                                                            <AlertDialogTrigger asChild>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    className="h-8 w-8 rounded-xl p-0 text-red-500 hover:bg-red-100 hover:text-red-600"
                                                                >
                                                                    <Trash2 className="h-4 w-4" />
                                                                </Button>
                                                            </AlertDialogTrigger>
                                                            <AlertDialogContent>
                                                                <AlertDialogHeader>
                                                                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                                                    <AlertDialogDescription>
                                                                        This action cannot be undone. This will permanently delete your campaign and all
                                                                        associated data.
                                                                    </AlertDialogDescription>
                                                                </AlertDialogHeader>
                                                                <AlertDialogFooter>
                                                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                                    <AlertDialogAction onClick={() => handleDeleteCampaign(campaign.id)}>
                                                                        Delete
                                                                    </AlertDialogAction>
                                                                </AlertDialogFooter>
                                                            </AlertDialogContent>
                                                        </AlertDialog>
                                                    </div>
                                                </div>

                                                {/* Date Range and Assigned Account */}
                                                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                        <Calendar className="h-4 w-4" />
                                                        <span>
                                                            {formatDate(campaign.startDate)} - {formatDate(campaign.endDate)}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-3 rounded-2xl border border-accent bg-muted/30 px-3 py-2">
                                                        <Avatar className="h-6 w-6">
                                                            <AvatarImage
                                                                src={campaign.assignedAccount.avatar || "/placeholder.svg?height=24&width=24"}
                                                                alt={campaign.assignedAccount.name}
                                                            />
                                                            <AvatarFallback className="text-xs">
                                                                {getInitials(campaign.assignedAccount.name)}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                        <div className="min-w-0">
                                                            <p className="text-xs font-medium text-primary">{campaign.assignedAccount.name}</p>
                                                            <p className="text-xs text-muted-foreground">{campaign.assignedAccount.role}</p>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Desktop Stats - Always visible on md+ */}
                                                <div className="hidden grid-cols-2 gap-4 md:grid lg:grid-cols-4">
                                                    <div className="rounded-2xl border border-accent bg-muted/50 p-4">
                                                        <div className="flex items-center justify-between">
                                                            <div>
                                                                <p className="text-xs font-medium text-muted-foreground">Progress</p>
                                                                <p className="text-lg font-bold text-primary">{calculateProgress(campaign)}%</p>
                                                            </div>
                                                            <div className="text-right">
                                                                <p className="text-xs text-muted-foreground">
                                                                    {campaign.emailsSent}/{campaign.totalEmails}
                                                                </p>
                                                                <div className="mt-1 h-2 w-16 rounded-full bg-muted">
                                                                    <div
                                                                        className="h-2 rounded-full bg-primary"
                                                                        style={{ width: `${calculateProgress(campaign)}%` }}
                                                                    ></div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="rounded-2xl border border-accent bg-muted/50 p-4">
                                                        <div className="flex items-center justify-between">
                                                            <div>
                                                                <p className="text-xs font-medium text-muted-foreground">Subscribers</p>
                                                                <p className="text-lg font-bold text-primary">
                                                                    {campaign.subscribers.toLocaleString()}
                                                                </p>
                                                            </div>
                                                            <Users className="h-5 w-5 text-muted-foreground" />
                                                        </div>
                                                    </div>
                                                    <div className="rounded-2xl border border-accent bg-muted/50 p-4">
                                                        <div className="flex items-center justify-between">
                                                            <div>
                                                                <p className="text-xs font-medium text-muted-foreground">Open Rate</p>
                                                                <p className="text-lg font-bold text-primary">{campaign.openRate}%</p>
                                                            </div>
                                                            <Mail className="h-5 w-5 text-muted-foreground" />
                                                        </div>
                                                    </div>
                                                    <div className="rounded-2xl border border-accent bg-muted/50 p-4">
                                                        <div className="flex items-center justify-between">
                                                            <div>
                                                                <p className="text-xs font-medium text-muted-foreground">Click Rate</p>
                                                                <p className="text-lg font-bold text-primary">{campaign.clickRate}%</p>
                                                            </div>
                                                            <TrendingUp className="h-5 w-5 text-muted-foreground" />
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Mobile Collapsible Stats - Only on mobile */}
                                                <div className="md:hidden">
                                                    <Collapsible
                                                        open={expandedCards.has(campaign.id)}
                                                        onOpenChange={() => toggleCardExpansion(campaign.id)}
                                                    >
                                                        <CollapsibleTrigger asChild>
                                                            <Button
                                                                variant="ghost"
                                                                className="flex w-full items-center justify-between rounded-2xl border border-accent bg-muted/50 p-4 hover:bg-muted"
                                                            >
                                                                <span className="text-sm font-medium">View Details</span>
                                                                {expandedCards.has(campaign.id) ? (
                                                                    <ChevronUp className="h-4 w-4" />
                                                                ) : (
                                                                    <ChevronDown className="h-4 w-4" />
                                                                )}
                                                            </Button>
                                                        </CollapsibleTrigger>
                                                        <CollapsibleContent className="mt-4 space-y-3">
                                                            <div className="grid grid-cols-2 gap-3">
                                                                <div className="rounded-2xl border border-accent bg-muted/50 p-3">
                                                                    <p className="text-xs font-medium text-muted-foreground">Progress</p>
                                                                    <p className="text-sm font-bold text-primary">{calculateProgress(campaign)}%</p>
                                                                    <p className="text-xs text-muted-foreground">
                                                                        {campaign.emailsSent}/{campaign.totalEmails}
                                                                    </p>
                                                                </div>
                                                                <div className="rounded-2xl border border-accent bg-muted/50 p-3">
                                                                    <p className="text-xs font-medium text-muted-foreground">Subscribers</p>
                                                                    <p className="text-sm font-bold text-primary">
                                                                        {campaign.subscribers.toLocaleString()}
                                                                    </p>
                                                                </div>
                                                                <div className="rounded-2xl border border-accent bg-muted/50 p-3">
                                                                    <p className="text-xs font-medium text-muted-foreground">Open Rate</p>
                                                                    <p className="text-sm font-bold text-primary">{campaign.openRate}%</p>
                                                                </div>
                                                                <div className="rounded-2xl border border-accent bg-muted/50 p-3">
                                                                    <p className="text-xs font-medium text-muted-foreground">Click Rate</p>
                                                                    <p className="text-sm font-bold text-primary">{campaign.clickRate}%</p>
                                                                </div>
                                                            </div>
                                                        </CollapsibleContent>
                                                    </Collapsible>
                                                </div>

                                                {/* Additional Info */}
                                                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                                        <span>{campaign.groups} email groups</span>
                                                        <span>•</span>
                                                        <span>Created {formatDate(campaign.createdAt)}</span>
                                                    </div>
                                                    {campaign.status === "active" && (
                                                        <div className="flex items-center gap-2 text-xs">
                                                            <Clock className="h-3 w-3 text-primary" />
                                                            <span className="text-primary">
                                                                {getDaysRemaining(campaign) > 0
                                                                    ? `${getDaysRemaining(campaign)} days remaining`
                                                                    : "Campaign ended"}
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>
                            ))}
                        </div>

                        {/* View More / Show Less Buttons */}
                        {campaigns.length > INITIAL_DISPLAY_COUNT && (
                            <div className="flex justify-center gap-4 pt-6">
                                {hasMoreCampaigns && (
                                    <Button
                                        onClick={handleViewMore}
                                        variant="outline"
                                        className="rounded-2xl border-primary/20 bg-primary/5 hover:bg-primary/10"
                                    >
                                        <Eye className="mr-2 h-4 w-4" />
                                        View More ({campaigns.length - displayCount} remaining)
                                    </Button>
                                )}
                                {canShowLess && (
                                    <Button
                                        onClick={handleShowLess}
                                        variant="outline"
                                        className="rounded-2xl border-muted-foreground/20 bg-muted/5 hover:bg-muted/10"
                                    >
                                        <EyeOff className="mr-2 h-4 w-4" />
                                        Show Less
                                    </Button>
                                )}
                            </div>
                        )}
                    </div>

                    {campaigns.length === 0 && !isLoading && (
                        <Card className="rounded-3xl border border-accent bg-card">
                            <CardContent className="p-12 text-center">
                                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
                                    <Calendar className="h-8 w-8 text-muted-foreground" />
                                </div>
                                <h3 className="mb-2 text-lg font-semibold text-primary">No campaigns found</h3>
                                <p className="text-sm text-muted-foreground">
                                    {searchQuery || filterStatus !== "all" || filterAssignee !== "all"
                                        ? "Try adjusting your search or filter criteria"
                                        : "Create your first campaign to get started"}
                                </p>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </AppLayout>
    )
}
