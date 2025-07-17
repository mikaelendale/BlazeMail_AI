<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Carbon\Carbon;

class Campaign extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'name',
        'starting_date',
        'status',
        'total_groups',
        'total_emails',
        'sequence_data',
        'is_setup_complete',
        'email_account_id',
        'recipient_settings',
        'campaign_settings',
        'sending_schedule',
        'notes',
        'launched_at',
        'completed_at',
        'paused_reason',
    ];

    protected $casts = [
        'starting_date' => 'date',
        'launched_at' => 'datetime',
        'completed_at' => 'datetime',
        'sequence_data' => 'array',
        'recipient_settings' => 'array',
        'campaign_settings' => 'array',
        'is_setup_complete' => 'boolean',
    ];

    // Relationships
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function emailAccount(): BelongsTo
    {
        return $this->belongsTo(EmailAccount::class);
    }

    public function groups(): HasMany
    {
        return $this->hasMany(CampaignGroup::class)->orderBy('order');
    }

    public function executions(): HasMany
    {
        return $this->hasMany(CampaignExecution::class);
    }

    // Scopes
    public function scopeSetupComplete($query)
    {
        return $query->where('is_setup_complete', true);
    }

    public function scopeSetupIncomplete($query)
    {
        return $query->where('is_setup_complete', false);
    }

    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }

    public function scopeCanLaunch($query)
    {
        return $query->where('is_setup_complete', true)
            ->where('status', 'draft');
    }

    // Helper methods
    public function needsSetup(): bool
    {
        return !$this->is_setup_complete;
    }

    public function canLaunch(): bool
    {
        return $this->is_setup_complete &&
            $this->status === 'draft' &&
            $this->emailAccount &&
            $this->emailAccount->canSendEmail();
    }

    public function isActive(): bool
    {
        return $this->status === 'active';
    }

    public function isPaused(): bool
    {
        return $this->status === 'paused';
    }

    public function isCompleted(): bool
    {
        return $this->status === 'completed';
    }

    public function getTotalRecipients(): int
    {
        if (!$this->recipient_settings) {
            return 0;
        }

        $settings = $this->recipient_settings;
        $query = Contact::forUser($this->user_id)->active();

        switch ($settings['type'] ?? 'all') {
            case 'classification':
                if (!empty($settings['classifications'])) {
                    $query->whereIn('classification', $settings['classifications']);
                }
                break;
            case 'tags':
                if (!empty($settings['tags'])) {
                    foreach ($settings['tags'] as $tag) {
                        $query->byTag($tag);
                    }
                }
                break;
            case 'selected':
                if (!empty($settings['selected_contacts'])) {
                    return count($settings['selected_contacts']);
                }
                break;
            case 'all':
            default:
                break;
        }

        return $query->count();
    }

    public function getProgressPercentage(): int
    {
        if ($this->total_emails === 0) {
            return 0;
        }

        $sentCount = $this->executions()->where('status', 'sent')->count();
        return round(($sentCount / $this->total_emails) * 100);
    }

    public function getCurrentGroup(): ?array
    {
        $sequenceData = $this->sequence_data ?? [];
        $groups = $sequenceData['groups'] ?? [];

        foreach ($groups as $group) {
            if (($group['status'] ?? 'scheduled') === 'in-progress') {
                return $group;
            }
        }

        return null;
    }

    public function getNextScheduledGroup(): ?array
    {
        $sequenceData = $this->sequence_data ?? [];
        $groups = $sequenceData['groups'] ?? [];

        foreach ($groups as $group) {
            if (($group['status'] ?? 'scheduled') === 'scheduled') {
                return $group;
            }
        }

        return null;
    }

    public function updateSequenceProgress(int $groupIndex, string $status, array $stats = []): void
    {
        $sequenceData = $this->sequence_data ?? [];

        if (isset($sequenceData['groups'][$groupIndex])) {
            $sequenceData['groups'][$groupIndex]['status'] = $status;
            $sequenceData['groups'][$groupIndex]['last_updated'] = now()->toISOString();

            if (!empty($stats)) {
                $sequenceData['groups'][$groupIndex]['stats'] = array_merge(
                    $sequenceData['groups'][$groupIndex]['stats'] ?? [],
                    $stats
                );
            }

            if ($status === 'completed') {
                $sequenceData['groups'][$groupIndex]['completed_at'] = now()->toISOString();
            }

            $this->update(['sequence_data' => $sequenceData]);
        }
    }
}
