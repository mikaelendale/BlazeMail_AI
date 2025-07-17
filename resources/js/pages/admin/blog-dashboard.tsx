import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Head, Link } from '@inertiajs/react';
import { CheckCircle, Clock, Eye, FileText, MessageCircle, Plus, Tag } from 'lucide-react';

interface Stats {
    total_posts: number;
    published_posts: number;
    draft_posts: number;
    total_views: number;
    pending_comments: number;
    total_categories: number;
    total_tags: number;
}

interface Post {
    id: string;
    title: string;
    slug: string;
    status: string;
    published_at?: string;
    views: number;
    author: {
        name: string;
    };
    categories: Array<{
        name: string;
    }>;
}

interface Comment {
    id: string;
    content: string;
    created_at: string;
    user?: {
        name: string;
    };
    post: {
        title: string;
        slug: string;
    };
}

interface Props {
    auth: any;
    stats: Stats;
    recentPosts: Post[];
    pendingComments: Comment[];
}

export default function AdminDashboard({ auth, stats, recentPosts, pendingComments }: Props) {
    const getStatusColor = (status: string) => {
        switch (status) {
            case 'published':
                return 'bg-green-100 text-green-800';
            case 'draft':
                return 'bg-yellow-100 text-yellow-800';
            case 'archived':
                return 'bg-gray-100 text-gray-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <>
            <Head title="Blog Dashboard" />
            <div className="py-12">
                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold text-gray-900">Blog Dashboard</h1>
                        <p className="mt-2 text-gray-600">Manage your blog content and monitor performance</p>
                    </div>

                    {/* Quick Actions */}
                    <div className="mb-8">
                        <div className="flex flex-wrap gap-4">
                            <Link href={route('admin.posts.create')}>
                                <Button>
                                    <Plus className="mr-2 h-4 w-4" />
                                    New Post
                                </Button>
                            </Link>
                            <Link href={route('admin.posts.index')}>
                                <Button variant="outline">
                                    <FileText className="mr-2 h-4 w-4" />
                                    All Posts
                                </Button>
                            </Link>
                            <Link href={route('admin.comments.index')}>
                                <Button variant="outline">
                                    <MessageCircle className="mr-2 h-4 w-4" />
                                    Comments
                                    {stats.pending_comments > 0 && <Badge className="ml-2 bg-red-500">{stats.pending_comments}</Badge>}
                                </Button>
                            </Link>
                        </div>
                    </div>

                    {/* Stats Cards */}
                    <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Total Posts</CardTitle>
                                <FileText className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{stats.total_posts}</div>
                                <p className="text-xs text-muted-foreground">
                                    {stats.published_posts} published, {stats.draft_posts} drafts
                                </p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Total Views</CardTitle>
                                <Eye className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{stats.total_views.toLocaleString()}</div>
                                <p className="text-xs text-muted-foreground">Across all published posts</p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Pending Comments</CardTitle>
                                <MessageCircle className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{stats.pending_comments}</div>
                                <p className="text-xs text-muted-foreground">Awaiting moderation</p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Categories & Tags</CardTitle>
                                <Tag className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{stats.total_categories + stats.total_tags}</div>
                                <p className="text-xs text-muted-foreground">
                                    {stats.total_categories} categories, {stats.total_tags} tags
                                </p>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
                        {/* Recent Posts */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center justify-between">
                                    Recent Posts
                                    <Link href={route('admin.posts.index')}>
                                        <Button variant="outline" size="sm">
                                            View All
                                        </Button>
                                    </Link>
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {recentPosts.length > 0 ? (
                                        recentPosts.map((post) => (
                                            <div key={post.id} className="flex items-start justify-between border-b pb-3 last:border-b-0 last:pb-0">
                                                <div className="flex-1">
                                                    <Link
                                                        href={route('admin.posts.edit', post.id)}
                                                        className="line-clamp-2 font-medium transition-colors hover:text-blue-600"
                                                    >
                                                        {post.title}
                                                    </Link>
                                                    <div className="mt-1 flex items-center space-x-2">
                                                        <Badge className={getStatusColor(post.status)}>{post.status}</Badge>
                                                        <span className="text-xs text-gray-500">by {post.author.name}</span>
                                                        {post.categories.length > 0 && (
                                                            <span className="text-xs text-gray-500">in {post.categories[0].name}</span>
                                                        )}
                                                    </div>
                                                    <div className="mt-2 flex items-center space-x-3 text-xs text-gray-500">
                                                        <div className="flex items-center space-x-1">
                                                            <Eye className="h-3 w-3" />
                                                            <span>{post.views}</span>
                                                        </div>
                                                        {post.published_at && (
                                                            <div className="flex items-center space-x-1">
                                                                <Clock className="h-3 w-3" />
                                                                <span>{new Date(post.published_at).toLocaleDateString()}</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="py-8 text-center text-gray-500">
                                            <FileText className="mx-auto mb-4 h-12 w-12 text-gray-300" />
                                            <p>No posts yet</p>
                                            <Link href={route('admin.posts.create')}>
                                                <Button className="mt-2">Create your first post</Button>
                                            </Link>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Pending Comments */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center justify-between">
                                    Pending Comments
                                    <Link href={route('admin.comments.index', { status: 'pending' })}>
                                        <Button variant="outline" size="sm">
                                            View All
                                        </Button>
                                    </Link>
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {pendingComments.length > 0 ? (
                                        pendingComments.map((comment) => (
                                            <div key={comment.id} className="border-b pb-3 last:border-b-0 last:pb-0">
                                                <div className="mb-2 flex items-start justify-between">
                                                    <div className="flex-1">
                                                        <p className="mb-2 line-clamp-2 text-sm text-gray-700">{comment.content}</p>
                                                        <div className="flex items-center space-x-2 text-xs text-gray-500">
                                                            <span>by {comment.user?.name || 'Anonymous'}</span>
                                                            <span>•</span>
                                                            <span>
                                                                on{' '}
                                                                <Link href={route('blog.show', comment.post.slug)} className="hover:text-blue-600">
                                                                    {comment.post.title}
                                                                </Link>
                                                            </span>
                                                            <span>•</span>
                                                            <span>{new Date(comment.created_at).toLocaleDateString()}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="py-8 text-center text-gray-500">
                                            <CheckCircle className="mx-auto mb-4 h-12 w-12 text-green-300" />
                                            <p>No pending comments</p>
                                            <p className="text-sm">All caught up!</p>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>{' '}
        </>
    );
}
