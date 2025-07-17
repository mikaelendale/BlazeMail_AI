import AdminAppLayout from '@/layouts/admin-app-layout';
('use client');

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ChevronLeft, ChevronRight, Eye, Search, Trash, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { router } from '@inertiajs/react';

interface User {
    id: number;
    name: string;
    email: string;
}

interface Email {
    id: number;
    user_id: number;
    subject: string;
    recipient: string;
    sender: string;
    audience?: string;
    tone?: string;
    purpose?: string;
    cta?: string;
    context?: string;
    prompt?: string;
    email_content: string;
    feedback?: string;
    model_used?: string;
    meta?: string;
    created_at: string;
    updated_at: string;
    user: User;
}

interface EmailMonitoringProps {
    emails: Email[];
}

const ITEMS_PER_PAGE = 40;

export default function EmailMonitoring({ emails = [] }: EmailMonitoringProps) {
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);

    // Filter emails based on search term
    const filteredEmails = useMemo(() => {
        if (!emails || emails.length === 0) return [];

        return emails.filter(
            (email) =>
                email.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                email.subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                email.recipient?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                email.sender?.toLowerCase().includes(searchTerm.toLowerCase()),
        );
    }, [emails, searchTerm]);

    // Pagination logic
    const totalPages = Math.ceil(filteredEmails.length / ITEMS_PER_PAGE);
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const paginatedEmails = filteredEmails.slice(startIndex, startIndex + ITEMS_PER_PAGE);

    const handleSearchChange = (value: string) => {
        setSearchTerm(value);
        setCurrentPage(1);
    };

    const handleDelete = async (emailId: number) => {
        try {
            console.log('Delete email:', emailId);
            router.delete(route('admin.email-monitor.delete', emailId), {
                onSuccess: () => {
                    // Optionally show a toast or notification here
                },
                onError: (errors) => {
                    console.error('Error deleting email:', errors);
                },
                preserveScroll: true,
            });
        } catch (error) {
            console.error('Error deleting email:', error);
        }
    };

    const handleViewFull = (email: Email) => {
        setSelectedEmail(email);
    };

    const getToneBadgeVariant = (tone?: string) => {
        if (!tone) return 'secondary';

        switch (tone.toLowerCase()) {
            case 'urgent':
                return 'destructive';
            case 'professional':
            case 'formal':
                return 'outline';
            case 'friendly':
            case 'casual':
                return 'secondary';
            case 'promotional':
                return 'outline';
            default:
                return 'default';
        }
    };

    const getModelBadgeVariant = (model?: string) => {
        if (!model) return 'outline';

        switch (model.toLowerCase()) {
            case 'gpt-4':
            case 'blazemail-70b':
                return 'default';
            case 'blazemail lite':
                return 'default';
            default:
                return 'outline';
        }
    };

    const formatDateTime = (dateTime: string) => {
        const date = new Date(dateTime);
        return date.toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const truncateText = (text: string, maxLength = 100) => {
        if (!text) return '';
        return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
    };

    return (
        <AdminAppLayout>
            {/* Main Content */}
            <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
                <div className="mb-6">
                    <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Email Monitoring</h1>
                    <p className="mt-2 text-sm text-muted-foreground">Monitor and manage generated emails ({emails.length} total emails)</p>
                </div>

                {/* Search Bar */}
                <div className="mb-6">
                    <div className="relative max-w-md">
                        <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform text-muted-foreground" />
                        <Input
                            type="text"
                            placeholder="Search by user, subject, recipient..."
                            value={searchTerm}
                            onChange={(e) => handleSearchChange(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                </div>

                {/* Show message if no emails */}
                {!emails || emails.length === 0 ? (
                    <div className="py-12 text-center">
                        <p className="text-muted-foreground">No emails found in the system.</p>
                    </div>
                ) : (
                    <>
                        {/* Emails Table */}
                        <div className="overflow-hidden rounded-lg border bg-card shadow-sm">
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="min-w-[120px]">User</TableHead>
                                            <TableHead className="min-w-[200px]">Subject</TableHead>
                                            <TableHead className="min-w-[150px]">Recipient</TableHead>
                                            <TableHead className="hidden min-w-[100px] sm:table-cell">Tone</TableHead>
                                            <TableHead className="hidden min-w-[100px] md:table-cell">Model</TableHead>
                                            <TableHead className="hidden min-w-[120px] lg:table-cell">Date</TableHead>
                                            <TableHead className="min-w-[150px] text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {paginatedEmails.map((email) => (
                                            <TableRow key={email.id}>
                                                <TableCell className="font-medium">
                                                    <div>
                                                        <div className="font-medium">{email.user?.name || 'Unknown User'}</div>
                                                        <div className="text-xs text-muted-foreground">{email.user?.email}</div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="max-w-[200px]">
                                                        <div className="text-sm font-medium">{truncateText(email.subject, 10)}</div>
                                                        <div className="mt-1 text-xs text-muted-foreground">
                                                            From: {truncateText(email.sender, 30)}
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="text-sm">{truncateText(email.recipient, 20)}</div>
                                                    {email.audience && (
                                                        <div className="mt-1 text-xs text-muted-foreground">
                                                            Audience: {truncateText(email.audience, 20)}
                                                        </div>
                                                    )}
                                                </TableCell>
                                                <TableCell className="hidden sm:table-cell">
                                                    {email.tone && (
                                                        <Badge variant={getToneBadgeVariant(email.tone)} className="text-xs">
                                                            {email.tone}
                                                        </Badge>
                                                    )}
                                                </TableCell>
                                                <TableCell className="hidden md:table-cell">
                                                    {email.model_used && (
                                                        <Badge variant={getModelBadgeVariant(email.model_used)} className="text-xs">
                                                            {email.model_used}
                                                        </Badge>
                                                    )}
                                                </TableCell>
                                                <TableCell className="hidden text-sm text-muted-foreground lg:table-cell">
                                                    {formatDateTime(email.created_at)}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <Button variant="outline" size="sm" onClick={() => handleViewFull(email)}>
                                                            <Eye className="h-4 w-4" />
                                                        </Button> 
                                                        <Button variant="outline" size="sm" onClick={() => handleDelete(email.id)}>
                                                            <Trash className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </div>

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                                <div className="text-sm text-muted-foreground">
                                    Showing {startIndex + 1} to {Math.min(startIndex + ITEMS_PER_PAGE, filteredEmails.length)} of{' '}
                                    {filteredEmails.length} emails
                                </div>
                                <div className="flex items-center justify-center gap-2 sm:justify-end">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                                        disabled={currentPage === 1}
                                        className="flex items-center gap-1"
                                    >
                                        <ChevronLeft className="h-4 w-4" />
                                        Previous
                                    </Button>

                                    <div className="flex items-center gap-1">
                                        {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                                            let page;
                                            if (totalPages <= 5) {
                                                page = i + 1;
                                            } else if (currentPage <= 3) {
                                                page = i + 1;
                                            } else if (currentPage >= totalPages - 2) {
                                                page = totalPages - 4 + i;
                                            } else {
                                                page = currentPage - 2 + i;
                                            }
                                            return (
                                                <Button
                                                    key={page}
                                                    variant={currentPage === page ? 'default' : 'outline'}
                                                    size="sm"
                                                    onClick={() => setCurrentPage(page)}
                                                    className="h-8 w-8 p-0"
                                                >
                                                    {page}
                                                </Button>
                                            );
                                        })}
                                    </div>

                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                                        disabled={currentPage === totalPages}
                                        className="flex items-center gap-1"
                                    >
                                        Next
                                        <ChevronRight className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        )}

                        {/* No results message */}
                        {filteredEmails.length === 0 && emails.length > 0 && (
                            <div className="py-12 text-center">
                                <p className="text-muted-foreground">No emails found matching your search.</p>
                            </div>
                        )}
                    </>
                )}
            </main>

            {/* Full Email Modal */}
            {selectedEmail && (
                <Dialog open={!!selectedEmail} onOpenChange={() => setSelectedEmail(null)}>
                    <DialogContent className="max-h-[80vh] max-w-4xl overflow-y-auto scroll-smooth">
                        <DialogHeader>
                            <DialogTitle>Email Details</DialogTitle>
                            <DialogDescription>
                                Generated by {selectedEmail.user?.name} on {formatDateTime(selectedEmail.created_at)}
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-6">
                            {/* Email Metadata */}
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <h4 className="text-sm font-medium">Email Information</h4>
                                    <div className="space-y-1 text-sm">
                                        <div>
                                            <span className="font-medium">Subject:</span> {selectedEmail.subject}
                                        </div>
                                        <div>
                                            <span className="font-medium">From:</span> {selectedEmail.sender}
                                        </div>
                                        <div>
                                            <span className="font-medium">To:</span> {selectedEmail.recipient}
                                        </div>
                                        {selectedEmail.audience && (
                                            <div>
                                                <span className="font-medium">Audience:</span> {selectedEmail.audience}
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <h4 className="text-sm font-medium">Generation Details</h4>
                                    <div className="flex flex-wrap gap-2">
                                        {selectedEmail.tone && <Badge variant={getToneBadgeVariant(selectedEmail.tone)}>{selectedEmail.tone}</Badge>}
                                        {selectedEmail.model_used && (
                                            <Badge variant={getModelBadgeVariant(selectedEmail.model_used)}>{selectedEmail.model_used}</Badge>
                                        )}
                                        {selectedEmail.purpose && <Badge variant="outline">{selectedEmail.purpose}</Badge>}
                                    </div>
                                    {selectedEmail.cta && (
                                        <div className="text-sm">
                                            <span className="font-medium">CTA:</span> {selectedEmail.cta}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Email Content */}
                            <div className="space-y-2">
                                <h4 className="text-sm font-medium">Email Content</h4>
                                <div className="max-h-60 overflow-y-auto rounded-lg bg-muted p-4">
                                    <pre className="font-mono text-sm whitespace-pre-wrap">{selectedEmail.email_content}</pre>
                                </div>
                            </div>

                            {/* Additional Information */}
                            {(selectedEmail.context || selectedEmail.prompt || selectedEmail.feedback) && (
                                <div className="space-y-4">
                                    {selectedEmail.context && (
                                        <div className="space-y-2">
                                            <h4 className="text-sm font-medium">Context</h4>
                                            <div className="rounded-lg bg-muted p-3 text-sm">{selectedEmail.context}</div>
                                        </div>
                                    )}
                                    {selectedEmail.prompt && (
                                        <div className="space-y-2">
                                            <h4 className="text-sm font-medium">Original Prompt</h4>
                                            <div className="rounded-lg bg-muted p-3 text-sm">{selectedEmail.prompt}</div>
                                        </div>
                                    )}
                                    {selectedEmail.feedback && (
                                        <div className="space-y-2">
                                            <h4 className="text-sm font-medium">Feedback</h4>
                                            <div className="rounded-lg bg-muted p-3 text-sm">{selectedEmail.feedback}</div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </DialogContent>
                </Dialog>
            )}
        </AdminAppLayout>
    );
}
