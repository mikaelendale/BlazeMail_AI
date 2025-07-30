<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class JobProgress extends Model
{
    use HasFactory;

    protected $table = 'job_progress';

    protected $fillable = [
        'job_id',
        'batch_id',
        'user_id',
        'job_type',
        'status',
        'total_items',
        'processed_items',
        'successful_items',
        'failed_items',
        'current_item',
        'metadata',
        'progress_percentage',
        'started_at',
        'completed_at',
        'error_message'
    ];

    protected $casts = [
        'current_item' => 'array',
        'metadata' => 'array',
        'started_at' => 'datetime',
        'completed_at' => 'datetime'
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function updateProgress(int $processed, int $successful, int $failed, array $currentItem = null)
    {
        $this->update([
            'processed_items' => $processed,
            'successful_items' => $successful,
            'failed_items' => $failed,
            'current_item' => $currentItem,
            'progress_percentage' => $this->total_items > 0 ?
                round(($processed / $this->total_items) * 100, 2) : 0
        ]);
    }
}
