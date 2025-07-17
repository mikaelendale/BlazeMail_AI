<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CampaignExecution extends Model
{
    use HasFactory;

    protected $fillable = [
        'campaign_id',
        'user_id',
        'recipient_data',
        'status',
        'scheduled_at',
        'executed_at',
        'execution_log',
        'email_data', // New column for email personalization data
        
    ];

    protected $casts = [
        'recipient_data' => 'array',
        'execution_log' => 'array',
        'scheduled_at' => 'datetime',
        'executed_at' => 'datetime',
    ];

    public function campaign(): BelongsTo
    {
        return $this->belongsTo(Campaign::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
