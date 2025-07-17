<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Post;
use App\Models\Comment;
use App\Models\Category;
use App\Models\Tag;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class BlogDashboardController extends Controller
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
    
    public function index()
    {
        $user = Auth::user();

        $postsQuery = Post::query();
        if ($user->role === 'author') {
            $postsQuery->where('author_id', $user->id);
        }

        $stats = [
            'total_posts' => $postsQuery->count(),
            'published_posts' => $postsQuery->where('status', 'published')->count(),
            'draft_posts' => $postsQuery->where('status', 'draft')->count(),
            'total_views' => $postsQuery->sum('views'),
            'pending_comments' => Comment::where('status', 'pending')->count(),
            'total_categories' => Category::count(),
            'total_tags' => Tag::count(),
        ];

        $recentPosts = $postsQuery->with(['author', 'categories'])
            ->latest()
            ->take(5)
            ->get();

        $pendingComments = Comment::with(['post', 'user'])
            ->where('status', 'pending')
            ->latest()
            ->take(5)
            ->get();

        return Inertia::render('admin/blog-dashboard', [
            'stats' => $stats,
            'recentPosts' => $recentPosts,
            'pendingComments' => $pendingComments,
        ]);
    }
}
