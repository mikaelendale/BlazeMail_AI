'use client';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AdminAppLayout from '@/layouts/admin-app-layout';
import { Head, Link, router } from '@inertiajs/react';
import { Clock, Monitor, MousePointer, Smartphone, Tablet, TrendingUp, Users } from 'lucide-react';
import { CartesianGrid, Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

interface Props {
    auth: any;
    stats: {
        total_views: number;
        unique_views: number;
        avg_time_on_page: number;
        bounce_rate: number;
    };
    traffic_sources: Array<{
        source: string;
        medium: string;
        views: number;
    }>;
    top_posts: Array<{
        post_id: string;
        views: number;
        post: {
            id: string;
            title: string;
            slug: string;
        };
    }>;
    device_stats: Array<{
        device_type: string;
        views: number;
    }>;
    browser_stats: Array<{
        browser: string;
        views: number;
    }>;
    daily_views: Array<{
        date: string;
        views: number;
    }>;
    days: number;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export default function AnalyticsIndex({ auth, stats, traffic_sources, top_posts, device_stats, browser_stats, daily_views, days }: Props) {
    const formatTime = (seconds: number) => {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = Math.floor(seconds % 60);
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    };

    const getDeviceIcon = (deviceType: string) => {
        switch (deviceType) {
            case 'mobile':
                return <Smartphone className="h-4 w-4" />;
            case 'tablet':
                return <Tablet className="h-4 w-4" />;
            default:
                return <Monitor className="h-4 w-4" />;
        }
    };

    const getSourceColor = (source: string, medium: string) => {
        if (medium === 'organic') return 'bg-green-100 text-green-800';
        if (medium === 'social') return 'bg-blue-100 text-blue-800';
        if (medium === 'referral') return 'bg-purple-100 text-purple-800';
        if (source === 'direct') return 'bg-gray-100 text-gray-800';
        return 'bg-orange-100 text-orange-800';
    };

    const handleDaysChange = (newDays: string) => {
        router.get('/admin/analytics', { days: newDays }, { preserveState: true });
    };

    return (
        <AdminAppLayout>
            <Head title="Analytics Dashboard" />
            <div className="py-12">
                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
                    <div className="mb-8">
                        <div className="flex items-center justify-between">
                            <div>
                                <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
                                <p className="mt-2 text-gray-600">Track your blog performance and audience insights</p>
                            </div>
                            <Select value={days.toString()} onValueChange={handleDaysChange}>
                                <SelectTrigger className="w-48">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="7">Last 7 days</SelectItem>
                                    <SelectItem value="30">Last 30 days</SelectItem>
                                    <SelectItem value="90">Last 90 days</SelectItem>
                                    <SelectItem value="365">Last year</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Overview Stats */}
                    <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Total Views</CardTitle>
                                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{stats.total_views.toLocaleString()}</div>
                                <p className="text-xs text-muted-foreground">Page views in selected period</p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Unique Visitors</CardTitle>
                                <Users className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{stats.unique_views.toLocaleString()}</div>
                                <p className="text-xs text-muted-foreground">Unique IP addresses</p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Avg. Time on Page</CardTitle>
                                <Clock className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{formatTime(stats.avg_time_on_page)}</div>
                                <p className="text-xs text-muted-foreground">Average session duration</p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Bounce Rate</CardTitle>
                                <MousePointer className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{stats.bounce_rate}%</div>
                                <p className="text-xs text-muted-foreground">Single page sessions</p>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="mb-8 grid grid-cols-1 gap-8 lg:grid-cols-2">
                        {/* Daily Views Chart */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Daily Views Trend</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {daily_views.length > 0 ? (
                                    <ResponsiveContainer width="100%" height={300}>
                                        <LineChart data={daily_views}>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis dataKey="date" />
                                            <YAxis />
                                            <Tooltip />
                                            <Line type="monotone" dataKey="views" stroke="#8884d8" strokeWidth={2} />
                                        </LineChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="flex h-[300px] items-center justify-center text-gray-500">
                                        No data available for the selected period
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Device Breakdown */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Device Breakdown</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {device_stats.length > 0 ? (
                                    <ResponsiveContainer width="100%" height={300}>
                                        <PieChart>
                                            <Pie
                                                data={device_stats}
                                                cx="50%"
                                                cy="50%"
                                                labelLine={false}
                                                label={({ device_type, percent }) => `${device_type} ${(percent * 100).toFixed(0)}%`}
                                                outerRadius={80}
                                                fill="#8884d8"
                                                dataKey="views"
                                            >
                                                {device_stats.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip />
                                        </PieChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="flex h-[300px] items-center justify-center text-gray-500">No device data available</div>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
                        {/* Traffic Sources */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Traffic Sources</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {traffic_sources.length > 0 ? (
                                        traffic_sources.map((source, index) => (
                                            <div key={index} className="flex items-center justify-between">
                                                <div className="flex items-center space-x-3">
                                                    <Badge className={getSourceColor(source.source, source.medium)}>{source.source}</Badge>
                                                    <span className="text-sm text-gray-600">({source.medium})</span>
                                                </div>
                                                <div className="flex items-center space-x-2">
                                                    <span className="font-medium">{source.views}</span>
                                                    <div className="h-2 w-20 rounded-full bg-gray-200">
                                                        <div
                                                            className="h-2 rounded-full bg-blue-600"
                                                            style={{
                                                                width: `${(source.views / (traffic_sources[0]?.views || 1)) * 100}%`,
                                                            }}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="py-8 text-center text-gray-500">No traffic source data available</div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Top Posts */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Top Performing Posts</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {top_posts.length > 0 ? (
                                        top_posts.map((post, index) => (
                                            <div key={post.post_id} className="flex items-start justify-between">
                                                <div className="flex-1">
                                                    <div className="mb-1 flex items-center space-x-2">
                                                        <span className="text-sm font-medium text-gray-500">#{index + 1}</span>
                                                        <Link
                                                            href={`/blog/${post.post.slug}`}
                                                            className="line-clamp-2 font-medium transition-colors hover:text-blue-600"
                                                            target="_blank"
                                                        >
                                                            {post.post.title}
                                                        </Link>
                                                    </div>
                                                </div>
                                                <div className="ml-4 flex items-center space-x-2">
                                                    <span className="font-medium">{post.views}</span>
                                                    <span className="text-sm text-gray-500">views</span>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="py-8 text-center text-gray-500">No post data available</div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Browser Stats */}
                    {browser_stats.length > 0 && (
                        <Card className="mt-8">
                            <CardHeader>
                                <CardTitle>Browser Statistics</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
                                    {browser_stats.map((browser, index) => (
                                        <div key={index} className="text-center">
                                            <div className="text-2xl font-bold text-blue-600">{browser.views}</div>
                                            <div className="text-sm text-gray-600 capitalize">{browser.browser}</div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>{' '}
        </AdminAppLayout>
    );
}
