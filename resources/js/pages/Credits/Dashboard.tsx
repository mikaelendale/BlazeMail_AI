import { Head } from "@inertiajs/react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import AppLayout from "@/layouts/app-layout"
import UsageChart from "@/components/UsageChart" // Import the new chart component
import { ScrollArea } from "@/components/ui/scroll-area"

interface CreditStats {
    current_balance: number
    total_earned: number
    total_used: number
    monthly_used: number
    referral_credits: number
}

interface Transaction {
    id: number
    type: string
    amount: number
    description: string
    created_at: string
    metadata?: any
}

// New interface for usage over time data
interface UsageDataPoint {
    date: string // YYYY-MM-DD
    usage: number // Credits used on that date
}

interface Props {
    stats: CreditStats
    recentTransactions: Transaction[]
    usageOverTime: UsageDataPoint[] // Add this prop
}

export default function CreditsDashboard({ stats, recentTransactions, usageOverTime }: Props) {
    // monthlyLimit and usagePercentage are no longer directly used for the graph but can be kept for other displays if needed.
    // const monthlyLimit = 1000 // You can make this dynamic based on user plan
    // const usagePercentage = (stats.monthly_used / monthlyLimit) * 100

    const getTransactionColor = (amount: number) => {
        return amount > 0 ? "text-green-600" : "text-red-600"
    }

    const getTransactionBadgeVariant = (type: string) => {
        const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
            signup_bonus: "default",
            referral_bonus: "default",
            subscription_bonus: "default",
            ai_usage: "outline",
            email_generation: "outline",
            ai_rewrite: "outline", // Add ai_rewrite badge variant
            manual_adjustment: "outline",
            expiration: "destructive", // Add expiration badge variant
            free_refill: "default", // Add free_refill badge variant
            subscription_refill: "default", // Add subscription_refill badge variant
            plan_upgrade_bonus: "default", // Add plan_upgrade_bonus badge variant
        }
        return variants[type] || "outline"
    }

    return (
        <AppLayout>
            <Head title="Credits Dashboard" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                        {/* Current Balance */}
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium">Current Balance</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-green-600">{stats.current_balance.toLocaleString()}</div>
                                <p className="text-xs text-muted-foreground">Available credits</p>
                            </CardContent>
                        </Card>

                        {/* Total Earned */}
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium">Total Earned</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{stats.total_earned.toLocaleString()}</div>
                                <p className="text-xs text-muted-foreground">All time</p>
                            </CardContent>
                        </Card>

                        {/* Monthly Usage */}
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium">Monthly Used</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{stats.monthly_used.toLocaleString()}</div>
                                <p className="text-xs text-muted-foreground">This month</p>
                            </CardContent>
                        </Card>

                        {/* Referral Credits */}
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium">Referral Credits</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-blue-600">{stats.referral_credits.toLocaleString()}</div>
                                <p className="text-xs text-muted-foreground">From referrals</p>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Usage Chart */}
                        <UsageChart data={usageOverTime} />

                        {/* Recent Transactions */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Recent Activity</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ScrollArea className="h-[300px] w-full rounded-md overflow-y-auto pr-6">
                                    <div className="space-y-3">
                                        {recentTransactions.map((transaction) => (
                                            <div key={transaction.id} className="flex items-center justify-between">
                                                <div className="flex items-center space-x-3">
                                                    <Badge variant={getTransactionBadgeVariant(transaction.type)}>
                                                        {transaction.type.replace(/_/g, " ")} {/* Use regex for global replace */}
                                                    </Badge>
                                                    <div>
                                                        <p className="text-sm font-medium">
                                                            {transaction.description || transaction.type.replace(/_/g, " ")}
                                                        </p>
                                                        <p className="text-xs text-muted-foreground">
                                                            {new Date(transaction.created_at).toLocaleDateString()}
                                                        </p>
                                                    </div>
                                                </div>
                                                <span className={`font-medium ${getTransactionColor(transaction.amount)}`}>
                                                    {transaction.amount > 0 ? "+" : ""}
                                                    {transaction.amount}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </ScrollArea>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </AppLayout>
    )
}
