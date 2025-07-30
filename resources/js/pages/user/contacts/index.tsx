"use client"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import AppLayout from "@/layouts/app-layout"
import { router, useForm } from "@inertiajs/react"
import {
    AlertTriangle,
    Building2,
    CheckCircle,
    Crown,
    Download,
    Edit,
    Eye,
    FileText,
    Grid3X3,
    List,
    Mail,
    MoreHorizontal,
    Plus,
    Search,
    Star,
    Trash2,
    TrendingUp,
    Upload,
    User,
    Users,
} from "lucide-react"
import type React from "react"
import { useRef, useState } from "react"

interface Contact {
    id: number
    name: string
    email: string
    company: string
    jobTitle: string
    classification: "lead" | "prospect" | "customer" | "partner" | "vendor" | "other"
    status: "active" | "inactive" | "blocked"
    tags: string[]
    lastContacted: string | null
    created_at: string
    updated_at: string
}

interface ContactsPageProps {
    contacts: {
        data: Contact[]
        current_page: number
        last_page: number
        per_page: number
        total: number
        links?: any[]
    }
    filters: {
        search?: string
        status?: string
        classification?: string
        company?: string
        sort_by?: string
        sort_order?: string
    }
    usage: {
        used: number
        limit: number
        remaining: number
        percentage: number
        plan: string
        can_add: boolean
        is_near_limit: boolean
        is_at_limit: boolean
    }
    stats: {
        total: number
        classifications: Record<string, number>
        active: number
        recent: number
    }
    companies: string[]
    upgrade_suggestions: Array<{
        plan: string
        limit: number
        price: string
        recommended: boolean
    }>
    flash?: {
        success?: string
        error?: string
        import_errors?: string[]
    }
}

export default function ContactsIndex({
    contacts,
    filters,
    usage,
    stats,
    companies,
    upgrade_suggestions,
    flash,
}: ContactsPageProps) {
    const [searchTerm, setSearchTerm] = useState(filters.search || "")
    const [statusFilter, setStatusFilter] = useState(filters.status || "all")
    const [classificationFilter, setClassificationFilter] = useState(filters.classification || "all")
    const [selectedContacts, setSelectedContacts] = useState<number[]>([])
    const [showAddModal, setShowAddModal] = useState(false)
    const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
    const [importFile, setImportFile] = useState<File | null>(null)
    const [importPreview, setImportPreview] = useState<any[]>([])
    const fileInputRef = useRef<HTMLInputElement>(null)

    // Form for adding new contact using Inertia's useForm
    const {
        data: newContact,
        setData,
        post,
        processing,
        errors,
        reset,
        clearErrors,
    } = useForm({
        name: "",
        email: "",
        company: "",
        job_title: "",
        classification: "prospect" as const,
        status: "active" as const,
        tags: [] as string[],
        custom_fields: {},
    })

    // Form for importing contacts
    const {
        data: importData,
        setData: setImportData,
        post: postImport,
        processing: importProcessing,
        errors: importErrors,
        reset: resetImport,
    } = useForm({
        file: null as File | null,
    })

    // Classification configurations - MINIMAL
    const classificationConfig = {
        lead: { label: "Lead", icon: TrendingUp },
        prospect: { label: "Prospect", icon: User },
        customer: { label: "Customer", icon: Star },
        partner: { label: "Partner", icon: Building2 },
        vendor: { label: "Vendor", icon: Building2 },
        other: { label: "Other", icon: User },
    }

    // Handle search with debounce
    const handleSearch = (value: string) => {
        setSearchTerm(value)
        const timeoutId = setTimeout(() => {
            router.get(
                "/contacts",
                {
                    search: value || undefined,
                    status: statusFilter !== "all" ? statusFilter : undefined,
                    classification: classificationFilter !== "all" ? classificationFilter : undefined,
                    page: 1,
                },
                {
                    preserveState: true,
                    replace: true,
                    only: ["contacts", "filters"],
                },
            )
        }, 300)
        return () => clearTimeout(timeoutId)
    }

    // Handle filters
    const handleFilter = (type: string, value: string) => {
        if (type === "status") setStatusFilter(value)
        if (type === "classification") setClassificationFilter(value)
        router.get(
            "/contacts",
            {
                search: searchTerm || undefined,
                status:
                    type === "status" ? (value !== "all" ? value : undefined) : statusFilter !== "all" ? statusFilter : undefined,
                classification:
                    type === "classification"
                        ? value !== "all"
                            ? value
                            : undefined
                        : classificationFilter !== "all"
                            ? classificationFilter
                            : undefined,
                page: 1,
            },
            {
                preserveState: true,
                replace: true,
                only: ["contacts", "filters"],
            },
        )
    }

    // Handle add contact
    const handleAddContact = (e: React.FormEvent) => {
        e.preventDefault()

        // Check if user can add more contacts
        if (!usage.can_add) {
            alert(
                `Contact limit reached! You have used ${usage.used}/${usage.limit} contacts on your ${usage.plan} plan. Please upgrade to add more contacts.`,
            )
            return
        }

        post("/contacts", {
            onSuccess: () => {
                setShowAddModal(false)
                reset()
                clearErrors()
            },
        })
    }

    // Handle delete contact
    const handleDeleteContact = (id: number, name: string) => {
        if (window.confirm(`Are you sure you want to delete ${name}?`)) {
            router.delete(`/contacts/${id}`, {
                onSuccess: () => {
                    setSelectedContacts((prev) => prev.filter((cId) => cId !== id))
                },
            })
        }
    }

    // Handle bulk delete
    const handleBulkDelete = () => {
        if (selectedContacts.length > 0 && window.confirm(`Delete ${selectedContacts.length} selected contacts?`)) {
            router.delete("/contacts/bulk/delete", {
                data: { contact_ids: selectedContacts },
                onSuccess: () => setSelectedContacts([]),
            })
        }
    }

    // Handle contact selection
    const handleSelectContact = (id: number, checked: boolean) => {
        if (checked) {
            setSelectedContacts([...selectedContacts, id])
        } else {
            setSelectedContacts(selectedContacts.filter((cId) => cId !== id))
        }
    }

    // Handle select all
    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            setSelectedContacts(contacts.data.map((c) => c.id))
        } else {
            setSelectedContacts([])
        }
    }

    // Handle file selection for import
    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            setImportFile(file)
            setImportData("file", file)
            previewImportFile(file)
        }
    }

    // Preview import file
    const previewImportFile = (file: File) => {
        const reader = new FileReader()
        reader.onload = (e) => {
            const text = e.target?.result as string
            const lines = text.split("\n").slice(0, 6) // Preview first 5 rows + header
            const preview = lines.map((line) => line.split(","))
            setImportPreview(preview)
        }
        reader.readAsText(file)
    }

    // Handle import
    const handleImport = (e: React.FormEvent) => {
        e.preventDefault()
        if (!importFile) return

        // Check if import would exceed limit
        if (importPreview.length > 1 && importPreview.length - 1 > usage.remaining) {
            alert(
                `Import contains ${importPreview.length - 1} contacts but you only have ${usage.remaining} slots remaining on your ${usage.plan} plan. Please upgrade your plan or reduce the import size.`,
            )
            return
        }

        postImport("/contacts/import", {
            onSuccess: () => {
                setShowAddModal(false)
                setImportFile(null)
                setImportPreview([])
                resetImport()
                if (fileInputRef.current) {
                    fileInputRef.current.value = ""
                }
            },
            onError: (errors) => {
                console.error("Import errors:", errors)
            },
        })
    }

    // Handle export
    const handleExport = () => {
        window.location.href = `/contacts/export?${new URLSearchParams({
            search: searchTerm || "",
            status: statusFilter !== "all" ? statusFilter : "",
            classification: classificationFilter !== "all" ? classificationFilter : "",
        }).toString()}`
    }

    // Handle download template
    const handleDownloadTemplate = () => {
        window.location.href = "/contacts/download-template"
    }

    // Handle upgrade
    const handleUpgrade = () => {
        router.visit("/billing/plans")
    }

    // Utility functions
    const getInitials = (name: string) => {
        return name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase()
            .slice(0, 2)
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case "active":
                return "bg-green-500"
            case "inactive":
                return "bg-gray-400"
            case "blocked":
                return "bg-red-500"
            default:
                return "bg-gray-400"
        }
    }

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
        })
    }

    const getPlanDisplayName = (plan: string) => {
        switch (plan) {
            case "free":
                return "Free"
            case "growth-monthly":
            case "growth-annual":
                return "Growth"
            case "scale-monthly":
            case "scale-annual":
                return "Scale"
            default:
                return "Free"
        }
    }

    const getPlanColor = (plan: string) => {
        switch (plan) {
            case "free":
                return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400"
            case "growth-monthly":
            case "growth-annual":
                return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
            case "scale-monthly":
            case "scale-annual":
                return "bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400"
            default:
                return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400"
        }
    }

    return (
        <AppLayout>
            <div className="min-h-screen bg-background">
                <div className="mx-auto max-w-7xl px-3 py-4 sm:px-4 sm:py-6 lg:px-6 lg:py-8 xl:px-8">
                    {/* Header - Ultra Responsive */}
                    <div className="mb-6 sm:mb-8">
                        <div className="flex flex-col gap-3 sm:gap-4 lg:flex-row lg:items-center lg:justify-between">
                            <div className="space-y-1 sm:space-y-2">
                                <div className="flex items-center gap-3">
                                    <h1 className="text-2xl font-bold text-foreground sm:text-3xl lg:text-4xl">Contacts</h1>
                                    <Badge className={getPlanColor(usage.plan)}>{getPlanDisplayName(usage.plan)}</Badge>
                                </div>
                                <p className="text-sm text-muted-foreground sm:text-base">Manage your contact database</p>
                            </div>
                            <div className="flex flex-col gap-2 sm:flex-row sm:gap-3">
                                <Button
                                    variant="outline"
                                    onClick={handleExport}
                                    className="h-9 gap-2 bg-transparent text-sm sm:h-10 sm:text-base"
                                    size="sm"
                                >
                                    <Download className="h-3 w-3 sm:h-4 sm:w-4" />
                                    <span className="xs:inline hidden">Export</span>
                                </Button>
                                <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
                                    <DialogTrigger asChild>
                                        <Button className="h-9 gap-2 text-sm sm:h-10 sm:text-base" size="sm" disabled={!usage.can_add}>
                                            <Plus className="h-3 w-3 sm:h-4 sm:w-4" />
                                            <span className="xs:inline hidden">Add Contact</span>
                                            <span className="xs:hidden">Add</span>
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent className="mx-2 w-[calc(100vw-16px)] max-w-none sm:mx-4 sm:w-[calc(100vw-32px)] md:max-w-2xl lg:max-w-3xl xl:max-w-4xl">
                                        <DialogHeader className="pb-4">
                                            <DialogTitle className="text-lg sm:text-xl">Add New Contact</DialogTitle>
                                        </DialogHeader>

                                        {/* Usage Warning */}
                                        {usage.is_near_limit && (
                                            <Alert
                                                className={`mb-4 ${usage.is_at_limit ? "border-red-200 bg-red-50" : "border-yellow-200 bg-yellow-50"}`}
                                            >
                                                <AlertTriangle
                                                    className={`h-4 w-4 ${usage.is_at_limit ? "text-red-600" : "text-yellow-600"}`}
                                                />
                                                <AlertDescription
                                                    className={`text-sm ${usage.is_at_limit ? "text-red-800" : "text-yellow-800"}`}
                                                >
                                                    {usage.is_at_limit
                                                        ? `Contact limit reached! You have used ${usage.used}/${usage.limit} contacts on your ${getPlanDisplayName(usage.plan)} plan.`
                                                        : `You're approaching your contact limit: ${usage.used}/${usage.limit} used (${usage.remaining} remaining).`}
                                                    {upgrade_suggestions.length > 0 && (
                                                        <Button
                                                            variant="link"
                                                            size="sm"
                                                            onClick={handleUpgrade}
                                                            className="ml-2 h-auto p-0 text-sm underline"
                                                        >
                                                            Upgrade Plan
                                                        </Button>
                                                    )}
                                                </AlertDescription>
                                            </Alert>
                                        )}

                                        <Tabs defaultValue="manual" className="w-full">
                                            <TabsList className="grid h-9 w-full grid-cols-2 sm:h-10">
                                                <TabsTrigger value="manual" className="text-xs sm:text-sm">
                                                    Manual Entry
                                                </TabsTrigger>
                                                <TabsTrigger value="import" className="text-xs sm:text-sm">
                                                    Bulk Import
                                                </TabsTrigger>
                                            </TabsList>
                                            <TabsContent value="manual" className="mt-4 sm:mt-6">
                                                <form onSubmit={handleAddContact} className="space-y-3 sm:space-y-4">
                                                    <div className="grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-2">
                                                        <div className="space-y-1 sm:space-y-2">
                                                            <Label htmlFor="name" className="text-sm font-medium">
                                                                Name *
                                                            </Label>
                                                            <Input
                                                                id="name"
                                                                value={newContact.name}
                                                                onChange={(e) => setData("name", e.target.value)}
                                                                placeholder="John Doe"
                                                                className={`h-9 text-sm sm:h-10 sm:text-base ${errors.name ? "border-red-500" : ""}`}
                                                                disabled={!usage.can_add}
                                                            />
                                                            {errors.name && <p className="text-xs text-red-600 sm:text-sm">{errors.name}</p>}
                                                        </div>
                                                        <div className="space-y-1 sm:space-y-2">
                                                            <Label htmlFor="email" className="text-sm font-medium">
                                                                Email *
                                                            </Label>
                                                            <Input
                                                                id="email"
                                                                type="email"
                                                                value={newContact.email}
                                                                onChange={(e) => setData("email", e.target.value)}
                                                                placeholder="john@company.com"
                                                                className={`h-9 text-sm sm:h-10 sm:text-base ${errors.email ? "border-red-500" : ""}`}
                                                                disabled={!usage.can_add}
                                                            />
                                                            {errors.email && <p className="text-xs text-red-600 sm:text-sm">{errors.email}</p>}
                                                        </div>
                                                        <div className="space-y-1 sm:space-y-2">
                                                            <Label htmlFor="company" className="text-sm font-medium">
                                                                Company
                                                            </Label>
                                                            <Input
                                                                id="company"
                                                                value={newContact.company}
                                                                onChange={(e) => setData("company", e.target.value)}
                                                                placeholder="Company Inc."
                                                                className="h-9 text-sm sm:h-10 sm:text-base"
                                                                disabled={!usage.can_add}
                                                            />
                                                        </div>
                                                        <div className="space-y-1 sm:space-y-2">
                                                            <Label htmlFor="job_title" className="text-sm font-medium">
                                                                Job Title
                                                            </Label>
                                                            <Input
                                                                id="job_title"
                                                                value={newContact.job_title}
                                                                onChange={(e) => setData("job_title", e.target.value)}
                                                                placeholder="Marketing Director"
                                                                className="h-9 text-sm sm:h-10 sm:text-base"
                                                                disabled={!usage.can_add}
                                                            />
                                                        </div>
                                                        <div className="space-y-1 sm:space-y-2">
                                                            <Label htmlFor="classification" className="text-sm font-medium">
                                                                Classification *
                                                            </Label>
                                                            <Select
                                                                value={newContact.classification}
                                                                onValueChange={(value) => setData("classification", value as any)}
                                                                disabled={!usage.can_add}
                                                            >
                                                                <SelectTrigger className="h-9 text-sm sm:h-10 sm:text-base">
                                                                    <SelectValue />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    {Object.entries(classificationConfig).map(([key, config]) => (
                                                                        <SelectItem key={key} value={key} className="text-sm">
                                                                            {config.label}
                                                                        </SelectItem>
                                                                    ))}
                                                                </SelectContent>
                                                            </Select>
                                                        </div>
                                                        <div className="space-y-1 sm:space-y-2">
                                                            <Label htmlFor="status" className="text-sm font-medium">
                                                                Status *
                                                            </Label>
                                                            <Select
                                                                value={newContact.status}
                                                                onValueChange={(value) => setData("status", value as any)}
                                                                disabled={!usage.can_add}
                                                            >
                                                                <SelectTrigger className="h-9 text-sm sm:h-10 sm:text-base">
                                                                    <SelectValue />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    <SelectItem value="active" className="text-sm">
                                                                        Active
                                                                    </SelectItem>
                                                                    <SelectItem value="inactive" className="text-sm">
                                                                        Inactive
                                                                    </SelectItem>
                                                                    <SelectItem value="blocked" className="text-sm">
                                                                        Blocked
                                                                    </SelectItem>
                                                                </SelectContent>
                                                            </Select>
                                                        </div>
                                                    </div>
                                                    <div className="flex flex-row gap-2 pt-3 sm:gap-3 sm:pt-4">
                                                        <Button
                                                            type="button"
                                                            variant="outline"
                                                            onClick={() => {
                                                                setShowAddModal(false)
                                                                reset()
                                                                clearErrors()
                                                            }}
                                                            className="h-9 flex-1 text-sm sm:h-10 sm:text-base"
                                                        >
                                                            Cancel
                                                        </Button>
                                                        <Button
                                                            type="submit"
                                                            disabled={processing || !usage.can_add}
                                                            className="h-9 flex-1 text-sm sm:h-10 sm:text-base"
                                                        >
                                                            {processing ? "Adding..." : "Add Contact"}
                                                        </Button>
                                                    </div>
                                                </form>
                                            </TabsContent>
                                            <TabsContent value="import" className="mt-4 sm:mt-6">
                                                <div className="space-y-3 sm:space-y-4">
                                                    {/* Import Guidelines */}
                                                    <Alert className="border-l-4 border-l-blue-500">
                                                        <FileText className="h-4 w-4" />
                                                        <AlertDescription>
                                                            <div className="mb-2 text-sm font-medium sm:text-base">Import Guidelines</div>
                                                            <ul className="space-y-1 text-xs sm:text-sm">
                                                                <li>
                                                                    • <strong>Required:</strong> Name, Email
                                                                </li>
                                                                <li>
                                                                    • <strong>Optional:</strong> Company, Job Title, Classification, Status, Tags
                                                                </li>
                                                                <li>
                                                                    • <strong>Formats:</strong> CSV, TXT
                                                                </li>
                                                                <li>
                                                                    • <strong>Max size:</strong> 10MB
                                                                </li>
                                                                <li>
                                                                    • <strong>Available slots:</strong> {usage.remaining} contacts remaining
                                                                </li>
                                                            </ul>
                                                        </AlertDescription>
                                                    </Alert>

                                                    {/* Import Limit Warning */}
                                                    {usage.remaining < 50 && (
                                                        <Alert className="border-yellow-200 bg-yellow-50">
                                                            <AlertTriangle className="h-4 w-4 text-yellow-600" />
                                                            <AlertDescription className="text-sm text-yellow-800">
                                                                You only have {usage.remaining} contact slots remaining on your{" "}
                                                                {getPlanDisplayName(usage.plan)} plan.
                                                                {upgrade_suggestions.length > 0 && (
                                                                    <>
                                                                        {" "}
                                                                        <Button
                                                                            variant="link"
                                                                            size="sm"
                                                                            onClick={handleUpgrade}
                                                                            className="h-auto p-0 text-sm underline"
                                                                        >
                                                                            Upgrade to add more contacts
                                                                        </Button>
                                                                    </>
                                                                )}
                                                            </AlertDescription>
                                                        </Alert>
                                                    )}

                                                    <form onSubmit={handleImport}>
                                                        <div className="rounded-lg border-2 border-dashed p-4 text-center sm:p-6">
                                                            <Upload className="mx-auto mb-3 h-10 w-10 text-muted-foreground sm:mb-4 sm:h-12 sm:w-12" />
                                                            <h3 className="mb-2 text-base font-medium sm:text-lg">Upload CSV File</h3>
                                                            <p className="mb-3 text-xs text-muted-foreground sm:mb-4 sm:text-sm">
                                                                Drag and drop or click to browse
                                                            </p>
                                                            <input
                                                                ref={fileInputRef}
                                                                type="file"
                                                                accept=".csv,.txt"
                                                                onChange={handleFileSelect}
                                                                className="hidden"
                                                                disabled={usage.remaining === 0}
                                                            />
                                                            <div className="flex flex-col gap-2 sm:flex-row sm:justify-center sm:gap-3">
                                                                <Button
                                                                    type="button"
                                                                    variant="outline"
                                                                    onClick={() => fileInputRef.current?.click()}
                                                                    className="h-9 text-sm sm:h-10"
                                                                    disabled={usage.remaining === 0}
                                                                >
                                                                    <Upload className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                                                                    Choose File
                                                                </Button>
                                                                <Button
                                                                    type="button"
                                                                    variant="outline"
                                                                    onClick={handleDownloadTemplate}
                                                                    className="h-9 text-sm sm:h-10 bg-transparent"
                                                                >
                                                                    <Download className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                                                                    Template
                                                                </Button>
                                                            </div>
                                                            {importFile && (
                                                                <div className="mt-3 rounded border bg-muted p-2 sm:mt-4 sm:p-3">
                                                                    <p className="truncate text-xs font-medium sm:text-sm">{importFile.name}</p>
                                                                    <p className="text-xs text-muted-foreground">
                                                                        {(importFile.size / 1024).toFixed(1)} KB
                                                                    </p>
                                                                    {importPreview.length > 1 && (
                                                                        <p className="text-xs text-muted-foreground">
                                                                            {importPreview.length - 1} contacts detected
                                                                            {importPreview.length - 1 > usage.remaining && (
                                                                                <span className="ml-1 text-red-600">
                                                                                    (exceeds limit by {importPreview.length - 1 - usage.remaining})
                                                                                </span>
                                                                            )}
                                                                        </p>
                                                                    )}
                                                                </div>
                                                            )}
                                                            {importErrors.file && (
                                                                <p className="mt-2 text-xs text-red-600 sm:text-sm">{importErrors.file}</p>
                                                            )}
                                                        </div>
                                                        {/* Import Preview */}
                                                        {importPreview.length > 0 && (
                                                            <div className="mt-3 overflow-x-auto sm:mt-4">
                                                                <div className="min-w-full">
                                                                    <div className="mb-2 text-xs font-medium sm:text-sm">Preview (first 5 rows):</div>
                                                                    <div className="overflow-hidden rounded-lg border">
                                                                        {importPreview.map((row, index) => (
                                                                            <div
                                                                                key={index}
                                                                                className={`flex border-b last:border-b-0 ${index === 0 ? "bg-muted font-medium" : ""}`}
                                                                            >
                                                                                {row.slice(0, 3).map((cell: string, cellIndex: number) => (
                                                                                    <div
                                                                                        key={cellIndex}
                                                                                        className="min-w-0 flex-1 truncate border-r px-2 py-1 text-xs last:border-r-0 sm:px-3 sm:py-2 sm:text-sm"
                                                                                    >
                                                                                        {cell}
                                                                                    </div>
                                                                                ))}
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        )}
                                                        <div className="flex flex-row gap-2 pt-3 sm:gap-3 sm:pt-4">
                                                            <Button
                                                                type="button"
                                                                variant="outline"
                                                                onClick={() => {
                                                                    setShowAddModal(false)
                                                                    setImportFile(null)
                                                                    setImportPreview([])
                                                                    resetImport()
                                                                }}
                                                                className="h-9 flex-1 text-sm sm:h-10 sm:text-base"
                                                            >
                                                                Cancel
                                                            </Button>
                                                            <Button
                                                                type="submit"
                                                                disabled={
                                                                    !importFile ||
                                                                    importProcessing ||
                                                                    usage.remaining === 0 ||
                                                                    (importPreview.length > 1 && importPreview.length - 1 > usage.remaining)
                                                                }
                                                                className="h-9 flex-1 text-sm sm:h-10 sm:text-base"
                                                            >
                                                                {importProcessing ? "Importing..." : "Import Contacts"}
                                                            </Button>
                                                        </div>
                                                    </form>
                                                </div>
                                            </TabsContent>
                                        </Tabs>
                                    </DialogContent>
                                </Dialog>
                            </div>
                        </div>
                    </div>

                    {/* Enhanced Usage Stats */}
                    <div className="mb-6 grid grid-cols-2 gap-3 sm:mb-8 sm:gap-4 lg:grid-cols-4">
                        <Card className="transition-all hover:shadow-md">
                            <CardContent className="p-3 sm:p-4 lg:p-6">
                                <div className="flex items-center justify-between">
                                    <div className="min-w-0 flex-1">
                                        <p className="truncate text-xs text-muted-foreground sm:text-sm">Total</p>
                                        <p className="truncate text-lg font-bold sm:text-xl lg:text-2xl">{stats.total.toLocaleString()}</p>
                                    </div>
                                    <Users className="h-6 w-6 flex-shrink-0 text-muted-foreground sm:h-7 sm:w-7 lg:h-8 lg:w-8" />
                                </div>
                            </CardContent>
                        </Card>
                        <Card className="transition-all hover:shadow-md">
                            <CardContent className="p-3 sm:p-4 lg:p-6">
                                <div className="flex items-center justify-between">
                                    <div className="min-w-0 flex-1">
                                        <p className="truncate text-xs text-muted-foreground sm:text-sm">Active</p>
                                        <p className="truncate text-lg font-bold sm:text-xl lg:text-2xl">{stats.active.toLocaleString()}</p>
                                    </div>
                                    <CheckCircle className="h-6 w-6 flex-shrink-0 text-muted-foreground sm:h-7 sm:w-7 lg:h-8 lg:w-8" />
                                </div>
                            </CardContent>
                        </Card>
                        <Card className="transition-all hover:shadow-md">
                            <CardContent className="p-3 sm:p-4 lg:p-6">
                                <div className="flex items-center justify-between">
                                    <div className="min-w-0 flex-1">
                                        <p className="truncate text-xs text-muted-foreground sm:text-sm">Recent</p>
                                        <p className="truncate text-lg font-bold sm:text-xl lg:text-2xl">{stats.recent.toLocaleString()}</p>
                                    </div>
                                    <TrendingUp className="h-6 w-6 flex-shrink-0 text-muted-foreground sm:h-7 sm:w-7 lg:h-8 lg:w-8" />
                                </div>
                            </CardContent>
                        </Card>
                        <Card className="col-span-2 transition-all hover:shadow-md lg:col-span-1">
                            <CardContent className="p-3 sm:p-4 lg:p-6">
                                <div className="flex items-center justify-between">
                                    <div className="min-w-0 flex-1">
                                        <div className="mb-1 flex items-center justify-between">
                                            <p className="truncate text-xs text-muted-foreground sm:text-sm">Usage</p>
                                            {usage.is_near_limit && (
                                                <AlertTriangle
                                                    className={`h-3 w-3 ${usage.is_at_limit ? "text-red-500" : "text-yellow-500"}`}
                                                />
                                            )}
                                        </div>
                                        <p className="text-base font-bold sm:text-lg">
                                            {usage.used.toLocaleString()}/{usage.limit.toLocaleString()}
                                        </p>
                                        <Progress
                                            value={usage.percentage}
                                            className={`mt-2 h-1.5 sm:h-2 ${usage.is_at_limit
                                                    ? "[&>div]:bg-red-500"
                                                    : usage.is_near_limit
                                                        ? "[&>div]:bg-yellow-500"
                                                        : "[&>div]:bg-green-500"
                                                }`}
                                        />
                                        <p className="mt-1 text-xs text-muted-foreground">
                                            {usage.remaining.toLocaleString()} remaining • {usage.percentage}%
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Upgrade Suggestion Banner */}
                    {usage.is_at_limit && upgrade_suggestions.length > 0 && (
                        <Card className="mb-6 border-orange-200 bg-gradient-to-r from-orange-50 to-yellow-50 sm:mb-8">
                            <CardContent className="p-4 sm:p-6">
                                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                    <div className="flex items-start gap-3">
                                        <Crown className="h-6 w-6 flex-shrink-0 text-orange-600" />
                                        <div>
                                            <h3 className="font-semibold text-orange-900">Contact Limit Reached</h3>
                                            <p className="text-sm text-orange-800">
                                                You've reached your {usage.limit.toLocaleString()} contact limit on the{" "}
                                                {getPlanDisplayName(usage.plan)} plan. Upgrade to add more contacts.
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        {upgrade_suggestions.slice(0, 1).map((suggestion, index) => (
                                            <Button key={index} onClick={handleUpgrade} className="bg-orange-600 hover:bg-orange-700">
                                                <Crown className="mr-2 h-4 w-4" />
                                                Upgrade to {suggestion.plan.charAt(0).toUpperCase() + suggestion.plan.slice(1)}
                                            </Button>
                                        ))}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Search and Filters - Ultra Responsive */}
                    <Card className="mb-4 sm:mb-6">
                        <CardContent className="p-3 sm:p-4 lg:p-6">
                            <div className="space-y-3 sm:space-y-4">
                                {/* Search Bar */}
                                <div className="relative">
                                    <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                    <Input
                                        placeholder="Search contacts..."
                                        value={searchTerm}
                                        onChange={(e) => handleSearch(e.target.value)}
                                        className="h-9 pl-10 text-sm sm:h-10 sm:text-base"
                                    />
                                </div>
                                {/* Filters and View Toggle */}
                                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                    <div className="flex flex-col gap-2 sm:flex-row sm:gap-3">
                                        <Select
                                            value={classificationFilter}
                                            onValueChange={(value) => handleFilter("classification", value)}
                                        >
                                            <SelectTrigger className="h-9 w-full text-sm sm:h-10 sm:w-36 lg:w-40">
                                                <SelectValue placeholder="Classification" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all" className="text-sm">
                                                    All Types
                                                </SelectItem>
                                                {Object.entries(classificationConfig).map(([key, config]) => (
                                                    <SelectItem key={key} value={key} className="text-sm">
                                                        {config.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <Select value={statusFilter} onValueChange={(value) => handleFilter("status", value)}>
                                            <SelectTrigger className="h-9 w-full text-sm sm:h-10 sm:w-28 lg:w-32">
                                                <SelectValue placeholder="Status" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all" className="text-sm">
                                                    All Status
                                                </SelectItem>
                                                <SelectItem value="active" className="text-sm">
                                                    Active
                                                </SelectItem>
                                                <SelectItem value="inactive" className="text-sm">
                                                    Inactive
                                                </SelectItem>
                                                <SelectItem value="blocked" className="text-sm">
                                                    Blocked
                                                </SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    {/* View Mode Toggle */}
                                    <div className="flex items-center gap-1 sm:gap-2">
                                        <Button
                                            variant={viewMode === "grid" ? "default" : "outline"}
                                            size="sm"
                                            onClick={() => setViewMode("grid")}
                                            className="h-8 w-8 p-0 sm:h-9 sm:w-9"
                                        >
                                            <Grid3X3 className="h-3 w-3 sm:h-4 sm:w-4" />
                                        </Button>
                                        <Button
                                            variant={viewMode === "list" ? "default" : "outline"}
                                            size="sm"
                                            onClick={() => setViewMode("list")}
                                            className="h-8 w-8 p-0 sm:h-9 sm:w-9"
                                        >
                                            <List className="h-3 w-3 sm:h-4 sm:w-4" />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Bulk Actions - Ultra Responsive */}
                    {selectedContacts.length > 0 && (
                        <Card className="mb-4 border-primary sm:mb-6">
                            <CardContent className="p-3 sm:p-4">
                                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                    <span className="text-sm font-medium">
                                        {selectedContacts.length} contact{selectedContacts.length > 1 ? "s" : ""} selected
                                    </span>
                                    <div className="flex gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setSelectedContacts([])}
                                            className="h-8 text-xs sm:h-9 sm:text-sm"
                                        >
                                            Deselect All
                                        </Button>
                                        <Button
                                            variant="destructive"
                                            size="sm"
                                            onClick={handleBulkDelete}
                                            className="h-8 text-xs sm:h-9 sm:text-sm"
                                        >
                                            <Trash2 className="mr-1 h-3 w-3 sm:h-4 sm:w-4" />
                                            Delete
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Contacts List - Ultra Responsive */}
                    {contacts.data.length === 0 ? (
                        <Card>
                            <CardContent className="py-12 text-center sm:py-16">
                                <Users className="mx-auto mb-3 h-12 w-12 text-muted-foreground sm:mb-4 sm:h-16 sm:w-16" />
                                <h3 className="mb-2 text-base font-medium sm:text-lg">No contacts found</h3>
                                <p className="mb-4 px-4 text-sm text-muted-foreground sm:mb-6 sm:text-base">
                                    {searchTerm || statusFilter !== "all" || classificationFilter !== "all"
                                        ? "Try adjusting your search or filters"
                                        : "Add your first contact to get started"}
                                </p>
                                {!searchTerm && statusFilter === "all" && classificationFilter === "all" && usage.can_add && (
                                    <Button onClick={() => setShowAddModal(true)} className="h-9 gap-2 sm:h-10">
                                        <Plus className="h-4 w-4" />
                                        Add Contact
                                    </Button>
                                )}
                            </CardContent>
                        </Card>
                    ) : (
                        <>
                            <div className="mb-3 flex items-center justify-between sm:mb-4">
                                <div className="flex items-center gap-2">
                                    <Checkbox
                                        checked={selectedContacts.length === contacts.data.length}
                                        onCheckedChange={handleSelectAll}
                                        className="h-4 w-4"
                                    />
                                    <span className="text-xs text-muted-foreground sm:text-sm">
                                        {contacts.data.length} contact{contacts.data.length > 1 ? "s" : ""}
                                    </span>
                                </div>
                            </div>
                            {viewMode === "grid" ? (
                                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
                                    {contacts.data.map((contact) => {
                                        const config = classificationConfig[contact.classification]
                                        const IconComponent = config.icon
                                        return (
                                            <Card key={contact.id} className="group transition-all hover:shadow-md">
                                                <CardContent className="p-3 sm:p-4 lg:p-6">
                                                    <div className="mb-3 flex items-start justify-between sm:mb-4">
                                                        <Checkbox
                                                            checked={selectedContacts.includes(contact.id)}
                                                            onCheckedChange={(checked) => handleSelectContact(contact.id, checked as boolean)}
                                                            className="h-4 w-4"
                                                        />
                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger asChild>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 sm:h-8 sm:w-8"
                                                                >
                                                                    <MoreHorizontal className="h-3 w-3 sm:h-4 sm:w-4" />
                                                                </Button>
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent align="end">
                                                                <DropdownMenuItem
                                                                    onClick={() => router.get(`/contacts/${contact.id}`)}
                                                                    className="text-sm"
                                                                >
                                                                    <Eye className="mr-2 h-4 w-4" />
                                                                    View Details
                                                                </DropdownMenuItem>
                                                                <DropdownMenuItem
                                                                    onClick={() => router.get(`/contacts/${contact.id}/edit`)}
                                                                    className="text-sm"
                                                                >
                                                                    <Edit className="mr-2 h-4 w-4" />
                                                                    Edit
                                                                </DropdownMenuItem>
                                                                <DropdownMenuSeparator />
                                                                <DropdownMenuItem
                                                                    className="text-sm text-destructive"
                                                                    onClick={() => handleDeleteContact(contact.id, contact.name)}
                                                                >
                                                                    <Trash2 className="mr-2 h-4 w-4" />
                                                                    Delete
                                                                </DropdownMenuItem>
                                                            </DropdownMenuContent>
                                                        </DropdownMenu>
                                                    </div>
                                                    <div className="mb-3 text-center sm:mb-4">
                                                        <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-muted sm:mb-3 sm:h-12 sm:w-12">
                                                            <span className="text-xs font-medium sm:text-sm">{getInitials(contact.name)}</span>
                                                        </div>
                                                        <h3 className="truncate text-sm font-semibold sm:text-base">{contact.name}</h3>
                                                        <p className="truncate text-xs text-muted-foreground sm:text-sm">{contact.company}</p>
                                                    </div>
                                                    <div className="space-y-1.5 sm:space-y-2">
                                                        <div className="flex items-center gap-2">
                                                            <Mail className="h-3 w-3 flex-shrink-0 text-muted-foreground sm:h-4 sm:w-4" />
                                                            <span className="truncate text-xs sm:text-sm">{contact.email}</span>
                                                        </div>
                                                        {contact.jobTitle && (
                                                            <div className="flex items-center gap-2">
                                                                <User className="h-3 w-3 flex-shrink-0 text-muted-foreground sm:h-4 sm:w-4" />
                                                                <span className="truncate text-xs sm:text-sm">{contact.jobTitle}</span>
                                                            </div>
                                                        )}
                                                        <div className="flex items-center justify-between">
                                                            <Badge variant="secondary" className="text-xs">
                                                                <IconComponent className="mr-1 h-2.5 w-2.5 sm:h-3 sm:w-3" />
                                                                <span className="hidden sm:inline">{config.label}</span>
                                                                <span className="sm:hidden">{config.label.slice(0, 4)}</span>
                                                            </Badge>
                                                            <div className={`h-2 w-2 rounded-full ${getStatusColor(contact.status)}`} />
                                                        </div>
                                                        {contact.tags && contact.tags.length > 0 && (
                                                            <div className="flex flex-wrap gap-1">
                                                                {contact.tags.slice(0, 2).map((tag, index) => (
                                                                    <Badge key={index} variant="outline" className="max-w-20 truncate text-xs">
                                                                        {tag}
                                                                    </Badge>
                                                                ))}
                                                                {contact.tags.length > 2 && (
                                                                    <Badge variant="outline" className="text-xs">
                                                                        +{contact.tags.length - 2}
                                                                    </Badge>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <Separator className="my-3 sm:my-4" />
                                                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                                                        <span className="truncate">Added {formatDate(contact.created_at)}</span>
                                                        {contact.lastContacted && (
                                                            <span className="ml-2 truncate">Last: {formatDate(contact.lastContacted)}</span>
                                                        )}
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        )
                                    })}
                                </div>
                            ) : (
                                <Card>
                                    <CardContent className="p-0">
                                        <div className="divide-y">
                                            {contacts.data.map((contact) => {
                                                const config = classificationConfig[contact.classification]
                                                const IconComponent = config.icon
                                                return (
                                                    <div
                                                        key={contact.id}
                                                        className="flex items-center gap-2 p-3 hover:bg-muted/50 sm:gap-4 sm:p-4"
                                                    >
                                                        <Checkbox
                                                            checked={selectedContacts.includes(contact.id)}
                                                            onCheckedChange={(checked) => handleSelectContact(contact.id, checked as boolean)}
                                                            className="h-4 w-4 flex-shrink-0"
                                                        />
                                                        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-muted sm:h-10 sm:w-10">
                                                            <span className="text-xs font-medium sm:text-sm">{getInitials(contact.name)}</span>
                                                        </div>
                                                        <div className="min-w-0 flex-1">
                                                            <div className="mb-1 flex items-center gap-2">
                                                                <h3 className="truncate text-sm font-medium sm:text-base">{contact.name}</h3>
                                                                <Badge variant="secondary" className="flex-shrink-0 text-xs">
                                                                    <IconComponent className="mr-1 h-2.5 w-2.5 sm:h-3 sm:w-3" />
                                                                    <span className="hidden sm:inline">{config.label}</span>
                                                                    <span className="sm:hidden">{config.label.slice(0, 4)}</span>
                                                                </Badge>
                                                                <div
                                                                    className={`h-2 w-2 rounded-full ${getStatusColor(contact.status)} flex-shrink-0`}
                                                                />
                                                            </div>
                                                            <div className="flex flex-col gap-1 text-xs text-muted-foreground sm:flex-row sm:items-center sm:gap-4 sm:text-sm">
                                                                <span className="truncate">{contact.email}</span>
                                                                {contact.company && <span className="truncate">{contact.company}</span>}
                                                                {contact.jobTitle && (
                                                                    <span className="hidden truncate sm:inline">{contact.jobTitle}</span>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <div className="flex flex-shrink-0 items-center gap-2">
                                                            {contact.tags && contact.tags.length > 0 && (
                                                                <div className="hidden gap-1 sm:flex">
                                                                    {contact.tags.slice(0, 1).map((tag, index) => (
                                                                        <Badge key={index} variant="outline" className="max-w-20 truncate text-xs">
                                                                            {tag}
                                                                        </Badge>
                                                                    ))}
                                                                    {contact.tags.length > 1 && (
                                                                        <Badge variant="outline" className="text-xs">
                                                                            +{contact.tags.length - 1}
                                                                        </Badge>
                                                                    )}
                                                                </div>
                                                            )}
                                                            <span className="hidden whitespace-nowrap text-xs text-muted-foreground md:inline">
                                                                {formatDate(contact.created_at)}
                                                            </span>
                                                            <DropdownMenu>
                                                                <DropdownMenuTrigger asChild>
                                                                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0 sm:h-8 sm:w-8">
                                                                        <MoreHorizontal className="h-3 w-3 sm:h-4 sm:w-4" />
                                                                    </Button>
                                                                </DropdownMenuTrigger>
                                                                <DropdownMenuContent align="end">
                                                                    <DropdownMenuItem
                                                                        onClick={() => router.get(`/contacts/${contact.id}`)}
                                                                        className="text-sm"
                                                                    >
                                                                        <Eye className="mr-2 h-4 w-4" />
                                                                        View Details
                                                                    </DropdownMenuItem>
                                                                    <DropdownMenuItem
                                                                        onClick={() => router.get(`/contacts/${contact.id}/edit`)}
                                                                        className="text-sm"
                                                                    >
                                                                        <Edit className="mr-2 h-4 w-4" />
                                                                        Edit
                                                                    </DropdownMenuItem>
                                                                    <DropdownMenuSeparator />
                                                                    <DropdownMenuItem
                                                                        className="text-sm text-destructive"
                                                                        onClick={() => handleDeleteContact(contact.id, contact.name)}
                                                                    >
                                                                        <Trash2 className="mr-2 h-4 w-4" />
                                                                        Delete
                                                                    </DropdownMenuItem>
                                                                </DropdownMenuContent>
                                                            </DropdownMenu>
                                                        </div>
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    </CardContent>
                                </Card>
                            )}
                            {/* Pagination - Ultra Responsive */}
                            {contacts.last_page > 1 && (
                                <div className="mt-6 flex items-center justify-center gap-1 sm:mt-8 sm:gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() =>
                                            router.get("/contacts", {
                                                ...filters,
                                                page: contacts.current_page - 1,
                                            })
                                        }
                                        disabled={contacts.current_page === 1}
                                        className="h-8 px-2 text-xs sm:h-9 sm:px-3 sm:text-sm"
                                    >
                                        <span className="hidden sm:inline">Previous</span>
                                        <span className="sm:hidden">Prev</span>
                                    </Button>
                                    {Array.from({ length: Math.min(5, contacts.last_page) }, (_, i) => {
                                        let pageNum = i + 1
                                        if (contacts.last_page > 5) {
                                            if (contacts.current_page <= 3) {
                                                pageNum = i + 1
                                            } else if (contacts.current_page >= contacts.last_page - 2) {
                                                pageNum = contacts.last_page - 4 + i
                                            } else {
                                                pageNum = contacts.current_page - 2 + i
                                            }
                                        }
                                        return (
                                            <Button
                                                key={pageNum}
                                                variant={pageNum === contacts.current_page ? "default" : "outline"}
                                                size="sm"
                                                onClick={() =>
                                                    router.get("/contacts", {
                                                        ...filters,
                                                        page: pageNum,
                                                    })
                                                }
                                                className="h-8 w-8 p-0 text-xs sm:h-9 sm:w-9 sm:text-sm"
                                            >
                                                {pageNum}
                                            </Button>
                                        )
                                    })}
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() =>
                                            router.get("/contacts", {
                                                ...filters,
                                                page: contacts.current_page + 1,
                                            })
                                        }
                                        disabled={contacts.current_page === contacts.last_page}
                                        className="h-8 px-2 text-xs sm:h-9 sm:px-3 sm:text-sm"
                                    >
                                        <span className="hidden sm:inline">Next</span>
                                        <span className="sm:hidden">Next</span>
                                    </Button>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </AppLayout>
    )
}
