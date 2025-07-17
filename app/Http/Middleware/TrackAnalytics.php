<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use App\Models\Analytics;

class TrackAnalytics
{
    public function handle(Request $request, Closure $next)
    {
        $response = $next($request);

        // Only track GET requests to blog posts
        if ($request->isMethod('GET') && $request->route() && $request->route()->getName() === 'blog.show') {
            $post = $request->route('post');
            if ($post) {
                Analytics::trackPageView($post->id, $request);
            }
        }

        return $response;
    }
}
