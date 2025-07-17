'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Link, router } from '@inertiajs/react';
import { Clock, Copy, Filter, Mail, Plus, RotateCcw, Search, Send, Trash2, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';

const getToneBadgeColor = (tone: string) => {
    switch (tone?.toLowerCase()) {
        case 'professional':
            return 'bg-blue-50 text-blue-700 border-blue-200';
        case 'casual':
            return 'bg-green-50 text-green-700 border-green-200';
        case 'formal':
            return 'bg-purple-50 text-purple-700 border-purple-200';
        case 'friendly':
            return 'bg-orange-50 text-orange-700 border-orange-200';
        case 'direct':
            return 'bg-red-50 text-red-700 border-red-200';
        case 'persuasive':
            return 'bg-indigo-50 text-indigo-700 border-indigo-200';
        default:
            return 'bg-muted text-muted-foreground';
    }
};

export default function MyEmailsComponent({ myEmails, filters = {} }) {
    const emails = myEmails?.data || [];
    const pagination = {
        current_page: myEmails?.current_page || 1,
        last_page: myEmails?.last_page || 1,
        per_page: myEmails?.per_page || 10,
        total: myEmails?.total || 0,
        from: myEmails?.from || 0,
        to: myEmails?.to || 0,
        links: myEmails?.links || [],
    };

    const [searchInput, setSearchInput] = useState(filters.search || '');
    const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);
    const [showFilters, setShowFilters] = useState(false);

    useEffect(() => {
        setSearchInput(filters.search || '');
    }, [filters.search]);

    const buildFilters = (overrides = {}) => {
        const newFilters = { ...filters, ...overrides };
        Object.keys(newFilters).forEach((k) => {
            if (newFilters[k] === '' || newFilters[k] === 'all' || newFilters[k] == null) delete newFilters[k];
        });
        delete newFilters.page;
        return newFilters;
    };

    const handleToneFilter = (value: string) => {
        router.get('/my-emails', buildFilters({ tone: value }), {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handleDateFilter = (value: string) => {
        router.get('/my-emails', buildFilters({ date: value }), {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handleSearchInput = (value: string) => {
        setSearchInput(value);
        if (searchTimeout) clearTimeout(searchTimeout);
        const timeout = setTimeout(() => {
            router.get('/my-emails', buildFilters({ search: value }), {
                preserveState: true,
                preserveScroll: true,
            });
        }, 500);
        setSearchTimeout(timeout);
    };

    const clearAllFilters = () => {
        setSearchInput('');
        router.get('/my-emails', {}, { preserveState: true, preserveScroll: true });
    };

    const hasActiveFilters = filters.tone || filters.date || filters.search;
    const activeFilterCount = [filters.tone, filters.date, filters.search].filter(Boolean).length;

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const handleCopyEmail = async (email: any) => {
        const emailText = `Subject: ${email.subject}\n\n${email.email_content}`;
        try {
            await navigator.clipboard.writeText(emailText);
        } catch (err) {
            console.error('Failed to copy email:', err);
        }
    };

    const handleSendEmail = (emailId: number) => {
        router.visit(`/email/generate/send?email_id=${emailId}`);
    };

    const availableTones = [...new Set(emails.map((email) => email.tone).filter(Boolean))];

    const EmptyState = () => (
        <div className="flex flex-col items-center justify-center py-20">
            <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
                <Mail className="h-10 w-10 text-primary" />
            </div>
            <h3 className="mb-2 text-2xl font-bold text-foreground">
                {filters.search
                    ? `No emails found for "${filters.search}"`
                    : hasActiveFilters
                        ? 'No emails match your filters'
                        : 'No emails generated yet'}
            </h3>
            <p className="mb-6 max-w-md text-center text-muted-foreground">
                {filters.search
                    ? 'Try a different search term or check your spelling.'
                    : hasActiveFilters
                        ? 'Try adjusting your filters or generate more emails to see results here.'
                        : 'Start creating professional emails with AI assistance. Generate your first email to see it appear here.'}
            </p>
            <div className="flex gap-3">
                {hasActiveFilters && (
                    <Button variant="outline" onClick={clearAllFilters} className="gap-2 bg-transparent">
                        <X className="h-4 w-4" />
                        Clear Filters
                    </Button>
                )}
                <Link href="/email/generate">
                    <Button className="gap-2">
                        <Plus className="h-4 w-4" />
                        Generate New Email
                    </Button>
                </Link>
            </div>
        </div>
    );
    const [deleteDialogEmail, setDeleteDialogEmail] = useState<any | null>(null);

    const handleConfirmDelete = () => {
        if (deleteDialogEmail) {
            router.delete(`/my-emails/${deleteDialogEmail.id}/delete`, {
                preserveState: true,
                preserveScroll: true,
            });
            setDeleteDialogEmail(null);
        }
    };

    const handleCancelDelete = () => {
        setDeleteDialogEmail(null);
    };

    const DeleteDialog = () =>
        deleteDialogEmail ? (
            <Dialog open={!!deleteDialogEmail} onOpenChange={handleCancelDelete}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Email?</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete this email? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="mb-2 rounded bg-muted p-3 text-sm">
                        <p className="font-medium">
                            Subject: <span className="font-normal">{deleteDialogEmail.subject}</span>
                        </p>
                    </div>
                    <div className="mb-4 rounded bg-muted p-3 text-sm">
                        <p className="font-medium">
                            Content: <span className="font-normal">{deleteDialogEmail.email_content?.substring(0, 100)}...</span>
                        </p>
                    </div>
                    <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={handleCancelDelete}>
                            Cancel
                        </Button>
                        <Button variant="destructive" onClick={handleConfirmDelete}>
                            Delete
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        ) : null;

    return (
        <div className="min-h-screen bg-background">
            <div className="container mx-auto max-w-7xl px-4 py-8">
                {/* Header Section */}
                <div className="mb-8">
                    <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                            <h1 className="mb-2 text-3xl font-bold text-foreground">Your Generated Emails</h1>
                            <p className="text-muted-foreground">Manage and organize your email campaigns</p>
                        </div>
                        <Link href="/email/generate">
                            <Button className="w-full gap-2 lg:w-auto">
                                <Plus className="h-4 w-4" />
                                Generate New Email
                            </Button>
                        </Link>
                    </div>

                    {/* Search and Filter Bar */}
                    <div className="mb-6 flex flex-col gap-4 lg:flex-row">
                        {/* Search */}
                        <div className="relative max-w-md flex-1">
                            <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform text-muted-foreground" />
                            <Input
                                placeholder="Search emails..."
                                value={searchInput}
                                onChange={(e) => handleSearchInput(e.target.value)}
                                className="pr-10 pl-10"
                            />
                            {searchInput && (
                                <button
                                    onClick={() => {
                                        setSearchInput('');
                                        router.get('/my-emails', buildFilters({ search: '' }), {
                                            preserveState: true,
                                            preserveScroll: true,
                                        });
                                    }}
                                    className="absolute top-1/2 right-3 -translate-y-1/2 transform text-muted-foreground hover:text-foreground"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            )}
                        </div>

                        {/* Filters */}
                        <div className="flex gap-2">
                            <Select value={filters.tone || 'all'} onValueChange={handleToneFilter}>
                                <SelectTrigger className="w-40">
                                    <SelectValue placeholder="All Tones" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Tones</SelectItem>
                                    <SelectItem value="professional">Professional</SelectItem>
                                    <SelectItem value="casual">Casual</SelectItem>
                                    <SelectItem value="formal">Formal</SelectItem>
                                    <SelectItem value="friendly">Friendly</SelectItem>
                                    <SelectItem value="direct">Direct</SelectItem>
                                    <SelectItem value="persuasive">Persuasive</SelectItem>
                                </SelectContent>
                            </Select>

                            <Select value={filters.date || 'all'} onValueChange={handleDateFilter}>
                                <SelectTrigger className="w-40">
                                    <SelectValue placeholder="All Time" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Time</SelectItem>
                                    <SelectItem value="today">Today</SelectItem>
                                    <SelectItem value="week">This Week</SelectItem>
                                    <SelectItem value="month">This Month</SelectItem>
                                    <SelectItem value="year">This Year</SelectItem>
                                </SelectContent>
                            </Select>

                            {hasActiveFilters && (
                                <Button variant="outline" size="icon" onClick={clearAllFilters}>
                                    <X className="h-4 w-4" />
                                </Button>
                            )}
                        </div>
                    </div>

                    {/* Active Filters */}
                    {hasActiveFilters && (
                        <div className="mb-6 flex flex-wrap items-center gap-2">
                            <span className="text-sm text-muted-foreground">Active filters:</span>
                            {filters.search && (
                                <Badge variant="secondary" className="gap-1">
                                    <Search className="h-3 w-3" />"{filters.search}"
                                </Badge>
                            )}
                            {filters.tone && (
                                <Badge variant="secondary" className="gap-1">
                                    <Filter className="h-3 w-3" />
                                    {filters.tone}
                                </Badge>
                            )}
                            {filters.date && (
                                <Badge variant="secondary" className="gap-1">
                                    <Filter className="h-3 w-3" />
                                    {filters.date}
                                </Badge>
                            )}
                        </div>
                    )}
                </div>

                {/* Content */}
                {emails.length === 0 ? (
                    <EmptyState />
                ) : (
                    <>
                        {/* Results Summary */}
                        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                            <p className="text-sm text-muted-foreground">
                                Showing {pagination.from}-{pagination.to} of {pagination.total} emails
                                {hasActiveFilters && <span className="ml-1 font-medium">(filtered)</span>}
                            </p>
                            <Select defaultValue="newest">
                                <SelectTrigger className="w-40">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="newest">Newest First</SelectItem>
                                    <SelectItem value="oldest">Oldest First</SelectItem>
                                    <SelectItem value="subject">By Subject</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Email Grid - Responsive Layout */}
                        <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-3">
                            {emails.map((email) => (
                                <Card key={email.id} className="group transition-all hover:shadow-md">
                                    <CardHeader className="pb-3">
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="min-w-0 flex-1">
                                                <div className="mb-2 flex items-center gap-2">
                                                    {email.tone && (
                                                        <Badge variant="outline" className={getToneBadgeColor(email.tone)}>
                                                            {email.tone}
                                                        </Badge>
                                                    )}
                                                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                                        <Clock className="h-3 w-3" />
                                                        {formatDate(email.created_at)}
                                                    </div>
                                                </div>
                                                <h3 className="mb-2 line-clamp-2 font-semibold text-foreground">{email.subject}</h3>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="pt-0">
                                        <p className="mb-4 line-clamp-3 text-sm leading-relaxed text-muted-foreground">
                                            {email.email_content?.substring(0, 150)}...
                                        </p>

                                        {/* Action Buttons */}
                                        <div className="flex flex-wrap gap-2">
                                            <Button size="sm" onClick={() => handleSendEmail(email.id)} className="min-w-0 flex-1 gap-1">
                                                <Send className="h-3 w-3" />
                                                <span className="hidden sm:inline">Send</span>
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="gap-1 bg-transparent text-destructive hover:bg-destructive/10"
                                                onClick={() => setDeleteDialogEmail(email)}
                                            >
                                                <Trash2 className="h-3 w-3" />
                                                <span className="hidden sm:inline">Delete</span>
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>

                        {/* Pagination */}
                        {pagination.links && pagination.links.length > 3 && (
                            <div className="flex flex-col items-center gap-4">
                                <p className="text-sm text-muted-foreground">
                                    Showing <span className="font-medium">{pagination.from}</span> to{' '}
                                    <span className="font-medium">{pagination.to}</span> of <span className="font-medium">{pagination.total}</span>{' '}
                                    results
                                </p>
                                <div className="flex flex-wrap items-center justify-center gap-1">
                                    {pagination.links.map((link) =>
                                        link.url ? (
                                            <Link
                                                key={link.label}
                                                href={link.url}
                                                className={`rounded-md px-3 py-2 text-sm transition-colors ${link.active ? 'bg-primary font-medium text-primary-foreground' : 'hover:bg-accent'
                                                    }`}
                                                dangerouslySetInnerHTML={{ __html: link.label }}
                                            />
                                        ) : (
                                            <span
                                                key={link.label}
                                                className="cursor-not-allowed px-3 py-2 text-sm text-muted-foreground"
                                                dangerouslySetInnerHTML={{ __html: link.label }}
                                            />
                                        ),
                                    )}
                                </div>
                            </div>

                        )}

                    </>
                )}
            </div>
            <DeleteDialog />
        </div>

    );
}
