<?php

namespace App\Http\Controllers;

use App\Models\EmailAccount;
use Illuminate\Http\Request;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;
use Inertia\Inertia;
use Inertia\Response;

class EmailAccountSetupController extends Controller
{
    /**
     * Show the setup page for a specific email account
     */
    public function show(EmailAccount $account): Response
    {
        // Ensure user owns this account
        if ($account->user_id !== Auth::id()) {
            abort(403, 'Unauthorized access to email account');
        }

        // Get current settings or defaults
        $settings = $account->settings ?? [];
        $metadata = $account->metadata ?? [];

        // Prepare setup data with defaults
        $setupData = [
            // Sender Profile
            'sender_name' => $settings['sender_name'] ?? Auth::user()->name ?? '',
            'from_email' => $account->email,
            'reply_to_email' => $settings['reply_to_email'] ?? $account->email,
            'signature' => $settings['signature'] ?? '',

            // Warm-up Settings
            'warmup_enabled' => $settings['warmup_enabled'] ?? true,
            'warmup_daily_volume' => $settings['warmup_daily_volume'] ?? 30,
            'warmup_timezone' => $settings['warmup_timezone'] ?? 'UTC',
            'warmup_template_style' => $settings['warmup_template_style'] ?? 'professional',

            // Compliance & Safety
            'auto_unsubscribe' => $settings['auto_unsubscribe'] ?? true,
            'tracking_enabled' => $settings['tracking_enabled'] ?? true,
            'compliance_confirmed' => $settings['compliance_confirmed'] ?? false,

            // Sending Limits
            'max_emails_per_day' => $account->daily_limit,
            'send_window_start' => $settings['send_window_start'] ?? '08:00',
            'send_window_end' => $settings['send_window_end'] ?? '17:00',

            // Fallback Behavior
            'retry_failed_emails' => $settings['retry_failed_emails'] ?? true,
            'max_retry_attempts' => $settings['max_retry_attempts'] ?? 3,
            'pause_on_errors' => $settings['pause_on_errors'] ?? true,
            'notify_on_errors' => $settings['notify_on_errors'] ?? true,
        ];

        // Check if setup is complete
        $isSetupComplete = $this->isSetupComplete($account);

        return Inertia::render('Settings/EmailAccounts/Setup', [
            'account' => $account->load('user'),
            'setupData' => $setupData,
            'isSetupComplete' => $isSetupComplete,
            'timezones' => $this->getTimezones(),
            'templateStyles' => $this->getTemplateStyles(),
            'breadcrumbs' => [
                ['title' => 'Settings', 'href' => '/settings'],
                ['title' => 'Email Accounts', 'href' => '/settings/email-accounts'],
                ['title' => 'Setup Account', 'href' => ''],
            ],
        ]);
    }

    /**
     * Save the setup configuration
     */
    public function store(Request $request, EmailAccount $account): RedirectResponse
    {
        // Ensure user owns this account
        if ($account->user_id !== Auth::id()) {
            abort(403, 'Unauthorized access to email account');
        }

        // Validate the setup data
        $validator = Validator::make($request->all(), [
            // Sender Profile
            'sender_name' => 'required|string|max:255',
            'reply_to_email' => 'required|email|max:255',
            'signature' => 'nullable|string|max:2000',

            // Warm-up Settings
            'warmup_enabled' => 'boolean',
            'warmup_daily_volume' => 'required|integer|min:5|max:200',
            'warmup_timezone' => 'required|string|max:50',
            'warmup_template_style' => 'required|in:professional,casual,friendly',

            // Compliance & Safety
            'auto_unsubscribe' => 'boolean',
            'tracking_enabled' => 'boolean',
            'compliance_confirmed' => 'required|accepted',

            // Sending Limits
            'max_emails_per_day' => 'required|integer|min:10|max:1000',
            'send_window_start' => 'required|date_format:H:i',
            'send_window_end' => 'required|date_format:H:i|after:send_window_start',

            // Fallback Behavior
            'retry_failed_emails' => 'boolean',
            'max_retry_attempts' => 'required|integer|min:1|max:10',
            'pause_on_errors' => 'boolean',
            'notify_on_errors' => 'boolean',
        ]);

        if ($validator->fails()) {
            return redirect()->back()
                ->withErrors($validator)
                ->withInput();
        }

        try {
            $validated = $validator->validated();

            // Prepare settings data
            $settings = [
                // Sender Profile
                'sender_name' => $validated['sender_name'],
                'reply_to_email' => $validated['reply_to_email'],
                'signature' => $validated['signature'] ?? '',

                // Warm-up Settings
                'warmup_enabled' => $validated['warmup_enabled'] ?? false,
                'warmup_daily_volume' => $validated['warmup_daily_volume'],
                'warmup_timezone' => $validated['warmup_timezone'],
                'warmup_template_style' => $validated['warmup_template_style'],

                // Compliance & Safety
                'auto_unsubscribe' => $validated['auto_unsubscribe'] ?? false,
                'tracking_enabled' => $validated['tracking_enabled'] ?? false,
                'compliance_confirmed' => $validated['compliance_confirmed'],

                // Sending Limits
                'send_window_start' => $validated['send_window_start'],
                'send_window_end' => $validated['send_window_end'],

                // Fallback Behavior
                'retry_failed_emails' => $validated['retry_failed_emails'] ?? false,
                'max_retry_attempts' => $validated['max_retry_attempts'],
                'pause_on_errors' => $validated['pause_on_errors'] ?? false,
                'notify_on_errors' => $validated['notify_on_errors'] ?? false,

                // Setup completion
                'setup_completed_at' => now()->toISOString(),
                'setup_version' => '1.0',
            ];

            // Update account with new settings
            $updateData = [
                'settings' => $settings,
                'daily_limit' => $validated['max_emails_per_day'],
                'status' => 'active', // Mark as active when setup is complete
                'metadata' => array_merge($account->metadata ?? [], [
                    'setup_completed' => true,
                    'setup_completed_at' => now()->toISOString(),
                    'last_settings_update' => now()->toISOString(),
                ]),
            ];

            // If warmup is enabled, set status to warming
            if ($validated['warmup_enabled']) {
                $updateData['status'] = 'warming';
                $updateData['warmup_progress'] = 0;
                $updateData['warmup_day'] = 1;
                $updateData['warmup_schedule'] = $this->generateWarmupSchedule(
                    $validated['warmup_daily_volume'],
                    $validated['warmup_timezone']
                );
            }

            $account->update($updateData);

            Log::info('Email account setup completed', [
                'account_id' => $account->id,
                'user_id' => Auth::id(),
                'email' => $account->email,
                'warmup_enabled' => $validated['warmup_enabled'],
                'daily_limit' => $validated['max_emails_per_day'],
            ]);

            return redirect()->route('settings.email-accounts')
                ->with('success', '🎉 Email account setup completed successfully! Your account is now ready to send emails.');
        } catch (\Exception $e) {
            Log::error('Email account setup failed', [
                'account_id' => $account->id,
                'user_id' => Auth::id(),
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return redirect()->back()
                ->with('error', 'Setup failed: ' . $e->getMessage())
                ->withInput();
        }
    }

    /**
     * Check if account setup is complete
     */
    private function isSetupComplete(EmailAccount $account): bool
    {
        $settings = $account->settings ?? [];

        $requiredFields = [
            'sender_name',
            'reply_to_email',
            'compliance_confirmed',
            'setup_completed_at',
        ];

        foreach ($requiredFields as $field) {
            if (empty($settings[$field])) {
                return false;
            }
        }

        return true;
    }

    /**
     * Get available timezones
     */
    private function getTimezones(): array
    {
        return [
            'UTC' => 'UTC (Coordinated Universal Time)',
            'America/New_York' => 'Eastern Time (US & Canada)',
            'America/Chicago' => 'Central Time (US & Canada)',
            'America/Denver' => 'Mountain Time (US & Canada)',
            'America/Los_Angeles' => 'Pacific Time (US & Canada)',
            'Europe/London' => 'London (GMT/BST)',
            'Europe/Paris' => 'Paris (CET/CEST)',
            'Europe/Berlin' => 'Berlin (CET/CEST)',
            'Asia/Tokyo' => 'Tokyo (JST)',
            'Asia/Shanghai' => 'Shanghai (CST)',
            'Australia/Sydney' => 'Sydney (AEST/AEDT)',
        ];
    }

    /**
     * Get available template styles
     */
    private function getTemplateStyles(): array
    {
        return [
            'professional' => [
                'name' => 'Professional',
                'description' => 'Formal business communication style',
            ],
            'casual' => [
                'name' => 'Casual',
                'description' => 'Relaxed and friendly tone',
            ],
            'friendly' => [
                'name' => 'Friendly',
                'description' => 'Warm and approachable style',
            ],
        ];
    }

    /**
     * Generate warmup schedule based on daily volume
     */
    private function generateWarmupSchedule(int $dailyVolume, string $timezone): array
    {
        // Generate a 30-day warmup schedule
        $schedule = [];
        $currentVolume = 5; // Start with 5 emails per day

        for ($day = 1; $day <= 30; $day++) {
            $schedule["day_{$day}"] = [
                'day' => $day,
                'volume' => min($currentVolume, $dailyVolume),
                'timezone' => $timezone,
            ];

            // Gradually increase volume
            if ($day % 3 === 0 && $currentVolume < $dailyVolume) {
                $currentVolume += 5;
            }
        }

        return $schedule;
    }
}
