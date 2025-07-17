"use client"

import React from "react"
import { Head, Link, useForm } from "@inertiajs/react" 
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Calendar, Eye, MessageCircle, ArrowLeft, Share2 } from "lucide-react"
import AdminAppLayout from "@/layouts/admin-app-layout"

interface Post {
  id: string
  title: string
  slug: string
  content: string
  excerpt: string
  featured_image?: string
  published_at: string
  views: number
  author: {
    id: number
    name: string
    avatar?: string
    bio?: string
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
  approved_comments: Array<{
    id: string
    content: string
    created_at: string
    user: {
      name: string
      avatar?: string
    }
    replies: Array<{
      id: string
      content: string
      created_at: string
      user: {
        name: string
        avatar?: string
      }
    }>
  }>
}

interface Props {
  auth: any
  post: Post
  relatedPosts: Post[]
}

const formatMarkdown = (markdown: string): string => {
  if (!markdown) return ""

  return (
    markdown
      // Headers
      .replace(/^### (.*$)/gim, '<h3 class="text-xl font-semibold mt-6 mb-4">$1</h3>')
      .replace(/^## (.*$)/gim, '<h2 class="text-2xl font-bold mt-8 mb-6">$1</h2>')
      .replace(/^# (.*$)/gim, '<h1 class="text-3xl font-bold mt-8 mb-6">$1</h1>')

      // Bold
      .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold">$1</strong>')
      .replace(/__(.*?)__/g, '<strong class="font-semibold">$1</strong>')

      // Italic
      .replace(/\*(.*?)\*/g, '<em class="italic">$1</em>')
      .replace(/_(.*?)_/g, '<em class="italic">$1</em>')

      // Code blocks
      .replace(
        /```([\s\S]*?)```/g,
        '<pre class="bg-gray-100 p-4 rounded-lg overflow-x-auto my-4"><code class="text-sm">$1</code></pre>',
      )
      .replace(/`(.*?)`/g, '<code class="bg-gray-100 px-2 py-1 rounded text-sm">$1</code>')

      // Links
      .replace(
        /\[([^\]]+)\]$$([^)]+)$$/g,
        '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:text-blue-800 underline">$1</a>',
      )

      // Lists
      .replace(/^\* (.*$)/gim, '<li class="mb-2">$1</li>')
      .replace(/^- (.*$)/gim, '<li class="mb-2">$1</li>')
      .replace(/^\d+\. (.*$)/gim, '<li class="mb-2">$1</li>')

      // Line breaks
      .replace(/\n\n/g, '</p><p class="mb-4">')
      .replace(/\n/g, "<br>")

      // Wrap in paragraphs
      .replace(/^(?!<[h|l|p|d|u])(.+)/gm, '<p class="mb-4 leading-relaxed">$1</p>')

      // Clean up list items
      .replace(/(<li.*<\/li>)/gs, '<ul class="list-disc list-inside mb-4 space-y-2">$1</ul>')
      .replace(/<\/ul>\s*<ul[^>]*>/g, "")
  )
}

const sharePost = (platform: string, post: Post) => {
  const url = encodeURIComponent(window.location.href)
  const title = encodeURIComponent(post.title)
  const text = encodeURIComponent(post.excerpt)

  let shareUrl = ""

  switch (platform) {
    case "twitter":
      shareUrl = `https://twitter.com/intent/tweet?url=${url}&text=${title}`
      break
    case "facebook":
      shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${url}`
      break
    case "linkedin":
      shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${url}`
      break
    case "reddit":
      shareUrl = `https://reddit.com/submit?url=${url}&title=${title}`
      break
    case "whatsapp":
      shareUrl = `https://wa.me/?text=${title} ${url}`
      break
    case "telegram":
      shareUrl = `https://t.me/share/url?url=${url}&text=${title}`
      break
    default:
      // Copy to clipboard
      navigator.clipboard.writeText(window.location.href)
      return
  }

  window.open(shareUrl, "_blank", "width=600,height=400")
}

export default function BlogShow({ auth, post, relatedPosts }: Props) {
  const {
    data,
    setData,
    post: submitComment,
    processing,
    errors,
    reset,
  } = useForm({
    content: "",
    parent_id: null as string | null,
  })

  const [replyingTo, setReplyingTo] = React.useState<string | null>(null)

  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    submitComment(route("blog.comments.store", post.slug), {
      onSuccess: () => {
        reset()
        setReplyingTo(null)
      },
    })
  }

  const handleReply = (commentId: string) => {
    setReplyingTo(commentId)
    setData("parent_id", commentId)
  }

  const cancelReply = () => {
    setReplyingTo(null)
    setData("parent_id", null)
  }
 
  return (
      <AdminAppLayout>
          <Head>
              <title>{post.title}</title>
              <meta name="description" content={post.excerpt} />
              <meta name="keywords" content={post.tags.map((tag) => tag.name).join(', ')} />
              <link rel="canonical" href={window.location.href} />

              {/* Open Graph / Facebook */}
              <meta property="og:type" content="article" />
              <meta property="og:title" content={post.title} />
              <meta property="og:description" content={post.excerpt} />
              <meta property="og:url" content={window.location.href} />
              <meta property="og:site_name" content="Your Blog Name" />
              {post.featured_image && <meta property="og:image" content={post.featured_image} />}
              <meta property="article:author" content={post.author.name} />
              <meta property="article:published_time" content={post.published_at} />
              <meta property="article:published_time" content={post.published_at} />
              {post.categories.map((category) => (
                  <meta key={category.id} property="article:section" content={category.name} />
              ))}
              {post.tags.map((tag) => (
                  <meta key={tag.id} property="article:tag" content={tag.name} />
              ))}

              {/* Twitter Card */}
              <meta name="twitter:card" content="summary_large_image" />
              <meta name="twitter:title" content={post.title} />
              <meta name="twitter:description" content={post.excerpt} />
              {post.featured_image && <meta name="twitter:image" content={post.featured_image} />}

              {/* Additional SEO */}
              <meta name="author" content={post.author.name} />
              <meta name="robots" content="index, follow" />
              <meta name="googlebot" content="index, follow" />

              {/* JSON-LD Structured Data */}
              <script type="application/ld+json">
                  {JSON.stringify({
                      '@context': 'https://schema.org',
                      '@type': 'BlogPosting',
                      headline: post.title,
                      description: post.excerpt,
                      image: post.featured_image,
                      author: {
                          '@type': 'Person',
                          name: post.author.name,
                      },
                      publisher: {
                          '@type': 'Organization',
                          name: 'Your Blog Name',
                      },
                      datePublished: post.published_at,
                      mainEntityOfPage: {
                          '@type': 'WebPage',
                          '@id': window.location.href,
                      },
                  })}
              </script>
          </Head>

          <div className="min-h-screen bg-gray-50">
              <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
                  {/* Back Button */}
                  <div className="mb-6">
                      <Link href={route('blog.index')}>
                          <Button variant="outline" size="sm">
                              <ArrowLeft className="mr-2 h-4 w-4" />
                              Back to Blog
                          </Button>
                      </Link>
                  </div>

                  {/* Article */}
                  <article className="mb-8 overflow-hidden rounded-lg bg-white shadow-sm">
                      {/* Featured Image */}
                      {post.featured_image && (
                          <div className="aspect-video bg-gray-200 sm:aspect-[2/1]">
                              <img src={post.featured_image || '/placeholder.svg'} alt={post.title} className="h-full w-full object-cover" />
                          </div>
                      )}

                      <div className="p-4 sm:p-6 lg:p-8">
                          {/* Categories */}
                          <div className="mb-4 flex flex-wrap gap-2">
                              {post.categories.map((category) => (
                                  <Link key={category.id} href={route('blog.category', category.slug)}>
                                      <Badge variant="outline" className="hover:bg-gray-100">
                                          {category.name}
                                      </Badge>
                                  </Link>
                              ))}
                          </div>

                          {/* Title */}
                          <h1 className="mb-4 text-2xl leading-tight font-bold text-gray-900 sm:mb-6 sm:text-3xl lg:text-4xl">{post.title}</h1>

                          {/* Meta Info */}
                          <div className="mb-6 flex flex-col border-b pb-4 sm:mb-8 sm:flex-row sm:items-center sm:justify-between sm:pb-6">
                              <div className="mb-4 flex items-center space-x-4 sm:mb-0">
                                  <div className="flex items-center space-x-2">
                                      <Avatar className="h-8 w-8 sm:h-10 sm:w-10">
                                          <AvatarImage src={post.author.avatar || '/placeholder.svg'} />
                                          <AvatarFallback>{post.author.name.charAt(0)}</AvatarFallback>
                                      </Avatar>
                                      <div>
                                          <Link
                                              href={route('blog.author', post.author.name)}
                                              className="text-sm font-medium transition-colors hover:text-blue-600 sm:text-base"
                                          >
                                              {post.author.name}
                                          </Link>
                                          <div className="flex flex-wrap items-center space-x-2 text-xs text-gray-500 sm:space-x-4 sm:text-sm">
                                              <div className="flex items-center space-x-1">
                                                  <Calendar className="h-3 w-3 sm:h-4 sm:w-4" />
                                                  <span>{new Date(post.published_at).toLocaleDateString()}</span>
                                              </div>
                                              <div className="flex items-center space-x-1">
                                                  <Eye className="h-3 w-3 sm:h-4 sm:w-4" />
                                                  <span>{post.views} views</span>
                                              </div>
                                              <div className="flex items-center space-x-1">
                                                  <MessageCircle className="h-3 w-3 sm:h-4 sm:w-4" />
                                                  <span>{post.approved_comments.length} comments</span>
                                              </div>
                                          </div>
                                      </div>
                                  </div>
                              </div>

                              {/* Share Buttons */}
                              <div className="flex items-center space-x-2">
                                  <span className="hidden text-sm font-medium text-gray-700 sm:inline">Share:</span>
                                  <Button variant="outline" size="sm" onClick={() => sharePost('twitter', post)}>
                                      <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                                          <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
                                      </svg>
                                  </Button>
                                  <Button variant="outline" size="sm" onClick={() => sharePost('facebook', post)}>
                                      <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                                          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                                      </svg>
                                  </Button>
                                  <Button variant="outline" size="sm" onClick={() => sharePost('linkedin', post)}>
                                      <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                                          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                                      </svg>
                                  </Button>
                                  <Button variant="outline" size="sm" onClick={() => sharePost('copy', post)}>
                                      <Share2 className="h-4 w-4" />
                                  </Button>
                              </div>
                          </div>

                          {/* Content */}
                          <div
                              className="prose prose-sm sm:prose lg:prose-lg mb-8 max-w-none text-gray-800"
                              dangerouslySetInnerHTML={{ __html: formatMarkdown(post.content) }}
                          />

                          {/* Tags */}
                          {post.tags.length > 0 && (
                              <div className="border-t pt-6">
                                  <h3 className="mb-3 text-sm font-medium text-gray-900">Tags:</h3>
                                  <div className="flex flex-wrap gap-2">
                                      {post.tags.map((tag) => (
                                          <Link key={tag.id} href={route('blog.tag', tag.slug)}>
                                              <Badge variant="secondary" className="hover:bg-gray-200">
                                                  #{tag.name}
                                              </Badge>
                                          </Link>
                                      ))}
                                  </div>
                              </div>
                          )}
                      </div>
                  </article>

                  {/* Author Bio */}
                  {post.author.bio && (
                      <Card className="mb-8">
                          <CardContent className="p-4 sm:p-6">
                              <div className="flex flex-col items-start space-y-4 sm:flex-row sm:space-y-0 sm:space-x-4">
                                  <Avatar className="h-12 w-12 sm:h-16 sm:w-16">
                                      <AvatarImage src={post.author.avatar || '/placeholder.svg'} />
                                      <AvatarFallback className="text-lg">{post.author.name.charAt(0)}</AvatarFallback>
                                  </Avatar>
                                  <div className="flex-1">
                                      <h3 className="mb-2 text-lg font-semibold">About {post.author.name}</h3>
                                      <p className="mb-3 text-sm text-gray-600 sm:text-base">{post.author.bio}</p>
                                      <Link
                                          href={route('blog.author', post.author.name)}
                                          className="text-sm font-medium text-blue-600 hover:text-blue-700"
                                      >
                                          View all posts by {post.author.name} →
                                      </Link>
                                  </div>
                              </div>
                          </CardContent>
                      </Card>
                  )}

                  {/* Comments Section */}
                  <Card className="mb-8">
                      <CardHeader>
                          <CardTitle>Comments ({post.approved_comments.length})</CardTitle>
                      </CardHeader>
                      <CardContent>
                          {/* Comment Form */}
                          {auth.user ? (
                              <form onSubmit={handleCommentSubmit} className="mb-8">
                                  <div className="mb-4">
                                      <Textarea
                                          placeholder="Write your comment..."
                                          value={data.content}
                                          onChange={(e) => setData('content', e.target.value)}
                                          rows={4}
                                          className={errors.content ? 'border-red-500' : ''}
                                      />
                                      {errors.content && <p className="mt-1 text-sm text-red-500">{errors.content}</p>}
                                  </div>
                                  <div className="flex flex-col items-start space-y-2 sm:flex-row sm:items-center sm:space-y-0 sm:space-x-2">
                                      <Button type="submit" disabled={processing}>
                                          {processing ? 'Posting...' : 'Post Comment'}
                                      </Button>
                                      {replyingTo && (
                                          <Button type="button" variant="outline" onClick={cancelReply}>
                                              Cancel Reply
                                          </Button>
                                      )}
                                  </div>
                              </form>
                          ) : (
                              <div className="mb-8 rounded-lg bg-gray-50 p-4 text-center">
                                  <p className="mb-2 text-gray-600">Please log in to leave a comment.</p>
                                  <Link href={route('login')}>
                                      <Button>Log In</Button>
                                  </Link>
                              </div>
                          )}

                          {/* Comments List */}
                          <div className="space-y-6">
                              {post.approved_comments.map((comment) => (
                                  <div key={comment.id} className="border-b pb-6 last:border-b-0 last:pb-0">
                                      <div className="flex items-start space-x-3">
                                          <Avatar className="h-8 w-8">
                                              <AvatarImage src={comment.user.avatar || '/placeholder.svg'} />
                                              <AvatarFallback>{comment.user.name.charAt(0)}</AvatarFallback>
                                          </Avatar>
                                          <div className="flex-1">
                                              <div className="mb-2 flex flex-col sm:flex-row sm:items-center sm:space-x-2">
                                                  <span className="font-medium">{comment.user.name}</span>
                                                  <span className="text-sm text-gray-500">{new Date(comment.created_at).toLocaleDateString()}</span>
                                              </div>
                                              <p className="mb-2 text-sm text-gray-700 sm:text-base">{comment.content}</p>
                                              {auth.user && (
                                                  <Button variant="ghost" size="sm" onClick={() => handleReply(comment.id)}>
                                                      Reply
                                                  </Button>
                                              )}

                                              {/* Replies */}
                                              {comment.replies.length > 0 && (
                                                  <div className="mt-4 ml-4 space-y-4 sm:ml-6">
                                                      {comment.replies.map((reply) => (
                                                          <div key={reply.id} className="flex items-start space-x-3">
                                                              <Avatar className="h-6 w-6">
                                                                  <AvatarImage src={reply.user.avatar || '/placeholder.svg'} />
                                                                  <AvatarFallback className="text-xs">{reply.user.name.charAt(0)}</AvatarFallback>
                                                              </Avatar>
                                                              <div className="flex-1">
                                                                  <div className="mb-1 flex flex-col sm:flex-row sm:items-center sm:space-x-2">
                                                                      <span className="text-sm font-medium">{reply.user.name}</span>
                                                                      <span className="text-xs text-gray-500">
                                                                          {new Date(reply.created_at).toLocaleDateString()}
                                                                      </span>
                                                                  </div>
                                                                  <p className="text-sm text-gray-700">{reply.content}</p>
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

                          {post.approved_comments.length === 0 && (
                              <div className="py-8 text-center text-gray-500">No comments yet. Be the first to comment!</div>
                          )}
                      </CardContent>
                  </Card>

                  {/* Related Posts */}
                  {relatedPosts.length > 0 && (
                      <Card>
                          <CardHeader>
                              <CardTitle>Related Posts</CardTitle>
                          </CardHeader>
                          <CardContent>
                              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                  {relatedPosts.map((relatedPost) => (
                                      <div key={relatedPost.id} className="rounded-lg border p-4 transition-shadow hover:shadow-md">
                                          {relatedPost.featured_image && (
                                              <div className="mb-3 aspect-video rounded bg-gray-200">
                                                  <img
                                                      src={relatedPost.featured_image || '/placeholder.svg'}
                                                      alt={relatedPost.title}
                                                      className="h-full w-full rounded object-cover"
                                                  />
                                              </div>
                                          )}
                                          <h4 className="mb-2 line-clamp-2 font-medium">
                                              <Link href={route('blog.show', relatedPost.slug)} className="transition-colors hover:text-blue-600">
                                                  {relatedPost.title}
                                              </Link>
                                          </h4>
                                          <p className="mb-2 line-clamp-2 text-sm text-gray-600">{relatedPost.excerpt}</p>
                                          <div className="flex items-center text-xs text-gray-500">
                                              <span>{relatedPost.author.name}</span>
                                              <span className="mx-1">•</span>
                                              <span>{new Date(relatedPost.published_at).toLocaleDateString()}</span>
                                          </div>
                                      </div>
                                  ))}
                              </div>
                          </CardContent>
                      </Card>
                  )}
              </div>
          </div>
      </AdminAppLayout>
  );
}
