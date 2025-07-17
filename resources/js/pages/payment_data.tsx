import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ModeToggle } from '@/components/ui/mode-toggle';
import { type ShareData } from '@/types';
import { Head, Link, usePage } from '@inertiajs/react';
import { AlertTriangle, CheckCircle, Clock, CreditCard, Pause, XCircle } from 'lucide-react';

interface SubscriptionState {
    valid: boolean;
    active: boolean;
    onTrial: boolean;
    expiredTrial: boolean;
    notOnTrial: boolean;
    recurring: boolean;
    pastDue: boolean;
    paused: boolean;
    notPaused: boolean;
    onPausedGracePeriod: boolean;
    notOnPausedGracePeriod: boolean;
    canceled: boolean;
    notCanceled: boolean;
    onGracePeriod: boolean;
    notOnGracePeriod: boolean;
    subscribed: boolean;
    subscribedToDefault: boolean;
    onGenericTrial: boolean;
    hasExpiredTrial: boolean;
}

interface SubscriptionData {
    id: string;
    type: string;
    paddle_id: string;
    status: string;
    trial_ends_at?: string;
    ends_at?: string;
    paused_at?: string;
    created_at: string;
    updated_at: string;
    states: Omit<SubscriptionState, 'subscribed' | 'subscribedToDefault' | 'onGenericTrial' | 'hasExpiredTrial'>;
}

interface Transaction {
    id: string;
    paddle_id: string;
    paddle_subscription_id?: string;
    invoice_number: string;
    status: string;
    total: number;
    tax: number;
    currency: string;
    billed_at?: string;
    created_at: string;
}

interface Receipt {
    id: string;
    paddle_id: string;
    amount: number;
    currency: string;
    status: string;
    created_at: string;
}

interface PageProps {
    subscription: {
        hasSubscription: boolean;
        defaultSubscription?: SubscriptionData;
        states: SubscriptionState;
        subscriptions: SubscriptionData[];
        trialEndsAt?: string;
    };
    billing: {
        transactions: Transaction[];
        receipts: Receipt[];
    };
}

export default function SubscriptionDemo() {
    const { subscription, billing, plan } = usePage<ShareData>().props;

    console.log(plan);
    const getStateIcon = (state: boolean) => {
        return state ? <CheckCircle className="h-4 w-4 text-green-500" /> : <XCircle className="h-4 w-4 text-red-500" />;
    };

    const getStatusBadge = (status: string) => {
        const statusColors: Record<string, string> = {
            active: 'bg-green-100 text-green-800',
            trialing: 'bg-blue-100 text-blue-800',
            past_due: 'bg-red-100 text-red-800',
            canceled: 'bg-gray-100 text-gray-800',
            paused: 'bg-yellow-100 text-yellow-800',
        };

        return <Badge className={statusColors[status] || 'bg-gray-100 text-gray-800'}>{status}</Badge>;
    };

    const formatCurrency = (amount: number, currency = 'USD') => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currency,
        }).format(amount / 100);
    };

    const formatDate = (dateString?: string) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    return (
        <>
            <Head title="Subscription Demo - Laravel Cashier (Paddle)" />
            <ModeToggle />
            <div className="min-h-screen bg-gray-50 py-8">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold text-gray-900">Laravel Cashier (Paddle) Demo</h1>
                        <p className="mt-2 text-gray-600">Complete overview of all subscription states and billing data</p>
                    </div>

                    {/* Quick Status Overview */}
                    <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-4">
                        <Card>
                            <CardContent className="p-6">
                                <div className="flex items-center">
                                    {subscription.hasSubscription ? (
                                        <CheckCircle className="h-8 w-8 text-green-500" />
                                    ) : (
                                        <XCircle className="h-8 w-8 text-red-500" />
                                    )}
                                    <div className="ml-4">
                                        <p className="text-sm font-medium text-gray-600">Subscription</p>
                                        <p className="text-2xl font-bold">{subscription.hasSubscription ? 'Active' : 'None'}</p>
                                    </div>
                                </div>
                                +
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="p-6">
                                <div className="flex items-center">
                                    {subscription.states.onTrial ? (
                                        <Clock className="h-8 w-8 text-blue-500" />
                                    ) : (
                                        <CreditCard className="h-8 w-8 text-gray-400" />
                                    )}
                                    <div className="ml-4">
                                        <p className="text-sm font-medium text-gray-600">Trial Status</p>
                                        <p className="text-2xl font-bold">{subscription.states.onTrial ? 'On Trial' : 'Not on Trial'}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="p-6">
                                <div className="flex items-center">
                                    {subscription.states.paused ? (
                                        <Pause className="h-8 w-8 text-yellow-500" />
                                    ) : (
                                        <CheckCircle className="h-8 w-8 text-green-500" />
                                    )}
                                    <div className="ml-4">
                                        <p className="text-sm font-medium text-gray-600">Status</p>
                                        <p className="text-2xl font-bold">{subscription.states.paused ? 'Paused' : 'Running'}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="p-6">
                                <div className="flex items-center">
                                    {subscription.states.pastDue ? (
                                        <AlertTriangle className="h-8 w-8 text-red-500" />
                                    ) : (
                                        <CheckCircle className="h-8 w-8 text-green-500" />
                                    )}
                                    <div className="ml-4">
                                        <p className="text-sm font-medium text-gray-600">Payment</p>
                                        <p className="text-2xl font-bold">{subscription.states.pastDue ? 'Past Due' : 'Current'}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
                        {/* All Subscription States */}
                        <Card>
                            <CardHeader>
                                <CardTitle>All Subscription States</CardTitle>
                                <CardDescription>Complete list of all Laravel Cashier subscription states</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    {Object.entries(subscription.states).map(([key, value]) => (
                                        <div key={key} className="flex items-center justify-between border-b border-gray-100 py-2 last:border-b-0">
                                            <div className="flex items-center space-x-2">
                                                {getStateIcon(value)}
                                                <span className="text-sm font-medium">
                                                    {key.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase())}
                                                </span>
                                            </div>
                                            <Badge variant={value ? 'default' : 'secondary'}>{value ? 'True' : 'False'}</Badge>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Default Subscription Details */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Default Subscription Details</CardTitle>
                                <CardDescription>Information about the primary subscription</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {subscription.defaultSubscription ? (
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <p className="text-sm font-medium text-gray-600">ID</p>
                                                <p className="text-sm">{subscription.defaultSubscription.id}</p>
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-gray-600">Type</p>
                                                <p className="text-sm">{subscription.defaultSubscription.type}</p>
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-gray-600">Paddle ID</p>
                                                <p className="text-sm">{subscription.defaultSubscription.paddle_id}</p>
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-gray-600">Status</p>
                                                {getStatusBadge(subscription.defaultSubscription.status)}
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <div className="flex justify-between">
                                                <span className="text-sm font-medium text-gray-600">Trial Ends At:</span>
                                                <span className="text-sm">{formatDate(subscription.defaultSubscription.trial_ends_at)}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-sm font-medium text-gray-600">Ends At:</span>
                                                <span className="text-sm">{formatDate(subscription.defaultSubscription.ends_at)}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-sm font-medium text-gray-600">Paused At:</span>
                                                <span className="text-sm">{formatDate(subscription.defaultSubscription.paused_at)}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-sm font-medium text-gray-600">Created At:</span>
                                                <span className="text-sm">{formatDate(subscription.defaultSubscription.created_at)}</span>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="py-8 text-center">
                                        <XCircle className="mx-auto mb-4 h-12 w-12 text-gray-400" />
                                        <p className="text-gray-600">No default subscription found</p>
                                        <Button asChild className="mt-4">
                                            <Link href="/subscribe">Subscribe Now</Link>
                                        </Button>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* All Subscriptions */}
                    {subscription.subscriptions.length > 0 && (
                        <Card className="mt-8">
                            <CardHeader>
                                <CardTitle>All Subscriptions ({subscription.subscriptions.length})</CardTitle>
                                <CardDescription>Complete list of all user subscriptions</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-6">
                                    {subscription.subscriptions.map((sub, index) => (
                                        <div key={sub.id} className="rounded-lg border p-4">
                                            <div className="mb-4 flex items-center justify-between">
                                                <div>
                                                    <h4 className="font-semibold">Subscription #{index + 1}</h4>
                                                    <p className="text-sm text-gray-600">Type: {sub.type}</p>
                                                </div>
                                                {getStatusBadge(sub.status)}
                                            </div>

                                            <div className="mb-4 grid grid-cols-2 gap-4 md:grid-cols-4">
                                                <div>
                                                    <p className="text-xs font-medium text-gray-600">ID</p>
                                                    <p className="text-sm">{sub.id}</p>
                                                </div>
                                                <div>
                                                    <p className="text-xs font-medium text-gray-600">Paddle ID</p>
                                                    <p className="text-sm">{sub.paddle_id}</p>
                                                </div>
                                                <div>
                                                    <p className="text-xs font-medium text-gray-600">Created</p>
                                                    <p className="text-sm">{formatDate(sub.created_at)}</p>
                                                </div>
                                                <div>
                                                    <p className="text-xs font-medium text-gray-600">Updated</p>
                                                    <p className="text-sm">{formatDate(sub.updated_at)}</p>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 gap-2 md:grid-cols-5">
                                                {Object.entries(sub.states).map(([key, value]) => (
                                                    <div key={key} className="flex items-center space-x-1">
                                                        {getStateIcon(value)}
                                                        <span className="text-xs">{key}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Billing Information */}
                    <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-2">
                        {/* Recent Transactions */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Recent Transactions</CardTitle>
                                <CardDescription>Latest {billing.transactions.length} transactions</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {billing.transactions.length > 0 ? (
                                    <div className="space-y-4">
                                        {billing.transactions.map((transaction) => (
                                            <div key={transaction.id} className="rounded-lg border p-4">
                                                <div className="mb-2 flex items-center justify-between">
                                                    <span className="text-sm font-medium">{transaction.invoice_number}</span>
                                                    <Badge>{transaction.status}</Badge>
                                                </div>
                                                <div className="grid grid-cols-2 gap-4 text-sm">
                                                    <div>
                                                        <p className="text-gray-600">Total</p>
                                                        <p className="font-medium">{formatCurrency(transaction.total, transaction.currency)}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-gray-600">Tax</p>
                                                        <p className="font-medium">{formatCurrency(transaction.tax, transaction.currency)}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-gray-600">Billed At</p>
                                                        <p>{formatDate(transaction.billed_at)}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-gray-600">Paddle ID</p>
                                                        <p className="font-mono text-xs">{transaction.paddle_id}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="py-8 text-center">
                                        <CreditCard className="mx-auto mb-4 h-12 w-12 text-gray-400" />
                                        <p className="text-gray-600">No transactions found</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Recent Receipts */}
                        {/* <Card>
                            <CardHeader>
                                <CardTitle>Recent Receipts</CardTitle>
                                <CardDescription>Latest {billing.receipts.length} receipts</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {billing.receipts.length > 0 ? (
                                    <div className="space-y-4">
                                        {billing.receipts.map((receipt) => (
                                            <div key={receipt.id} className="rounded-lg border p-4">
                                                <div className="mb-2 flex items-center justify-between">
                                                    <span className="text-sm font-medium">Receipt #{receipt.id}</span>
                                                    <Badge>{receipt.status}</Badge>
                                                </div>
                                                <div className="grid grid-cols-2 gap-4 text-sm">
                                                    <div>
                                                        <p className="text-gray-600">Amount</p>
                                                        <p className="font-medium">{formatCurrency(receipt.amount, receipt.currency)}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-gray-600">Currency</p>
                                                        <p>{receipt.currency}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-gray-600">Created At</p>
                                                        <p>{formatDate(receipt.created_at)}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-gray-600">Paddle ID</p>
                                                        <p className="font-mono text-xs">{receipt.paddle_id}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="py-8 text-center">
                                        <CreditCard className="mx-auto mb-4 h-12 w-12 text-gray-400" />
                                        <p className="text-gray-600">No receipts found</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card> */}
                    </div>

                    {/* Raw Data Dump */}
                    <Card className="mt-8">
                        <CardHeader>
                            <CardTitle>Raw Data Dump</CardTitle>
                            <CardDescription>Complete JSON dump of all subscription and billing data for debugging</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div>
                                    <h4 className="mb-2 font-semibold">Subscription Data:</h4>
                                    <pre className="max-h-64 overflow-auto rounded-lg bg-gray-100 p-4 text-xs">
                                        {JSON.stringify(subscription, null, 2)}
                                    </pre>
                                </div>
                                <div>
                                    <h4 className="mb-2 font-semibold">Billing Data:</h4>
                                    <pre className="max-h-64 overflow-auto rounded-lg bg-gray-100 p-4 text-xs">
                                        {JSON.stringify(billing, null, 2)}
                                    </pre>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Action Buttons */}
                    <div className="mt-8 flex flex-wrap gap-4">
                        <Button asChild>
                            <Link href="/dashboard">← Back to Dashboard</Link>
                        </Button>
                        <Button asChild variant="outline">
                            <Link href="/billing">Manage Billing</Link>
                        </Button>
                        {!subscription.hasSubscription && (
                            <Button asChild>
                                <Link href="/subscribe">Subscribe Now</Link>
                            </Button>
                        )}
                        {subscription.states.pastDue && (
                            <Button asChild variant="destructive">
                                <Link href="/billing/update-payment">Update Payment Method</Link>
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}
