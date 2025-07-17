<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Facades\Crypt;

class EmailAccount extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'user_id',
        'email',
        'provider',
        'status',
        'is_connected',
        'is_verified',
        'daily_limit',
        'daily_sent',
        'hourly_limit',
        'hourly_sent',
        'daily_sent_date',
        'hourly_sent_reset',
        'warmup_progress',
        'warmup_day',
        'warmup_emails_today',
        'warmup_schedule',
        'reputation',
        'bounce_rate',
        'complaint_rate',
        'success_rate',
        'last_activity',
        'last_sync',
        'last_health_check',
        'last_error',
        'consecutive_errors',
        'last_error_at',
        'connection_hash',
        'security_flags',
        'last_security_check',
        'metadata',
        'settings',

        // 🔥 CRITICAL OAUTH FIELDS!
        'encrypted_password',
        'encrypted_access_token',
        'encrypted_refresh_token',
        'encrypted_app_password',
        'encrypted_imap_host',
        'imap_port',
        'encrypted_smtp_host',
        'smtp_port',
        'encryption_type',
        'oauth_provider_id',
        'token_expires_at',
        'oauth_scopes',
    ];

    protected $casts = [
        'is_connected' => 'boolean',
        'is_verified' => 'boolean',
        'daily_limit' => 'integer',
        'daily_sent' => 'integer',
        'hourly_limit' => 'integer',
        'hourly_sent' => 'integer',
        'daily_sent_date' => 'date',
        'hourly_sent_reset' => 'datetime',
        'warmup_progress' => 'integer',
        'warmup_day' => 'integer',
        'warmup_emails_today' => 'integer',
        'bounce_rate' => 'float',
        'complaint_rate' => 'float',
        'success_rate' => 'float',
        'consecutive_errors' => 'integer',
        'imap_port' => 'integer',
        'smtp_port' => 'integer',
        'last_activity' => 'datetime',
        'last_sync' => 'datetime',
        'last_health_check' => 'datetime',
        'last_error_at' => 'datetime',
        'token_expires_at' => 'datetime',
        'metadata' => 'array',
        'settings' => 'array',
        'oauth_scopes' => 'array',
        'warmup_schedule' => 'array',
        'security_flags' => 'array',
    ];

    protected $hidden = [
        'encrypted_password',
        'encrypted_access_token',
        'encrypted_refresh_token',
        'encrypted_app_password',
    ];

    // 🔥 AUTOMATIC ENCRYPTION FOR OAUTH TOKENS!
    public function setEncryptedAccessTokenAttribute($value)
    {
        if ($value) {
            $this->attributes['encrypted_access_token'] = Crypt::encryptString($value);
        }
    }

    public function getEncryptedAccessTokenAttribute($value)
    {
        if ($value) {
            return Crypt::decryptString($value);
        }
        return null;
    }

    public function setEncryptedRefreshTokenAttribute($value)
    {
        if ($value) {
            $this->attributes['encrypted_refresh_token'] = Crypt::encryptString($value);
        }
    }

    public function getEncryptedRefreshTokenAttribute($value)
    {
        if ($value) {
            return Crypt::decryptString($value);
        }
        return null;
    }

    // Legacy support for old field names
    public function setOauthTokenAttribute($value)
    {
        $this->encrypted_access_token = $value;
    }

    public function getOauthTokenAttribute()
    {
        return $this->encrypted_access_token;
    }

    public function setOauthRefreshTokenAttribute($value)
    {
        $this->encrypted_refresh_token = $value;
    }

    public function getOauthRefreshTokenAttribute()
    {
        return $this->encrypted_refresh_token;
    }

    // Other encryption methods...
    public function setEncryptedPasswordAttribute($value)
    {
        if ($value) {
            $this->attributes['encrypted_password'] = Crypt::encryptString($value);
        }
    }

    public function getEncryptedPasswordAttribute($value)
    {
        if ($value) {
            return Crypt::decryptString($value);
        }
        return null;
    }

    // Relationships
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    // Scopes
    public function scopeActive($query)
    {
        return $query->where('status', 'active')->where('is_connected', true);
    }

    public function scopeWarming($query)
    {
        return $query->where('status', 'warming');
    }

    public function scopeGmail($query)
    {
        return $query->where('provider', 'gmail');
    }

    public function scopeImap($query)
    {
        return $query->where('provider', 'imap');
    }

    // Helper methods
    public function isDailyLimitReached(): bool
    {
        return $this->daily_sent >= $this->daily_limit;
    }
    
    public function getRemainingDailyLimit(): int
    {
        return max(0, $this->daily_limit - $this->daily_sent);
    }

    public function isHourlyLimitReached(): bool
    {
        return $this->hourly_sent >= $this->hourly_limit;
    }

    public function needsWarmup(): bool
    {
        return $this->warmup_progress < 100 && $this->status === 'warming';
    }

    public function getWarmupEmailsAllowed(): int
    {
        // Progressive warmup schedule
        $schedule = [
            1 => 5,   // Day 1: 5 emails
            2 => 10,  // Day 2: 10 emails
            3 => 15,  // Day 3: 15 emails
            4 => 25,  // Day 4: 25 emails
            5 => 40,  // Day 5: 40 emails
            6 => 60,  // Day 6: 60 emails
            7 => 80,  // Day 7: 80 emails
        ];

        return $schedule[$this->warmup_day] ?? min($this->daily_limit, 100);
    }

    public function canSendEmail(): bool
    {
        return $this->is_connected
            && $this->status === 'active'
            && !$this->isDailyLimitReached()
            && !$this->isHourlyLimitReached()
            && $this->consecutive_errors < 3;
    }

    public function incrementSentCount(): void
    {
        $this->increment('daily_sent');
        $this->increment('hourly_sent');

        if ($this->needsWarmup()) {
            $this->increment('warmup_emails_today');
        }

        $this->update(['last_activity' => now()]);
    }

    public function recordError(string $error): void
    {
        $this->increment('consecutive_errors');
        $this->update([
            'last_error' => $error,
            'last_error_at' => now(),
            'last_activity' => now(),
        ]);

        // If too many consecutive errors, disable account
        if ($this->consecutive_errors >= 5) {
            $this->update([
                'status' => 'error',
                'is_connected' => false,
            ]);
        }
    }

    public function recordSuccess(): void
    {
        $this->update([
            'consecutive_errors' => 0,
            'last_error' => null,
            'last_activity' => now(),
        ]);
    }

    public function resetDailyCounts(): void
    {
        $this->update([
            'daily_sent' => 0,
            'warmup_emails_today' => 0,
            'daily_sent_date' => now()->toDateString(),
        ]);
    }

    public function resetHourlyCounts(): void
    {
        $this->update([
            'hourly_sent' => 0,
            'hourly_sent_reset' => now(),
        ]);
    }

    // Static methods
    public static function getAvailableProviders(): array
    {
        return [
            'gmail' => [
                'name' => 'Gmail',
                'enabled' => true,
                'oauth' => true,
                'coming_soon' => false,
            ],
            'imap' => [
                'name' => 'IMAP/SMTP',
                'enabled' => false,
                'oauth' => false,
                'coming_soon' => true,
            ],
            'outlook' => [
                'name' => 'Outlook',
                'enabled' => false,
                'oauth' => true,
                'coming_soon' => true,
            ],
            'yahoo' => [
                'name' => 'Yahoo',
                'enabled' => false,
                'oauth' => true,
                'coming_soon' => true,
            ],
        ];
    }
}
