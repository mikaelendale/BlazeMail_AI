<?php

namespace App\Http\Controllers;

use App\Models\PreparedEmail;
use App\Models\EmailAccount;
use App\Services\GmailService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Exception;

class EmailReviewController extends Controller
{
    public function review(Request $request, string $batch)
    {
        $user = auth()->user();

        $preparedEmails = PreparedEmail::where('batch_id', $batch)
            ->where('user_id', $user->id)
            ->with(['contact', 'emailTemplate', 'emailAccount'])
            ->orderBy('created_at')
            ->get();

        if ($preparedEmails->isEmpty()) {
            return redirect()->route('dashboard')->with('error', 'Email batch not found.');
        }

        $stats = [
            'total' => $preparedEmails->count(),
            'pending' => $preparedEmails->where('status', 'pending')->count(),
            'approved' => $preparedEmails->where('status', 'approved')->count(),
            'sent' => $preparedEmails->where('status', 'sent')->count(),
            'failed' => $preparedEmails->where('status', 'failed')->count(),
            'avg_score' => round($preparedEmails->avg('personalization_score'), 1),
            'models_used' => $preparedEmails->groupBy('model_used')->map->count()
        ];

        return Inertia::render('user/email/review', [
            'batchId' => $batch,
            'emails' => $preparedEmails->map(function ($email) {
                return [
                    'id' => $email->id,
                    'contact_name' => $email->contact_name,
                    'contact_email' => $email->contact_email,
                    'contact_company' => $email->contact_company,
                    'contact_job_title' => $email->contact_job_title,
                    'subject' => $email->subject,
                    'body' => $email->body,
                    'personalization_score' => $email->personalization_score,
                    'model_used' => $email->model_used,
                    'status' => $email->status,
                    'personalization_metadata' => $email->personalization_metadata,
                    'created_at' => $email->created_at->format('M j, Y g:i A')
                ];
            }),
            'stats' => $stats,
            'emailTemplate' => [
                'id' => $preparedEmails->first()->emailTemplate->id,
                'subject' => $preparedEmails->first()->emailTemplate->subject,
                'purpose' => $preparedEmails->first()->emailTemplate->purpose
            ]
        ]);
    }

    public function sendApproved(Request $request, string $batch)
    {
        $user = auth()->user();

        $approvedEmails = PreparedEmail::where('batch_id', $batch)
            ->where('user_id', $user->id)
            ->where('status', 'approved')
            ->with(['emailAccount'])
            ->get();

        if ($approvedEmails->isEmpty()) {
            return response()->json(['error' => 'No approved emails found'], 400);
        }

        $gmailService = app(GmailService::class);
        $sent = 0;
        $failed = 0;

        foreach ($approvedEmails as $email) {
            try {
                // For now, simulate sending (you can uncomment for real sending)
                // $result = [
                //     'success' => true,
                //     'message_id' => uniqid('sent_', true)
                // ];

                // Real sending (uncomment when ready):
                $result = $gmailService->sendEmail(
                    $email->emailAccount,
                    [
                        'to' => $email->contact_email,
                        'from' => $email->emailAccount->email,
                        'subject' => $email->subject,
                        'body' => $email->body
                    ]
                );

                if ($result['success']) {
                    $email->update([
                        'status' => 'sent',
                        'sent_at' => now(),
                        'message_id' => $result['message_id']
                    ]);
                    $sent++;
                } else {
                    $email->update([
                        'status' => 'failed',
                        'send_error' => $result['error'] ?? 'Unknown error'
                    ]);
                    $failed++;
                }

                // Add delay between sends
                usleep(500000); // 0.5 second delay

            } catch (Exception $e) {
                $email->update([
                    'status' => 'failed',
                    'send_error' => $e->getMessage()
                ]);
                $failed++;

                Log::error('Failed to send approved email', [
                    'email_id' => $email->id,
                    'error' => $e->getMessage()
                ]);
            }
        }

        return back()->with(
            'success', "Successfully sent {$sent} emails" . ($failed > 0 ? ", {$failed} failed" : "")
        );
    }

    public function updateStatus(Request $request, string $batch)
    {
        $request->validate([
            'email_ids' => 'required|array',
            'status' => 'required|in:approved,pending'
        ]);

        $user = auth()->user();

        $updated = PreparedEmail::where('batch_id', $batch)
            ->where('user_id', $user->id)
            ->whereIn('id', $request->email_ids)
            ->update(['status' => $request->status]);

        return back()->with(
            'success', "Updated {$updated} emails to {$request->status}"
        );
    }

    /**
     * 🔥 NEW: Send all approved emails without review
     */
    public function sendAll(Request $request, string $batch)
    {
        $user = auth()->user();

        $preparedEmails = PreparedEmail::where('batch_id', $batch)
            ->where('user_id', $user->id)
            ->where('status', 'pending')
            ->with(['emailAccount'])
            ->get();

        if ($preparedEmails->isEmpty()) {
            return response()->json(['error' => 'No emails found to send'], 400);
        }

        // Auto-approve all emails and send them
        $gmailService = app(GmailService::class);
        $sent = 0;
        $failed = 0;

        foreach ($preparedEmails as $email) {
            try {
                // Auto-approve
                $email->update(['status' => 'approved']);

                // Simulate sending (uncomment for real sending)
                $result = [
                    'success' => true,
                    'message_id' => uniqid('sent_', true)
                ];

                // Real sending:
                // $result = $gmailService->sendEmail([...]);

                if ($result['success']) {
                    $email->update([
                        'status' => 'sent',
                        'sent_at' => now(),
                        'message_id' => $result['message_id']
                    ]);
                    $sent++;
                } else {
                    $email->update([
                        'status' => 'failed',
                        'send_error' => $result['error'] ?? 'Unknown error'
                    ]);
                    $failed++;
                }

                usleep(500000); // 0.5 second delay

            } catch (Exception $e) {
                $email->update([
                    'status' => 'failed',
                    'send_error' => $e->getMessage()
                ]);
                $failed++;

                Log::error('Failed to send email', [
                    'email_id' => $email->id,
                    'error' => $e->getMessage()
                ]);
            }
        }

        return response()->json([
            'success' => true,
            'sent' => $sent,
            'failed' => $failed,
            'message' => "Auto-sent {$sent} emails" . ($failed > 0 ? ", {$failed} failed" : "")
        ]);
    }
}
