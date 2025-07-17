'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AdminAppLayout from '@/layouts/admin-app-layout';
import { Head, router, useForm } from '@inertiajs/react';
import { Edit, Hash, Plus, Trash2 } from 'lucide-react';
import type React from 'react';
import { useState } from 'react'; 

interface Tag {
    id: string;
    name: string;
    slug: string;
    posts_count: number;
}

interface Props {
    auth: any;
    tags: Tag[];
}

export default function TagsIndex({ auth, tags }: Props) {
    const [editingTag, setEditingTag] = useState<Tag | null>(null);
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);

    const createForm = useForm({
        name: '',
    });

    const editForm = useForm({
        name: '',
    });

    const handleCreate = (e: React.FormEvent) => {
        e.preventDefault();
        createForm.post(route('admin.tags.store'), {
            onSuccess: () => {
                createForm.reset();
                setIsCreateOpen(false);
            },
        });
    };

    const handleEdit = (tag: Tag) => {
        setEditingTag(tag);
        editForm.setData({
            name: tag.name,
        });
        setIsEditOpen(true);
    };

    const handleUpdate = (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingTag) return;

        editForm.put(route('admin.tags.update', editingTag.id), {
            onSuccess: () => {
                editForm.reset();
                setIsEditOpen(false);
                setEditingTag(null);
            },
        });
    };

    const handleDelete = (tag: Tag) => {
        if (tag.posts_count > 0) {
            alert('Cannot delete tag with existing posts.');
            return;
        }

        if (confirm(`Are you sure you want to delete "${tag.name}"?`)) {
            router.delete(route('admin.tags.destroy', tag.id));
        }
    };

    return (
        <AdminAppLayout>
            <Head title="Manage Tags" />
            <div className="py-12">
                <div className="mx-auto max-w-4xl sm:px-6 lg:px-8">
                    <div className="mb-8">
                        <div className="flex items-center justify-between">
                            <div>
                                <h1 className="text-3xl font-bold text-gray-900">Tags</h1>
                                <p className="mt-2 text-gray-600">Manage tags for your blog posts</p>
                            </div>
                            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                                <DialogTrigger asChild>
                                    <Button>
                                        <Plus className="mr-2 h-4 w-4" />
                                        New Tag
                                    </Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>Create New Tag</DialogTitle>
                                    </DialogHeader>
                                    <form onSubmit={handleCreate} className="space-y-4">
                                        <div>
                                            <Label htmlFor="create-name">Name *</Label>
                                            <Input
                                                id="create-name"
                                                value={createForm.data.name}
                                                onChange={(e) => createForm.setData('name', e.target.value)}
                                                className={createForm.errors.name ? 'border-red-500' : ''}
                                                placeholder="Tag name"
                                                required
                                            />
                                            {createForm.errors.name && <p className="mt-1 text-sm text-red-500">{createForm.errors.name}</p>}
                                        </div>
                                        <div className="flex justify-end space-x-2">
                                            <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                                                Cancel
                                            </Button>
                                            <Button type="submit" disabled={createForm.processing}>
                                                {createForm.processing ? 'Creating...' : 'Create'}
                                            </Button>
                                        </div>
                                    </form>
                                </DialogContent>
                            </Dialog>
                        </div>
                    </div>

                    <Card>
                        <CardHeader>
                            <CardTitle>All Tags ({tags.length})</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {tags.length > 0 ? (
                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                                    {tags.map((tag) => (
                                        <div key={tag.id} className="rounded-lg border p-4 transition-shadow hover:shadow-sm">
                                            <div className="mb-3 flex items-center justify-between">
                                                <div className="flex items-center space-x-2">
                                                    <Hash className="h-4 w-4 text-gray-400" />
                                                    <span className="font-medium">{tag.name}</span>
                                                </div>
                                                <div className="flex items-center space-x-1">
                                                    <Button variant="ghost" size="sm" onClick={() => handleEdit(tag)}>
                                                        <Edit className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleDelete(tag)}
                                                        className="text-red-600 hover:text-red-700"
                                                        disabled={tag.posts_count > 0}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <Badge variant="secondary">{tag.posts_count} posts</Badge>
                                                <span className="text-xs text-gray-500">/{tag.slug}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="py-12 text-center">
                                    <Hash className="mx-auto mb-4 h-12 w-12 text-gray-300" />
                                    <h3 className="mb-2 text-lg font-medium text-gray-900">No tags yet</h3>
                                    <p className="mb-4 text-gray-600">Create your first tag to organize your posts.</p>
                                    <Button onClick={() => setIsCreateOpen(true)}>
                                        <Plus className="mr-2 h-4 w-4" />
                                        Create Tag
                                    </Button>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Edit Dialog */}
                    <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Edit Tag</DialogTitle>
                            </DialogHeader>
                            <form onSubmit={handleUpdate} className="space-y-4">
                                <div>
                                    <Label htmlFor="edit-name">Name *</Label>
                                    <Input
                                        id="edit-name"
                                        value={editForm.data.name}
                                        onChange={(e) => editForm.setData('name', e.target.value)}
                                        className={editForm.errors.name ? 'border-red-500' : ''}
                                        placeholder="Tag name"
                                        required
                                    />
                                    {editForm.errors.name && <p className="mt-1 text-sm text-red-500">{editForm.errors.name}</p>}
                                </div>
                                <div className="flex justify-end space-x-2">
                                    <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)}>
                                        Cancel
                                    </Button>
                                    <Button type="submit" disabled={editForm.processing}>
                                        {editForm.processing ? 'Updating...' : 'Update'}
                                    </Button>
                                </div>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>{' '}
        </AdminAppLayout>
    );
}
