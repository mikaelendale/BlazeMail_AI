<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class EmailBatch extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'email_account_id',
        'campaign_id',
        'batch_number',
        'total_batches',
        'recipients',
        'email_template',
        'status',
        'scheduled_at',
        'started_at',
        'completed_at',
        'batch_size',
        'sent_count',
        'error_count',
        'errors',
        'settings',
        'metadata',
    ];

    protected $casts = [
        'recipients' => 'array',
        'email_template' => 'array',
        'errors' => 'array',
        'settings' => 'array',
        'metadata' => 'array',
        'scheduled_at' => 'datetime',
        'started_at' => 'datetime',
        'completed_at' => 'datetime',
    ];

    /**
     * Get the user that owns the batch
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the email account for this batch
     */
    public function emailAccount(): BelongsTo
    {
        return $this->belongsTo(EmailAccount::class);
    }

    /**
     * Scope for pending batches
     */
    public function scopePending($query)
    {
        return $query->where('status', 'pending');
    }

    /**
     * Scope for processing batches
     */
    public function scopeProcessing($query)
    {
        return $query->where('status', 'processing');
    }

    /**
     * Scope for completed batches
     */
    public function scopeCompleted($query)
    {
        return $query->whereIn('status', ['completed', 'completed_with_errors']);
    }

    /**
     * Scope for failed batches
     */
    public function scopeFailed($query)
    {
        return $query->where('status', 'failed');
    }

    /**
     * Scope for ready to process (scheduled time has passed)
     */
    public function scopeReadyToProcess($query)
    {
        return $query->where('status', 'pending')
            ->where('scheduled_at', '<=', now());
    }

    /**
     * Get success rate percentage
     */
    public function getSuccessRateAttribute(): float
    {
        if ($this->batch_size === 0) {
            return 0;
        }

        return ($this->sent_count / $this->batch_size) * 100;
    }

    /**
     * Check if batch is ready to process
     */
    public function isReadyToProcess(): bool
    {
        return $this->status === 'pending' && $this->scheduled_at <= now();
    }

    /**
     * Check if batch is completed
     */
    public function isCompleted(): bool
    {
        return in_array($this->status, ['completed', 'completed_with_errors', 'failed']);
    }

    /**
     * Get estimated completion time
     */
    public function getEstimatedCompletionTime(): ?\Carbon\Carbon
    {
        if ($this->isCompleted()) {
            return $this->completed_at;
        }

        if ($this->status === 'processing') {
            // Estimate based on average time per email (2 seconds)
            $remainingEmails = $this->batch_size - $this->sent_count;
            return now()->addSeconds($remainingEmails * 2);
        }

        return $this->scheduled_at?->addMinutes(5); // Estimated processing time
    }

    /**
     * Get batch progress percentage
     */
    public function getProgressPercentage(): float
    {
        if ($this->batch_size === 0) {
            return 0;
        }

        $processed = $this->sent_count + $this->error_count;
        return ($processed / $this->batch_size) * 100;
    }
}
