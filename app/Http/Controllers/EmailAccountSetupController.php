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

        // Prepare setup data with defaults for confirmation emails
        $setupData = [
            // Sender Profile
            'sender_name' => $settings['sender_name'] ?? Auth::user()->name ?? '',
            'from_email' => $account->email,
            'reply_to_email' => $settings['reply_to_email'] ?? $account->email,
            'signature' => $settings['signature'] ?? '',

            // Batch Configuration for Confirmation Emails
            'batch_size' => $settings['batch_size'] ?? 50, // 50 emails per batch
            'batch_delay_minutes' => $settings['batch_delay_minutes'] ?? 60, // 60 minutes between batches
            'max_emails_per_day' => $account->daily_limit ?? 400, // Safe Gmail limit
            'send_window_start' => $settings['send_window_start'] ?? '08:00',
            'send_window_end' => $settings['send_window_end'] ?? '18:00',

            // Confirmation Email Features
            'auto_unsubscribe' => $settings['auto_unsubscribe'] ?? true,
            'tracking_enabled' => $settings['tracking_enabled'] ?? true,
            'compliance_confirmed' => $settings['compliance_confirmed'] ?? false,

            // Error Handling
            'retry_failed_emails' => $settings['retry_failed_emails'] ?? true,
            'max_retry_attempts' => $settings['max_retry_attempts'] ?? 3,
            'pause_on_errors' => $settings['pause_on_errors'] ?? true,
            'notify_on_errors' => $settings['notify_on_errors'] ?? true,
        ];

        // Check if setup is complete
        $isSetupComplete = $this->isSetupComplete($account);

        return Inertia::render('settings/setup', [
            'account' => $account->load('user'),
            'setupData' => $setupData,
            'isSetupComplete' => $isSetupComplete,
            'bestPractices' => $this->getBestPractices(),
            'batchingGuidelines' => $this->getBatchingGuidelines(),
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

            // Batch Configuration
            'batch_size' => 'required|integer|min:10|max:100', // 10-100 emails per batch
            'batch_delay_minutes' => 'required|integer|min:30|max:180', // 30-180 minutes delay
            'max_emails_per_day' => 'required|integer|min:50|max:400', // Gmail safe limits
            'send_window_start' => 'required|date_format:H:i',
            'send_window_end' => 'required|date_format:H:i|after:send_window_start',

            // Features
            'auto_unsubscribe' => 'boolean',
            'tracking_enabled' => 'boolean',
            'compliance_confirmed' => 'required|accepted',

            // Error Handling
            'retry_failed_emails' => 'boolean',
            'max_retry_attempts' => 'required|integer|min:1|max:5',
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

                // Batch Configuration
                'batch_size' => $validated['batch_size'],
                'batch_delay_minutes' => $validated['batch_delay_minutes'],
                'send_window_start' => $validated['send_window_start'],
                'send_window_end' => $validated['send_window_end'],

                // Features
                'auto_unsubscribe' => $validated['auto_unsubscribe'] ?? false,
                'tracking_enabled' => $validated['tracking_enabled'] ?? false,
                'compliance_confirmed' => $validated['compliance_confirmed'],

                // Error Handling
                'retry_failed_emails' => $validated['retry_failed_emails'] ?? false,
                'max_retry_attempts' => $validated['max_retry_attempts'],
                'pause_on_errors' => $validated['pause_on_errors'] ?? false,
                'notify_on_errors' => $validated['notify_on_errors'] ?? false,

                // Setup completion
                'setup_completed_at' => now()->toISOString(),
                'setup_version' => '2.0',
                'account_type' => 'confirmation_emails',
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
                    'account_purpose' => 'confirmation_emails',
                    'batch_configuration' => [
                        'batch_size' => $validated['batch_size'],
                        'delay_minutes' => $validated['batch_delay_minutes'],
                        'daily_limit' => $validated['max_emails_per_day'],
                    ],
                ]),
            ];

            $account->update($updateData);

            Log::info('Gmail confirmation email account setup completed', [
                'account_id' => $account->id,
                'user_id' => Auth::id(),
                'email' => $account->email,
                'batch_size' => $validated['batch_size'],
                'daily_limit' => $validated['max_emails_per_day'],
                'delay_minutes' => $validated['batch_delay_minutes'],
            ]);

            return redirect()->route('settings.email-accounts')
                ->with('success', '🎉 Gmail account configured for confirmation emails! Ready to send batched campaigns.');
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
            'batch_size',
            'batch_delay_minutes',
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
     * Get best practices for confirmation emails
     */
    private function getBestPractices(): array
    {
        return [
            'content' => [
                'title' => 'Content Best Practices',
                'items' => [
                    'Use clear, descriptive subject lines (e.g., "Confirm your account")',
                    'Keep emails short and focused on the confirmation action',
                    'Include your company name and branding for trust',
                    'Use a clear call-to-action button',
                    'Avoid promotional content in confirmation emails',
                ]
            ],
            'sending' => [
                'title' => 'Sending Best Practices',
                'items' => [
                    'Send confirmation emails immediately after signup',
                    'Use consistent "From" name and email address',
                    'Stick to business hours (8 AM - 6 PM) when possible',
                    'Monitor bounce rates and remove invalid emails',
                    'Keep daily volume under 400 emails per Gmail account',
                ]
            ],
            'compliance' => [
                'title' => 'Compliance Guidelines',
                'items' => [
                    'Only send to users who explicitly requested confirmation',
                    'Include unsubscribe links (automatically added)',
                    'Add your physical business address',
                    'Respect user preferences and opt-outs',
                    'Follow CAN-SPAM and GDPR regulations',
                ]
            ],
        ];
    }

    /**
     * Get batching guidelines
     */
    private function getBatchingGuidelines(): array
    {
        return [
            'recommended_settings' => [
                'title' => 'Recommended Batch Settings',
                'batch_size' => 50,
                'delay_minutes' => 60,
                'daily_limit' => 400,
                'description' => 'These settings work well for most confirmation email campaigns while staying within Gmail limits.',
            ],
            'campaign_examples' => [
                [
                    'name' => 'Small Campaign (≤200 emails)',
                    'batch_size' => 50,
                    'batches' => 4,
                    'total_time' => '3 hours',
                    'description' => 'Perfect for daily signups or small product launches',
                ],
                [
                    'name' => 'Medium Campaign (≤400 emails)',
                    'batch_size' => 50,
                    'batches' => 8,
                    'total_time' => '7 hours',
                    'description' => 'Good for weekly campaigns or moderate traffic sites',
                ],
            ],
            'timing_tips' => [
                'Start campaigns early in the day to complete within business hours',
                'Avoid sending during weekends unless necessary',
                'Monitor for bounces and errors between batches',
                'Pause campaigns if error rate exceeds 5%',
            ],
        ];
    }
}
