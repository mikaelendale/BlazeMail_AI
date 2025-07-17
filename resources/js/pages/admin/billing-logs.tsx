import AdminAppLayout from '@/layouts/admin-app-layout';
import { useState, useMemo } from 'react';
import { Download, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'; 

// Mock billing data
const mockBillingLogs = [
    {
        id: 1,
        userName: 'John Smith',
        plan: 'Pro',
        amount: 29.99,
        status: 'Paid',
        date: '2024-01-15',
        invoiceId: 'INV-2024-001',
    },
    {
        id: 2,
        userName: 'Sarah Johnson',
        plan: 'Basic',
        amount: 9.99,
        status: 'Paid',
        date: '2024-01-14',
        invoiceId: 'INV-2024-002',
    },
    {
        id: 3,
        userName: 'Mike Chen',
        plan: 'Enterprise',
        amount: 99.99,
        status: 'Failed',
        date: '2024-01-14',
        invoiceId: 'INV-2024-003',
    },
    {
        id: 4,
        userName: 'Emily Davis',
        plan: 'Pro',
        amount: 29.99,
        status: 'Paid',
        date: '2024-01-13',
        invoiceId: 'INV-2024-004',
    },
    {
        id: 5,
        userName: 'Alex Rodriguez',
        plan: 'Basic',
        amount: 9.99,
        status: 'Failed',
        date: '2024-01-13',
        invoiceId: 'INV-2024-005',
    },
    {
        id: 6,
        userName: 'Lisa Wang',
        plan: 'Pro',
        amount: 29.99,
        status: 'Paid',
        date: '2024-01-12',
        invoiceId: 'INV-2024-006',
    },
    {
        id: 7,
        userName: 'David Brown',
        plan: 'Enterprise',
        amount: 99.99,
        status: 'Paid',
        date: '2024-01-12',
        invoiceId: 'INV-2024-007',
    },
    {
        id: 8,
        userName: 'Jennifer Lee',
        plan: 'Pro',
        amount: 29.99,
        status: 'Failed',
        date: '2024-01-11',
        invoiceId: 'INV-2024-008',
    },
    {
        id: 9,
        userName: 'Robert Wilson',
        plan: 'Basic',
        amount: 9.99,
        status: 'Paid',
        date: '2024-01-11',
        invoiceId: 'INV-2024-009',
    },
    {
        id: 10,
        userName: 'Maria Garcia',
        plan: 'Enterprise',
        amount: 99.99,
        status: 'Paid',
        date: '2024-01-10',
        invoiceId: 'INV-2024-010',
    },
];

const ITEMS_PER_PAGE = 8;

export default function BillingLogs() {
    const [statusFilter, setStatusFilter] = useState('All');
    const [currentPage, setCurrentPage] = useState(1);

    // Filter billing logs based on status
    const filteredLogs = useMemo(() => {
        if (statusFilter === 'All') {
            return mockBillingLogs;
        }
        return mockBillingLogs.filter((log) => log.status === statusFilter);
    }, [statusFilter]);

    // Pagination logic
    const totalPages = Math.ceil(filteredLogs.length / ITEMS_PER_PAGE);
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const paginatedLogs = filteredLogs.slice(startIndex, startIndex + ITEMS_PER_PAGE);

    // Reset to first page when filter changes
    useMemo(() => {
        setCurrentPage(1);
    }, [statusFilter]);

    const handleDownloadInvoice = (invoiceId: string) => {
        // In a real app, this would trigger a download or API call
        console.log(`Downloading invoice: ${invoiceId}`);
        // Simulate download
        alert(`Downloading invoice ${invoiceId}`);
    };

    const getStatusBadgeVariant = (status: string) => {
        return status === 'Paid' ? 'default' : 'destructive';
    };

    const getPlanBadgeVariant = (plan: string) => {
        switch (plan) {
            case 'Enterprise':
                return 'default';
            case 'Pro':
                return 'secondary';
            case 'Basic':
                return 'outline';
            default:
                return 'outline';
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    const formatAmount = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
        }).format(amount);
    };
    return (
        <AdminAppLayout>  
                {/* Main Content */}
                <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
                    {/* Filter Bar */}
                    <div className="mb-6">
                        <div className="flex items-center gap-4">
                            <label htmlFor="status-filter" className="text-sm font-medium text-secondary">
                                Filter by Status:
                            </label>
                            <Select value={statusFilter} onValueChange={setStatusFilter}>
                                <SelectTrigger className="w-32">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="All">All</SelectItem>
                                    <SelectItem value="Paid">Paid</SelectItem>
                                    <SelectItem value="Failed">Failed</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Billing Logs Table */}
                    <div className="overflow-hidden rounded-lg border border-accent bg-primary-foreground ">
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>User Name</TableHead>
                                        <TableHead>Plan</TableHead>
                                        <TableHead>Amount</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Date</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {paginatedLogs.map((log) => (
                                        <TableRow key={log.id}>
                                            <TableCell className="font-medium">{log.userName}</TableCell>
                                            <TableCell>
                                                <Badge variant={getPlanBadgeVariant(log.plan)}>{log.plan}</Badge>
                                            </TableCell>
                                            <TableCell className="font-semibold">{formatAmount(log.amount)}</TableCell>
                                            <TableCell>
                                                <Badge variant={getStatusBadgeVariant(log.status)}>{log.status}</Badge>
                                            </TableCell>
                                            <TableCell className="text-secondary">{formatDate(log.date)}</TableCell>
                                            <TableCell className="text-right">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => handleDownloadInvoice(log.invoiceId)}
                                                >
                                                    <Download className="mr-1 h-4 w-4" />
                                                    Invoice
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="flex items-center justify-between border-t border-accent px-6 py-4">
                                <div className="text-sm text-secondary">
                                    Showing {startIndex + 1} to {Math.min(startIndex + ITEMS_PER_PAGE, filteredLogs.length)} of {filteredLogs.length}{' '}
                                    transactions
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                                        disabled={currentPage === 1}
                                    >
                                        <ChevronLeft className="h-4 w-4" />
                                        Previous
                                    </Button>
                                    <div className="flex items-center gap-1">
                                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                                            <Button
                                                key={page}
                                                variant={currentPage === page ? 'default' : 'outline'}
                                                size="sm"
                                                onClick={() => setCurrentPage(page)}
                                                className="h-8 w-8 p-0"
                                            >
                                                {page}
                                            </Button>
                                        ))}
                                    </div>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                                        disabled={currentPage === totalPages}
                                    >
                                        Next
                                        <ChevronRight className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* No results message */}
                    {filteredLogs.length === 0 && (
                        <div className="py-12 text-center">
                            <p className="text-secondary">No billing logs found for the selected status.</p>
                        </div>
                    )}

                    {/* Summary Stats */}
                    <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-3">
                        <div className="rounded-lg border border-accent bg-primary-foreground p-6">
                            <div className="text-sm font-medium text-secondary">Total Transactions</div>
                            <div className="mt-1 text-2xl font-bold text-primary">{filteredLogs.length}</div>
                        </div>
                        <div className="rounded-lg border border-accent bg-primary-foreground p-6">
                            <div className="text-sm font-medium text-secondary">Successful Payments</div>
                            <div className="mt-1 text-2xl font-bold text-green-600 dark:text-green-500">{filteredLogs.filter((log) => log.status === 'Paid').length}</div>
                        </div>
                        <div className="rounded-lg border border-accent bg-primary-foreground p-6">
                            <div className="text-sm font-medium text-secondary">Failed Payments</div>
                            <div className="mt-1 text-2xl font-bold text-red-600 dark:text-red-500">{filteredLogs.filter((log) => log.status === 'Failed').length}</div>
                        </div>
                    </div>
                </main>
        </AdminAppLayout>
    );
}
