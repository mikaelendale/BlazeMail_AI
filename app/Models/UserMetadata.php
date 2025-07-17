<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class UserMetadata extends Model
{
    protected $table = 'user_metadata';
    protected $fillable = [
        'user_id',
        'utm_source',
        'utm_medium',
        'utm_campaign',
        'utm_term',
        'utm_content',
        'referrer',
        'ip',
        'country',
        'city',
        'device',
        'browser',
        'is_returning',
        'referral_code',
        'platform',
    ];
}
