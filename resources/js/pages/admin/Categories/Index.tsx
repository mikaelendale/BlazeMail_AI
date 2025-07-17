'use client';

import type React from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Head, router, useForm } from '@inertiajs/react';
import { Edit, Plus, Tag, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { route } from 'ziggy-js';

interface Category {
    id: string;
    name: string;
    slug: string;
    description?: string;
    posts_count: number;
}

interface Props {
    auth: any;
    categories: Category[];
}

export default function CategoriesIndex({ auth, categories }: Props) {
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);

    const createForm = useForm({
        name: '',
        description: '',
    });

    const editForm = useForm({
        name: '',
        description: '',
    });

    const handleCreate = (e: React.FormEvent) => {
        e.preventDefault();
        createForm.post(route('admin.categories.store'), {
            onSuccess: () => {
                createForm.reset();
                setIsCreateOpen(false);
            },
        });
    };

    const handleEdit = (category: Category) => {
        setEditingCategory(category);
        editForm.setData({
            name: category.name,
            description: category.description || '',
        });
        setIsEditOpen(true);
    };

    const handleUpdate = (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingCategory) return;

        editForm.put(route('admin.categories.update', editingCategory.id), {
            onSuccess: () => {
                editForm.reset();
                setIsEditOpen(false);
                setEditingCategory(null);
            },
        });
    };

    const handleDelete = (category: Category) => {
        if (category.posts_count > 0) {
            alert('Cannot delete category with existing posts.');
            return;
        }

        if (confirm(`Are you sure you want to delete "${category.name}"?`)) {
            router.delete(route('admin.categories.destroy', category.id));
        }
    };

    return (
        <>
            <Head title="Manage Categories" />
            <div className="py-12">
                <div className="mx-auto max-w-4xl sm:px-6 lg:px-8">
                    <div className="mb-8">
                        <div className="flex items-center justify-between">
                            <div>
                                <h1 className="text-3xl font-bold text-gray-900">Categories</h1>
                                <p className="mt-2 text-gray-600">Organize your blog posts into categories</p>
                            </div>
                            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                                <DialogTrigger asChild>
                                    <Button>
                                        <Plus className="mr-2 h-4 w-4" />
                                        New Category
                                    </Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>Create New Category</DialogTitle>
                                    </DialogHeader>
                                    <form onSubmit={handleCreate} className="space-y-4">
                                        <div>
                                            <Label htmlFor="create-name">Name *</Label>
                                            <Input
                                                id="create-name"
                                                value={createForm.data.name}
                                                onChange={(e) => createForm.setData('name', e.target.value)}
                                                className={createForm.errors.name ? 'border-red-500' : ''}
                                                placeholder="Category name"
                                                required
                                            />
                                            {createForm.errors.name && <p className="mt-1 text-sm text-red-500">{createForm.errors.name}</p>}
                                        </div>
                                        <div>
                                            <Label htmlFor="create-description">Description</Label>
                                            <Textarea
                                                id="create-description"
                                                value={createForm.data.description}
                                                onChange={(e) => createForm.setData('description', e.target.value)}
                                                placeholder="Optional description"
                                                rows={3}
                                            />
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
                            <CardTitle>All Categories ({categories.length})</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {categories.length > 0 ? (
                                <div className="space-y-4">
                                    {categories.map((category) => (
                                        <div key={category.id} className="flex items-center justify-between rounded-lg border p-4">
                                            <div className="flex-1">
                                                <div className="flex items-center space-x-3">
                                                    <Tag className="h-5 w-5 text-gray-400" />
                                                    <div>
                                                        <h3 className="font-semibold">{category.name}</h3>
                                                        {category.description && <p className="mt-1 text-sm text-gray-600">{category.description}</p>}
                                                        <div className="mt-2 flex items-center space-x-2">
                                                            <Badge variant="secondary">{category.posts_count} posts</Badge>
                                                            <span className="text-xs text-gray-500">/{category.slug}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <Button variant="outline" size="sm" onClick={() => handleEdit(category)}>
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => handleDelete(category)}
                                                    className="text-red-600 hover:text-red-700"
                                                    disabled={category.posts_count > 0}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="py-12 text-center">
                                    <Tag className="mx-auto mb-4 h-12 w-12 text-gray-300" />
                                    <h3 className="mb-2 text-lg font-medium text-gray-900">No categories yet</h3>
                                    <p className="mb-4 text-gray-600">Create your first category to organize your posts.</p>
                                    <Button onClick={() => setIsCreateOpen(true)}>
                                        <Plus className="mr-2 h-4 w-4" />
                                        Create Category
                                    </Button>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Edit Dialog */}
                    <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Edit Category</DialogTitle>
                            </DialogHeader>
                            <form onSubmit={handleUpdate} className="space-y-4">
                                <div>
                                    <Label htmlFor="edit-name">Name *</Label>
                                    <Input
                                        id="edit-name"
                                        value={editForm.data.name}
                                        onChange={(e) => editForm.setData('name', e.target.value)}
                                        className={editForm.errors.name ? 'border-red-500' : ''}
                                        placeholder="Category name"
                                        required
                                    />
                                    {editForm.errors.name && <p className="mt-1 text-sm text-red-500">{editForm.errors.name}</p>}
                                </div>
                                <div>
                                    <Label htmlFor="edit-description">Description</Label>
                                    <Textarea
                                        id="edit-description"
                                        value={editForm.data.description}
                                        onChange={(e) => editForm.setData('description', e.target.value)}
                                        placeholder="Optional description"
                                        rows={3}
                                    />
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
        </>
    );
}
