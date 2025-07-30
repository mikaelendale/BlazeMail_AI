<?php

namespace App\Services;

use App\Models\JobProgress;
use App\Events\JobProgressUpdated;
use Illuminate\Support\Facades\Log;

class JobProgressService
{
    public function startJob(string $jobId, string $batchId, int $userId, string $jobType, int $totalItems, array $metadata = []): JobProgress
    {
        $progress = JobProgress::create([
            'job_id' => $jobId,
            'batch_id' => $batchId,
            'user_id' => $userId,
            'job_type' => $jobType,
            'status' => 'started',
            'total_items' => $totalItems,
            'metadata' => $metadata,
            'started_at' => now()
        ]);

        // 🔥 BROADCAST REAL-TIME UPDATE
        $this->broadcastUpdate($progress);

        Log::info('📊 Job progress tracking started with REAL-TIME broadcasting', [
            'job_id' => $jobId,
            'batch_id' => $batchId,
            'total_items' => $totalItems,
            'user_id' => $userId
        ]);

        return $progress;
    }

    public function updateProgress(string $jobId, int $processed, int $successful, int $failed, array $currentItem = null): void
    {
        $progress = JobProgress::where('job_id', $jobId)->first();

        if (!$progress) {
            Log::warning('Progress tracking not found for job', ['job_id' => $jobId]);
            return;
        }

        $progress->updateProgress($processed, $successful, $failed, $currentItem);
        $progress->update(['status' => 'processing']);

        // 🔥 BROADCAST REAL-TIME UPDATE
        $this->broadcastUpdate($progress);

        Log::info('📈 Job progress updated with REAL-TIME broadcast', [
            'job_id' => $jobId,
            'progress' => $progress->progress_percentage . '%',
            'processed' => $processed,
            'successful' => $successful,
            'failed' => $failed
        ]);
    }

    public function completeJob(string $jobId, bool $success = true, string $errorMessage = null): void
    {
        $progress = JobProgress::where('job_id', $jobId)->first();

        if (!$progress) {
            Log::warning('Progress tracking not found for job completion', ['job_id' => $jobId]);
            return;
        }

        $progress->update([
            'status' => $success ? 'completed' : 'failed',
            'completed_at' => now(),
            'error_message' => $errorMessage,
            'progress_percentage' => $success ? 100 : $progress->progress_percentage
        ]);

        // 🔥 BROADCAST REAL-TIME COMPLETION
        $this->broadcastUpdate($progress);

        Log::info('🏁 Job progress completed with REAL-TIME broadcast', [
            'job_id' => $jobId,
            'success' => $success,
            'final_stats' => [
                'processed' => $progress->processed_items,
                'successful' => $progress->successful_items,
                'failed' => $progress->failed_items
            ]
        ]);
    }

    public function getProgress(string $jobId): ?JobProgress
    {
        return JobProgress::where('job_id', $jobId)->first();
    }

    public function getProgressByBatch(string $batchId): ?JobProgress
    {
        return JobProgress::where('batch_id', $batchId)->first();
    }

    /**
     * 🔥 BROADCAST REAL-TIME UPDATES VIA PUSHER
     */
    private function broadcastUpdate(JobProgress $progress): void
    {
        try {
            $jobData = [
                'id' => $progress->id,
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
                'started_at' => $progress->started_at?->diffForHumans(),
                'completed_at' => $progress->completed_at?->diffForHumans(),
                'updated_at' => $progress->updated_at->toISOString(),
                'error_message' => $progress->error_message
            ];

            // 🔥 FIRE THE REAL-TIME EVENT
            event(new JobProgressUpdated($jobData, $progress->user_id));

            Log::info('🔥 Real-time job progress broadcasted via Pusher', [
                'job_id' => $progress->job_id,
                'user_id' => $progress->user_id,
                'status' => $progress->status,
                'progress' => $progress->progress_percentage . '%'
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to broadcast progress update', [
                'job_id' => $progress->job_id,
                'error' => $e->getMessage()
            ]);
        }
    }
}
