<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Contact extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'name',
        'email',
        'company',
        'job_title',
        'custom_fields',
        'classification',
        'status',
        'tags',
        'last_contacted'
    ];

    protected $casts = [
        'custom_fields' => 'array',
    ];

    // Relationship: contact belongs to a user
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    // Scope for filtering
    public function scopeSearch($query, $term)
    {
        return $query->where(function ($q) use ($term) {
            $q->where('name', 'like', "%{$term}%")
                ->orWhere('email', 'like', "%{$term}%")
                ->orWhere('company', 'like', "%{$term}%")
                ->orWhere('job_title', 'like', "%{$term}%");
        });
    }
    public function scopeForUser($query, $userId)
    {
        return $query->where('user_id', $userId);
    }
    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }
    public function getFullNameAttribute(): string
    {
        return $this->name;
    }

    public function getDisplayNameAttribute(): string
    {
        return $this->getFullNameAttribute();
    }
}
