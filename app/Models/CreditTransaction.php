<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CreditTransaction extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'type',
        'amount',
        'description',
        'metadata',
        'expires_at',
        'expired',
        'batch_id',
        'reversal_transaction_id',
        'reference_id',
    ];

    protected $casts = [
        'metadata' => 'array',
        'expires_at' => 'datetime',
        'expired' => 'boolean',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function reversalTransaction(): BelongsTo
    {
        return $this->belongsTo(CreditTransaction::class, 'reversal_transaction_id');
    }

    public function scopeEarned($query)
    {
        return $query->where('amount', '>', 0);
    }

    public function scopeUsed($query)
    {
        return $query->where('amount', '<', 0);
    }

    public function scopeNotExpired($query)
    {
        return $query->where('expired', false)
            ->where(function ($q) {
                $q->whereNull('expires_at')
                    ->orWhere('expires_at', '>', now());
            });
    }
}
