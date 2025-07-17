'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import AdminAppLayout from '@/layouts/admin-app-layout';
import { Head, Link, router } from '@inertiajs/react';
import { Calendar, Edit, Eye, Plus, Search, Trash2, User } from 'lucide-react';
import React from 'react';

interface Post {
    id: string;
    title: string;
    slug: string;
    excerpt: string;
    status: string;
    published_at: string | null;
    created_at: string;
    author: {
        name: string;
    };
    categories: Array<{ id: string; name: string }>;
    tags: Array<{ id: string; name: string }>;
    comments_count: number;
}

interface Props {
    auth: any;
    posts: {
        data: Post[];
        links: any[];
        meta: any;
    };
    filters: {
        search?: string;
        status?: string;
    };
}

export default function PostsIndex({ auth, posts, filters }: Props) {
    const [search, setSearch] = React.useState(filters.search || '');
    const [deletePost, setDeletePost] = React.useState<Post | null>(null);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get('/admin/posts', { search }, { preserveState: true });
    };

    const handleDelete = (post: Post) => {
        router.delete(`/admin/posts/${post.id}`, {
            onSuccess: () => {
                setDeletePost(null);
            },
        });
    };

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

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    return (
        <AdminAppLayout>
            <Head title="Posts Management" />
            <div className="py-12">
                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
                    <div className="mb-8">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <h1 className="text-3xl font-bold text-gray-900">Posts</h1>
                                <p className="text-gray-600">Manage your blog posts</p>
                            </div>
                            <Link href="/admin/posts/create">
                                <Button>
                                    <Plus className="mr-2 h-4 w-4" />
                                    New Post
                                </Button>
                            </Link>
                        </div>
                    </div>

                    {/* Search and Filters */}
                    <Card className="mb-6">
                        <CardContent className="pt-6">
                            <form onSubmit={handleSearch} className="flex gap-4">
                                <div className="flex-1">
                                    <div className="relative">
                                        <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform text-gray-400" />
                                        <Input
                                            placeholder="Search posts..."
                                            value={search}
                                            onChange={(e) => setSearch(e.target.value)}
                                            className="pl-10"
                                        />
                                    </div>
                                </div>
                                <Button type="submit">Search</Button>
                                {filters.search && (
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => {
                                            setSearch('');
                                            router.get('/admin/posts');
                                        }}
                                    >
                                        Clear
                                    </Button>
                                )}
                            </form>
                        </CardContent>
                    </Card>

                    {/* Posts List */}
                    <div className="space-y-4">
                        {posts.data.length === 0 ? (
                            <Card>
                                <CardContent className="py-12 text-center">
                                    <p className="mb-4 text-gray-500">No posts found</p>
                                    <Link href="/admin/posts/create">
                                        <Button>
                                            <Plus className="mr-2 h-4 w-4" />
                                            Create Your First Post
                                        </Button>
                                    </Link>
                                </CardContent>
                            </Card>
                        ) : (
                            posts.data.map((post) => (
                                <Card key={post.id}>
                                    <CardContent className="p-6">
                                        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                                            <div className="min-w-0 flex-1">
                                                <div className="mb-2 flex items-center gap-3">
                                                    <h3 className="truncate text-lg font-semibold text-gray-900">{post.title}</h3>
                                                    <Badge className={getStatusColor(post.status)}>{post.status}</Badge>
                                                </div>

                                                <p className="mb-3 line-clamp-2 text-sm text-gray-600">{post.excerpt}</p>

                                                <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500">
                                                    <div className="flex items-center gap-1">
                                                        <User className="h-3 w-3" />
                                                        {post.author.name}
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        <Calendar className="h-3 w-3" />
                                                        {post.published_at ? formatDate(post.published_at) : formatDate(post.created_at)}
                                                    </div>
                                                    <div>{post.comments_count} comments</div>
                                                </div>

                                                {/* Categories and Tags */}
                                                <div className="mt-3 flex flex-wrap gap-2">
                                                    {(post.categories || []).map((category) => (
                                                        <Badge key={category.id} variant="outline" className="text-xs">
                                                            {category.name}
                                                        </Badge>
                                                    ))}
                                                    {(post.tags || []).map((tag) => (
                                                        <Badge key={tag.id} variant="secondary" className="text-xs">
                                                            #{tag.name}
                                                        </Badge>
                                                    ))}
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2">
                                                {post.status === 'published' && (
                                                    <Link href={`/blog/${post.slug}`} target="_blank">
                                                        <Button variant="outline" size="sm">
                                                            <Eye className="h-4 w-4" />
                                                        </Button>
                                                    </Link>
                                                )}
                                                <Link href={`/admin/posts/${post.id}/edit`}>
                                                    <Button variant="outline" size="sm">
                                                        <Edit className="h-4 w-4" />
                                                    </Button>
                                                </Link>
                                                <Dialog>
                                                    <DialogTrigger asChild>
                                                        <Button variant="outline" size="sm" onClick={() => setDeletePost(post)}>
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </DialogTrigger>
                                                    <DialogContent>
                                                        <DialogHeader>
                                                            <DialogTitle>Delete Post</DialogTitle>
                                                            <DialogDescription>
                                                                Are you sure you want to delete "{post.title}"? This action cannot be undone.
                                                            </DialogDescription>
                                                        </DialogHeader>
                                                        <DialogFooter>
                                                            <Button variant="outline">Cancel</Button>
                                                            <Button variant="destructive" onClick={() => handleDelete(post)}>
                                                                Delete
                                                            </Button>
                                                        </DialogFooter>
                                                    </DialogContent>
                                                </Dialog>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))
                        )}
                    </div>

                    {/* Pagination */}
                    {/* {posts.meta.last_page > 1 && (
                        <div className="mt-8 flex justify-center">
                            <div className="flex gap-2">
                                {posts.links.map((link: any, index: number) => (
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
                        </div>
                    )} */}
                </div>
            </div>{' '}
        </AdminAppLayout>
    );
}
