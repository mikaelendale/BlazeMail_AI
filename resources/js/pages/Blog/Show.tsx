"use client"

import MarkdownRenderer from "@/components/MarkdownRenderer"
import NewsletterSignup from "@/components/NewsletterSignup"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { Head, Link, useForm } from "@inertiajs/react"
import {
    ArrowLeft,
    Calendar,
    Copy,
    Eye,
    Facebook,
    Folder,
    Linkedin,
    MessageCircle,
    Share2,
    Tag,
    Twitter,
} from "lucide-react"
import type React from "react"
import LandingLayout from "../landing/landing-layout"

interface Post {
    id: string
    title: string
    slug: string
    content: string
    excerpt: string
    featured_image?: string
    published_at: string
    views: number
    meta_title?: string
    meta_description?: string
    meta_keywords?: string
    author: {
        id: string
        name: string
        email: string
        avatar?: string
        bio?: string
    }
    categories: Array<{ id: string; name: string; slug: string }>
    tags: Array<{ id: string; name: string; slug: string }>
    approved_comments: Array<{
        id: string
        content: string
        created_at: string
        user: {
            name: string
            email: string
            avatar?: string
        }
        replies?: Array<{
            id: string
            content: string
            created_at: string
            user: {
                name: string
                email: string
                avatar?: string
            }
        }>
    }>
}

interface Props {
    post: Post
    relatedPosts: Array<{
        id: string
        title: string
        slug: string
        excerpt: string
        featured_image?: string
        published_at: string
        author: {
            name: string
        }
    }>
    auth?: {
        user?: {
            id: string
            name: string
            email: string
        }
    }
}

export default function BlogShow({ post, relatedPosts, auth }: Props) {
    const {
        data,
        setData,
        post: submitComment,
        processing,
        errors,
        reset,
    } = useForm({
        name: "",
        email: "",
        content: "",
    })

    const handleCommentSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        submitComment(`/blog/${post.slug}/comments`, {
            onSuccess: () => {
                reset()
            },
        })
    }

    const shareUrl = typeof window !== "undefined" ? window.location.href : ""
    const shareTitle = post.title

    const handleShare = (platform: string) => {
        const urls = {
            facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`,
            twitter: `https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareTitle)}`,
            linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`,
        }
        if (platform === "copy") {
            navigator.clipboard.writeText(shareUrl)
            alert("Link copied to clipboard!")
            return
        }
        window.open(urls[platform as keyof typeof urls], "_blank", "width=600,height=400")
    }

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
        })
    }

    const getInitials = (name: string) => {
        return name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase()
    }

    return (
        <LandingLayout>
            <Head>
                <title>{post.meta_title || post.title}</title>
                <meta name="description" content={post.meta_description || post.excerpt} />
                {post.meta_keywords && <meta name="keywords" content={post.meta_keywords} />}
                <meta property="og:title" content={post.title} />
                <meta property="og:description" content={post.excerpt} />
                <meta property="og:type" content="article" />
                <meta property="og:url" content={shareUrl} />
                {post.featured_image && <meta property="og:image" content={post.featured_image} />}
                <meta name="twitter:card" content="summary_large_image" />
                <meta name="twitter:title" content={post.title} />
                <meta name="twitter:description" content={post.excerpt} />
                {post.featured_image && <meta name="twitter:image" content={post.featured_image} />}
            </Head>
            <div className="pt-20 sm:pt-20 min-h-screen bg-background">
                {/* Header */}
                <header className="">
                    <div className="container mx-auto max-w-3xl px-4 py-4  ">
                        <Link href="/blog">
                            <Button variant="outline" size="sm" className=" mb-4 text-muted-foreground hover:text-foreground">
                                <ArrowLeft className="mr-2 h-4 w-4" /> Back
                            </Button>
                        </Link>
                    </div>
                </header>
                <main className="container mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
                    <article className="border-b-orange-500 border-b-4 overflow-hidden rounded-lg bg-primary-foreground">
                        {/* Featured Image */}
                        {post.featured_image && (
                            <div className="aspect-video w-full overflow-hidden bg-muted">
                                <img
                                    src={post.featured_image || "/placeholder.svg?height=400&width=800"}
                                    alt={post.title}
                                    className="h-full w-full object-cover"
                                />
                            </div>
                        )}
                        <div className="p-6 sm:p-8 lg:p-12">
                            {/* Post Header */}
                            <header className="mb-8">
                                <div className="mb-4 flex flex-wrap items-center gap-2">
                                    {post.categories.map((category) => (
                                        <Link key={category.id} href={`/blog/category/${category.slug}`}>
                                            <Badge
                                                variant="secondary"
                                                className="bg-primary/10 text-primary transition-colors hover:bg-primary hover:text-primary-foreground"
                                            >
                                                <Folder className="mr-1 h-3 w-3" />
                                                {category.name}
                                            </Badge>
                                        </Link>
                                    ))}
                                </div>
                                <h1 className="mb-6 text-3xl font-bold leading-tight text-foreground sm:text-4xl lg:text-4xl">
                                    {post.title}
                                </h1>
                                <div className="mb-6    flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                                    <div className="pl-2 flex items-center gap-4">
                                        <Avatar className="h-12 w-12">
                                            <AvatarImage
                                                src={post.author.avatar || "/placeholder.svg?height=48&width=48"}
                                                alt={post.author.name}
                                            />
                                            <AvatarFallback>{getInitials(post.author.name)}</AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <p className="font-medium text-foreground">{post.author.name}</p>
                                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                                <div className="flex items-center gap-1">
                                                    <Calendar className="h-4 w-4" />
                                                    {formatDate(post.published_at)}
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <Eye className="h-4 w-4" />
                                                    {post.views} views
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <MessageCircle className="h-4 w-4" />
                                                    {post.approved_comments.length} comments
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    {/* Share Popover */}
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button variant="outline" size="sm" className="pr-2 ">
                                                <Share2 className="mr-2 h-4 w-4 " />
                                                Share
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-48 p-2">
                                            <div className="space-y-1">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="w-full justify-start text-muted-foreground hover:text-foreground"
                                                    onClick={() => handleShare("facebook")}
                                                >
                                                    <Facebook className="mr-2 h-4 w-4" />
                                                    Facebook
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="w-full justify-start text-muted-foreground hover:text-foreground"
                                                    onClick={() => handleShare("twitter")}
                                                >
                                                    <Twitter className="mr-2 h-4 w-4" />
                                                    Twitter
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="w-full justify-start text-muted-foreground hover:text-foreground"
                                                    onClick={() => handleShare("linkedin")}
                                                >
                                                    <Linkedin className="mr-2 h-4 w-4" />
                                                    LinkedIn
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="w-full justify-start text-muted-foreground hover:text-foreground"
                                                    onClick={() => handleShare("copy")}
                                                >
                                                    <Copy className="mr-2 h-4 w-4" />
                                                    Copy Link
                                                </Button>
                                            </div>
                                        </PopoverContent>
                                    </Popover>
                                </div>
                                {/* Tags */}
                                {post.tags.length > 0 && (
                                    <div className="flex flex-wrap gap-2">
                                        {post.tags.map((tag) => (
                                            <Link key={tag.id} href={`/blog/tag/${tag.slug}`}>
                                                <Badge
                                                    variant="outline"
                                                    className="bg-accent/10 text-accent-foreground transition-colors hover:bg-accent"
                                                >
                                                    <Tag className="mr-1 h-3 w-3" />
                                                    {tag.name}
                                                </Badge>
                                            </Link>
                                        ))}
                                    </div>
                                )}
                            </header>
                            {/* Post Content */}
                            <div className="prose prose-lg max-w-none text-primary dark:prose-invert mb-12">
                                <MarkdownRenderer content={post.content} />
                            </div>
                            <Separator className="my-12" />
                            {/* Comments Section */}
                            <section className="mb-12">
                                <h2 className="mb-6 text-2xl font-bold text-foreground">Comments ({post.approved_comments.length})</h2>
                                {/* Comment Form */}
                                {auth?.user ? (
                                    <div className="mb-8">
                                        <form onSubmit={handleCommentSubmit} className="space-y-4">
                                            <div>
                                                <Textarea
                                                    placeholder="Your comment..."
                                                    rows={4}
                                                    value={data.content}
                                                    onChange={(e) => setData("content", e.target.value)}
                                                    className={errors.content ? "border-destructive" : ""}
                                                />
                                                {errors.content && <p className="mt-1 text-sm text-destructive">{errors.content}</p>}
                                            </div>
                                            <Button type="submit" disabled={processing} size="sm">
                                                {processing ? "Posting..." : "Post Comment"}
                                            </Button>
                                        </form>
                                    </div>
                                ) : (
                                    <div className="mb-8 text-center">
                                        <p className="mb-4 text-muted-foreground">Please log in to leave a comment.</p>
                                        <Link href="/login">
                                            <Button size="sm">Log In</Button>
                                        </Link>
                                    </div>
                                )}
                                {/* Comments List */}
                                {post.approved_comments.length > 0 && (
                                    <div className="space-y-6">
                                        {post.approved_comments.map((comment) => (
                                            <div key={comment.id} className="py-4">
                                                <div className="flex items-start gap-4">
                                                    <Avatar className="h-10 w-10">
                                                        <AvatarImage src={comment.user.avatar || "/placeholder.svg?height=40&width=40"} />
                                                        <AvatarFallback>{getInitials(comment.user.name)}</AvatarFallback>
                                                    </Avatar>
                                                    <div className="flex-1">
                                                        <div className="mb-2 flex items-center gap-2">
                                                            <h4 className="font-medium text-foreground">{comment.user.name}</h4>
                                                            <span className="text-sm text-muted-foreground">{formatDate(comment.created_at)}</span>
                                                        </div>
                                                        <p className="text-foreground">{comment.content}</p>
                                                        {/* Replies */}
                                                        {comment.replies && comment.replies.length > 0 && (
                                                            <div className="mt-4 ml-6 space-y-4 border-l border-border pl-4">
                                                                {comment.replies.map((reply) => (
                                                                    <div key={reply.id} className="flex items-start gap-3">
                                                                        <Avatar className="h-8 w-8">
                                                                            <AvatarImage src={reply.user.avatar || "/placeholder.svg?height=32&width=32"} />
                                                                            <AvatarFallback className="text-xs">
                                                                                {getInitials(reply.user.name)}
                                                                            </AvatarFallback>
                                                                        </Avatar>
                                                                        <div className="flex-1">
                                                                            <div className="mb-1 flex items-center gap-2">
                                                                                <h5 className="text-sm font-medium text-foreground">{reply.user.name}</h5>
                                                                                <span className="text-xs text-muted-foreground">
                                                                                    {formatDate(reply.created_at)}
                                                                                </span>
                                                                            </div>
                                                                            <p className="text-sm text-foreground">{reply.content}</p>
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </section>
                        </div>
                    </article>
                    {/* Related Posts */}
                    {relatedPosts.length > 0 && (
                        <section className="mt-12">
                            <h2 className="mb-6 text-2xl font-bold text-foreground">Related Posts</h2>
                            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                                {relatedPosts.map((relatedPost) => (
                                    <Card
                                        key={relatedPost.id}
                                        className="group overflow-hidden transition-all duration-200 hover:border-primary/20"
                                    >
                                        <Link href={`/blog/${relatedPost.slug}`}>
                                            {relatedPost.featured_image && (
                                                <div className="aspect-video overflow-hidden bg-muted">
                                                    <img
                                                        src={relatedPost.featured_image || "/placeholder.svg?height=200&width=400"}
                                                        alt={relatedPost.title}
                                                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                                                    />
                                                </div>
                                            )}
                                            <CardContent className="p-4">
                                                <h3 className="mb-2 line-clamp-2 font-semibold text-foreground transition-colors group-hover:text-primary">
                                                    {relatedPost.title}
                                                </h3>
                                                <p className="mb-3 line-clamp-3 text-sm text-muted-foreground">{relatedPost.excerpt}</p>
                                                <div className="flex items-center justify-between text-xs text-muted-foreground">
                                                    <span>{relatedPost.author.name}</span>
                                                    <span>{formatDate(relatedPost.published_at)}</span>
                                                </div>
                                            </CardContent>
                                        </Link>
                                    </Card>
                                ))}
                            </div>
                        </section>
                    )}
                    {/* Newsletter Signup */}
                    <div className="mt-12">
                        <NewsletterSignup />
                    </div>
                </main>
            </div>
        </LandingLayout>
    )
}
