<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class UserOnboarding extends Model
{
    protected $fillable = [
        'user_id', 
        'profile_completed',
        'first_email_sent',
        'user_goal',
        'custom_goal',
        'user_info',
        'email_data',
    ];

    protected $casts = [
        'email_connected' => 'boolean',
        'profile_completed' => 'boolean',
        'first_email_sent' => 'boolean',
        'user_info' => 'array',
        'email_data' => 'array',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}