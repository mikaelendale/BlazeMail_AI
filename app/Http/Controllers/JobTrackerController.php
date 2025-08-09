<?php

namespace App\Http\Controllers;

use App\Services\JobProgressService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;

class JobTrackerController extends Controller
{
    protected $progressService;

    public function __construct(JobProgressService $progressService)
    {
        $this->progressService = $progressService;
    }

    /**
     * 🔥 GET RECENT JOBS FOR TRACKER (last 10)
     */
    public function getRecentJobs(Request $request)
    {
        $user = Auth::user();

        Log::info('🔄 Fetching recent jobs for user', [
            'user_id' => $user->id,
            'request_ip' => $request->ip()
        ]);

        $jobs = \App\Models\JobProgress::where('user_id', $user->id)
            ->orderBy('created_at', 'desc')
            ->limit(10)
            ->get();

        Log::info('📊 Found jobs for user', [
            'user_id' => $user->id,
            'jobs_count' => $jobs->count(),
            'job_ids' => $jobs->pluck('id')->toArray()
        ]);

        $formattedJobs = $jobs->map(function ($job) {
            return [
                'id' => $job->id,
                'job_id' => $job->job_id,
                'batch_id' => $job->batch_id,
                'job_type' => $job->job_type,
                'status' => $job->status,
                'progress_percentage' => $job->progress_percentage,
                'processed_items' => $job->processed_items,
                'successful_items' => $job->successful_items,
                'failed_items' => $job->failed_items,
                'total_items' => $job->total_items,
                'current_item' => $job->current_item,
                'metadata' => $job->metadata,
                'started_at' => $job->started_at?->diffForHumans(),
                'completed_at' => $job->completed_at?->diffForHumans(),
                'updated_at' => $job->updated_at->toISOString(),
                'error_message' => $job->error_message
            ];
        });

        Log::info('✅ Returning formatted jobs', [
            'user_id' => $user->id,
            'formatted_jobs_count' => $formattedJobs->count()
        ]);

        
        return response()->json($formattedJobs);
    }

    /**
     * 🔥 SHOW DEDICATED JOBS PAGE
     */
    public function index(Request $request)
    {
        $user = Auth::user();

        $jobs = \App\Models\JobProgress::where('user_id', $user->id)
            ->orderBy('created_at', 'desc')
            ->paginate(20)
            ->through(function ($job) {
                return [
                    'id' => $job->id,
                    'job_id' => $job->job_id,
                    'batch_id' => $job->batch_id,
                    'job_type' => $job->job_type,
                    'status' => $job->status,
                    'progress_percentage' => $job->progress_percentage,
                    'processed_items' => $job->processed_items,
                    'successful_items' => $job->successful_items,
                    'failed_items' => $job->failed_items,
                    'total_items' => $job->total_items,
                    'current_item' => $job->current_item,
                    'metadata' => $job->metadata,
                    'started_at' => $job->started_at?->format('M j, Y g:i A'),
                    'completed_at' => $job->completed_at?->format('M j, Y g:i A'),
                    'error_message' => $job->error_message,
                    'duration' => $job->started_at && $job->completed_at ?
                        $job->started_at->diffInSeconds($job->completed_at) : null
                ];
            });

        $stats = [
            'total_jobs' => \App\Models\JobProgress::where('user_id', $user->id)->count(),
            'active_jobs' => \App\Models\JobProgress::where('user_id', $user->id)
                ->whereIn('status', ['started', 'processing'])->count(),
            'completed_jobs' => \App\Models\JobProgress::where('user_id', $user->id)
                ->where('status', 'completed')->count(),
            'failed_jobs' => \App\Models\JobProgress::where('user_id', $user->id)
                ->where('status', 'failed')->count(),
        ];

        return Inertia::render('Jobs/Index', [
            'jobs' => $jobs,
            'stats' => $stats
        ]);
    }

    /**
     * Get specific job progress
     */
    public function getJobProgress(Request $request, string $batchId)
    {
        $user = Auth::user();
        $progress = $this->progressService->getProgressByBatch($batchId);

        if (!$progress || $progress->user_id !== $user->id) {
            return response()->json(['error' => 'Job not found'], 404);
        }

        return response()->json([
            'job_id' => $progress->job_id,
            'batch_id' => $progress->batch_id,
            'job_type' => $progress->job_type,
            'status' => $progress->status,
            'progress_percentage' => $progress->progress_percentage,
            'processed_items' => $progress->processed_items,
            'successful_items' => $progress->successful_items,
            'failed_items' => $progress->failed_items,
            'total_items' => $progress->total_items,
            'current_item' => $progress->current_item,
            'metadata' => $progress->metadata,
            'updated_at' => $progress->updated_at->toISOString()
        ]);
    }
}
