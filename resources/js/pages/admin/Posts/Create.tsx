'use client';

import type React from 'react';

import RichTextEditor from '@/components/RichTextEditor';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import AdminAppLayout from '@/layouts/admin-app-layout';
import { Head, router, useForm } from '@inertiajs/react';
import { ArrowLeft, Eye, Save } from 'lucide-react';
import { useState } from 'react';

interface Category {
    id: string;
    name: string;
    slug: string;
}

interface Tag {
    id: string;
    name: string;
    slug: string;
}

interface Props {
    auth: any;
    categories: Category[];
    tags: Tag[];
}

export default function CreatePost({ auth, categories, tags }: Props) {
    const { data, setData, post, processing, errors, reset } = useForm({
        title: '',
        content: '',
        excerpt: '',
        featured_image: '',
        status: 'draft',
        published_at: '',
        categories: [] as string[],
        tags: [] as string[],
        meta_title: '',
        meta_description: '',
        meta_keywords: '',
    });

    const [showSeoFields, setShowSeoFields] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/admin/posts', {
            onSuccess: () => {
                reset();
            },
        });
    };

    const handleCategoryChange = (categoryId: string, checked: boolean) => {
        if (checked) {
            setData('categories', [...data.categories, categoryId]);
        } else {
            setData(
                'categories',
                data.categories.filter((id) => id !== categoryId),
            );
        }
    };

    const handleTagChange = (tagId: string, checked: boolean) => {
        if (checked) {
            setData('tags', [...data.tags, tagId]);
        } else {
            setData(
                'tags',
                data.tags.filter((id) => id !== tagId),
            );
        }
    };

    const handlePreview = () => {
        // Save as draft first, then open preview
        post('/admin/posts', {
            data: { ...data, status: 'draft' },
            onSuccess: (page: any) => {
                // Assuming the response contains the post slug
                window.open(`/blog/${page.props.post?.slug || 'preview'}`, '_blank');
            },
        });
    };

    return (
        <AdminAppLayout>
            <Head title="Create Post" />
            <div className="py-12">
                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
                    <div className="mb-6">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <Button variant="ghost" onClick={() => router.visit('/admin/posts')} className="flex items-center gap-2">
                                    <ArrowLeft className="h-4 w-4" />
                                    Back to Posts
                                </Button>
                                <h1 className="text-2xl font-bold text-gray-900">Create New Post</h1>
                            </div>
                            <div className="flex items-center gap-2">
                                <Button variant="outline" onClick={handlePreview} disabled={processing}>
                                    <Eye className="mr-2 h-4 w-4" />
                                    Preview
                                </Button>
                                <Button type="submit" form="post-form" disabled={processing}>
                                    <Save className="mr-2 h-4 w-4" />
                                    {processing ? 'Saving...' : 'Save Post'}
                                </Button>
                            </div>
                        </div>
                    </div>

                    <form id="post-form" onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                            {/* Main Content */}
                            <div className="space-y-6 lg:col-span-2">
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Post Content</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div>
                                            <Label htmlFor="title">Title</Label>
                                            <Input
                                                id="title"
                                                value={data.title}
                                                onChange={(e) => setData('title', e.target.value)}
                                                className={errors.title ? 'border-red-500' : ''}
                                                placeholder="Enter post title..."
                                            />
                                            {errors.title && <p className="mt-1 text-sm text-red-500">{errors.title}</p>}
                                        </div>

                                        <div>
                                            <Label htmlFor="excerpt">Excerpt</Label>
                                            <Textarea
                                                id="excerpt"
                                                value={data.excerpt}
                                                onChange={(e) => setData('excerpt', e.target.value)}
                                                className={errors.excerpt ? 'border-red-500' : ''}
                                                placeholder="Brief description of the post..."
                                                rows={3}
                                            />
                                            {errors.excerpt && <p className="mt-1 text-sm text-red-500">{errors.excerpt}</p>}
                                        </div>

                                        <div>
                                            <RichTextEditor
                                                label="Content"
                                                value={data.content}
                                                onChange={(value) => setData('content', value)}
                                                error={errors.content}
                                                placeholder="Write your post content here..."
                                                height={500}
                                            />
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* SEO Fields */}
                                <Card>
                                    <CardHeader>
                                        <div className="flex items-center justify-between">
                                            <CardTitle>SEO Settings</CardTitle>
                                            <Button type="button" variant="ghost" size="sm" onClick={() => setShowSeoFields(!showSeoFields)}>
                                                {showSeoFields ? 'Hide' : 'Show'} SEO Fields
                                            </Button>
                                        </div>
                                    </CardHeader>
                                    {showSeoFields && (
                                        <CardContent className="space-y-4">
                                            <div>
                                                <Label htmlFor="meta_title">Meta Title</Label>
                                                <Input
                                                    id="meta_title"
                                                    value={data.meta_title}
                                                    onChange={(e) => setData('meta_title', e.target.value)}
                                                    placeholder="SEO title (leave empty to use post title)"
                                                />
                                            </div>

                                            <div>
                                                <Label htmlFor="meta_description">Meta Description</Label>
                                                <Textarea
                                                    id="meta_description"
                                                    value={data.meta_description}
                                                    onChange={(e) => setData('meta_description', e.target.value)}
                                                    placeholder="SEO description (leave empty to use excerpt)"
                                                    rows={3}
                                                />
                                            </div>

                                            <div>
                                                <Label htmlFor="meta_keywords">Meta Keywords</Label>
                                                <Input
                                                    id="meta_keywords"
                                                    value={data.meta_keywords}
                                                    onChange={(e) => setData('meta_keywords', e.target.value)}
                                                    placeholder="keyword1, keyword2, keyword3"
                                                />
                                            </div>
                                        </CardContent>
                                    )}
                                </Card>
                            </div>

                            {/* Sidebar */}
                            <div className="space-y-6">
                                {/* Publish Settings */}
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Publish Settings</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div>
                                            <Label htmlFor="status">Status</Label>
                                            <Select value={data.status} onValueChange={(value) => setData('status', value)}>
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="draft">Draft</SelectItem>
                                                    <SelectItem value="published">Published</SelectItem>
                                                    <SelectItem value="archived">Archived</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        {data.status === 'published' && (
                                            <div>
                                                <Label htmlFor="published_at">Publish Date</Label>
                                                <Input
                                                    id="published_at"
                                                    type="date"
                                                    value={data.published_at}
                                                    onChange={(e) => setData('published_at', e.target.value)}
                                                />
                                            </div>
                                        )}

                                        <div>
                                            <Label htmlFor="featured_image">Featured Image URL</Label>
                                            <Input
                                                id="featured_image"
                                                value={data.featured_image}
                                                onChange={(e) => setData('featured_image', e.target.value)}
                                                placeholder="https://example.com/image.jpg"
                                            />
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Categories */}
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Categories</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="max-h-48 space-y-2 overflow-y-auto">
                                            {categories.map((category) => (
                                                <div key={category.id} className="flex items-center space-x-2">
                                                    <Checkbox
                                                        id={`category-${category.id}`}
                                                        checked={data.categories.includes(category.id)}
                                                        onCheckedChange={(checked) => handleCategoryChange(category.id, checked as boolean)}
                                                    />
                                                    <Label htmlFor={`category-${category.id}`} className="text-sm">
                                                        {category.name}
                                                    </Label>
                                                </div>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Tags */}
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Tags</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="max-h-48 space-y-2 overflow-y-auto">
                                            {tags.map((tag) => (
                                                <div key={tag.id} className="flex items-center space-x-2">
                                                    <Checkbox
                                                        id={`tag-${tag.id}`}
                                                        checked={data.tags.includes(tag.id)}
                                                        onCheckedChange={(checked) => handleTagChange(tag.id, checked as boolean)}
                                                    />
                                                    <Label htmlFor={`tag-${tag.id}`} className="text-sm">
                                                        {tag.name}
                                                    </Label>
                                                </div>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Selected Categories & Tags Preview */}
                                {(data.categories.length > 0 || data.tags.length > 0) && (
                                    <Card>
                                        <CardHeader>
                                            <CardTitle>Selected</CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-3">
                                            {data.categories.length > 0 && (
                                                <div>
                                                    <Label className="text-xs tracking-wide text-gray-500 uppercase">Categories</Label>
                                                    <div className="mt-1 flex flex-wrap gap-1">
                                                        {data.categories.map((categoryId) => {
                                                            const category = categories.find((c) => c.id === categoryId);
                                                            return (
                                                                <Badge key={categoryId} variant="secondary" className="text-xs">
                                                                    {category?.name}
                                                                </Badge>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            )}

                                            {data.tags.length > 0 && (
                                                <div>
                                                    <Label className="text-xs tracking-wide text-gray-500 uppercase">Tags</Label>
                                                    <div className="mt-1 flex flex-wrap gap-1">
                                                        {data.tags.map((tagId) => {
                                                            const tag = tags.find((t) => t.id === tagId);
                                                            return (
                                                                <Badge key={tagId} variant="outline" className="text-xs">
                                                                    {tag?.name}
                                                                </Badge>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>
                                )}
                            </div>
                        </div>
                    </form>
                </div>
            </div>{' '}
        </AdminAppLayout>
    );
}
