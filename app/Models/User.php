<?php

namespace App\Models;

use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Paddle\Billable;
use Spatie\Permission\Traits\HasRoles;

class User extends Authenticatable implements MustVerifyEmail
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory, Notifiable, HasRoles, Billable;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'referred_by',
        'provider_id',
        'provider_name',
        'provider_token',
        'provider_refresh_token',
        'own_referral_code',
        'subscription_status',
        'onboarding_status',
        'credit_balance', // Add this
        'referral_credits', // Add this
        'device_fingerprint', // Add this
        'last_credit_activity', // Add this
        'fraud_score', // Add this
        'account_status', // Add this
        'credit_metadata', // Add this
        'last_monthly_refill_at', // Add this
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
        'provider_token',
        'provider_refresh_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'last_credit_activity' => 'datetime', // Cast as datetime
            'last_monthly_refill_at' => 'datetime', // Cast as datetime
            'credit_metadata' => 'array', // Cast as array
        ];
    }

    /**
     * Get the customer's name to associate with Paddle.
     */
    public function paddleName(): string|null
    {
        return $this->name;
    }

    /**
     * Get the customer's email address to associate with Paddle.
     */
    public function paddleEmail(): string|null
    {
        return $this->email;
    }

    /**
     * Get the email accounts associated with the user.
     */
    public function emailAccounts(): HasMany
    {
        return $this->hasMany(EmailAccount::class);
    }

    /**
     * Get active email accounts only
     */
    public function activeEmailAccounts(): HasMany
    {
        return $this->emailAccounts()->active();
    }

    /**
     * Get accounts ready to send emails
     */
    public function readyEmailAccounts(): HasMany
    {
        return $this->emailAccounts()->readyToSend();
    }

    /**
     * Get total daily email limit across all accounts
     */
    public function getTotalDailyLimitAttribute(): int
    {
        return $this->activeEmailAccounts()->sum('daily_limit');
    }

    /**
     * Get total emails sent today across all accounts
     */
    public function getTotalDailySentAttribute(): int
    {
        return $this->activeEmailAccounts()->sum('daily_sent');
    }

    /**
     * Check if user has reached overall sending limits
     */
    public function canSendEmails(): bool
    {
        return $this->readyEmailAccounts()->count() > 0;
    }

    public function emailMessages(): HasMany
    {
        return $this->hasMany(EmailMessage::class);
    }

    /**
     * Get the user's onboarding data.
     */
    public function onboarding(): HasOne
    {
        return $this->hasOne(UserOnboarding::class);
    }

    /**
     * Get the user's credit transactions.
     */
    public function creditTransactions(): HasMany
    {
        return $this->hasMany(CreditTransaction::class);
    }
    /**
     * Get the user's Contacts.
     */
    public function contacts(): HasMany
    {
        return $this->hasMany(Contact::class);
    }
};
