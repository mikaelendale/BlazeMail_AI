'use client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AppLayout from '@/layouts/app-layout';
import { router } from '@inertiajs/react'; 
import {
    Activity,
    AlertTriangle,
    ArrowLeft,
    BarChart3,
    Calendar,
    CheckCircle,
    Clock,
    Download,
    Eye,
    Mail,
    MousePointer,
    Pause,
    Play,
    Settings,
    Target,
    Users,
} from 'lucide-react';
import { useState } from 'react';
import { Area, AreaChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

interface EmailAccount {
    id: number;
    email: string;
    provider: string;
    status: string;
    daily_limit: number;
    reputation: string;
}

interface CampaignGroup {
    id: number;
    title: string;
    delay: {
        days: number;
        hours: number;
        minutes: number;
    };
    order: number;
    emails: Array<{
        id: number;
        subject: string;
        email_content: string;
    }>;
    status?: 'completed' | 'in-progress' | 'scheduled' | 'paused';
    sent_at?: string;
    scheduled_for?: string;
    stats?: {
        sent: number;
        opens: number;
        clicks: number;
        bounces: number;
        unsubscribes: number;
    };
}

interface Campaign {
    id: number;
    name: string;
    status: 'draft' | 'active' | 'paused' | 'completed';
    starting_date: string;
    total_groups: number;
    total_emails: number;
    sequence_data: {
        groups: CampaignGroup[];
    };
    email_account?: EmailAccount;
    created_at: string;
    launched_at?: string;
    stats?: {
        total_sent: number;
        total_opens: number;
        total_clicks: number;
        total_bounces: number;
        total_unsubscribes: number;
        open_rate: number;
        click_rate: number;
        bounce_rate: number;
        unsubscribe_rate: number;
    };
    performance_data?: Array<{
        date: string;
        sent: number;
        opens: number;
        clicks: number;
    }>;
}

interface Props {
    campaign: Campaign;
}

export default function CampaignShow({ campaign }: Props) {
    const [isPaused, setIsPaused] = useState(campaign.status === 'paused');

    const handlePauseResume = () => {
        const newStatus = isPaused ? 'active' : 'paused';

        router.patch(
            route('user.email.campaign.updateStatus', campaign.id),
            {
                status: newStatus,
            },
            {
                onSuccess: () => {
                    setIsPaused(!isPaused);
                },
                onError: (errors) => {
                    console.error('Failed to update campaign status:', errors);
                },
            },
        );
    };

    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map((n) => n[0])
            .join('')
            .toUpperCase();
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const formatDelay = (delay: { days: number; hours: number; minutes: number }) => {
        const parts = [];
        if (delay.days > 0) parts.push(`${delay.days}d`);
        if (delay.hours > 0) parts.push(`${delay.hours}h`);
        if (delay.minutes > 0) parts.push(`${delay.minutes}m`);
        return parts.length > 0 ? parts.join(' ') : 'Immediately';
    };

    const calculateProgress = () => {
        if (!campaign.stats) return 0;
        const completedGroups = campaign.sequence_data.groups.filter((g) => g.status === 'completed').length;
        return Math.round((completedGroups / campaign.total_groups) * 100);
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'completed':
                return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
            case 'in-progress':
                return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
            case 'scheduled':
                return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
            case 'paused':
                return 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400';
            default:
                return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'completed':
                return <CheckCircle className="h-3 w-3" />;
            case 'in-progress':
                return <Activity className="h-3 w-3" />;
            case 'paused':
                return <Pause className="h-3 w-3" />;
            case 'scheduled':
                return <Clock className="h-3 w-3" />;
            default:
                return <Clock className="h-3 w-3" />;
        }
    };

    const getCampaignStatusBadge = () => {
        switch (campaign.status) {
            case 'active':
                return (
                    <Badge className="bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">
                        <Activity className="mr-1 h-3 w-3" />
                        Active
                    </Badge>
                );
            case 'paused':
                return (
                    <Badge className="bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400">
                        <Pause className="mr-1 h-3 w-3" />
                        Paused
                    </Badge>
                );
            case 'completed':
                return (
                    <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400">
                        <CheckCircle className="mr-1 h-3 w-3" />
                        Completed
                    </Badge>
                );
            case 'draft':
                return (
                    <Badge className="bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400">
                        <AlertTriangle className="mr-1 h-3 w-3" />
                        Draft
                    </Badge>
                );
            default:
                return null;
        }
    };

    // Prepare engagement data for pie chart
    const engagementData = campaign.stats
        ? [
              { name: 'Opened', value: campaign.stats.open_rate, color: '#3b82f6' },
              { name: 'Clicked', value: campaign.stats.click_rate, color: '#10b981' },
              { name: 'Bounced', value: campaign.stats.bounce_rate, color: '#ef4444' },
              { name: 'Unsubscribed', value: campaign.stats.unsubscribe_rate, color: '#f59e0b' },
              {
                  name: 'No Action',
                  value: Math.max(0, 100 - campaign.stats.open_rate - campaign.stats.bounce_rate),
                  color: '#6b7280',
              },
          ]
        : [];

    return (
        <AppLayout>
            <div className="min-h-screen bg-background p-4 md:p-6 lg:p-8">
                <div className="mx-auto max-w-7xl">
                    {/* Header */}
                    <div className="mb-8">
                        <div className="mb-4 flex items-center gap-4">
                            <Button variant="ghost" size="sm" className="rounded-2xl" onClick={() => router.get(route('user.email.campaign'))}>
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Back to Campaigns
                            </Button>
                        </div>
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <div className="mb-2 flex items-center gap-3">
                                    <h1 className="text-3xl font-bold text-primary lg:text-4xl">{campaign.name}</h1>
                                    {getCampaignStatusBadge()}
                                </div>
                                <p className="text-lg text-secondary">Campaign performance and analytics</p>
                            </div>
                            <div className="flex items-center gap-3">
                                {campaign.status === 'active' || campaign.status === 'paused' ? (
                                    <Button variant={isPaused ? 'default' : 'secondary'} onClick={handlePauseResume} className="rounded-2xl">
                                        {isPaused ? <Play className="mr-2 h-4 w-4" /> : <Pause className="mr-2 h-4 w-4" />}
                                        {isPaused ? 'Resume' : 'Pause'}
                                    </Button>
                                ) : null}
                                <Button
                                    variant="outline"
                                    className="rounded-2xl bg-transparent"
                                    onClick={() => router.get(route('user.email.campaign.setup', campaign.id))}
                                >
                                    <Settings className="mr-2 h-4 w-4" />
                                    Settings
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* Key Metrics */}
                    <div className="mb-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                        <Card className="rounded-3xl border border-accent bg-card">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground">Progress</p>
                                        <p className="text-2xl font-bold text-primary">{calculateProgress()}%</p>
                                        <p className="text-xs text-muted-foreground">
                                            {campaign.sequence_data.groups.filter((g) => g.status === 'completed').length} of {campaign.total_groups}{' '}
                                            groups completed
                                        </p>
                                    </div>
                                    <div className="rounded-2xl bg-primary/10 p-3">
                                        <Target className="h-6 w-6 text-primary" />
                                    </div>
                                </div>
                                <Progress value={calculateProgress()} className="mt-3" />
                            </CardContent>
                        </Card>

                        <Card className="rounded-3xl border border-accent bg-card">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground">Open Rate</p>
                                        <p className="text-2xl font-bold text-primary">{campaign.stats?.open_rate?.toFixed(1) || '0.0'}%</p>
                                        <div className="flex items-center gap-1 text-xs">
                                            <span className="text-muted-foreground">{campaign.stats?.total_opens || 0} opens</span>
                                        </div>
                                    </div>
                                    <div className="rounded-2xl bg-secondary/10 p-3">
                                        <Eye className="h-6 w-6 text-secondary-foreground" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="rounded-3xl border border-accent bg-card">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground">Click Rate</p>
                                        <p className="text-2xl font-bold text-primary">{campaign.stats?.click_rate?.toFixed(1) || '0.0'}%</p>
                                        <div className="flex items-center gap-1 text-xs">
                                            <span className="text-muted-foreground">{campaign.stats?.total_clicks || 0} clicks</span>
                                        </div>
                                    </div>
                                    <div className="rounded-2xl bg-accent/10 p-3">
                                        <MousePointer className="h-6 w-6 text-accent-foreground" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="rounded-3xl border border-accent bg-card">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground">Total Sent</p>
                                        <p className="text-2xl font-bold text-primary">{campaign.stats?.total_sent?.toLocaleString() || '0'}</p>
                                        <div className="flex items-center gap-1 text-xs">
                                            <span className="text-muted-foreground">{campaign.stats?.total_unsubscribes || 0} unsubscribed</span>
                                        </div>
                                    </div>
                                    <div className="rounded-2xl bg-muted/10 p-3">
                                        <Users className="h-6 w-6 text-muted-foreground" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
                        {/* Main Content */}
                        <div className="space-y-8 lg:col-span-2">
                            {/* Performance Chart */}
                            {campaign.performance_data && campaign.performance_data.length > 0 && (
                                <Card className="rounded-3xl border border-accent bg-card">
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <BarChart3 className="h-5 w-5 text-primary" />
                                            Performance Overview
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <Tabs defaultValue="timeline" className="w-full">
                                            <TabsList className="grid w-full grid-cols-2 rounded-2xl">
                                                <TabsTrigger value="timeline" className="rounded-xl">
                                                    Timeline
                                                </TabsTrigger>
                                                <TabsTrigger value="engagement" className="rounded-xl">
                                                    Engagement
                                                </TabsTrigger>
                                            </TabsList>
                                            <TabsContent value="timeline" className="mt-6">
                                                <ResponsiveContainer width="100%" height={300}>
                                                    <AreaChart data={campaign.performance_data}>
                                                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                                        <XAxis
                                                            dataKey="date"
                                                            tickFormatter={(value) =>
                                                                new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                                                            }
                                                            stroke="#666"
                                                        />
                                                        <YAxis stroke="#666" />
                                                        <Tooltip
                                                            labelFormatter={(value) => new Date(value).toLocaleDateString()}
                                                            contentStyle={{
                                                                backgroundColor: 'white',
                                                                border: '1px solid #e2e8f0',
                                                                borderRadius: '12px',
                                                                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                                                            }}
                                                        />
                                                        <Area
                                                            type="monotone"
                                                            dataKey="opens"
                                                            stackId="1"
                                                            stroke="#3b82f6"
                                                            fill="#3b82f6"
                                                            fillOpacity={0.6}
                                                        />
                                                        <Area
                                                            type="monotone"
                                                            dataKey="clicks"
                                                            stackId="1"
                                                            stroke="#10b981"
                                                            fill="#10b981"
                                                            fillOpacity={0.8}
                                                        />
                                                    </AreaChart>
                                                </ResponsiveContainer>
                                            </TabsContent>
                                            <TabsContent value="engagement" className="mt-6">
                                                {engagementData.length > 0 && (
                                                    <>
                                                        <div className="flex justify-center">
                                                            <ResponsiveContainer width="100%" height={300}>
                                                                <PieChart>
                                                                    <Pie
                                                                        data={engagementData}
                                                                        cx="50%"
                                                                        cy="50%"
                                                                        innerRadius={60}
                                                                        outerRadius={120}
                                                                        paddingAngle={5}
                                                                        dataKey="value"
                                                                    >
                                                                        {engagementData.map((entry, index) => (
                                                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                                                        ))}
                                                                    </Pie>
                                                                    <Tooltip
                                                                        formatter={(value) => [`${Number(value).toFixed(1)}%`, 'Percentage']}
                                                                        contentStyle={{
                                                                            backgroundColor: 'white',
                                                                            border: '1px solid #e2e8f0',
                                                                            borderRadius: '12px',
                                                                        }}
                                                                    />
                                                                </PieChart>
                                                            </ResponsiveContainer>
                                                        </div>
                                                        <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3">
                                                            {engagementData.map((item, index) => (
                                                                <div key={index} className="flex items-center gap-2">
                                                                    <div
                                                                        className="h-3 w-3 rounded-full"
                                                                        style={{ backgroundColor: item.color }}
                                                                    ></div>
                                                                    <span className="text-sm text-muted-foreground">
                                                                        {item.name}: {Number(item.value).toFixed(1)}%
                                                                    </span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </>
                                                )}
                                            </TabsContent>
                                        </Tabs>
                                    </CardContent>
                                </Card>
                            )}

                            {/* Email Sequence Progress */}
                            <Card className="rounded-3xl border border-accent bg-card">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Mail className="h-5 w-5 text-primary" />
                                        Email Sequence Progress
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        {campaign.sequence_data.groups.map((group, index) => (
                                            <div key={group.id} className="relative">
                                                {/* Timeline connector */}
                                                {index < campaign.sequence_data.groups.length - 1 && (
                                                    <div className="absolute top-12 left-6 h-8 w-0.5 bg-border"></div>
                                                )}
                                                <div className="flex items-start gap-4">
                                                    <div
                                                        className={`flex h-12 w-12 items-center justify-center rounded-2xl ${getStatusColor(
                                                            group.status || 'scheduled',
                                                        )}`}
                                                    >
                                                        {getStatusIcon(group.status || 'scheduled')}
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                        <div className="mb-2 flex items-center gap-2">
                                                            <h4 className="font-semibold text-primary">{group.title}</h4>
                                                            <Badge className={`text-xs ${getStatusColor(group.status || 'scheduled')}`}>
                                                                {group.status || 'scheduled'}
                                                            </Badge>
                                                            <span className="text-xs text-muted-foreground">Delay: {formatDelay(group.delay)}</span>
                                                        </div>
                                                        <div className="space-y-2">
                                                            {group.emails.map((email, emailIndex) => (
                                                                <div key={emailIndex} className="rounded-2xl border border-accent bg-muted/30 p-3">
                                                                    <div className="mb-2 flex items-center justify-between">
                                                                        <p className="text-sm font-medium">{email.subject}</p>
                                                                        {group.stats && (
                                                                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                                                                <span>{group.stats.opens} opens</span>
                                                                                <span>{group.stats.clicks} clicks</span>
                                                                                <span>{group.stats.sent} sent</span>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                    {group.stats && group.stats.sent > 0 && (
                                                                        <div className="flex gap-4">
                                                                            <div className="flex-1">
                                                                                <div className="mb-1 flex justify-between text-xs">
                                                                                    <span>Open Rate</span>
                                                                                    <span>
                                                                                        {((group.stats.opens / group.stats.sent) * 100).toFixed(1)}%
                                                                                    </span>
                                                                                </div>
                                                                                <Progress
                                                                                    value={(group.stats.opens / group.stats.sent) * 100}
                                                                                    className="h-2"
                                                                                />
                                                                            </div>
                                                                            <div className="flex-1">
                                                                                <div className="mb-1 flex justify-between text-xs">
                                                                                    <span>Click Rate</span>
                                                                                    <span>
                                                                                        {((group.stats.clicks / group.stats.sent) * 100).toFixed(1)}%
                                                                                    </span>
                                                                                </div>
                                                                                <Progress
                                                                                    value={(group.stats.clicks / group.stats.sent) * 100}
                                                                                    className="h-2"
                                                                                />
                                                                            </div>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            ))}
                                                        </div>
                                                        <p className="mt-2 text-xs text-muted-foreground">
                                                            {group.status === 'completed' && group.sent_at && `Sent on ${formatDate(group.sent_at)}`}
                                                            {group.status === 'in-progress' && `Currently sending...`}
                                                            {group.status === 'scheduled' &&
                                                                group.scheduled_for &&
                                                                `Scheduled for ${formatDate(group.scheduled_for)}`}
                                                            {group.status === 'paused' && `Paused`}
                                                            {!group.status && `Waiting to be scheduled`}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Sidebar */}
                        <div className="space-y-6">
                            {/* Campaign Info */}
                            <Card className="rounded-3xl border border-accent bg-card">
                                <CardHeader>
                                    <CardTitle className="text-lg">Campaign Details</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    {campaign.email_account && (
                                        <div className="space-y-3">
                                            <div className="flex items-center gap-2 text-sm">
                                                <Mail className="h-4 w-4 text-muted-foreground" />
                                                <span className="text-muted-foreground">From:</span>
                                                <span className="font-medium">{campaign.email_account.email}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-sm">
                                                <span className="text-muted-foreground">Provider:</span>
                                                <span className="font-medium">{campaign.email_account.provider}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-sm">
                                                <span className="text-muted-foreground">Daily Limit:</span>
                                                <span className="font-medium">{campaign.email_account.daily_limit}</span>
                                            </div>
                                        </div>
                                    )}
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-2 text-sm">
                                            <Calendar className="h-4 w-4 text-muted-foreground" />
                                            <span className="text-muted-foreground">Created:</span>
                                            <span className="font-medium">{formatDate(campaign.created_at)}</span>
                                        </div>
                                        {campaign.launched_at && (
                                            <div className="flex items-center gap-2 text-sm">
                                                <Clock className="h-4 w-4 text-muted-foreground" />
                                                <span className="text-muted-foreground">Launched:</span>
                                                <span className="font-medium">{formatDate(campaign.launched_at)}</span>
                                            </div>
                                        )}
                                        <div className="flex items-center gap-2 text-sm">
                                            <Target className="h-4 w-4 text-muted-foreground" />
                                            <span className="text-muted-foreground">Total Groups:</span>
                                            <span className="font-medium">{campaign.total_groups}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-sm">
                                            <Mail className="h-4 w-4 text-muted-foreground" />
                                            <span className="text-muted-foreground">Total Emails:</span>
                                            <span className="font-medium">{campaign.total_emails}</span>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Quick Actions */}
                            <Card className="rounded-3xl border border-accent bg-card">
                                <CardHeader>
                                    <CardTitle className="text-lg">Quick Actions</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    <Button
                                        variant="outline"
                                        className="w-full justify-start rounded-2xl bg-transparent"
                                        onClick={() => {
                                            // Export functionality
                                            console.log('Exporting campaign report...');
                                        }}
                                    >
                                        <Download className="mr-2 h-4 w-4" />
                                        Export Report
                                    </Button>
                                    <Button
                                        variant="outline"
                                        className="w-full justify-start rounded-2xl bg-transparent"
                                        onClick={() => router.get(route('email.index'))}
                                    >
                                        <Eye className="mr-2 h-4 w-4" />
                                        View Email Library
                                    </Button>
                                    <Button
                                        variant="outline"
                                        className="w-full justify-start rounded-2xl bg-transparent"
                                        onClick={() => router.get(route('contacts.index'))}
                                    >
                                        <Users className="mr-2 h-4 w-4" />
                                        View Contacts
                                    </Button>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
