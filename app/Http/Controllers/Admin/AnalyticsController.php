<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Analytics;
use App\Models\Post;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class AnalyticsController extends Controller
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
        $days = $request->get('days', 30);
        $startDate = Carbon::now()->subDays($days);

        $analyticsQuery = Analytics::where('created_at', '>=', $startDate);

        if ($user->role === 'author') {
            $analyticsQuery->whereHas('post', function ($query) use ($user) {
                $query->where('author_id', $user->id);
            });
        }

        // Overview stats - Fixed the queries
        $totalViews = (clone $analyticsQuery)->count();
        $uniqueViews = (clone $analyticsQuery)->distinct('ip_address')->count('ip_address');
        $avgTimeOnPage = (clone $analyticsQuery)->avg('time_on_page') ?? 0;
        $bounceRate = $totalViews > 0 ? ((clone $analyticsQuery)->where('is_bounce', true)->count() / $totalViews * 100) : 0;

        // Traffic sources
        $trafficSources = Analytics::where('created_at', '>=', $startDate)
            ->when($user->role === 'author', function ($query) use ($user) {
                $query->whereHas('post', function ($q) use ($user) {
                    $q->where('author_id', $user->id);
                });
            })
            ->select('source', 'medium', DB::raw('COUNT(*) as views'))
            ->groupBy('source', 'medium')
            ->orderByDesc('views')
            ->take(10)
            ->get();

        // Top posts
        $topPosts = Analytics::where('created_at', '>=', $startDate)
            ->when($user->role === 'author', function ($query) use ($user) {
                $query->whereHas('post', function ($q) use ($user) {
                    $q->where('author_id', $user->id);
                });
            })
            ->select('post_id', DB::raw('COUNT(*) as views'))
            ->with('post:id,title,slug')
            ->groupBy('post_id')
            ->orderByDesc('views')
            ->take(10)
            ->get();

        // Device breakdown
        $deviceStats = Analytics::where('created_at', '>=', $startDate)
            ->when($user->role === 'author', function ($query) use ($user) {
                $query->whereHas('post', function ($q) use ($user) {
                    $q->where('author_id', $user->id);
                });
            })
            ->select('device_type', DB::raw('COUNT(*) as views'))
            ->groupBy('device_type')
            ->get();

        // Browser breakdown
        $browserStats = Analytics::where('created_at', '>=', $startDate)
            ->when($user->role === 'author', function ($query) use ($user) {
                $query->whereHas('post', function ($q) use ($user) {
                    $q->where('author_id', $user->id);
                });
            })
            ->select('browser', DB::raw('COUNT(*) as views'))
            ->groupBy('browser')
            ->orderByDesc('views')
            ->take(5)
            ->get();

        // Daily views for chart
        $dailyViews = Analytics::where('created_at', '>=', $startDate)
            ->when($user->role === 'author', function ($query) use ($user) {
                $query->whereHas('post', function ($q) use ($user) {
                    $q->where('author_id', $user->id);
                });
            })
            ->select(DB::raw('DATE(created_at) as date'), DB::raw('COUNT(*) as views'))
            ->groupBy(DB::raw('DATE(created_at)'))
            ->orderBy('date')
            ->get();

        return Inertia::render('admin/Analytics/Index', [
            'stats' => [
                'total_views' => $totalViews,
                'unique_views' => $uniqueViews,
                'avg_time_on_page' => round($avgTimeOnPage, 2),
                'bounce_rate' => round($bounceRate, 2),
            ],
            'traffic_sources' => $trafficSources,
            'top_posts' => $topPosts,
            'device_stats' => $deviceStats,
            'browser_stats' => $browserStats,
            'daily_views' => $dailyViews,
            'days' => $days,
        ]);
    }
}
