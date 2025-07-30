<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PreparedEmail extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'email_template_id',
        'contact_id',
        'email_account_id',
        'batch_id',
        'contact_name',
        'contact_email',
        'contact_company',
        'contact_job_title',
        'subject',
        'body',
        'personalization_score',
        'personalization_metadata',
        'model_used',
        'status',
        'sent_at',
        'message_id',
        'send_error'
    ];

    protected $casts = [
        'personalization_metadata' => 'array',
        'sent_at' => 'datetime'
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function emailTemplate()
    {
        return $this->belongsTo(UserSavedEmails::class, 'email_template_id');
    }

    public function contact()
    {
        return $this->belongsTo(Contact::class);
    }

    public function emailAccount()
    {
        return $this->belongsTo(EmailAccount::class);
    }
}
