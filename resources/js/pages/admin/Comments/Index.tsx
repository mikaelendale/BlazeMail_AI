'use client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AdminAppLayout from '@/layouts/admin-app-layout';
import { Head, Link, router } from '@inertiajs/react';
import { AlertTriangle, Calendar, CheckCircle, Eye, Filter, MessageCircle, Trash2, XCircle } from 'lucide-react';

interface Comment {
    id: string;
    content: string;
    status: 'pending' | 'approved' | 'spam';
    created_at: string;
    user?: {
        id: number;
        name: string;
        email: string;
        avatar?: string;
    };
    post: {
        id: string;
        title: string;
        slug: string;
    };
}

interface Props {
    auth: any;
    comments: {
        data: Comment[];
        links: any[];
        meta: any;
    };
    filters: {
        status?: string;
    };
}

export default function CommentsIndex({ auth, comments, filters }: Props) {
    const handleStatusFilter = (status: string) => {
        router.get(
            route('admin.comments.index'),
            {
                status: status === 'all' ? '' : status,
            },
            { preserveState: true },
        );
    };

    const handleStatusUpdate = (commentId: string, newStatus: string) => {
        router.put(route('admin.comments.update', commentId), {
            status: newStatus,
        });
    };

    const handleDelete = (commentId: string) => {
        if (confirm('Are you sure you want to delete this comment?')) {
            router.delete(route('admin.comments.destroy', commentId));
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'approved':
                return 'bg-green-100 text-green-800';
            case 'pending':
                return 'bg-yellow-100 text-yellow-800';
            case 'spam':
                return 'bg-red-100 text-red-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'approved':
                return <CheckCircle className="h-4 w-4 text-green-600" />;
            case 'pending':
                return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
            case 'spam':
                return <XCircle className="h-4 w-4 text-red-600" />;
            default:
                return <MessageCircle className="h-4 w-4 text-gray-600" />;
        }
    };

    const truncateContent = (content: string, maxLength = 150) => {
        if (content.length <= maxLength) return content;
        return content.substring(0, maxLength) + '...';
    };

    return (
        <AdminAppLayout>
            <Head title="Manage Comments" />
            <div className="py-12">
                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
                    <div className="mb-8">
                        <div className="flex items-center justify-between">
                            <div>
                                <h1 className="text-3xl font-bold text-gray-900">Comments</h1>
                                <p className="mt-2 text-gray-600">Moderate and manage blog comments</p>
                            </div>
                        </div>
                    </div>

                    {/* Filters */}
                    <Card className="mb-6">
                        <CardContent className="p-6">
                            <div className="flex items-center space-x-4">
                                <div className="flex items-center space-x-2">
                                    <Filter className="h-4 w-4 text-gray-500" />
                                    <span className="text-sm font-medium text-gray-700">Filter by status:</span>
                                </div>
                                <Select value={filters.status || 'all'} onValueChange={handleStatusFilter}>
                                    <SelectTrigger className="w-48">
                                        <SelectValue placeholder="All Comments" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Comments</SelectItem>
                                        <SelectItem value="pending">Pending</SelectItem>
                                        <SelectItem value="approved">Approved</SelectItem>
                                        <SelectItem value="spam">Spam</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Comments List */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center space-x-2">
                                <MessageCircle className="h-5 w-5" />
                                <span>All Comments ({comments.meta})</span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {comments.data.length > 0 ? (
                                <>
                                    <div className="space-y-6">
                                        {comments.data.map((comment) => (
                                            <div key={comment.id} className="rounded-lg border p-6 transition-shadow hover:shadow-sm">
                                                <div className="mb-4 flex items-start justify-between">
                                                    <div className="flex flex-1 items-start space-x-4">
                                                        <Avatar className="h-10 w-10">
                                                            <AvatarImage src={comment.user?.avatar || '/placeholder.svg'} />
                                                            <AvatarFallback>{comment.user?.name?.charAt(0) || 'A'}</AvatarFallback>
                                                        </Avatar>
                                                        <div className="flex-1">
                                                            <div className="mb-2 flex items-center space-x-3">
                                                                <span className="font-medium text-gray-900">{comment.user?.name || 'Anonymous'}</span>
                                                                {comment.user?.email && (
                                                                    <span className="text-sm text-gray-500">{comment.user.email}</span>
                                                                )}
                                                                <Badge className={getStatusColor(comment.status)}>
                                                                    <span className="flex items-center space-x-1">
                                                                        {getStatusIcon(comment.status)}
                                                                        <span className="capitalize">{comment.status}</span>
                                                                    </span>
                                                                </Badge>
                                                            </div>

                                                            <div className="mb-3 flex items-center space-x-4 text-sm text-gray-500">
                                                                <div className="flex items-center space-x-1">
                                                                    <Calendar className="h-4 w-4" />
                                                                    <span>{new Date(comment.created_at).toLocaleDateString()}</span>
                                                                </div>
                                                                <div className="flex items-center space-x-1">
                                                                    <span>on</span>
                                                                    <Link
                                                                        href={route('blog.show', comment.post.slug)}
                                                                        className="font-medium text-blue-600 hover:text-blue-700"
                                                                        target="_blank"
                                                                    >
                                                                        {comment.post.title}
                                                                    </Link>
                                                                </div>
                                                            </div>

                                                            <div className="mb-4 rounded-lg bg-gray-50 p-4">
                                                                <p className="leading-relaxed text-gray-700">{truncateContent(comment.content)}</p>
                                                                {comment.content.length > 150 && (
                                                                    <button className="mt-2 text-sm text-blue-600 hover:text-blue-700">
                                                                        Read more...
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Action Buttons */}
                                                <div className="flex items-center justify-between border-t pt-4">
                                                    <div className="flex items-center space-x-2">
                                                        <Link href={route('blog.show', comment.post.slug)} target="_blank">
                                                            <Button variant="outline" size="sm">
                                                                <Eye className="mr-2 h-4 w-4" />
                                                                View Post
                                                            </Button>
                                                        </Link>
                                                    </div>

                                                    <div className="flex items-center space-x-2">
                                                        {comment.status !== 'approved' && (
                                                            <Button
                                                                size="sm"
                                                                onClick={() => handleStatusUpdate(comment.id, 'approved')}
                                                                className="bg-green-600 hover:bg-green-700"
                                                            >
                                                                <CheckCircle className="mr-2 h-4 w-4" />
                                                                Approve
                                                            </Button>
                                                        )}

                                                        {comment.status !== 'spam' && (
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() => handleStatusUpdate(comment.id, 'spam')}
                                                                className="border-orange-300 text-orange-600 hover:text-orange-700"
                                                            >
                                                                <AlertTriangle className="mr-2 h-4 w-4" />
                                                                Mark as Spam
                                                            </Button>
                                                        )}

                                                        {comment.status !== 'pending' && (
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() => handleStatusUpdate(comment.id, 'pending')}
                                                                className="border-yellow-300 text-yellow-600 hover:text-yellow-700"
                                                            >
                                                                <AlertTriangle className="mr-2 h-4 w-4" />
                                                                Mark Pending
                                                            </Button>
                                                        )}

                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => handleDelete(comment.id)}
                                                            className="border-red-300 text-red-600 hover:text-red-700"
                                                        >
                                                            <Trash2 className="mr-2 h-4 w-4" />
                                                            Delete
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Pagination */}
                                    {comments.links && (
                                        <div className="mt-8 flex justify-center space-x-2">
                                            {comments.links.map((link, index) => (
                                                <Button
                                                    key={index}
                                                    variant={link.active ? 'default' : 'outline'}
                                                    size="sm"
                                                    disabled={!link.url}
                                                    onClick={() => link.url && router.get(link.url)}
                                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                                />
                                            ))}
                                        </div>
                                    )}
                                </>
                            ) : (
                                <div className="py-12 text-center">
                                    <MessageCircle className="mx-auto mb-4 h-12 w-12 text-gray-300" />
                                    <h3 className="mb-2 text-lg font-medium text-gray-900">No comments found</h3>
                                    <p className="text-gray-600">
                                        {filters.status && filters.status !== 'all'
                                            ? `No ${filters.status} comments at the moment.`
                                            : 'No comments have been posted yet.'}
                                    </p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Quick Stats */}
                    <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-4">
                        <Card>
                            <CardContent className="p-4">
                                <div className="flex items-center space-x-2">
                                    <AlertTriangle className="h-5 w-5 text-yellow-500" />
                                    <div>
                                        <p className="text-sm font-medium text-gray-600">Pending</p>
                                        <p className="text-2xl font-bold text-yellow-600">
                                            {comments.data.filter((c) => c.status === 'pending').length}
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="p-4">
                                <div className="flex items-center space-x-2">
                                    <CheckCircle className="h-5 w-5 text-green-500" />
                                    <div>
                                        <p className="text-sm font-medium text-gray-600">Approved</p>
                                        <p className="text-2xl font-bold text-green-600">
                                            {comments.data.filter((c) => c.status === 'approved').length}
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="p-4">
                                <div className="flex items-center space-x-2">
                                    <XCircle className="h-5 w-5 text-red-500" />
                                    <div>
                                        <p className="text-sm font-medium text-gray-600">Spam</p>
                                        <p className="text-2xl font-bold text-red-600">{comments.data.filter((c) => c.status === 'spam').length}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="p-4">
                                <div className="flex items-center space-x-2">
                                    <MessageCircle className="h-5 w-5 text-blue-500" />
                                    <div>
                                        <p className="text-sm font-medium text-gray-600">Total</p>
                                        <p className="text-2xl font-bold text-blue-600">{comments.meta}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>{' '}
        </AdminAppLayout>
    );
}
