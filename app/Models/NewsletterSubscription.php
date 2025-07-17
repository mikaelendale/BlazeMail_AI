<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Support\Str;

class NewsletterSubscription extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'email',
        'name',
        'email_verified_at',
        'verification_token',
        'is_active',
        'preferences',
    ];

    protected $casts = [
        'email_verified_at' => 'datetime',
        'is_active' => 'boolean',
        'preferences' => 'array',
    ];

    public static function subscribe($email, $name = null)
    {
        $subscription = self::firstOrCreate(
            ['email' => $email],
            [
                'name' => $name,
                'verification_token' => Str::random(60),
                'is_active' => false,
            ]
        );

        // Send verification email here
        // Mail::to($subscription->email)->send(new VerifyNewsletterSubscription($subscription));

        return $subscription;
    }

    public function verify($token)
    {
        if ($this->verification_token === $token) {
            $this->update([
                'email_verified_at' => now(),
                'verification_token' => null,
                'is_active' => true,
            ]);
            return true;
        }
        return false;
    }
}
