<?php

namespace App\Jobs;

use App\Models\EmailBatch;
use App\Services\GmailBatchService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class ProcessEmailBatchJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public $timeout = 600; // 10 minutes timeout
    public $tries = 3; // Retry up to 3 times
    public $backoff = [60, 300, 900]; // Backoff delays: 1min, 5min, 15min

    protected EmailBatch $batch;

    /**
     * Create a new job instance.
     */
    public function __construct(EmailBatch $batch)
    {
        $this->batch = $batch;
        $this->onQueue('email-batches'); // Use dedicated queue
    }

    /**
     * Execute the job.
     */
    public function handle(GmailBatchService $batchService): void
    {
        try {
            Log::info('Processing email batch job', [
                'batch_id' => $this->batch->id,
                'campaign_id' => $this->batch->campaign_id,
                'batch_number' => $this->batch->batch_number,
                'recipient_count' => $this->batch->batch_size,
            ]);

            // Check if batch is still valid and ready to process
            if (!$this->batch->isReadyToProcess()) {
                Log::warning('Batch not ready to process', [
                    'batch_id' => $this->batch->id,
                    'status' => $this->batch->status,
                    'scheduled_at' => $this->batch->scheduled_at,
                ]);
                return;
            }

            // Check if email account is still active
            $account = $this->batch->emailAccount;
            if (!$account || !$account->is_connected || $account->status !== 'active') {
                $this->batch->update([
                    'status' => 'failed',
                    'completed_at' => now(),
                    'errors' => [['error' => 'Email account is not active or connected']],
                ]);
                return;
            }

            // Process the batch
            $result = $batchService->processBatch($this->batch);

            if ($result['success']) {
                Log::info('Email batch processed successfully', [
                    'batch_id' => $this->batch->id,
                    'sent_count' => $result['sent_count'],
                    'error_count' => $result['error_count'],
                ]);
            } else {
                Log::error('Email batch processing failed', [
                    'batch_id' => $this->batch->id,
                    'error' => $result['error'],
                ]);

                // Mark as failed and don't retry
                $this->fail(new \Exception($result['error']));
            }
        } catch (\Exception $e) {
            Log::error('Email batch job failed', [
                'batch_id' => $this->batch->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            // Update batch status
            $this->batch->update([
                'status' => 'failed',
                'completed_at' => now(),
                'errors' => [['error' => $e->getMessage()]],
            ]);

            throw $e; // Re-throw to trigger retry logic
        }
    }

    /**
     * Handle a job failure.
     */
    public function failed(\Throwable $exception): void
    {
        Log::error('Email batch job permanently failed', [
            'batch_id' => $this->batch->id,
            'error' => $exception->getMessage(),
            'attempts' => $this->attempts(),
        ]);

        // Mark batch as permanently failed
        $this->batch->update([
            'status' => 'failed',
            'completed_at' => now(),
            'errors' => [
                [
                    'error' => $exception->getMessage(),
                    'failed_at' => now()->toISOString(),
                    'attempts' => $this->attempts(),
                ]
            ],
        ]);
    }

    /**
     * Get the tags that should be assigned to the job.
     */
    public function tags(): array
    {
        return [
            'email-batch',
            'campaign:' . $this->batch->campaign_id,
            'account:' . $this->batch->email_account_id,
        ];
    }
}
