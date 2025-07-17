<?php

namespace App\Http\Controllers;

use App\Jobs\SendCampaignEmailsJob;
use App\Models\UserSavedEmails;
use App\Models\Campaign;
use App\Models\CampaignGroup;
use App\Models\Contact;
use App\Models\EmailAccount;
use App\Models\CampaignExecution;
use App\Services\CampaignService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Support\Facades\Cache;

class CampaignController extends Controller
{
    use AuthorizesRequests;

    protected $campaignService;

    public function __construct(CampaignService $campaignService)
    {
        $this->campaignService = $campaignService;
    }

    public function index(Request $request)
    {
        $userId = Auth::id();

        // Get filter parameters from request
        $search = $request->get('search', '');
        $status = $request->get('status', 'all');
        $assignee = $request->get('assignee', 'all');
        $sortBy = $request->get('sort', 'startDate');
        $sortOrder = $request->get('order', 'desc');

        // Build query with filters
        $query = Campaign::where('user_id', $userId)
            ->with(['emailAccount:id,email,provider,status']);

        // Apply search filter
        if (!empty($search)) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'LIKE', "%{$search}%")
                    ->orWhere('notes', 'LIKE', "%{$search}%");
            });
        }

        // Apply status filter
        if ($status !== 'all') {
            $query->where('status', $status);
        }

        // Apply assignee filter (email account)
        if ($assignee !== 'all') {
            $query->where('email_account_id', $assignee);
        }

        // Apply sorting
        switch ($sortBy) {
            case 'name':
                $query->orderBy('name', $sortOrder);
                break;
            case 'status':
                $query->orderBy('status', $sortOrder);
                break;
            case 'created_at':
                $query->orderBy('created_at', $sortOrder);
                break;
            case 'subscribers':
                // For subscribers, we'll sort by a calculated field later
                break;
            case 'startDate':
            default:
                $query->orderBy('starting_date', $sortOrder)
                    ->orderBy('created_at', 'desc');
                break;
        }

        // Get campaigns
        $campaigns = $query->get()->map(function ($campaign) {
            // Calculate progress
            $progress = $campaign->getProgressPercentage();
            $sentCount = $campaign->executions()->where('status', 'completed')->count(); // Use 'completed' for sent emails
            // Get campaign stats
            $stats = $this->campaignService->getCampaignStats($campaign);

            // Calculate days remaining
            $daysRemaining = 0;
            if ($campaign->starting_date && $campaign->status === 'active') {
                $endDate = \Carbon\Carbon::parse($campaign->starting_date)->addDays(30);
                $daysRemaining = max(0, $endDate->diffInDays(now(), false));
            }

            // Get sequence data for groups count
            $sequenceData = $campaign->sequence_data ?? [];
            $groupsCount = count($sequenceData['groups'] ?? []);

            // Extract tags from campaign metadata or generate them
            $tags = [];
            if (isset($sequenceData['metadata']['tags'])) {
                $tags = $sequenceData['metadata']['tags'];
            } else {
                // Generate tags based on campaign properties
                $tags = [$campaign->status];
                if ($campaign->recipient_settings) {
                    $recipientType = $campaign->recipient_settings['type'] ?? 'all';
                    if ($recipientType !== 'all') {
                        $tags[] = $recipientType;
                    }
                }
                if ($campaign->campaign_settings && isset($campaign->campaign_settings['unsubscribe_enabled'])) {
                    $tags[] = 'automated';
                }
            }

            $subscriberCount = $this->campaignService->getRecipientCount($campaign);

            return [
                'id' => $campaign->id,
                'name' => $campaign->name,
                'status' => $campaign->status,
                'startDate' => $campaign->starting_date ? $campaign->starting_date->format('Y-m-d') : now()->format('Y-m-d'),
                'endDate' => $campaign->starting_date ? $campaign->starting_date->addDays(30)->format('Y-m-d') : now()->addDays(30)->format('Y-m-d'),
                'totalEmails' => $campaign->total_emails ?? 0,
                'emailsSent' => $sentCount,
                'subscribers' => $subscriberCount,
                'openRate' => round($stats['open_rate'] ?? 0, 1),
                'clickRate' => round($stats['click_rate'] ?? 0, 1),
                'groups' => $groupsCount,
                'createdAt' => $campaign->created_at->format('Y-m-d'),
                'description' => $campaign->notes ?? 'Email campaign sequence',
                'tags' => array_unique($tags),
                'progress' => $progress,
                'daysRemaining' => $daysRemaining,
                'needsSetup' => $campaign->needsSetup(),
                'canLaunch' => $campaign->canLaunch(),
                'assignedAccount' => [
                    'id' => $campaign->emailAccount->id ?? 0,
                    'name' => $campaign->emailAccount ? $this->getAccountDisplayName($campaign->emailAccount) : 'No Account',
                    'email' => $campaign->emailAccount->email ?? '',
                    'avatar' => null,
                    'role' => $campaign->emailAccount ? ucfirst($campaign->emailAccount->provider) . ' Account' : 'No Account',
                ],
                // Add sort field for subscribers
                'sort_subscribers' => $subscriberCount,
            ];
        });

        // Apply subscriber sorting if needed (since it's calculated)
        if ($sortBy === 'subscribers') {
            $campaigns = $campaigns->sortBy('sort_subscribers', SORT_REGULAR, $sortOrder === 'desc');
        }

        // Get user's email accounts for filtering
        $emailAccounts = Auth::user()->emailAccounts()
            ->select('id', 'email', 'provider', 'status')
            ->get()
            ->map(function ($account) {
                return [
                    'id' => $account->id,
                    'name' => $this->getAccountDisplayName($account),
                    'email' => $account->email,
                    'provider' => $account->provider,
                    'status' => $account->status,
                ];
            });

        // Calculate overall stats (for all campaigns, not filtered)
        $allCampaigns = Campaign::where('user_id', $userId)->get();
        $totalActiveCampaigns = $allCampaigns->where('status', 'active')->count();
        $totalSubscribers = 0;
        $totalOpenRate = 0;
        $totalClickRate = 0;
        $campaignsWithStats = 0;

        foreach ($allCampaigns as $camp) {
            $totalSubscribers += $this->campaignService->getRecipientCount($camp);
            $campStats = $this->campaignService->getCampaignStats($camp);
            if (isset($campStats['open_rate']) && $campStats['open_rate'] > 0) {
                $totalOpenRate += $campStats['open_rate'];
                $campaignsWithStats++;
            }
            if (isset($campStats['click_rate']) && $campStats['click_rate'] > 0) {
                $totalClickRate += $campStats['click_rate'];
            }
        }

        $avgOpenRate = $campaignsWithStats > 0 ? round($totalOpenRate / $campaignsWithStats, 1) : 0;
        $avgClickRate = $campaignsWithStats > 0 ? round($totalClickRate / $campaignsWithStats, 1) : 0;

        // Get filter options for frontend
        $statusOptions = [
            ['value' => 'all', 'label' => 'All Status'],
            ['value' => 'active', 'label' => 'Active'],
            ['value' => 'scheduled', 'label' => 'Scheduled'],
            ['value' => 'completed', 'label' => 'Completed'],
            ['value' => 'paused', 'label' => 'Paused'],
            ['value' => 'draft', 'label' => 'Draft'],
        ];
        $assigneeOptions = $emailAccounts->prepend([
            'id' => 'all',
            'name' => 'All Assignees',
            'email' => '',
            'provider' => '',
            'status' => '',
        ]);
        $sortOptions = [
            ['value' => 'startDate', 'label' => 'Start Date'],
            ['value' => 'name', 'label' => 'Name'],
            ['value' => 'status', 'label' => 'Status'],
            ['value' => 'subscribers', 'label' => 'Subscribers'],
            ['value' => 'created_at', 'label' => 'Created Date'],
        ];

        return Inertia::render('user/campaign/index', [
            'campaigns' => $campaigns->values(),
            'emailAccounts' => $emailAccounts,
            'stats' => [
                'activeCampaigns' => $totalActiveCampaigns,
                'totalSubscribers' => $totalSubscribers,
                'avgOpenRate' => $avgOpenRate,
                'avgClickRate' => $avgClickRate,
            ],
            'filters' => [
                'search' => $search,
                'status' => $status,
                'assignee' => $assignee,
                'sort' => $sortBy,
                'order' => $sortOrder,
            ],
            'filterOptions' => [
                'status' => $statusOptions,
                'assignees' => $assigneeOptions,
                'sortOptions' => $sortOptions,
            ],
        ]);
    }

    /**
     * AJAX endpoint for real-time filtering
     */
    public function filter(Request $request)
    {
        // Validate request
        $request->validate([
            'search' => 'nullable|string|max:255',
            'status' => 'nullable|string|in:all,active,scheduled,completed,paused,draft',
            'assignee' => 'nullable|string',
            'sort' => 'nullable|string|in:startDate,name,status,created_at',
            'order' => 'nullable|string|in:asc,desc',
        ]);

        // Use the same logic as index but return JSON
        $userId = Auth::id();
        $search = $request->get('search', '');
        $status = $request->get('status', 'all');
        $assignee = $request->get('assignee', 'all');
        $sortBy = $request->get('sort', 'startDate');
        $sortOrder = $request->get('order', 'desc');

        $query = Campaign::where('user_id', $userId)
            ->with(['emailAccount:id,email,provider,status']);

        // Apply filters
        if (!empty($search)) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'LIKE', "%{$search}%")
                    ->orWhere('notes', 'LIKE', "%{$search}%");
            });
        }

        if ($status !== 'all') {
            $query->where('status', $status);
        }

        if ($assignee !== 'all') {
            $query->where('email_account_id', $assignee);
        }

        // Apply sorting
        switch ($sortBy) {
            case 'name':
                $query->orderBy('name', $sortOrder);
                break;
            case 'status':
                $query->orderBy('status', $sortOrder);
                break;
            case 'created_at':
                $query->orderBy('created_at', $sortOrder);
                break;
            case 'startDate':
            default:
                $query->orderBy('starting_date', $sortOrder)
                    ->orderBy('created_at', 'desc');
                break;
        }

        $campaigns = $query->get()->map(function ($campaign) {
            $progress = 0;
            $sentCount = 0;
            if ($campaign->total_emails > 0) {
                $sentCount = CampaignExecution::where('campaign_id', $campaign->id)
                    ->where('status', 'completed') // Use 'completed' for sent emails
                    ->count();
                $progress = round(($sentCount / $campaign->total_emails) * 100);
            }

            $stats = $this->campaignService->getCampaignStats($campaign);

            $daysRemaining = 0;
            if ($campaign->starting_date && $campaign->status === 'active') {
                $endDate = \Carbon\Carbon::parse($campaign->starting_date)->addDays(30);
                $daysRemaining = max(0, $endDate->diffInDays(now(), false));
            }

            $sequenceData = $campaign->sequence_data ?? [];
            $groupsCount = count($sequenceData['groups'] ?? []);

            $tags = [$campaign->status];
            if ($campaign->recipient_settings) {
                $recipientType = $campaign->recipient_settings['type'] ?? 'all';
                if ($recipientType !== 'all') {
                    $tags[] = $recipientType;
                }
            }
            if ($campaign->campaign_settings && isset($campaign->campaign_settings['unsubscribe_enabled'])) {
                $tags[] = 'automated';
            }

            return [
                'id' => $campaign->id,
                'name' => $campaign->name,
                'status' => $campaign->status,
                'startDate' => $campaign->starting_date ? $campaign->starting_date->format('Y-m-d') : now()->format('Y-m-d'),
                'endDate' => $campaign->starting_date ? $campaign->starting_date->addDays(30)->format('Y-m-d') : now()->addDays(30)->format('Y-m-d'),
                'totalEmails' => $campaign->total_emails ?? 0,
                'emailsSent' => $sentCount,
                'subscribers' => $this->campaignService->getRecipientCount($campaign),
                'openRate' => round($stats['open_rate'] ?? 0, 1),
                'clickRate' => round($stats['click_rate'] ?? 0, 1),
                'groups' => $groupsCount,
                'createdAt' => $campaign->created_at->format('Y-m-d'),
                'description' => $campaign->notes ?? 'Email campaign sequence',
                'tags' => array_unique($tags),
                'progress' => $progress,
                'daysRemaining' => $daysRemaining,
                'assignedAccount' => [
                    'id' => $campaign->emailAccount->id ?? 0,
                    'name' => $campaign->emailAccount ? $this->getAccountDisplayName($campaign->emailAccount) : 'No Account',
                    'email' => $campaign->emailAccount->email ?? '',
                    'avatar' => null,
                    'role' => $campaign->emailAccount ? ucfirst($campaign->emailAccount->provider) . ' Account' : 'No Account',
                ],
            ];
        });

        return response()->json([
            'campaigns' => $campaigns->values(),
            'total' => $campaigns->count(),
        ]);
    }

    /**
     * Get display name for email account
     */
    private function getAccountDisplayName($account): string
    {
        if (!$account) return 'No Account';
        $email = $account->email;
        $namePart = explode('@', $email)[0];
        $displayName = str_replace(['.', '_', '-'], ' ', $namePart);
        $displayName = ucwords($displayName);
        return $displayName;
    }

    public function updateSetup(Request $request, Campaign $campaign)
    {
        $this->authorize('update', $campaign);

        $request->validate([
            'email_account_id' => 'required|exists:email_accounts,id',
            'recipient_settings' => 'required|array',
            'recipient_settings.type' => 'required|in:all,classification,tags,selected',
            'campaign_settings' => 'required|array',
            'campaign_settings.unsubscribe_enabled' => 'required|boolean',
            'sending_schedule' => 'required|in:business-hours,extended,24-7,custom',
            'notes' => 'nullable|string|max:1000',
        ]);

        // Validate email account belongs to user
        $emailAccount = EmailAccount::where('id', $request->email_account_id)
            ->where('user_id', Auth::id())
            ->firstOrFail();

        if (!$emailAccount->canSendEmail()) {
            return back()->withErrors(['email_account_id' => 'Selected email account cannot send emails.']);
        }

        try {
            DB::beginTransaction();

            $campaign->update([
                'email_account_id' => $request->email_account_id,
                'recipient_settings' => $request->recipient_settings,
                'campaign_settings' => $request->campaign_settings,
                'sending_schedule' => $request->sending_schedule,
                'notes' => $request->notes,
                'is_setup_complete' => true,
            ]);

            DB::commit();

            Log::info('✅ Campaign setup completed', [
                'campaign_id' => $campaign->id,
                'user_id' => Auth::id(),
                'email_account_id' => $request->email_account_id,
                'recipient_count' => $this->campaignService->getRecipientCount($campaign)
            ]);

            return redirect()->route('user.email.campaign.show', $campaign)
                ->with('success', 'Campaign setup completed successfully!');
        } catch (\Exception $e) {
            Log::error('❌ Failed to save campaign setup', [
                'campaign_id' => $campaign->id,
                'error' => $e->getMessage(),
                'error_section' => 'CAMPAIGN_SETUP'
            ]);
            DB::rollBack();
            return back()->withErrors(['error' => 'Failed to save campaign setup.']);
        }
    }

    public function create()
    {
        $userId = Auth::user()->id;
        $userEmails = UserSavedEmails::where('user_id', $userId)->get();

        $emails = $userEmails->map(function ($email) {
            return [
                'id' => $email->id,
                'subject' => $email->subject,
                'email_content' => $email->email_content,
            ];
        });

        return Inertia::render('user/campaign/create', [
            'emails' => $emails
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'starting_date' => 'required|date|after_or_equal:today',
            'groups' => 'required|array|min:1|max:50',
            'groups.*.title' => 'required|string|max:255',
            'groups.*.delay_days' => 'required|integer|min:0|max:30',
            'groups.*.delay_hours' => 'required|integer|min:0|max:23',
            'groups.*.delay_minutes' => 'required|integer|min:0|max:59',
            'groups.*.order' => 'required|integer|min:1',
            'groups.*.emails' => 'required|array|min:1|max:20',
            'groups.*.emails.*.email_id' => 'required|exists:user_saved_emails,id',
            'groups.*.emails.*.order' => 'required|integer|min:1',
        ]);

        try {
            DB::beginTransaction();

            $sequenceData = $this->buildSequenceData($request);

            $campaign = Campaign::create([
                'user_id' => Auth::id(),
                'name' => $request->name,
                'starting_date' => $request->starting_date,
                'status' => 'draft',
                'total_groups' => count($request->groups),
                'total_emails' => collect($request->groups)->sum(function ($group) {
                    return count($group['emails']);
                }),
                'sequence_data' => $sequenceData,
            ]);

            $this->createCampaignGroups($campaign, $request->groups);

            DB::commit();

            Log::info('✅ Campaign created successfully', [
                'campaign_id' => $campaign->id,
                'user_id' => Auth::id(),
                'total_groups' => $campaign->total_groups,
                'total_emails' => $campaign->total_emails
            ]);

            return redirect()->route('user.email.campaign.setup', ['campaign' => $campaign->id])
                ->with('success', 'Campaign created successfully!');
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('❌ Campaign creation failed', [
                'user_id' => Auth::id(),
                'error' => $e->getMessage(),
                'error_section' => 'CAMPAIGN_CREATION',
                'request_data' => $request->all()
            ]);
            return back()->withErrors(['error' => 'Failed to create campaign. Please try again.']);
        }
    }

    public function show(Campaign $campaign)
    {
        $this->authorize('view', $campaign);

        $campaign->load('emailAccount');

        $stats = $this->campaignService->getCampaignStats($campaign);
        $progress = $this->campaignService->getCampaignProgress($campaign);

        $campaignData = [
            'id' => $campaign->id,
            'name' => $campaign->name,
            'status' => $campaign->status,
            'starting_date' => $campaign->starting_date,
            'total_groups' => $campaign->total_groups,
            'total_emails' => $campaign->total_emails,
            'sequence_data' => $campaign->sequence_data,
            'email_account' => $campaign->emailAccount ? [
                'id' => $campaign->emailAccount->id,
                'email' => $campaign->emailAccount->email,
                'provider' => $campaign->emailAccount->provider,
                'status' => $campaign->emailAccount->status,
                'daily_limit' => $campaign->emailAccount->daily_limit,
                'reputation' => $campaign->emailAccount->reputation,
            ] : null,
            'created_at' => $campaign->created_at,
            'launched_at' => $campaign->launched_at,
            'stats' => $stats,
            'progress' => $progress,
        ];

        return Inertia::render('user/campaign/show', [
            'campaign' => $campaignData
        ]);
    }

    /**
     * Launch a campaign
     */
    public function launch(Campaign $campaign)
    {
        $this->authorize('update', $campaign);

        // Validate campaign can be launched
        if (!$campaign->canLaunch()) {
            return back()->withErrors([
                'error' => 'Campaign cannot be launched. Please ensure setup is complete and campaign is in draft status.'
            ]);
        }

        $result = $this->campaignService->launchCampaign($campaign);

        if ($result['success']) {
            return redirect()->route('user.email.campaign.show', $campaign)
                ->with('success', $result['message']);
        } else {
            return back()->withErrors(['error' => $result['error']]);
        }
    }

    public function toggleSending(Campaign $campaign)
    {
        $this->authorize('update', $campaign);

        if ($campaign->status === 'active') {
            $result = $this->campaignService->pauseCampaign($campaign);
        } elseif ($campaign->status === 'paused') {
            $result = $this->campaignService->resumeCampaign($campaign);
        } else {
            return back()->withErrors(['error' => 'Campaign must be active or paused to toggle sending.']);
        }

        if ($result['success']) {
            return back()->with('success', $result['message']);
        } else {
            return back()->withErrors(['error' => $result['error']]);
        }
    }

    public function setup(Request $request, Campaign $campaign)
    {
        $this->authorize('update', $campaign);

        // Get user's email accounts
        $emailAccounts = Auth::user()->emailAccounts()
            ->select('id', 'email', 'provider', 'status', 'daily_limit', 'reputation', 'warmup_progress', 'is_verified')
            ->get()
            ->map(function ($account) {
                return [
                    'id' => $account->id,
                    'email' => $account->email,
                    'provider' => $account->provider,
                    'status' => $account->status,
                    'daily_limit' => $account->daily_limit,
                    'reputation' => $account->reputation,
                    'warmup_progress' => $account->warmup_progress,
                    'is_verified' => $account->is_verified,
                    'can_send' => $account->canSendEmail(),
                    'remaining_limit' => $account->getRemainingDailyLimit(),
                ];
            });

        // Get contact statistics
        $contactStats = Cache::remember("contact_stats_{$campaign->user_id}", 300, function () {
            $contacts = Contact::forUser(Auth::id())->active();
            return [
                'total_contacts' => $contacts->count(),
                'classifications' => $contacts->select('classification')
                    ->whereNotNull('classification')
                    ->groupBy('classification')
                    ->selectRaw('classification, count(*) as count')
                    ->get()
                    ->mapWithKeys(fn($item) => [$item->classification => $item->count])
                    ->toArray(),
                'all_tags' => $contacts->whereNotNull('tags')
                    ->get()
                    ->pluck('tags')
                    ->flatten()
                    ->unique()
                    ->values()
                    ->toArray(),
            ];
        });

        $data = [
            'campaign' => [
                'id' => $campaign->id,
                'name' => $campaign->name,
                'is_setup_complete' => $campaign->is_setup_complete,
                'email_account_id' => $campaign->email_account_id,
                'recipient_settings' => $campaign->recipient_settings,
                'campaign_settings' => $campaign->campaign_settings,
                'sending_schedule' => $campaign->sending_schedule,
                'notes' => $campaign->notes,
            ],
            'email_accounts' => $emailAccounts,
            'contact_stats' => $contactStats,
            'system_info' => [
                'timezone' => config('app.timezone', 'UTC'),
                'current_time' => now()->format('Y-m-d H:i:s T'),
            ],
            'search_results' => [],
            'recipient_preview' => null,
        ];

        // Handle search and preview requests
        if ($request->has('search') && $request->get('get_contacts')) {
            $data['search_results'] = $this->searchContactsInternal($request, $campaign);
        }

        if ($request->has('get_preview') && $request->has('filter_type')) {
            $data['recipient_preview'] = $this->getRecipientPreview($request, $campaign);
        }

        return Inertia::render('user/campaign/setup', $data);
    }

    /**
     * Update campaign status (pause/resume)
     */
    public function updateStatus(Request $request, Campaign $campaign)
    {
        $this->authorize('update', $campaign);

        $request->validate([
            'status' => 'required|in:active,paused'
        ]);

        $newStatus = $request->status;

        if ($newStatus === 'paused' && $campaign->status === 'active') {
            $result = $this->campaignService->pauseCampaign($campaign);
        } elseif ($newStatus === 'active' && $campaign->status === 'paused') {
            $result = $this->campaignService->resumeCampaign($campaign);
        } else {
            return response()->json([
                'success' => false,
                'error' => 'Invalid status transition'
            ], 400);
        }

        if ($result['success']) {
            return redirect()->with('success', [
                'message' => $result['message'],
                'campaign' => $result['campaign']
            ]);
        } else {
            return redirect()->with('success', [ 
                'error' => $result['error']
            ], 400);
        }
    }

    public function destroy(Campaign $campaign)
    {
        $this->authorize('delete', $campaign);

        try {
            $campaign->delete();
            Log::info('✅ Campaign deleted successfully', ['campaign_id' => $campaign->id, 'user_id' => Auth::id()]);
            return redirect()->route('user.email.campaign')->with('success', 'Campaign deleted successfully!');
        } catch (\Exception $e) {
            Log::error('❌ Failed to delete campaign', [
                'campaign_id' => $campaign->id,
                'user_id' => Auth::id(),
                'error' => $e->getMessage(),
                'error_section' => 'CAMPAIGN_DELETION'
            ]);
            return back()->withErrors(['error' => 'Failed to delete campaign. Please try again.']);
        }
    }

    // Helper methods
    private function buildSequenceData(Request $request): array
    {
        $emailIds = collect($request->groups)
            ->flatMap(function ($group) {
                return collect($group['emails'])->pluck('email_id');
            })
            ->unique()
            ->values();

        $emailsData = UserSavedEmails::whereIn('id', $emailIds)
            ->where('user_id', Auth::id())
            ->get()
            ->keyBy('id');

        $sequenceData = [
            'name' => $request->name,
            'starting_date' => $request->starting_date,
            'groups' => [],
            'metadata' => [
                'created_at' => now()->toISOString(),
                'user_id' => Auth::id(),
            ]
        ];

        foreach ($request->groups as $groupData) {
            $groupEmails = [];
            foreach ($groupData['emails'] as $emailData) {
                $email = $emailsData->get($emailData['email_id']);
                if ($email) {
                    $groupEmails[] = [
                        'id' => $email->id,
                        'subject' => $email->subject,
                        'email_content' => $email->email_content,
                        'order' => $emailData['order'],
                    ];
                }
            }
            usort($groupEmails, function ($a, $b) {
                return $a['order'] <=> $b['order'];
            });

            $sequenceData['groups'][] = [
                'id' => $groupData['order'],
                'title' => $groupData['title'],
                'delay' => [
                    'days' => $groupData['delay_days'],
                    'hours' => $groupData['delay_hours'],
                    'minutes' => $groupData['delay_minutes'],
                ],
                'order' => $groupData['order'],
                'emails' => $groupEmails,
                'status' => 'scheduled',
            ];
        }

        usort($sequenceData['groups'], function ($a, $b) {
            return $a['order'] <=> $b['order'];
        });

        return $sequenceData;
    }

    private function createCampaignGroups(Campaign $campaign, array $groups): void
    {
        foreach ($groups as $groupData) {
            $emailIds = collect($groupData['emails'])
                ->sortBy('order')
                ->pluck('email_id')
                ->values()
                ->toArray();

            CampaignGroup::create([
                'campaign_id' => $campaign->id,
                'title' => $groupData['title'],
                'delay_days' => $groupData['delay_days'],
                'delay_hours' => $groupData['delay_hours'],
                'delay_minutes' => $groupData['delay_minutes'],
                'order' => $groupData['order'],
                'email_ids' => $emailIds,
            ]);
        }
    }

    private function searchContactsInternal(Request $request, Campaign $campaign): array
    {
        $search = $request->get('search');
        if (!$search) {
            return [];
        }

        $query = Contact::forUser(Auth::id())->active();
        $query->search($search);

        $results = $query->select('id', 'name', 'email', 'company', 'classification', 'tags')
            ->orderBy('email')
            ->limit(50)
            ->get();

        return $results->toArray();
    }

    private function getRecipientPreview(Request $request, Campaign $campaign): array
    {
        $filterType = $request->get('filter_type');
        $classifications = $request->get('classifications', []);
        $tags = $request->get('tags', []);

        $query = Contact::forUser(Auth::id())->active();

        if ($filterType === 'classification' && !empty($classifications)) {
            $query->whereIn('classification', $classifications);
        }

        if ($filterType === 'tags' && !empty($tags)) {
            foreach ($tags as $tag) {
                $query->byTag($tag);
            }
        }

        $count = $query->count();
        $preview = $query->select('id', 'name', 'email', 'company')
            ->limit(10)
            ->get();

        return [
            'count' => $count,
            'preview' => $preview->toArray(),
        ];
    }
}
