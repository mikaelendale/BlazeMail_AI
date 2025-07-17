<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CampaignGroup extends Model
{
    use HasFactory;

    protected $fillable = [
        'campaign_id',
        'title',
        'delay_days',
        'delay_hours',
        'delay_minutes',
        'order',
        'email_ids',
    ];

    protected $casts = [
        'email_ids' => 'array',
    ];

    public function campaign(): BelongsTo
    {
        return $this->belongsTo(Campaign::class);
    }

    // Get emails for this group efficiently
    public function getEmails()
    {
        if (empty($this->email_ids)) {
            return collect();
        }

        return UserSavedEmails::whereIn('id', $this->email_ids)
            ->orderByRaw('FIELD(id, ' . implode(',', $this->email_ids) . ')')
            ->get();
    }
}
