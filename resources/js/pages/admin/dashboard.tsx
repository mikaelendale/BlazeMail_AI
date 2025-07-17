import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import AdminAppLayout from '@/layouts/admin-app-layout';

export default function AdminDashboard({ total_users, total_emails, total_revenue, subscribed_user }) {
    const stats = [
        {
            title: 'Total Users',
            value: total_users,
            label: 'registered users',
        },
        {
            title: 'Total Emails Generated',
            value: total_emails,
            label: 'emails created',
        },
        {
            title: 'Revenue This Month',
            value: total_revenue,
            label: 'monthly revenue',
        },
        {
            title: 'Active Subscriptions',
            value: subscribed_user,
            label: 'paying customers',
        },
    ];

    return (
        <AdminAppLayout>
            {/* Main Content */}
            <main className="mx-auto max-w-7xl py-8 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
                    {stats.map((stat, index) => (
                        <Card key={index} className="bg-primary-foreground">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium text-secondary">{stat.title}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="mb-1 text-3xl font-bold text-primary">{stat.value}</div>
                                <p className="text-xs text-secondary">{stat.label}</p>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </main>
        </AdminAppLayout>
    );
}
