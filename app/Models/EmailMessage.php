<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Log;

class EmailMessage extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'email_account_id',
        'gmail_message_id',
        'gmail_thread_id',
        'gmail_labels',
        'message_id',
        'subject',
        'from_email',
        'from_name',
        'to_email',
        'to_name',
        'reply_to',
        'cc',
        'bcc',
        'body_html',
        'body_text',
        'snippet',
        'is_read',
        'is_important',
        'is_starred',
        'is_draft',
        'is_sent',
        'is_spam',
        'is_trash',
        'size_bytes',
        'has_attachments',
        'attachments',
        'is_cold_email',
        'is_reply',
        'in_reply_to',
        'references',
        'received_at',
        'sent_at',
        'synced_at',
        'sync_status',
        'sync_error',
        'metadata',
    ];

    protected $casts = [
        'gmail_labels' => 'array',
        'cc' => 'array',
        'bcc' => 'array',
        'is_read' => 'boolean',
        'is_important' => 'boolean',
        'is_starred' => 'boolean',
        'is_draft' => 'boolean',
        'is_sent' => 'boolean',
        'is_spam' => 'boolean',
        'is_trash' => 'boolean',
        'has_attachments' => 'boolean',
        'is_cold_email' => 'boolean',
        'is_reply' => 'boolean',
        'attachments' => 'array',
        'references' => 'array',
        'received_at' => 'datetime',
        'sent_at' => 'datetime',
        'synced_at' => 'datetime',
        'metadata' => 'array',
    ];

    /**
     * Relationships 🔗
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function emailAccount(): BelongsTo
    {
        return $this->belongsTo(EmailAccount::class);
    }

    /**
     * Scopes for filtering 🔍
     */
    public function scopeInbox($query)
    {
        return $query->where('is_sent', false)
            ->where('is_draft', false)
            ->where('is_spam', false)
            ->where('is_trash', false);
    }

    public function scopeUnread($query)
    {
        return $query->where('is_read', false);
    }

    public function scopeImportant($query)
    {
        return $query->where('is_important', true);
    }

    public function scopeStarred($query)
    {
        return $query->where('is_starred', true);
    }

    public function scopeColdEmails($query)
    {
        return $query->where('is_cold_email', true);
    }

    public function scopeReplies($query)
    {
        return $query->where('is_reply', true);
    }

    public function scopeRecentFirst($query)
    {
        return $query->orderBy('received_at', 'desc');
    }

    public function scopeByThread($query, string $threadId)
    {
        return $query->where('gmail_thread_id', $threadId);
    }

    /**
     * Helper methods 🛠️
     */
    public function markAsRead(): void
    {
        $this->update(['is_read' => true]);
    }

    public function markAsUnread(): void
    {
        $this->update(['is_read' => false]);
    }

    public function toggleStar(): void
    {
        $this->update(['is_starred' => !$this->is_starred]);
    }

    public function markAsImportant(): void
    {
        $this->update(['is_important' => true]);
    }

    public function detectIfColdEmail(): bool
    {
        // Smart detection logic for cold emails
        $coldEmailIndicators = [
            'unsubscribe',
            'cold',
            'outreach',
            'partnership',
            'collaboration',
            'marketing',
            'sales',
            'proposal',
            'interested in',
            'reaching out',
        ];

        $content = strtolower($this->body_text ?? '') . ' ' . strtolower($this->subject ?? '');

        foreach ($coldEmailIndicators as $indicator) {
            if (str_contains($content, $indicator)) {
                return true;
            }
        }

        return false;
    }

    public function getThreadEmails()
    {
        return static::where('gmail_thread_id', $this->gmail_thread_id)
            ->where('email_account_id', $this->email_account_id)
            ->orderBy('received_at', 'asc')
            ->get();
    }

    public function getFormattedDate(): string
    {
        return $this->received_at->format('M j, Y g:i A');
    }

    public function getShortDate(): string
    {
        $now = now();
        $received = $this->received_at;

        if ($received->isToday()) {
            return $received->format('g:i A');
        } elseif ($received->isYesterday()) {
            return 'Yesterday';
        } elseif ($received->isCurrentWeek()) {
            return $received->format('D');
        } elseif ($received->isCurrentYear()) {
            return $received->format('M j');
        } else {
            return $received->format('M j, Y');
        }
    }

    public function getTruncatedSubject(int $length = 50): string
    {
        return strlen($this->subject) > $length
            ? substr($this->subject, 0, $length) . '...'
            : $this->subject;
    }

    public function getTruncatedSnippet(int $length = 100): string
    {
        return strlen($this->snippet) > $length
            ? substr($this->snippet, 0, $length) . '...'
            : $this->snippet;
    }

    /**
     * Search functionality 🔍
     */
    public function scopeSearch($query, string $search)
    {
        return $query->where(function ($q) use ($search) {
            $q->where('subject', 'like', "%{$search}%")
                ->orWhere('from_email', 'like', "%{$search}%")
                ->orWhere('from_name', 'like', "%{$search}%")
                ->orWhere('body_text', 'like', "%{$search}%");
        });
    }

    /**
     * Bulk operations 🏗️
     */
    public static function markMultipleAsRead(array $messageIds): void
    {
        static::whereIn('id', $messageIds)->update(['is_read' => true]);
    }

    public static function markMultipleAsUnread(array $messageIds): void
    {
        static::whereIn('id', $messageIds)->update(['is_read' => false]);
    }

    public static function deleteMultiple(array $messageIds): void
    {
        static::whereIn('id', $messageIds)->update(['is_trash' => true]);
    }

    /**
     * Statistics 📊
     */
    public static function getUnreadCount(int $userId): int
    {
        return static::where('user_id', $userId)->unread()->count();
    }

    public static function getColdEmailCount(int $userId): int
    {
        return static::where('user_id', $userId)->coldEmails()->count();
    }

    public static function getReplyCount(int $userId): int
    {
        return static::where('user_id', $userId)->replies()->count();
    }
}
