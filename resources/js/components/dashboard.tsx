'use client';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Link, usePage } from '@inertiajs/react';
import { BadgeCheck, BarChart3, Clock, Mail, Plus, Sparkles, TrendingUp, X, Zap } from 'lucide-react';
import { useState } from 'react';
import { RecentEmails } from './recent-emails';
import TrialStatus from './trial-status';
import CreditStatus from './CreditStatus';

const mockUser = {
    name: 'Alex Johnson',
    email: 'alex@company.com',
    company: 'TechCorp Solutions',
    plan: 'Pro Plan',
    isNewUser: true,
};

const mockUsageStats = {
    emailsThisMonth: 87,
    monthlyLimit: 150,
    emailsToday: 12,
    dailyLimit: 25,
    totalEmails: 1247,
};

const mockRecentEmails = [
    {
        id: 1,
        subject: 'Boost Your Sales with Our AI-Powered Analytics',
        preview: 'Hi {{firstName}}, I noticed your company has been growing rapidly...',
        createdAt: '2024-01-15T10:30:00Z',
        tone: 'Professional',
        targetAudience: 'SaaS Founders',
    },
    {
        id: 2,
        subject: 'Quick Question About Your Marketing Stack',
        preview: "Hey {{firstName}}, I've been following {{companyName}}...",
        createdAt: '2024-01-15T09:15:00Z',
        tone: 'Casual',
        targetAudience: 'Marketing Directors',
    },
    {
        id: 3,
        subject: 'Partnership Opportunity for {{companyName}}',
        preview: 'Hello {{firstName}}, I hope this email finds you well...',
        createdAt: '2024-01-14T16:45:00Z',
        tone: 'Formal',
        targetAudience: 'Business Development Managers',
    },
];

export function MainDashboard({ user = mockUser, usageStats = mockUsageStats, recentEmails = mockRecentEmails }) {
    const { customer, trialStatus } = usePage<ShareData>().props;
    const [showAlert, setShowAlert] = useState(user.isNewUser);
    const monthlyUsagePercentage = (usageStats.emailsThisMonth / usageStats.monthlyLimit) * 100;
    const [showComingSoon, setShowComingSoon] = useState(false);
    

    return (
        <div className="min-h-screen bg-background">
            <div className="container mx-auto max-w-6xl px-6 py-8">
                <CreditStatus />
                {/* Header */}
                <div className="mb-8 flex items-center justify-between">
                    <div>
                        <h1 className="mb-1 text-3xl font-bold text-foreground">Hey {user.name}👋🏽
                        </h1>
                        <p className="text-muted-foreground">
                            {user.email} • {customer.plan}
                        </p>
                    </div>
                    <Link href="/email/generate">
                        <Button className="gap-2">
                            <Plus className="h-4 w-4" />
                            New Email
                        </Button>
                    </Link>
                </div>
                <TrialStatus/>
                {/* Stats Cards */}
                {/* <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-3">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">This Month</CardTitle>
                            <TrendingUp className="h-4 w-4 text-primary" />
                        </CardHeader>
                        <CardContent>
                            <div className="mb-2 text-2xl font-bold text-foreground">{usageStats.emailsThisMonth}</div>
                            <Progress value={monthlyUsagePercentage} className="mb-2 h-2" />
                            <p className="text-xs text-muted-foreground">
                                {usageStats.monthlyLimit - usageStats.emailsThisMonth} remaining of {usageStats.monthlyLimit}
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Today</CardTitle>
                            <Zap className="h-4 w-4 text-primary" />
                        </CardHeader>
                        <CardContent>
                            <div className="mb-2 text-2xl font-bold text-foreground">{usageStats.emailsToday}</div>
                            <p className="text-xs text-muted-foreground">{usageStats.dailyLimit - usageStats.emailsToday} left today</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Total Emails</CardTitle>
                            <Mail className="h-4 w-4 text-primary" />
                        </CardHeader>
                        <CardContent>
                            <div className="mb-2 text-2xl font-bold text-foreground">{usageStats.totalEmails.toLocaleString()}</div>
                            <p className="text-xs text-muted-foreground">All time generated</p>
                        </CardContent>
                    </Card>
                </div> */}

                {/* Quick Actions */}
                <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-4">
                    <Link href="/email/generate">
                        <Card className="cursor-pointer transition-colors hover:bg-accent/50">
                            <CardContent className="flex items-center gap-4 p-6">
                                <div className="rounded-lg bg-primary/10 p-2">
                                    <Plus className="h-5 w-5 text-primary" />
                                </div>
                                <div>
                                    <h3 className="font-medium text-foreground">Generate Email</h3>
                                    <p className="text-sm text-muted-foreground">Create new email</p>
                                </div>
                            </CardContent>
                        </Card>
                    </Link>

                    <Link href="/my-emails">
                        <Card className="cursor-pointer transition-colors hover:bg-accent/50">
                            <CardContent className="flex items-center gap-4 p-6">
                                <div className="rounded-lg bg-primary/10 p-2">
                                    <Mail className="h-5 w-5 text-primary" />
                                </div>
                                <div>
                                    <h3 className="font-medium text-foreground">My Emails</h3>
                                    <p className="text-sm text-muted-foreground">View all emails</p>
                                </div>
                            </CardContent>
                        </Card>
                    </Link>

                    <Card
                        className="cursor-pointer transition-colors hover:bg-accent/50"
                        onClick={() => setShowComingSoon(true)}
                        tabIndex={0}
                        role="button"
                        aria-label="Analytics Coming Soon"
                    >
                        <CardContent className="flex items-center gap-4 p-6">
                            <div className="rounded-lg bg-primary/10 p-2">
                                <BarChart3 className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                                <h3 className="font-medium text-foreground">Analytics</h3>
                                <p className="text-sm text-muted-foreground">Coming Soon</p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card
                        className="cursor-pointer transition-colors hover:bg-accent/50"
                        onClick={() => setShowComingSoon(true)}
                        tabIndex={0}
                        role="button"
                        aria-label="Templates Coming Soon"
                    >
                        <CardContent className="flex items-center gap-4 p-6">
                            <div className="rounded-lg bg-primary/10 p-2">
                                <Clock className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                                <h3 className="font-medium text-foreground">Templates</h3>
                                <p className="text-sm text-muted-foreground">Coming Soon</p>
                            </div>
                        </CardContent>
                    </Card>
                    {/* Coming Soon Modal using shadcn/ui Dialog */}
                    <Dialog open={showComingSoon} onOpenChange={setShowComingSoon}>
                        <DialogContent className="max-w-sm">
                            <DialogHeader>
                                <DialogTitle className="flex items-center gap-2">Coming Soon</DialogTitle>
                                <DialogDescription>This feature is coming soon. Stay tuned for updates!</DialogDescription>
                            </DialogHeader>
                        </DialogContent>
                    </Dialog>
                </div>

                {/* Recent Emails */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle className="flex items-center gap-2">
                                <Clock className="h-5 w-5" />
                                Recent Emails
                            </CardTitle>
                            <Link href="/my-emails">
                                <Button variant="outline" size="sm">
                                    View All
                                </Button>
                            </Link>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        <RecentEmails emails={recentEmails} />
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
