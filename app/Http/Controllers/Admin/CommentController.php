<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Comment;
use Illuminate\Http\Request;
use Inertia\Inertia;

class CommentController extends Controller
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
        $comments = Comment::with(['post', 'user'])
            ->when($request->status, function ($query, $status) {
                return $query->where('status', $status);
            })
            ->latest()
            ->paginate(20);

        return Inertia::render('admin/Comments/Index', [
            'comments' => $comments,
            'filters' => $request->only(['status']),
        ]);
    }

    public function update(Request $request, Comment $comment)
    {
        $request->validate([
            'status' => 'required|in:pending,approved,spam',
        ]);

        $comment->update([
            'status' => $request->status,
        ]);

        return redirect()->route('admin.comments.index')
            ->with('success', 'Comment status updated successfully.');
    }

    public function destroy(Comment $comment)
    {
        $comment->delete();

        return redirect()->route('admin.comments.index')
            ->with('success', 'Comment deleted successfully.');
    }
}
