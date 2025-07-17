<?php

namespace App\Http\Controllers;

use App\Models\Post;
use App\Models\Category;
use App\Models\Tag;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\Analytics;

class BlogController extends Controller
{
    public function index(Request $request)
    {
        $posts = Post::published()
            ->with(['author', 'categories', 'tags'])
            ->when($request->category, function ($query, $category) {
                return $query->byCategory($category);
            })
            ->when($request->tag, function ($query, $tag) {
                return $query->byTag($tag);
            })
            ->when($request->search, function ($query, $search) {
                return $query->search($search);
            })
            ->latest('published_at')
            ->paginate(12);

        $categories = Category::withCount('posts')->get();
        $tags = Tag::withCount('posts')->get();
        $recentPosts = Post::published()
            ->with('author')
            ->latest('published_at')
            ->take(5)
            ->get();

        return Inertia::render('Blog/Index', [
            'posts' => $posts,
            'categories' => $categories,
            'tags' => $tags,
            'recentPosts' => $recentPosts,
            'filters' => $request->only(['category', 'tag', 'search']),
        ]);
    }

    public function show(Post $post, Request $request)
    {
        if ($post->status !== 'published' || $post->published_at > now()) {
            abort(404);
        }

        $post->incrementViews();

        // Track analytics
        Analytics::trackPageView($post->id, $request);

        $post->load([
            'author',
            'categories',
            'tags',
            'approvedComments' => function ($query) {
                $query->with(['user', 'replies.user'])
                    ->topLevel()
                    ->latest();
            }
        ]);

        $relatedPosts = Post::published()
            ->where('id', '!=', $post->id)
            ->whereHas('tags', function ($query) use ($post) {
                $query->whereIn('tags.id', $post->tags->pluck('id'));
            })
            ->with(['author', 'categories'])
            ->take(3)
            ->get();

        return Inertia::render('Blog/Show', [
            'post' => $post,
            'relatedPosts' => $relatedPosts,
        ]);
    }

    public function category(Category $category)
    {
        $posts = Post::published()
            ->byCategory($category->slug)
            ->with(['author', 'categories', 'tags'])
            ->latest('published_at')
            ->paginate(12);

        return Inertia::render('Blog/Category', [
            'category' => $category,
            'posts' => $posts,
        ]);
    }

    public function tag(Tag $tag)
    {
        $posts = Post::published()
            ->byTag($tag->slug)
            ->with(['author', 'categories', 'tags'])
            ->latest('published_at')
            ->paginate(12);

        return Inertia::render('Blog/Tag', [
            'tag' => $tag,
            'posts' => $posts,
        ]);
    }

    public function author(User $user)
    {
        $posts = Post::published()
            ->where('author_id', $user->id)
            ->with(['author', 'categories', 'tags'])
            ->latest('published_at')
            ->paginate(12);

        return Inertia::render('Blog/Author', [
            'author' => $user,
            'posts' => $posts,
        ]);
    }

    public function search(Request $request)
    {
        $search = $request->get('q');

        $posts = Post::published()
            ->search($search)
            ->with(['author', 'categories', 'tags'])
            ->latest('published_at')
            ->paginate(12);

        return Inertia::render('Blog/Search', [
            'posts' => $posts,
            'search' => $search,
        ]);
    }
}
