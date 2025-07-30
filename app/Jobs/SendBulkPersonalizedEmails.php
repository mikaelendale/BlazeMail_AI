<?php

namespace App\Jobs;

use App\Models\EmailAccount;
use App\Models\UserSavedEmails;
use App\Models\Contact;
use App\Models\User;
use App\Models\PreparedEmail;
use App\Services\GmailService;
use App\Services\CreditService;
use App\Services\PersonalizationEngine;
use App\Services\JobProgressService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Notification;
use App\Notifications\BulkEmailJobCompleted;
use Illuminate\Support\Str;
use Exception;

class SendBulkPersonalizedEmails implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    protected $userEmail;
    protected $recipients;
    protected $userId;
    protected $emailAccountId;

    public $timeout = 600;
    public $tries = 3;
    public $maxExceptions = 3;

    public function __construct(UserSavedEmails $userEmail, array $recipients, int $userId, int $emailAccountId)
    {
        $this->userEmail = $userEmail;
        $this->recipients = $recipients;
        $this->userId = $userId;
        $this->emailAccountId = $emailAccountId;
    }

    public function handle(GmailService $gmailService, CreditService $creditService, JobProgressService $progressService)
    {
        $user = null;
        $jobStartTime = now();
        $batchId = Str::uuid()->toString();
        $jobId = $this->job->getJobId();

        try {
            Log::info('🚀 Starting OPTIMIZED bulk email preparation with LIVE PROGRESS', [
                'job_id' => $jobId,
                'batch_id' => $batchId,
                'email_id' => $this->userEmail->id,
                'recipients_count' => count($this->recipients),
                'user_id' => $this->userId,
                'started_at' => $jobStartTime->toISOString()
            ]);

            $user = User::findOrFail($this->userId);
            $totalCreditsNeeded = count($this->recipients) * $creditService->getCreditCost('email_generation');

            if (!$creditService->hasCredits($user, 'email_generation', $totalCreditsNeeded)) {
                $creditInfo = $creditService->canPerformAction($user, 'email_generation');
                throw new Exception("Insufficient credits. Need {$totalCreditsNeeded}, have {$creditInfo['current_balance']}");
            }

            // 🔥 START PROGRESS TRACKING
            $progress = $progressService->startJob(
                $jobId,
                $batchId,
                $this->userId,
                'bulk_email_preparation',
                count($this->recipients),
                [
                    'email_template_id' => $this->userEmail->id,
                    'email_template_subject' => $this->userEmail->subject,
                    'email_account_id' => $this->emailAccountId
                ]
            );

            $emailAccount = $this->getEmailAccount();
            $engine = new PersonalizationEngine();

            $successCount = 0;
            $failureCount = 0;
            $creditsUsed = 0;
            $refundedCredits = 0;
            $preparedEmails = [];

            // Process recipients with live progress updates
            $recipientBatches = array_chunk($this->recipients, 5);

            foreach ($recipientBatches as $batchIndex => $batch) {
                foreach ($batch as $recipientIndex => $recipientId) {
                    $creditTransaction = null;
                    $overallIndex = ($batchIndex * 5) + $recipientIndex + 1;

                    try {
                        $contact = Contact::findOrFail($recipientId);

                        // 🔥 UPDATE PROGRESS WITH CURRENT CONTACT
                        $progressService->updateProgress(
                            $jobId,
                            $overallIndex - 1, // processed (not including current)
                            $successCount,
                            $failureCount,
                            [
                                'contact_id' => $contact->id,
                                'contact_name' => $contact->name,
                                'contact_email' => $contact->email,
                                'status' => 'processing',
                                'step' => 'personalizing_email'
                            ]
                        );

                        Log::info('🎯 Processing contact with LIVE PROGRESS', [
                            'contact_id' => $contact->id,
                            'contact_name' => $contact->name,
                            'batch_id' => $batchId,
                            'progress' => "{$overallIndex}/" . count($this->recipients)
                        ]);

                        // Deduct credits
                        $creditResult = $creditService->attemptCreditUsage(
                            $user,
                            'email_generation',
                            null,
                            [
                                'contact_id' => $contact->id,
                                'batch_id' => $batchId,
                                'processing_step' => 'email_preparation'
                            ]
                        );

                        if (!$creditResult['success']) {
                            Log::error('❌ Credit deduction failed', [
                                'contact_id' => $contact->id,
                                'error' => $creditResult['message']
                            ]);
                            $failureCount++;

                            // Update progress with failure
                            $progressService->updateProgress(
                                $jobId,
                                $overallIndex,
                                $successCount,
                                $failureCount,
                                [
                                    'contact_id' => $contact->id,
                                    'contact_name' => $contact->name,
                                    'status' => 'failed',
                                    'error' => 'Credit deduction failed'
                                ]
                            );
                            continue;
                        }

                        $creditsUsed += $creditResult['credits_used'];
                        $creditTransaction = $creditResult['transaction_id'] ?? null;

                        // Update progress - now personalizing
                        $progressService->updateProgress(
                            $jobId,
                            $overallIndex - 1,
                            $successCount,
                            $failureCount,
                            [
                                'contact_id' => $contact->id,
                                'contact_name' => $contact->name,
                                'status' => 'personalizing',
                                'step' => 'ai_personalization'
                            ]
                        );

                        // AI Personalization
                        $personalized = $engine->personalizeWithAdvancedAI($contact, $this->userEmail);

                        // Store prepared email
                        $preparedEmail = PreparedEmail::create([
                            'user_id' => $this->userId,
                            'email_template_id' => $this->userEmail->id,
                            'contact_id' => $contact->id,
                            'email_account_id' => $this->emailAccountId,
                            'batch_id' => $batchId,
                            'contact_name' => $contact->name,
                            'contact_email' => $contact->email,
                            'contact_company' => $contact->company,
                            'contact_job_title' => $contact->job_title,
                            'subject' => $personalized['subject'],
                            'body' => $personalized['body'],
                            'personalization_score' => $personalized['personalization_score'] ?? 0,
                            'personalization_metadata' => [
                                'key_personalizations' => $personalized['key_personalizations'] ?? [],
                                'psychological_triggers' => $personalized['psychological_triggers'] ?? [],
                                'industry_insights' => $personalized['industry_insights'] ?? [],
                                'role_adaptations' => $personalized['role_adaptations'] ?? []
                            ],
                            'model_used' => $personalized['model_used'] ?? 'fallback',
                            'status' => 'pending'
                        ]);

                        $preparedEmails[] = [
                            'id' => $preparedEmail->id,
                            'contact_name' => $contact->name,
                            'contact_email' => $contact->email,
                            'subject' => $personalized['subject'],
                            'personalization_score' => $personalized['personalization_score'] ?? 0,
                            'model_used' => $personalized['model_used'] ?? 'fallback'
                        ];

                        $successCount++;

                        // 🔥 UPDATE PROGRESS WITH SUCCESS
                        $progressService->updateProgress(
                            $jobId,
                            $overallIndex,
                            $successCount,
                            $failureCount,
                            [
                                'contact_id' => $contact->id,
                                'contact_name' => $contact->name,
                                'status' => 'completed',
                                'personalization_score' => $personalized['personalization_score'] ?? 0,
                                'model_used' => $personalized['model_used'] ?? 'fallback'
                            ]
                        );

                        Log::info('✅ Email prepared with LIVE PROGRESS', [
                            'contact_id' => $contact->id,
                            'prepared_email_id' => $preparedEmail->id,
                            'personalization_score' => $personalized['personalization_score'] ?? 0,
                            'model_used' => $personalized['model_used'] ?? 'fallback',
                            'progress' => "{$overallIndex}/" . count($this->recipients)
                        ]);
                    } catch (Exception $e) {
                        $failureCount++;

                        // Refund credits if failed
                        if ($creditTransaction) {
                            try {
                                $refundResult = $creditService->addCredits(
                                    $user,
                                    $creditResult['credits_used'],
                                    'refund',
                                    "Refund for failed email preparation - Contact: {$contact->name}",
                                    ['batch_id' => $batchId, 'contact_id' => $recipientId],
                                    null,
                                    "batch_refund_{$batchId}_{$recipientId}",
                                    $creditTransaction
                                );
                                $refundedCredits += $creditResult['credits_used'];
                            } catch (Exception $refundException) {
                                Log::error('Failed to refund credits', [
                                    'contact_id' => $recipientId,
                                    'error' => $refundException->getMessage()
                                ]);
                            }
                        }

                        // Update progress with failure
                        $progressService->updateProgress(
                            $jobId,
                            $overallIndex,
                            $successCount,
                            $failureCount,
                            [
                                'contact_id' => $recipientId,
                                'contact_name' => $contact->name ?? 'Unknown',
                                'status' => 'failed',
                                'error' => $e->getMessage()
                            ]
                        );

                        Log::error('❌ Failed to prepare email with LIVE PROGRESS', [
                            'contact_id' => $recipientId,
                            'error' => $e->getMessage(),
                            'batch_id' => $batchId,
                            'progress' => "{$overallIndex}/" . count($this->recipients)
                        ]);
                    }
                }

                // Small delay between batches
                if (count($recipientBatches) > 1) {
                    usleep(100000); // 0.1 second
                }
            }

            $jobEndTime = now();
            $jobDuration = $jobStartTime->diffInSeconds($jobEndTime);

            // 🔥 COMPLETE PROGRESS TRACKING
            $progressService->completeJob($jobId, true);

            Log::info('🎉 OPTIMIZED bulk email preparation completed with LIVE PROGRESS', [
                'batch_id' => $batchId,
                'job_id' => $jobId,
                'successful' => $successCount,
                'failed' => $failureCount,
                'total_processed' => count($this->recipients),
                'success_rate' => $successCount > 0 ? round(($successCount / count($this->recipients)) * 100, 2) : 0,
                'credits_used' => $creditsUsed,
                'credits_refunded' => $refundedCredits,
                'job_duration_seconds' => $jobDuration,
                'avg_time_per_email' => $successCount > 0 ? round($jobDuration / $successCount, 2) : 0
            ]);

            // 🔥 SEND NOTIFICATION WITH CORRECT REVIEW LINK
            $reviewUrl = route('emails.review', ['batch' => $batchId]);

            $this->sendJobCompletionNotification($user, true, [
                'batch_id' => $batchId,
                'successful' => $successCount,
                'failed' => $failureCount,
                'total_processed' => count($this->recipients),
                'credits_used' => $creditsUsed,
                'credits_refunded' => $refundedCredits,
                'net_credits_used' => $creditsUsed - $refundedCredits,
                'job_duration' => $jobDuration,
                'prepared_emails' => $preparedEmails,
                'review_url' => $reviewUrl, // 🔥 FIXED: Proper review URL
                'average_personalization_score' => $successCount > 0 ?
                    round(collect($preparedEmails)->avg('personalization_score'), 2) : 0
            ]);
        } catch (Exception $e) {
            // Complete progress tracking with error
            if (isset($progressService) && isset($jobId)) {
                $progressService->completeJob($jobId, false, $e->getMessage());
            }

            Log::error('💥 Bulk email preparation job failed with LIVE PROGRESS', [
                'batch_id' => $batchId ?? 'unknown',
                'job_id' => $jobId,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            if ($user) {
                $this->sendJobCompletionNotification($user, false, [
                    'error' => $e->getMessage(),
                    'batch_id' => $batchId ?? null,
                    'total_recipients' => count($this->recipients)
                ]);
            }

            $this->fail($e);
        }
    }

    private function sendJobCompletionNotification(User $user, bool $success, array $data): void
    {
        try {
            Notification::send($user, new BulkEmailJobCompleted([
                'success' => $success,
                'job_type' => 'bulk_email_preparation',
                'email_template_id' => $this->userEmail->id,
                'email_template_subject' => $this->userEmail->subject,
                'data' => $data,
                'completed_at' => now()->toISOString()
            ]));

            Log::info('🔔 Job completion notification sent with review link', [
                'user_id' => $user->id,
                'success' => $success,
                'batch_id' => $data['batch_id'] ?? null,
                'review_url' => $data['review_url'] ?? null
            ]);
        } catch (Exception $e) {
            Log::error('Failed to send notification', [
                'user_id' => $user->id,
                'error' => $e->getMessage()
            ]);
        }
    }

    private function getEmailAccount(): EmailAccount
    {
        return EmailAccount::where('id', $this->emailAccountId)
            ->where('user_id', $this->userId)
            ->where('status', 'active')
            ->where('is_connected', true)
            ->firstOrFail();
    }

    public function failed(\Throwable $exception)
    {
        $jobId = $this->job->getJobId();

        // Complete progress tracking with error
        try {
            $progressService = app(JobProgressService::class);
            $progressService->completeJob($jobId, false, $exception->getMessage());
        } catch (Exception $e) {
            Log::error('Failed to update progress on job failure', ['error' => $e->getMessage()]);
        }

        Log::error('💥 Bulk email preparation job failed completely', [
            'job_id' => $jobId,
            'error' => $exception->getMessage()
        ]);

        try {
            $user = User::find($this->userId);
            if ($user) {
                $this->sendJobCompletionNotification($user, false, [
                    'error' => $exception->getMessage(),
                    'failure_type' => 'job_exception',
                    'total_recipients' => count($this->recipients)
                ]);
            }
        } catch (Exception $e) {
            Log::error('Failed to send failure notification', ['error' => $e->getMessage()]);
        }
    }
}
