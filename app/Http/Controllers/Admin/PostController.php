<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Post;
use App\Models\Category;
use App\Models\Tag;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;
use Inertia\Inertia;

class PostController extends Controller
{
    public function __construct()
    {
        $this->middleware(function ($request, $next) {
            if (!auth()->user()->hasAnyRole(['admin', 'author'])) {
                abort(403);
            }
            return $next($request);
        });
    }

    public function index(Request $request)
    {
        $user = auth()->user();

        $posts = Post::query()
            ->when($user->role === 'author', function ($query) use ($user) {
                return $query->where('author_id', $user->id);
            })
            ->when($request->status, function ($query, $status) {
                return $query->where('status', $status);
            })
            ->when($request->search, function ($query, $search) {
                return $query->search($search);
            })
            ->with(['author', 'categories'])
            ->latest()
            ->paginate(15);

        return Inertia::render('admin/Posts/Index', [
            'posts' => $posts,
            'filters' => $request->only(['status', 'search']),
        ]);
    }

    public function show(Post $post)
    {
        $user = auth()->user();

        if ($user->role === 'author' && $post->author_id !== $user->id) {
            abort(403);
        }

        $post->load(['author', 'categories', 'tags', 'comments.user']);

        return Inertia::render('admin/Posts/Show', [
            'post' => $post,
        ]);
    }

    public function create()
    {
        $categories = Category::all();
        $tags = Tag::all();

        return Inertia::render('admin/Posts/Create', [
            'categories' => $categories,
            'tags' => $tags,
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'title' => 'required|string|max:255',
            'content' => 'required|string',
            'excerpt' => 'required|string|max:500',
            'featured_image' => 'nullable|string',
            'status' => 'required|in:draft,published,archived',
            'published_at' => 'nullable|date',
            'categories' => 'array',
            'categories.*' => 'exists:categories,id',
            'tags' => 'array',
            'tags.*' => 'exists:tags,id',
        ]);

        $post = Post::create([
            'title' => $request->title,
            'slug' => Str::slug($request->title),
            'content' => $request->content,
            'excerpt' => $request->excerpt,
            'author_id' => Auth::user()->id,
            'featured_image' => $request->featured_image,
            'status' => $request->status,
            'published_at' => $request->status === 'published'
                ? ($request->published_at ?? now())
                : $request->published_at,
        ]);

        if ($request->categories) {
            $post->categories()->sync($request->categories);
        }

        if ($request->tags) {
            $post->tags()->sync($request->tags);
        }

        return redirect()->route('admin.posts.index')
            ->with('success', 'Post created successfully.');
    }

    public function edit(Post $post)
    {
        $user = auth()->user();

        if ($user->role === 'author' && $post->author_id !== $user->id) {
            abort(403);
        }

        $post->load(['categories', 'tags']);
        $categories = Category::all();
        $tags = Tag::all();

        return Inertia::render('admin/Posts/Edit', [
            'post' => [
                'id' => $post->id,
                'title' => $post->title,
                'slug' => $post->slug,
                'content' => $post->content,
                'excerpt' => $post->excerpt,
                'featured_image' => $post->featured_image,
                'status' => $post->status,
                'published_at' => $post->published_at ? $post->published_at->format('Y-m-d') : null,
                'meta_title' => $post->meta_title,
                'meta_description' => $post->meta_description,
                'meta_keywords' => $post->meta_keywords,
                'categories' => $post->categories,
                'tags' => $post->tags,
            ],
            'categories' => $categories,
            'tags' => $tags,
        ]);
    }

    public function update(Request $request, Post $post)
    {
        $user = auth()->user();

        if ($user->role === 'author' && $post->author_id !== $user->id) {
            abort(403);
        }

        $request->validate([
            'title' => 'required|string|max:255',
            'content' => 'required|string',
            'excerpt' => 'required|string|max:500',
            'featured_image' => 'nullable|string',
            'status' => 'required|in:draft,published,archived',
            'published_at' => 'nullable|date',
            'categories' => 'array',
            'categories.*' => 'exists:categories,id',
            'tags' => 'array',
            'tags.*' => 'exists:tags,id',
        ]);

        $post->update([
            'title' => $request->title,
            'slug' => Str::slug($request->title),
            'content' => $request->content,
            'excerpt' => $request->excerpt,
            'featured_image' => $request->featured_image,
            'status' => $request->status,
            'published_at' => $request->status === 'published'
                ? ($request->published_at ?? $post->published_at ?? now())
                : $request->published_at,
        ]);

        $post->categories()->sync($request->categories ?? []);
        $post->tags()->sync($request->tags ?? []);

        return redirect()->route('admin.posts.index')
            ->with('success', 'Post updated successfully.');
    }

    public function destroy(Post $post)
    {
        $user = auth()->user();

        if ($user->role === 'author' && $post->author_id !== $user->id) {
            abort(403);
        }

        $post->delete();

        return redirect()->route('admin.posts.index')
            ->with('success', 'Post deleted successfully.');
    }
}
