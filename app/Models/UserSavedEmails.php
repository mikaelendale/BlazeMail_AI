<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class UserSavedEmails extends Model
{
    use HasFactory;

    protected $table = 'user_saved_emails';

    protected $fillable = [
        'user_id',
        'subject',
        'recipient',
        'sender',
        'audience',
        'tone',
        'purpose',
        'cta',
        'context',
        'prompt',
        'email_content',
        'feedback',
        'model_used',
        'meta',
    ];

    protected $casts = [
        'meta' => 'array',
    ];

    // Optional: relationship to User
    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
