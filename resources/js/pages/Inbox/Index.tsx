'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AppLayout from '@/layouts/app-layout';
import { router, usePage } from '@inertiajs/react';
import { Mail, MailOpen, MoreVertical, Paperclip, RefreshCw, Search, Star, StarOff, Trash2, Users, Zap } from 'lucide-react';
import type React from 'react';
import { useEffect, useState } from 'react';

// TypeScript interfaces
interface EmailMessage {
    id: number;
    subject: string;
    from_email: string;
    from_name: string;
    to_email: string;
    snippet: string;
    is_read: boolean;
    is_important: boolean;
    is_starred: boolean;
    is_cold_email: boolean;
    is_reply: boolean;
    has_attachments: boolean;
    received_at: string;
    short_date: string;
    account: {
        id: number;
        email: string;
        provider: string;
    };
}

interface EmailAccount {
    id: number;
    email: string;
    provider: string;
    status: string;
}

interface InboxStats {
    total_messages: number;
    unread_messages: number;
    cold_emails: number;
    replies: number;
    important_messages: number;
}

interface Props {
    messages: {
        data: EmailMessage[];
        meta: {
            current_page: number;
            last_page: number;
            per_page: number;
            total: number;
        };
    };
    email_accounts: EmailAccount[];
    stats: InboxStats;
    filters: {
        filter: string;
        search: string;
        account_id: number | null;
    };
    error?: string;
}

export default function InboxPage({ messages, email_accounts, stats, filters, error }: Props) {
    const { flash } = usePage().props as any;
    const [selectedMessages, setSelectedMessages] = useState<number[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState(filters?.search || '');
    const [currentFilter, setCurrentFilter] = useState(filters?.filter || 'inbox');
    const [selectedAccount, setSelectedAccount] = useState(filters?.account_id?.toString() || '');

    // Safe defaults
    const safeMessages = messages?.data || [];
    const safeMeta = messages?.meta || { current_page: 1, last_page: 1, per_page: 25, total: 0 };
    const safeAccounts = email_accounts || [];
    const safeStats = stats || {
        total_messages: 0,
        unread_messages: 0,
        cold_emails: 0,
        replies: 0,
        important_messages: 0,
    };
    const safeFilters = filters || { filter: 'inbox', search: '', account_id: null };

    // Flash messages
    useEffect(() => {
        if (flash?.success) {
            console.log('Success:', flash.success);
        }
        if (flash?.error) {
            console.log('Error:', flash.error);
        }
    }, [flash]);

    // Handle message selection
    const handleSelectMessage = (messageId: number) => {
        setSelectedMessages((prev) => (prev.includes(messageId) ? prev.filter((id) => id !== messageId) : [...prev, messageId]));
    };

    // Handle select all
    const handleSelectAll = () => {
        if (selectedMessages.length === safeMessages.length) {
            setSelectedMessages([]);
        } else {
            setSelectedMessages(safeMessages.map((msg) => msg.id));
        }
    };

    // Handle inbox sync
    const handleSync = () => {
        setIsLoading(true);
        router.post(
            '/inbox/sync',
            {
                account_id: selectedAccount || null,
            },
            {
                onFinish: () => setIsLoading(false),
                preserveScroll: true,
            },
        );
    };

    // Handle mark as read/unread
    const handleMarkAsRead = (read: boolean) => {
        if (selectedMessages.length === 0) return;
        router.post(
            '/inbox/mark-read',
            {
                message_ids: selectedMessages,
                read: read,
            },
            {
                onSuccess: () => setSelectedMessages([]),
                preserveScroll: true,
            },
        );
    };

    // Handle star toggle
    const handleStarToggle = (messageId: number) => {
        router.post(
            `/inbox/${messageId}/star`,
            {},
            {
                preserveScroll: true,
            },
        );
    };

    // Handle delete messages
    const handleDeleteMessages = () => {
        if (selectedMessages.length === 0) return;
        if (confirm('Are you sure you want to delete these messages?')) {
            router.delete('/inbox/messages', {
                data: {
                    message_ids: selectedMessages,
                },
                onSuccess: () => setSelectedMessages([]),
                preserveScroll: true,
            });
        }
    };

    // Handle search
    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get(
            '/inbox',
            {
                search: searchTerm,
                filter: currentFilter,
                account_id: selectedAccount || undefined,
            },
            {
                preserveState: true,
                preserveScroll: true,
            },
        );
    };

    // Handle filter change
    const handleFilterChange = (newFilter: string) => {
        setCurrentFilter(newFilter);
        router.get(
            '/inbox',
            {
                filter: newFilter,
                search: searchTerm,
                account_id: selectedAccount || undefined,
            },
            {
                preserveState: true,
                preserveScroll: true,
            },
        );
    };

    // Handle account change
    const handleAccountChange = (accountId: string) => {
        setSelectedAccount(accountId);
        router.get(
            '/inbox',
            {
                filter: currentFilter,
                search: searchTerm,
                account_id: accountId === 'all' ? undefined : accountId,
            },
            {
                preserveState: true,
                preserveScroll: true,
            },
        );
    };

    // Get provider icon
    const getProviderIcon = (provider: string) => {
        switch (provider) {
            case 'gmail':
                return <img src='https://api.iconify.design/logos/google-icon.svg' className="h-4 w-4" alt="Gmail" />;
            case 'outlook':
                return <img src='https://api.iconify.design/logos/microsoft-icon.svg' className="h-4 w-4" alt="Outlook" />;
            default:
                return <div className="h-2 w-2 rounded-full bg-gray-400" />;
        }
    };

    return (
        <AppLayout>
            <div className="min-h-screen bg-background p-4">
                <div className="mx-auto max-w-7xl space-y-6">
                    {/* Header */}
                    <div className="space-y-4 text-center">
                        <div>
                            <h1 className="text-3xl font-bold">Inbox</h1> 
                        </div>

                        {/* Search */}
                        <div className="relative mx-auto max-w-md">
                            <Search className="absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                            <form onSubmit={handleSearch}>
                                <Input
                                    placeholder="Search your messages..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="h-12 rounded-2xl pl-12"
                                />
                            </form>
                        </div>
                    </div> 

                    {/* Filters and Controls */}
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <Tabs value={currentFilter} onValueChange={handleFilterChange}>
                            <TabsList className="rounded-2xl">
                                <TabsTrigger value="inbox" className="rounded-xl">
                                    Inbox
                                </TabsTrigger>
                                <TabsTrigger value="unread" className="rounded-xl">
                                    Unread
                                </TabsTrigger>
                                <TabsTrigger value="cold" className="rounded-xl">
                                    Cold
                                </TabsTrigger>
                                <TabsTrigger value="replies" className="rounded-xl">
                                    Replies
                                </TabsTrigger>
                                <TabsTrigger value="starred" className="rounded-xl">
                                    Starred
                                </TabsTrigger>
                            </TabsList>
                        </Tabs>

                        <div className="flex items-center gap-2">
                            <Select value={selectedAccount} onValueChange={handleAccountChange}>
                                <SelectTrigger className="w-48 rounded-2xl">
                                    <SelectValue placeholder="All accounts" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All accounts</SelectItem>
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

                            <Button onClick={handleSync} disabled={isLoading} variant="outline" className="rounded-2xl bg-transparent">
                                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                            </Button>
                        </div>
                    </div>

                    {/* Bulk Actions */}
                    {selectedMessages.length > 0 && (
                        <div className="flex items-center justify-between rounded-2xl bg-primary/10 p-4">
                            <span className="text-sm font-medium">{selectedMessages.length} selected</span>
                            <div className="flex items-center gap-2">
                                <Button size="sm" variant="outline" onClick={() => handleMarkAsRead(true)} className="rounded-xl">
                                    <MailOpen className="mr-2 h-4 w-4" />
                                    Read
                                </Button>
                                <Button size="sm" variant="outline" onClick={() => handleMarkAsRead(false)} className="rounded-xl">
                                    <Mail className="mr-2 h-4 w-4" />
                                    Unread
                                </Button>
                                <Button size="sm" variant="outline" onClick={handleDeleteMessages} className="rounded-xl bg-transparent">
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Delete
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* Select All */}
                    {safeMessages.length > 0 && (
                        <div className="flex items-center justify-center">
                            <div className="flex items-center gap-3 rounded-2xl bg-muted/50 p-3">
                                <Checkbox checked={selectedMessages.length === safeMessages.length} onCheckedChange={handleSelectAll} />
                                <span className="text-sm font-medium">
                                    {selectedMessages.length > 0
                                        ? `${selectedMessages.length} of ${safeMessages.length} selected`
                                        : `Select all ${safeMessages.length} messages`}
                                </span>
                            </div>
                        </div>
                    )}

                    {/* Messages Grid */}
                    {safeMessages.length === 0 ? (
                        <div className="py-16 text-center">
                            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                                <Mail className="h-8 w-8 text-muted-foreground" />
                            </div>
                            <h3 className="mb-2 text-lg font-medium">No messages found</h3>
                            <p className="text-muted-foreground">
                                {currentFilter === 'inbox'
                                    ? 'Your inbox is empty. Click sync to fetch new messages.'
                                    : `No ${currentFilter} messages found.`}
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                            {safeMessages.map((message, index) => (
                                <div
                                    key={message.id}
                                    className={`group transform cursor-pointer rounded-3xl border bg-card p-6 shadow-sm transition-all hover:-translate-y-2 hover:shadow-lg ${
                                        // Zigzag pattern: alternate left/right margins
                                        index % 3 === 0 ? 'md:ml-4' : index % 3 === 1 ? 'md:mr-4' : 'md:mx-2'
                                    } ${!message.is_read ? 'bg-primary/5 ring-2 ring-primary/20' : ''}`}
                                    onClick={() => router.get(`/inbox/${message.id}`)}
                                >
                                    {/* Selection Checkbox */}
                                    <div className="absolute top-4 left-4 opacity-0 transition-opacity group-hover:opacity-100">
                                        <Checkbox
                                            checked={selectedMessages.includes(message.id)}
                                            onCheckedChange={() => handleSelectMessage(message.id)}
                                            onClick={(e) => e.stopPropagation()}
                                        />
                                    </div>

                                    {/* Header */}
                                    <div className="mb-4 flex items-start justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                                                <span className="font-medium text-primary">{message.from_name?.charAt(0) || '?'}</span>
                                            </div>
                                            <div>
                                                <p className={`font-medium ${!message.is_read ? 'text-primary' : ''}`}>{message.from_name}</p>
                                                <div className="flex items-center gap-2">
                                                    <p className="text-sm text-muted-foreground">{message.short_date}</p>
                                                    {getProviderIcon(message.account?.provider || 'gmail')}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleStarToggle(message.id);
                                                }}
                                                className="text-muted-foreground transition-colors hover:text-yellow-500"
                                            >
                                                {message.is_starred ? (
                                                    <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                                                ) : (
                                                    <StarOff className="h-4 w-4" />
                                                )}
                                            </button>
                                            <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100">
                                                <MoreVertical className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>

                                    {/* Subject */}
                                    <h3 className={`mb-3 font-semibold ${!message.is_read ? 'text-primary' : ''}`}>
                                        {message.subject || '(No Subject)'}
                                    </h3>

                                    {/* Snippet */}
                                    <p className="mb-4 line-clamp-3 text-muted-foreground">{message.snippet}</p>

                                    {/* Badges */}
                                    <div className="flex flex-wrap items-center gap-2">
                                        {message.is_cold_email && (
                                            <Badge variant="secondary" className="rounded-full text-xs">
                                                <Zap className="mr-1 h-3 w-3" />
                                                Cold
                                            </Badge>
                                        )}
                                        {message.is_reply && (
                                            <Badge variant="outline" className="rounded-full text-xs">
                                                Reply
                                            </Badge>
                                        )}
                                        {message.has_attachments && (
                                            <Badge variant="outline" className="rounded-full text-xs">
                                                <Paperclip className="mr-1 h-3 w-3" />
                                                Attachment
                                            </Badge>
                                        )}
                                        {!message.is_read && <Badge className="rounded-full bg-primary text-xs">New</Badge>}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Pagination */}
                    {safeMeta.last_page > 1 && (
                        <div className="flex items-center justify-between">
                            <div className="text-sm text-muted-foreground">
                                Showing {(safeMeta.current_page - 1) * safeMeta.per_page + 1} to{' '}
                                {Math.min(safeMeta.current_page * safeMeta.per_page, safeMeta.total)} of {safeMeta.total} messages
                            </div>
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={safeMeta.current_page === 1}
                                    className="rounded-2xl bg-transparent"
                                    onClick={() =>
                                        router.get(
                                            '/inbox',
                                            {
                                                ...safeFilters,
                                                page: safeMeta.current_page - 1,
                                            },
                                            {
                                                preserveState: true,
                                            },
                                        )
                                    }
                                >
                                    Previous
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={safeMeta.current_page === safeMeta.last_page}
                                    className="rounded-2xl bg-transparent"
                                    onClick={() =>
                                        router.get(
                                            '/inbox',
                                            {
                                                ...safeFilters,
                                                page: safeMeta.current_page + 1,
                                            },
                                            {
                                                preserveState: true,
                                            },
                                        )
                                    }
                                >
                                    Next
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
