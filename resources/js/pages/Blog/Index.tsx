"use client"

import NewsletterSignup from "@/components/NewsletterSignup"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { Head, Link, router } from "@inertiajs/react"
import { Calendar, Eye, MessageCircle, Search, User, X } from "lucide-react"
import React from "react"
import LandingLayout from "../landing/landing-layout"

interface Post {
    id: string
    title: string
    slug: string
    excerpt: string
    featured_image?: string
    published_at: string
    views: number
    author: {
        name: string
        avatar?: string
    }
    categories: Array<{
        id: string
        name: string
        slug: string
    }>
    tags: Array<{
        id: string
        name: string
        slug: string
    }>
    approved_comments_count?: number
}

interface Category {
    id: string
    name: string
    slug: string
    posts_count: number
}

interface Tag {
    id: string
    name: string
    slug: string
    posts_count: number
}

interface Props {
    auth: any
    posts: {
        data: Post[]
        links: any[]
        meta: any
    }
    categories: Category[]
    tags: Tag[]
    recentPosts: Post[]
    filters: {
        category?: string
        tag?: string
        search?: string
    }
}

export default function BlogIndex({ auth, posts, categories, tags, recentPosts, filters }: Props) {
    const [searchTerm, setSearchTerm] = React.useState(filters.search || "")

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault()
        router.get(route("blog.index"), { search: searchTerm }, { preserveState: true })
    }

    const clearFilters = () => {
        router.get(route("blog.index"))
    }

    return (
        <LandingLayout>
            <Head title="Blog" />
            <div className="min-h-screen bg-background">
                {/* Hero Section */}
                <section className="pt-20">
                    <div className="container mx-auto px-4 py-16 sm:px-6 lg:px-8">
                        <div className="mx-auto max-w-3xl text-center">
                            <h1 className="mb-4 text-4xl font-bold tracking-tight text-foreground sm:text-5xl">Our Blog</h1>
                            <p className="mb-8 text-xl text-muted-foreground">
                                Discover insights, tutorials, and stories from our team
                            </p>

                            {/* Search Bar */}
                            <form onSubmit={handleSearch} className="mx-auto max-w-md">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                    <Input
                                        type="text"
                                        placeholder="Search posts..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="pl-10 pr-20"
                                    />
                                    <Button type="submit" size="sm" className="absolute right-1 top-1/2 -translate-y-1/2">
                                        Search
                                    </Button>
                                </div>
                            </form>
                        </div>
                    </div>
                </section>

                <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
                        {/* Main Content */}
                        <main className="lg:col-span-3">
                            {/* Active Filters */}
                            {(filters.category || filters.tag || filters.search) && (
                                <Card className="mb-6 border-primary/20 bg-primary/5">
                                    <CardContent className="p-4">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center space-x-2">
                                                <span className="text-sm font-medium text-foreground">Active filters:</span>
                                                <div className="flex flex-wrap gap-2">
                                                    {filters.category && (
                                                        <Link key={filters.category} href={route("blog.category", filters.category)}>
                                                            <Badge variant="secondary" className="bg-primary/10 text-primary">
                                                                Category: {filters.category}
                                                            </Badge>
                                                        </Link>
                                                    )}
                                                    {filters.tag && (
                                                        <Link key={filters.tag} href={route("blog.tag", filters.tag)}>
                                                            <Badge variant="secondary" className="bg-primary/10 text-primary">
                                                                Tag: {filters.tag}
                                                            </Badge>
                                                        </Link>
                                                    )}
                                                    {filters.search && (
                                                        <Badge variant="secondary" className="bg-primary/10 text-primary">
                                                            Search: {filters.search}
                                                        </Badge>
                                                    )}
                                                </div>
                                            </div>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={clearFilters}
                                                className="hover:bg-destructive hover:text-destructive-foreground bg-transparent"
                                            >
                                                <X className="mr-1 h-3 w-3" />
                                                Clear all
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            )}

                            {/* Posts Grid */}
                            {posts.data.length > 0 ? (
                                <>
                                    <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2">
                                        {posts.data.map((post) => (
                                            <Card
                                                key={post.id}
                                                className="group overflow-hidden transition-all duration-200 hover:shadow-lg hover:shadow-primary/5 hover:border-primary/20"
                                            >
                                                {post.featured_image && (
                                                    <div className="aspect-video overflow-hidden bg-muted">
                                                        <img
                                                            src={post.featured_image || "/placeholder.svg?height=200&width=400"}
                                                            alt={post.title}
                                                            className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
                                                        />
                                                    </div>
                                                )}
                                                <CardHeader className="pb-3">
                                                    <div className="mb-3 flex flex-wrap gap-2">
                                                        {post.categories.map((category) => (
                                                            <Link key={category.id} href={route("blog.category", category.slug)}>
                                                                <Badge
                                                                    variant="outline"
                                                                    className="hover:bg-primary hover:text-primary-foreground transition-colors"
                                                                >
                                                                    {category.name}
                                                                </Badge>
                                                            </Link>
                                                        ))}
                                                    </div>
                                                    <CardTitle className="line-clamp-2 text-lg">
                                                        <Link href={route("blog.show", post.slug)} className="transition-colors hover:text-primary">
                                                            {post.title}
                                                        </Link>
                                                    </CardTitle>
                                                </CardHeader>
                                                <CardContent className="pt-0">
                                                    <p className="mb-4 line-clamp-3 text-muted-foreground">{post.excerpt}</p>

                                                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                                                        <div className="flex items-center space-x-4">
                                                            <div className="flex items-center space-x-1">
                                                                <User className="h-4 w-4" />
                                                                <Link
                                                                    href={route("blog.author", post.author.name)}
                                                                    className="hover:text-primary transition-colors"
                                                                >
                                                                    {post.author.name}
                                                                </Link>
                                                            </div>
                                                            <div className="flex items-center space-x-1">
                                                                <Calendar className="h-4 w-4" />
                                                                <span>{new Date(post.published_at).toLocaleDateString()}</span>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center space-x-3">
                                                            <div className="flex items-center space-x-1">
                                                                <Eye className="h-4 w-4" />
                                                                <span>{post.views}</span>
                                                            </div>
                                                            {post.approved_comments_count !== undefined && (
                                                                <div className="flex items-center space-x-1">
                                                                    <MessageCircle className="h-4 w-4" />
                                                                    <span>{post.approved_comments_count}</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {post.tags.length > 0 && (
                                                        <div className="mt-4 flex flex-wrap gap-1">
                                                            {post.tags.map((tag) => (
                                                                <Link key={tag.id} href={route("blog.tag", tag.slug)}>
                                                                    <Badge
                                                                        variant="secondary"
                                                                        className="text-xs hover:bg-accent hover:text-accent-foreground transition-colors"
                                                                    >
                                                                        #{tag.name}
                                                                    </Badge>
                                                                </Link>
                                                            ))}
                                                        </div>
                                                    )}
                                                </CardContent>
                                            </Card>
                                        ))}
                                    </div>

                                    {/* Pagination */}
                                    {posts.links && (
                                        <div className="flex justify-center space-x-1">
                                            {posts.links.map((link, index) => (
                                                <Button
                                                    key={index}
                                                    variant={link.active ? "default" : "outline"}
                                                    size="sm"
                                                    disabled={!link.url}
                                                    onClick={() => link.url && router.get(link.url)}
                                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                                    className={link.active ? "bg-primary text-primary-foreground" : ""}
                                                />
                                            ))}
                                        </div>
                                    )}
                                </>
                            ) : (
                                <Card className="py-12">
                                    <CardContent className="text-center">
                                        <h3 className="mb-2 text-lg font-medium text-foreground">No posts found</h3>
                                        <p className="text-muted-foreground">Try adjusting your search or filters.</p>
                                    </CardContent>
                                </Card>
                            )}
                        </main>

                        {/* Sidebar */}
                        <aside className="space-y-6">
                            {/* Recent Posts */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-foreground">Recent Posts</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    {recentPosts.map((post, index) => (
                                        <div key={post.id}>
                                            <Link
                                                href={route("blog.show", post.slug)}
                                                className="line-clamp-2 text-sm font-medium transition-colors hover:text-primary"
                                            >
                                                {post.title}
                                            </Link>
                                            <div className="mt-1 flex items-center text-xs text-muted-foreground">
                                                <span>{post.author.name}</span>
                                                <span className="mx-1">•</span>
                                                <span>{new Date(post.published_at).toLocaleDateString()}</span>
                                            </div>
                                            {index < recentPosts.length - 1 && <Separator className="mt-4" />}
                                        </div>
                                    ))}
                                </CardContent>
                            </Card>

                            {/* Categories */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-foreground">Categories</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-3">
                                        {categories.map((category) => (
                                            <Link
                                                key={category.id}
                                                href={route("blog.category", category.slug)}
                                                className="flex items-center justify-between text-sm transition-colors hover:text-primary group"
                                            >
                                                <span className="group-hover:text-primary">{category.name}</span>
                                                <Badge variant="secondary" className="text-xs bg-muted">
                                                    {category.posts_count}
                                                </Badge>
                                            </Link>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Popular Tags */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-foreground">Popular Tags</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex flex-wrap gap-2">
                                        {tags.slice(0, 15).map((tag) => (
                                            <Link key={tag.id} href={route("blog.tag", tag.slug)}>
                                                <Badge
                                                    variant="outline"
                                                    className="hover:bg-primary hover:text-primary-foreground transition-colors"
                                                >
                                                    #{tag.name} ({tag.posts_count})
                                                </Badge>
                                            </Link>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Newsletter Signup */}
                            <NewsletterSignup />
                        </aside>
                    </div>
                </div>
            </div>
        </LandingLayout>
    )
}
