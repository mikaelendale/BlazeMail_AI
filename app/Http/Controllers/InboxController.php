<?php

namespace App\Http\Controllers;

use App\Models\EmailAccount;
use App\Models\EmailMessage;
use App\Services\GmailInboxService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Inertia\Response;

class InboxController extends Controller
{
    protected GmailInboxService $gmailInboxService;

    public function __construct(GmailInboxService $gmailInboxService)
    {
        $this->gmailInboxService = $gmailInboxService;
        $this->middleware('throttle:100,1'); // 100 requests per minute
    }

    /**
     * Display the inbox 📬 - BULLETPROOF VERSION! 🛡️
     */
    public function index(Request $request): Response
    {
        try {
            $user = Auth::user();

            // SAFE: Get user's connected email accounts with error handling
            $emailAccounts = collect();
            try {
                $emailAccounts = $user->emailAccounts()
                    ->where('is_connected', true)
                    ->where('status', 'active')
                    ->select('id', 'email', 'provider', 'status', 'last_sync', 'created_at')
                    ->get();
            } catch (\Exception $e) {
                Log::error('Failed to load email accounts', [
                    'user_id' => $user->id,
                    'error' => $e->getMessage(),
                ]);
                $emailAccounts = collect();
            }

            // Transform accounts safely
            $safeEmailAccounts = $emailAccounts->map(function ($account) {
                return [
                    'id' => $account->id ?? 0,
                    'email' => $this->sanitizeText($account->email ?? ''),
                    'provider' => $account->provider ?? 'gmail',
                    'status' => $account->status ?? 'unknown',
                    'last_sync' => $account->last_sync ? $account->last_sync->toISOString() : null,
                    'created_at' => $account->created_at ? $account->created_at->toISOString() : now()->toISOString(),
                ];
            })->toArray();

            // Check if user has no connected accounts
            if ($emailAccounts->isEmpty()) {
                return Inertia::render('Inbox/NoAccounts', [
                    'message' => 'No email accounts connected',
                    'action_text' => 'Connect your first email account to start using the inbox.',
                    'connect_url' => route('email-accounts.index'),
                ]);
            }

            // Check if inbox is empty and user hasn't selected an account to sync
            $totalMessages = 0;
            try {
                $totalMessages = EmailMessage::where('user_id', $user->id)->count();
            } catch (\Exception $e) {
                Log::error('Failed to count messages', [
                    'user_id' => $user->id,
                    'error' => $e->getMessage(),
                ]);
            }

            $accountId = $request->input('account_id');

            if ($totalMessages === 0 && !$accountId) {
                return Inertia::render('Inbox/SelectAccount', [
                    'email_accounts' => $safeEmailAccounts,
                    'message' => 'Welcome to your inbox!',
                    'subtitle' => 'Select an email account to sync and start managing your emails.',
                ]);
            }

            // SAFE: Continue with normal inbox logic
            $perPage = max(1, min(100, (int) $request->input('per_page', 25))); // Limit between 1-100
            $filter = $this->sanitizeText($request->input('filter', 'inbox'));
            $search = $this->sanitizeText($request->input('search', ''));

            // SAFE: Build query with error handling
            $messages = collect();
            $messagesMeta = [
                'current_page' => 1,
                'last_page' => 1,
                'per_page' => $perPage,
                'total' => 0,
            ];

            try {
                // Build query
                $query = EmailMessage::where('user_id', $user->id)
                    ->with('emailAccount')
                    ->recentFirst();

                // Apply account filter
                if ($accountId && $accountId !== 'all' && is_numeric($accountId)) {
                    $query->where('email_account_id', (int) $accountId);
                }

                // Apply status filters
                switch ($filter) {
                    case 'unread':
                        $query->unread();
                        break;
                    case 'important':
                        $query->important();
                        break;
                    case 'starred':
                        $query->starred();
                        break;
                    case 'cold':
                        $query->coldEmails();
                        break;
                    case 'replies':
                        $query->replies();
                        break;
                    default:
                        $query->inbox();
                        break;
                }

                // Apply search safely
                if (!empty($search) && strlen($search) >= 2) {
                    $query->search($search);
                }

                // Get paginated results
                $paginatedMessages = $query->paginate($perPage);

                $messagesMeta = [
                    'current_page' => $paginatedMessages->currentPage(),
                    'last_page' => $paginatedMessages->lastPage(),
                    'per_page' => $paginatedMessages->perPage(),
                    'total' => $paginatedMessages->total(),
                ];

                $messages = $paginatedMessages->getCollection();
            } catch (\Exception $e) {
                Log::error('Failed to load messages', [
                    'user_id' => $user->id,
                    'filter' => $filter,
                    'search' => $search,
                    'error' => $e->getMessage(),
                ]);
                // Continue with empty collection
            }

            // SAFE: Transform messages for frontend with UTF-8 protection
            $transformedMessages = $messages->map(function ($message) {
                try {
                    return [
                        'id' => $message->id ?? 0,
                        'subject' => $this->sanitizeText($message->subject ?? '(No Subject)'),
                        'from_email' => $this->sanitizeText($message->from_email ?? ''),
                        'from_name' => $this->sanitizeText($message->from_name ?? ''),
                        'to_email' => $this->sanitizeText($message->to_email ?? ''),
                        'snippet' => $this->sanitizeText($message->snippet ?? ''),
                        'is_read' => (bool) ($message->is_read ?? false),
                        'is_important' => (bool) ($message->is_important ?? false),
                        'is_starred' => (bool) ($message->is_starred ?? false),
                        'is_cold_email' => (bool) ($message->is_cold_email ?? false),
                        'is_reply' => (bool) ($message->is_reply ?? false),
                        'has_attachments' => (bool) ($message->has_attachments ?? false),
                        'received_at' => $message->received_at ? $message->received_at->toISOString() : now()->toISOString(),
                        'short_date' => $this->getShortDate($message->received_at ?? now()),
                        'account' => [
                            'id' => $message->emailAccount->id ?? 0,
                            'email' => $this->sanitizeText($message->emailAccount->email ?? ''),
                            'provider' => $message->emailAccount->provider ?? 'gmail',
                        ],
                    ];
                } catch (\Exception $e) {
                    Log::error('Failed to transform message', [
                        'message_id' => $message->id ?? 'unknown',
                        'error' => $e->getMessage(),
                    ]);

                    // Return safe fallback
                    return [
                        'id' => $message->id ?? 0,
                        'subject' => '(Error loading message)',
                        'from_email' => '',
                        'from_name' => '',
                        'to_email' => '',
                        'snippet' => '',
                        'is_read' => true,
                        'is_important' => false,
                        'is_starred' => false,
                        'is_cold_email' => false,
                        'is_reply' => false,
                        'has_attachments' => false,
                        'received_at' => now()->toISOString(),
                        'short_date' => 'Unknown',
                        'account' => [
                            'id' => 0,
                            'email' => '',
                            'provider' => 'gmail',
                        ],
                    ];
                }
            })->toArray();

            // SAFE: Get inbox stats with error handling
            $stats = [
                'total_messages' => 0,
                'unread_messages' => 0,
                'cold_emails' => 0,
                'replies' => 0,
                'important_messages' => 0,
            ];

            try {
                $stats = [
                    'total_messages' => EmailMessage::where('user_id', $user->id)->count(),
                    'unread_messages' => EmailMessage::where('user_id', $user->id)->unread()->count(),
                    'cold_emails' => EmailMessage::where('user_id', $user->id)->coldEmails()->count(),
                    'replies' => EmailMessage::where('user_id', $user->id)->replies()->count(),
                    'important_messages' => EmailMessage::where('user_id', $user->id)->important()->count(),
                ];
            } catch (\Exception $e) {
                Log::error('Failed to load stats', [
                    'user_id' => $user->id,
                    'error' => $e->getMessage(),
                ]);
            }

            return Inertia::render('Inbox/Index', [
                'messages' => [
                    'data' => $transformedMessages,
                    'meta' => $messagesMeta,
                ],
                'email_accounts' => $safeEmailAccounts,
                'stats' => $stats,
                'filters' => [
                    'filter' => $filter,
                    'search' => $search,
                    'account_id' => $accountId,
                ],
            ]);
        } catch (\Exception $e) {
            // LOG THE ERROR BUT DON'T SHOW TO USER! 🛡️
            Log::error('Inbox page critical error', [
                'user_id' => Auth::id(),
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'request_data' => $request->all(),
            ]);

            // GRACEFUL FALLBACK - USER SEES CLEAN ERROR PAGE
            return Inertia::render('Inbox/Index', [
                'messages' => [
                    'data' => [],
                    'meta' => [
                        'current_page' => 1,
                        'last_page' => 1,
                        'per_page' => 25,
                        'total' => 0,
                    ],
                ],
                'email_accounts' => [],
                'stats' => [
                    'total_messages' => 0,
                    'unread_messages' => 0,
                    'cold_emails' => 0,
                    'replies' => 0,
                    'important_messages' => 0,
                ],
                'filters' => [
                    'filter' => 'inbox',
                    'search' => '',
                    'account_id' => null,
                ],
                'error' => 'Unable to load inbox at this time. Please try again later.',
            ]);
        }
    }

    /**
     * SAFE: Sanitize text to prevent UTF-8 errors 🧹
     */
    private function sanitizeText(?string $text): string
    {
        if (empty($text)) {
            return '';
        }

        try {
            // Remove invalid UTF-8 characters
            $text = mb_convert_encoding($text, 'UTF-8', 'UTF-8');

            // Remove null bytes and control characters
            $text = preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/', '', $text);

            // Ensure it's valid UTF-8
            if (!mb_check_encoding($text, 'UTF-8')) {
                return '(Invalid encoding)';
            }

            // Truncate if too long
            return mb_substr($text, 0, 1000);
        } catch (\Exception $e) {
            Log::warning('Text sanitization failed', [
                'original_length' => strlen($text ?? ''),
                'error' => $e->getMessage(),
            ]);
            return '(Text encoding error)';
        }
    }

    /**
     * SAFE: Get short date format 📅
     */
    private function getShortDate($date): string
    {
        try {
            if (!$date) {
                return 'Unknown';
            }

            $now = now();
            $received = is_string($date) ? \Carbon\Carbon::parse($date) : $date;

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
        } catch (\Exception $e) {
            return 'Unknown';
        }
    }

    /**
     * Show specific email message 📧 - BULLETPROOF VERSION!
     */
    public function show(EmailMessage $message): Response
    {
        // Ensure user owns this message
        if ($message->user_id !== Auth::id()) {
            abort(404);
        }

        try {
            // Mark as read
            if (!$message->is_read) {
                $message->markAsRead();
            }

            // Get thread messages
            $threadMessages = $message->getThreadEmails();

            // Transform messages for frontend
            $transformedMessages = $threadMessages->map(function ($msg) {
                return [
                    'id' => $msg->id,
                    'subject' => $msg->subject ?? '',
                    'from_email' => $msg->from_email ?? '',
                    'from_name' => $msg->from_name ?? '',
                    'to_email' => $msg->to_email ?? '',
                    'to_name' => $msg->to_name ?? '',
                    'body_html' => $msg->body_html ?? '',
                    'body_text' => $msg->body_text ?? '',
                    'snippet' => $msg->snippet ?? '',
                    'is_read' => (bool) $msg->is_read,
                    'is_important' => (bool) $msg->is_important,
                    'is_starred' => (bool) $msg->is_starred,
                    'is_cold_email' => (bool) $msg->is_cold_email,
                    'is_reply' => (bool) $msg->is_reply,
                    'has_attachments' => (bool) $msg->has_attachments,
                    'attachments' => $msg->attachments ?? [],
                    'received_at' => $msg->received_at ? $msg->received_at->toISOString() : now()->toISOString(),
                    'formatted_date' => $msg->getFormattedDate(),
                    'account' => [
                        'id' => $msg->emailAccount->id ?? 0,
                        'email' => $msg->emailAccount->email ?? '',
                        'provider' => $msg->emailAccount->provider ?? 'gmail',
                    ],
                ];
            })->toArray();

            return Inertia::render('Inbox/Show', [
                'message' => $transformedMessages[0] ?? null,
                'thread_messages' => $transformedMessages,
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to load email message', [
                'message_id' => $message->id,
                'user_id' => Auth::id(),
                'error' => $e->getMessage(),
            ]);

            return Inertia::render('Inbox/Show', [
                'message' => null,
                'thread_messages' => [],
                'error' => 'Failed to load message',
            ]);
        }
    }

    /**
     * SAFE: Get formatted date 📅
     */
    private function getFormattedDate($date): string
    {
        try {
            if (!$date) {
                return 'Unknown';
            }

            $received = is_string($date) ? \Carbon\Carbon::parse($date) : $date;
            return $received->format('M j, Y g:i A');
        } catch (\Exception $e) {
            return 'Unknown';
        }
    }

    /**
     * Sync inbox messages 🔄 - SAFE VERSION
     */
    public function sync(Request $request)
    {
        try {
            $user = Auth::user();
            $accountId = $request->input('account_id');

            if ($accountId && is_numeric($accountId)) {
                // Sync specific account
                $account = EmailAccount::where('id', (int) $accountId)
                    ->where('user_id', $user->id)
                    ->first();

                if (!$account) {
                    return redirect()->back()->with('error', 'Account not found');
                }

                $result = $this->gmailInboxService->fetchInboxMessages($account);
            } else {
                // Sync all accounts
                $result = $this->gmailInboxService->syncAllAccountsForUser($user->id);
            }

            return redirect()->back()->with('success', 'Inbox sync completed successfully!');
        } catch (\Exception $e) {
            Log::error('Inbox sync failed', [
                'user_id' => Auth::id(),
                'error' => $e->getMessage(),
            ]);

            return redirect()->back()->with('error', 'Sync temporarily unavailable. Please try again later.');
        }
    }

    /**
     * Mark messages as read/unread 📖 - SAFE VERSION
     */
    public function markAsRead(Request $request)
    {
        try {
            $messageIds = $request->input('message_ids', []);
            $read = $request->input('read', true);

            if (empty($messageIds) || !is_array($messageIds)) {
                return redirect()->back()->with('error', 'No messages selected');
            }

            // Sanitize message IDs
            $messageIds = array_filter(array_map('intval', $messageIds));

            if (empty($messageIds)) {
                return redirect()->back()->with('error', 'Invalid message selection');
            }

            // Verify user owns these messages
            $messages = EmailMessage::where('user_id', Auth::id())
                ->whereIn('id', $messageIds)
                ->get();

            if ($messages->count() !== count($messageIds)) {
                return redirect()->back()->with('error', 'Some messages not found');
            }

            // Update messages
            if ($read) {
                EmailMessage::markMultipleAsRead($messageIds);
                $message = 'Messages marked as read';
            } else {
                EmailMessage::markMultipleAsUnread($messageIds);
                $message = 'Messages marked as unread';
            }

            return redirect()->back()->with('success', $message);
        } catch (\Exception $e) {
            Log::error('Mark as read failed', [
                'user_id' => Auth::id(),
                'error' => $e->getMessage(),
            ]);

            return redirect()->back()->with('error', 'Update failed. Please try again.');
        }
    }

    /**
     * Toggle star on message ⭐ - SAFE VERSION
     */
    public function toggleStar(EmailMessage $message)
    {
        if ($message->user_id !== Auth::id()) {
            return redirect()->back()->with('error', 'Unauthorized');
        }

        try {
            $message->toggleStar();
            $starStatus = $message->fresh()->is_starred ? 'starred' : 'unstarred';

            return redirect()->back()->with('success', "Message {$starStatus}");
        } catch (\Exception $e) {
            Log::error('Toggle star failed', [
                'message_id' => $message->id,
                'error' => $e->getMessage(),
            ]);

            return redirect()->back()->with('error', 'Update failed. Please try again.');
        }
    }

    /**
     * Delete messages 🗑️ - SAFE VERSION
     */
    public function destroy(Request $request)
    {
        try {
            $messageIds = $request->input('message_ids', []);

            if (empty($messageIds) || !is_array($messageIds)) {
                return redirect()->back()->with('error', 'No messages selected');
            }

            // Sanitize message IDs
            $messageIds = array_filter(array_map('intval', $messageIds));

            if (empty($messageIds)) {
                return redirect()->back()->with('error', 'Invalid message selection');
            }

            // Verify user owns these messages
            $messages = EmailMessage::where('user_id', Auth::id())
                ->whereIn('id', $messageIds)
                ->get();

            if ($messages->count() !== count($messageIds)) {
                return redirect()->back()->with('error', 'Some messages not found');
            }

            // Soft delete (mark as trash)
            EmailMessage::deleteMultiple($messageIds);

            return redirect()->back()->with('success', 'Messages deleted successfully');
        } catch (\Exception $e) {
            Log::error('Delete messages failed', [
                'user_id' => Auth::id(),
                'error' => $e->getMessage(),
            ]);

            return redirect()->back()->with('error', 'Delete failed. Please try again.');
        }
    }

    /**
     * Mark message as important 🔥 - SAFE VERSION
     */
    public function markAsImportant(EmailMessage $message)
    {
        if ($message->user_id !== Auth::id()) {
            return redirect()->back()->with('error', 'Unauthorized');
        }

        try {
            $message->markAsImportant();

            return redirect()->back()->with('success', 'Message marked as important');
        } catch (\Exception $e) {
            Log::error('Mark as important failed', [
                'message_id' => $message->id,
                'error' => $e->getMessage(),
            ]);

            return redirect()->back()->with('error', 'Update failed. Please try again.');
        }
    }

    /**
     * Sync specific account and redirect to inbox 🔄 - SAFE VERSION
     */
    public function syncAccount(Request $request)
    {
        try {
            $user = Auth::user();
            $accountId = $request->input('account_id');

            if (!$accountId || !is_numeric($accountId)) {
                return redirect()->back()->with('error', 'Please select an account to sync');
            }

            // Get the account
            $account = EmailAccount::where('id', (int) $accountId)
                ->where('user_id', $user->id)
                ->where('is_connected', true)
                ->first();

            if (!$account) {
                return redirect()->back()->with('error', 'Account not found or not connected');
            }

            // Sync the account
            $result = $this->gmailInboxService->fetchInboxMessages($account, 100);

            if (is_array($result) && isset($result['success']) && $result['success']) {
                $message = "Successfully synced {$account->email}! ";
                $message .= "Fetched {$result['fetched_count']} messages, {$result['new_count']} new.";

                return redirect()->route('inbox.index', ['account_id' => $accountId])
                    ->with('success', $message);
            } else {
                return redirect()->back()->with('error', 'Sync completed but some issues occurred. Please try again if needed.');
            }
        } catch (\Exception $e) {
            Log::error('Account sync failed', [
                'user_id' => Auth::id(),
                'account_id' => $request->input('account_id'),
                'error' => $e->getMessage(),
            ]);

            return redirect()->back()->with('error', 'Sync temporarily unavailable. Please try again later.');
        }
    }
}
