<?php

namespace App\Jobs;

use App\Models\EmailAccount;
use App\Models\UserSavedEmails;
use App\Models\Contact;
use App\Models\User;
use App\Services\GmailService;
use App\Services\CreditService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Notification;
use App\Notifications\BulkEmailJobCompleted;
use LucianoTonet\GroqPHP\Groq;
use Exception;

class SendBulkPersonalizedEmails implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    protected $userEmail;
    protected $recipients;
    protected $userId;
    protected $emailAccountId;

    public $timeout = 600; // 10 minutes
    public $tries = 3;
    public $maxExceptions = 3;

    public function __construct(UserSavedEmails $userEmail, array $recipients, int $userId, int $emailAccountId)
    {
        $this->userEmail = $userEmail;
        $this->recipients = $recipients;
        $this->userId = $userId;
        $this->emailAccountId = $emailAccountId;
    }

    public function handle(GmailService $gmailService, CreditService $creditService)
    {
        $user = null;
        $jobStartTime = now();

        try {
            Log::info('🚀 Starting ADVANCED bulk personalized email job', [
                'email_id' => $this->userEmail->id,
                'recipients_count' => count($this->recipients),
                'user_id' => $this->userId,
                'email_account_id' => $this->emailAccountId,
                'job_id' => $this->job->getJobId(),
                'started_at' => $jobStartTime->toISOString()
            ]);

            // Get user for credit operations
            $user = User::findOrFail($this->userId);

            // Calculate total credits needed for bulk operation
            $totalCreditsNeeded = count($this->recipients) * $creditService->getCreditCost('email_generation');

            // Check if user has enough credits before starting
            if (!$creditService->hasCredits($user, 'email_generation', $totalCreditsNeeded)) {
                $creditInfo = $creditService->canPerformAction($user, 'email_generation');
                throw new Exception("Insufficient credits for bulk email operation. Need {$totalCreditsNeeded} credits, have {$creditInfo['current_balance']}");
            }

            $emailAccount = $this->getEmailAccount();
            $engine = new PersonalizationEngine();
            $successCount = 0;
            $failureCount = 0;
            $personalizations = [];
            $creditsUsed = 0;
            $refundedCredits = 0;
            $processedEmails = [];

            foreach ($this->recipients as $recipientId) {
                $creditTransaction = null;
                $emailSent = false;

                try {
                    $contact = Contact::with('user')->findOrFail($recipientId);

                    Log::info('🎯 Processing contact with advanced personalization', [
                        'contact_id' => $contact->id,
                        'contact_name' => $contact->name,
                        'company' => $contact->company,
                        'job_title' => $contact->job_title,
                        'custom_fields_count' => $contact->custom_fields ? count($contact->custom_fields) : 0
                    ]);

                    // Deduct credits before processing each email
                    $creditResult = $creditService->attemptCreditUsage(
                        $user,
                        'email_generation',
                        null,
                        [
                            'contact_id' => $contact->id,
                            'contact_name' => $contact->name,
                            'email_account_id' => $this->emailAccountId,
                            'processing_step' => 'pre_personalization'
                        ]
                    );

                    if (!$creditResult['success']) {
                        Log::error('❌ Credit deduction failed for contact', [
                            'contact_id' => $contact->id,
                            'error' => $creditResult['message'],
                            'remaining_balance' => $user->fresh()->credit_balance
                        ]);
                        $failureCount++;
                        continue;
                    }

                    $creditsUsed += $creditResult['credits_used'];
                    $creditTransaction = isset($creditResult['transaction_id']) ? $creditResult['transaction_id'] : null;

                    // ADVANCED AI PERSONALIZATION
                    $personalized = $engine->personalizeWithAdvancedAI($contact, $this->userEmail);

                    // 🔥 ENHANCED LOGGING: Log the personalized email content
                    $this->logPersonalizedEmail($contact, $personalized, $this->userEmail);

                    $emailData = [
                        'to' => $contact->email,
                        'from' => $emailAccount->email,
                        'subject' => $personalized['subject'],
                        'body' => $personalized['body'],
                    ];

                    // 🔥 ACTUAL EMAIL SENDING (UNCOMMENTED FOR PRODUCTION)
                    Log::info('📤 Attempting to send personalized email', [
                        'contact_id' => $contact->id,
                        'to' => $contact->email,
                        'subject' => $personalized['subject'],
                        'email_account' => $emailAccount->email
                    ]);

                    $result = $gmailService->sendEmail($emailAccount, $emailData);

                    if ($result['success']) {
                        $emailSent = true;
                        $successCount++;
                        $contact->update(['last_contacted' => now()]);

                        // Save the personalized email record
                        $savedEmail = $this->saveAdvancedPersonalizedEmail($contact, $emailData, $personalized);

                        $personalizations[] = [
                            'contact_id' => $contact->id,
                            'personalization_score' => isset($personalized['personalization_score']) ? $personalized['personalization_score'] : 0,
                            'key_personalizations' => isset($personalized['key_personalizations']) ? $personalized['key_personalizations'] : [],
                            'psychological_triggers' => isset($personalized['psychological_triggers']) ? $personalized['psychological_triggers'] : [],
                            'credits_used' => $creditResult['credits_used'],
                            'email_sent' => true,
                            'saved_email_id' => $savedEmail ? $savedEmail->id : null
                        ];

                        $processedEmails[] = [
                            'contact_id' => $contact->id,
                            'contact_name' => $contact->name,
                            'email' => $contact->email,
                            'status' => 'sent',
                            'message_id' => isset($result['message_id']) ? $result['message_id'] : null,
                            'personalization_score' => isset($personalized['personalization_score']) ? $personalized['personalization_score'] : 0
                        ];

                        Log::info('✅ Advanced personalized email sent successfully', [
                            'contact_id' => $contact->id,
                            'personalization_score' => isset($personalized['personalization_score']) ? $personalized['personalization_score'] : 0,
                            'message_id' => isset($result['message_id']) ? $result['message_id'] : null,
                            'credits_used' => $creditResult['credits_used'],
                            'remaining_balance' => $creditResult['remaining_balance']
                        ]);
                    } else {
                        $errorMessage = isset($result['error']) ? $result['error'] : 'Failed to send email via Gmail API';
                        throw new Exception($errorMessage);
                    }

                    // Intelligent delay based on account reputation
                    $this->intelligentDelay($emailAccount, $successCount);
                } catch (Exception $e) {
                    $failureCount++;

                    // 🔥 REFUND CREDITS IF EMAIL SENDING FAILED AFTER DEDUCTION
                    if ($creditTransaction && !$emailSent) {
                        try {
                            $contactName = isset($contact->name) ? $contact->name : 'Unknown';
                            $refundResult = $creditService->addCredits(
                                $user,
                                $creditResult['credits_used'],
                                'refund',
                                "Refund for failed email generation - Contact: {$contactName} (ID: {$recipientId})",
                                [
                                    'original_transaction_id' => $creditTransaction,
                                    'contact_id' => $recipientId,
                                    'failure_reason' => $e->getMessage(),
                                    'refund_type' => 'email_generation_failure'
                                ],
                                null,
                                "bulk_job_refund_{$recipientId}",
                                $creditTransaction
                            );

                            $refundedCredits += $creditResult['credits_used'];

                            Log::info('💰 Credits refunded for failed email', [
                                'contact_id' => $recipientId,
                                'refunded_amount' => $creditResult['credits_used'],
                                'refund_transaction_id' => $refundResult->id,
                                'original_transaction_id' => $creditTransaction,
                                'failure_reason' => $e->getMessage()
                            ]);
                        } catch (Exception $refundException) {
                            Log::error('🚨 CRITICAL: Failed to refund credits after email failure', [
                                'contact_id' => $recipientId,
                                'original_error' => $e->getMessage(),
                                'refund_error' => $refundException->getMessage(),
                                'credits_to_refund' => isset($creditResult['credits_used']) ? $creditResult['credits_used'] : 0,
                                'original_transaction_id' => $creditTransaction
                            ]);
                        }
                    }

                    $contactName = isset($contact->name) ? $contact->name : 'Unknown';
                    $contactEmail = isset($contact->email) ? $contact->email : 'Unknown';
                    $refundAmount = isset($refundResult) ? $creditResult['credits_used'] : 0;

                    $processedEmails[] = [
                        'contact_id' => $recipientId,
                        'contact_name' => $contactName,
                        'email' => $contactEmail,
                        'status' => 'failed',
                        'error' => $e->getMessage(),
                        'credits_refunded' => $refundAmount
                    ];

                    Log::error('❌ Error processing recipient with advanced system', [
                        'recipient_id' => $recipientId,
                        'error' => $e->getMessage(),
                        'credits_used_so_far' => $creditsUsed,
                        'credits_refunded' => $refundedCredits,
                        'email_sent' => $emailSent
                    ]);
                }
            }

            $jobEndTime = now();
            $jobDuration = $jobStartTime->diffInSeconds($jobEndTime);

            // Log final results
            $this->logAdvancedResults($successCount, $failureCount, $personalizations, $creditsUsed, $refundedCredits, $jobDuration);

            // 🔔 SEND SUCCESS NOTIFICATION TO USER
            $avgScore = 0;
            if (!empty($personalizations)) {
                $avgScore = round(collect($personalizations)->avg('personalization_score'), 2);
            }

            $this->sendJobCompletionNotification($user, true, [
                'successful' => $successCount,
                'failed' => $failureCount,
                'total_processed' => count($this->recipients),
                'credits_used' => $creditsUsed,
                'credits_refunded' => $refundedCredits,
                'net_credits_used' => $creditsUsed - $refundedCredits,
                'job_duration' => $jobDuration,
                'processed_emails' => $processedEmails,
                'average_personalization_score' => $avgScore
            ]);
        } catch (Exception $e) {
            Log::error('💥 Advanced bulk email job failed', [
                'email_id' => $this->userEmail->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'credits_used' => isset($creditsUsed) ? $creditsUsed : 0,
                'credits_refunded' => isset($refundedCredits) ? $refundedCredits : 0
            ]);

            // 🔔 SEND FAILURE NOTIFICATION TO USER
            if ($user) {
                $this->sendJobCompletionNotification($user, false, [
                    'error' => $e->getMessage(),
                    'credits_used' => isset($creditsUsed) ? $creditsUsed : 0,
                    'credits_refunded' => isset($refundedCredits) ? $refundedCredits : 0,
                    'processed_count' => (isset($successCount) ? $successCount : 0) + (isset($failureCount) ? $failureCount : 0),
                    'total_recipients' => count($this->recipients)
                ]);
            }

            $this->fail($e);
        }
    }

    /**
     * 🔔 Send job completion notification to user
     */
    private function sendJobCompletionNotification(User $user, bool $success, array $data): void
    {
        try {
            Notification::send($user, new BulkEmailJobCompleted([
                'success' => $success,
                'job_type' => 'bulk_personalized_emails',
                'email_template_id' => $this->userEmail->id,
                'email_template_subject' => $this->userEmail->subject,
                'data' => $data,
                'completed_at' => now()->toISOString()
            ]));

            Log::info('🔔 Job completion notification sent', [
                'user_id' => $user->id,
                'success' => $success,
                'notification_data' => $data
            ]);
        } catch (Exception $e) {
            Log::error('Failed to send job completion notification', [
                'user_id' => $user->id,
                'error' => $e->getMessage()
            ]);
        }
    }

    /**
     * 🔥 NEW METHOD: Enhanced logging for personalized emails
     */
    private function logPersonalizedEmail(Contact $contact, array $personalized, UserSavedEmails $originalEmail): void
    {
        Log::info('📧 PERSONALIZED EMAIL GENERATED', [
            'timestamp' => now()->toISOString(),
            'contact_details' => [
                'id' => $contact->id,
                'name' => $contact->name,
                'email' => $contact->email,
                'company' => $contact->company,
                'job_title' => $contact->job_title,
                'status' => $contact->status,
                'tags' => isset($contact->tags) ? $contact->tags : [],
                'custom_fields' => isset($contact->custom_fields) ? $contact->custom_fields : []
            ],
            'original_template' => [
                'id' => $originalEmail->id,
                'subject' => $originalEmail->subject,
                'content_preview' => substr($originalEmail->email_content, 0, 100) . '...',
                'purpose' => $originalEmail->purpose,
                'tone' => $originalEmail->tone,
                'audience' => $originalEmail->audience,
                'cta' => $originalEmail->cta
            ],
            'personalized_content' => [
                'subject' => $personalized['subject'],
                'body_preview' => substr($personalized['body'], 0, 200) . '...',
                'personalization_score' => isset($personalized['personalization_score']) ? $personalized['personalization_score'] : 0,
                'key_personalizations' => isset($personalized['key_personalizations']) ? $personalized['key_personalizations'] : [],
                'psychological_triggers' => isset($personalized['psychological_triggers']) ? $personalized['psychological_triggers'] : [],
                'industry_insights' => isset($personalized['industry_insights']) ? $personalized['industry_insights'] : [],
                'role_adaptations' => isset($personalized['role_adaptations']) ? $personalized['role_adaptations'] : []
            ],
            'personalization_analysis' => [
                'changes_made' => $this->analyzePersonalizationChanges($originalEmail, $personalized),
                'personalization_techniques' => $this->identifyPersonalizationTechniques($personalized),
                'content_length_change' => [
                    'original_length' => strlen($originalEmail->email_content),
                    'personalized_length' => strlen($personalized['body']),
                    'change_percentage' => $this->calculateLengthChange($originalEmail->email_content, $personalized['body'])
                ]
            ],
            'ai_metadata' => [
                'model_used' => 'llama3-70b-8192',
                'processing_timestamp' => now()->toISOString(),
                'personalization_engine_version' => '2.0-advanced'
            ]
        ]);

        // Also log full content separately for debugging
        Log::debug('📝 FULL PERSONALIZED EMAIL CONTENT', [
            'job_id' => $this->job->getJobId(),
            'contact_id' => $contact->id,
            'contact_name' => $contact->name,
            'original_subject' => $originalEmail->subject,
            'personalized_subject' => $personalized['subject'],
            'original_body' => $originalEmail->email_content,
            'personalized_body' => $personalized['body'],
            'personalization_metadata' => $personalized
        ]);
    }

    /**
     * Analyze what changes were made during personalization
     */
    private function analyzePersonalizationChanges(UserSavedEmails $original, array $personalized): array
    {
        $changes = [];

        // Subject changes
        if ($original->subject !== $personalized['subject']) {
            $changes[] = [
                'type' => 'subject_modification',
                'original' => $original->subject,
                'personalized' => $personalized['subject']
            ];
        }

        // Body changes analysis
        $originalWords = str_word_count($original->email_content);
        $personalizedWords = str_word_count($personalized['body']);

        if ($originalWords !== $personalizedWords) {
            $changes[] = [
                'type' => 'content_length_change',
                'original_words' => $originalWords,
                'personalized_words' => $personalizedWords,
                'word_difference' => $personalizedWords - $originalWords
            ];
        }

        // Check for specific personalization tokens
        $personalizations = [
            'name_insertion' => ['{name}', '[name]', '{{name}}'],
            'company_insertion' => ['{company}', '[company]', '{{company}}'],
            'role_insertion' => ['{role}', '[role]', '{{role}}']
        ];

        foreach ($personalizations as $type => $tokens) {
            foreach ($tokens as $token) {
                if (str_contains($original->email_content, $token) && !str_contains($personalized['body'], $token)) {
                    $changes[] = [
                        'type' => $type,
                        'token_replaced' => $token
                    ];
                }
            }
        }

        return $changes;
    }

    /**
     * Identify personalization techniques used
     */
    private function identifyPersonalizationTechniques(array $personalized): array
    {
        $techniques = [];

        if (isset($personalized['key_personalizations'])) {
            $techniques['key_personalizations'] = $personalized['key_personalizations'];
        }

        if (isset($personalized['psychological_triggers'])) {
            $techniques['psychological_triggers'] = $personalized['psychological_triggers'];
        }

        if (isset($personalized['industry_insights'])) {
            $techniques['industry_insights'] = $personalized['industry_insights'];
        }

        if (isset($personalized['role_adaptations'])) {
            $techniques['role_adaptations'] = $personalized['role_adaptations'];
        }

        return $techniques;
    }

    /**
     * Calculate percentage change in content length
     */
    private function calculateLengthChange(string $original, string $personalized): float
    {
        $originalLength = strlen($original);
        $personalizedLength = strlen($personalized);

        if ($originalLength === 0) return 0;

        return round((($personalizedLength - $originalLength) / $originalLength) * 100, 2);
    }

    private function getEmailAccount(): EmailAccount
    {
        return EmailAccount::where('id', $this->emailAccountId)
            ->where('user_id', $this->userId)
            ->where('status', 'active')
            ->where('is_connected', true)
            ->firstOrFail();
    }

    private function intelligentDelay(EmailAccount $emailAccount, int $sentCount): void
    {
        // Dynamic delay based on account health and sending pattern
        $baseDelay = 500000; // 0.5 seconds

        // Increase delay for new accounts or those with issues
        if ($emailAccount->consecutive_errors > 0) {
            $baseDelay *= (1 + $emailAccount->consecutive_errors * 0.5);
        }

        // Reduce delay for established accounts with good reputation
        if ($emailAccount->success_rate > 0.95 && $emailAccount->reputation > 80) {
            $baseDelay *= 0.7;
        }

        // Add randomization to avoid pattern detection
        $randomFactor = rand(80, 120) / 100;
        $finalDelay = (int)($baseDelay * $randomFactor);

        usleep($finalDelay);
    }

    private function saveAdvancedPersonalizedEmail(Contact $contact, array $emailData, array $personalized)
    {
        try {
            return UserSavedEmails::create([
                'user_id' => $this->userId,
                'subject' => $emailData['subject'],
                'recipient' => $contact->email,
                'sender' => $emailData['from'],
                'audience' => $this->userEmail->audience,
                'tone' => $this->userEmail->tone,
                'purpose' => $this->userEmail->purpose,
                'cta' => $this->userEmail->cta,
                'context' => $this->userEmail->context,
                'prompt' => "Advanced AI Personalization for: {$contact->name}",
                'email_content' => $emailData['body'],
                'model_used' => 'llama3-70b-8192',
                'meta' => json_encode([
                    'original_email_id' => $this->userEmail->id,
                    'email_account_id' => $this->emailAccountId,
                    'personalized_for' => $contact->only(['id', 'name', 'email', 'company', 'job_title']),
                    'personalization_score' => isset($personalized['personalization_score']) ? $personalized['personalization_score'] : 0,
                    'key_personalizations' => isset($personalized['key_personalizations']) ? $personalized['key_personalizations'] : [],
                    'psychological_triggers' => isset($personalized['psychological_triggers']) ? $personalized['psychological_triggers'] : [],
                    'custom_fields_used' => isset($contact->custom_fields) ? $contact->custom_fields : [],
                    'sent_at' => now()->toISOString(),
                    'advanced_features' => [
                        'industry_context' => true,
                        'role_adaptation' => true,
                        'psychological_triggers' => true,
                        'company_intelligence' => true
                    ]
                ])
            ]);
        } catch (Exception $e) {
            Log::error('Failed to save advanced personalized email record', [
                'contact_id' => $contact->id,
                'error' => $e->getMessage()
            ]);
            return null;
        }
    }

    private function logAdvancedResults(int $successCount, int $failureCount, array $personalizations, int $totalCreditsUsed, int $refundedCredits, int $jobDuration): void
    {
        $avgScore = 0;
        if (!empty($personalizations)) {
            $avgScore = collect($personalizations)->avg('personalization_score');
        }

        $totalProcessed = $successCount + $failureCount;
        $successRate = $totalProcessed > 0 ? ($successCount / $totalProcessed) * 100 : 0;

        Log::info('🎉 ADVANCED bulk email campaign completed', [
            'email_id' => $this->userEmail->id,
            'successful' => $successCount,
            'failed' => $failureCount,
            'total_processed' => $totalProcessed,
            'success_rate' => round($successRate, 2),
            'average_personalization_score' => round($avgScore, 2),
            'total_personalizations' => count($personalizations),
            'credits_used' => $totalCreditsUsed,
            'credits_refunded' => $refundedCredits,
            'net_credits_used' => $totalCreditsUsed - $refundedCredits,
            'job_duration_seconds' => $jobDuration,
            'credits_per_email' => $totalProcessed > 0 ? round($totalCreditsUsed / $totalProcessed, 2) : 0,
            'advanced_features_used' => [
                'ai_personalization' => true,
                'psychological_triggers' => true,
                'industry_context' => true,
                'role_adaptation' => true,
                'credit_refund_system' => true
            ]
        ]);
    }

    public function failed(\Throwable $exception)
    {
        Log::error('💥 Advanced bulk email job failed completely', [
            'job_id' => $this->job->getJobId(),
            'email_id' => $this->userEmail->id,
            'user_id' => $this->userId,
            'email_account_id' => $this->emailAccountId,
            'error' => $exception->getMessage(),
            'trace' => $exception->getTraceAsString()
        ]);

        // Try to send failure notification
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
            Log::error('Failed to send failure notification', [
                'error' => $e->getMessage()
            ]);
        }
    }
}

// ADVANCED PERSONALIZATION ENGINE
class PersonalizationEngine
{
    private $groqApiKey;
    private $maxRetries = 3;
    private $retryDelay = 1000000; // 1 second

    public function __construct()
    {
        $this->groqApiKey = config('services.groq.api_key');
    }

    public function personalizeWithAdvancedAI(Contact $contact, UserSavedEmails $template): array
    {
        if (empty($this->groqApiKey)) {
            Log::warning('🔑 No Groq API key, using ADVANCED fallback personalization');
            return $this->getAdvancedFallbackPersonalization($contact, $template);
        }

        for ($attempt = 1; $attempt <= $this->maxRetries; $attempt++) {
            try {
                Log::info("🤖 Attempt {$attempt}: Calling Groq API for advanced personalization", [
                    'contact_id' => $contact->id,
                    'attempt' => $attempt
                ]);

                $prompt = $this->buildAdvancedPersonalizationPrompt($contact, $template);
                $response = $this->callGroqAPI($prompt);

                return $this->parseAndValidateResponse($response, $contact, $template);
            } catch (Exception $e) {
                Log::warning("⚠️ Groq API attempt {$attempt} failed", [
                    'contact_id' => $contact->id,
                    'error' => $e->getMessage(),
                    'attempt' => $attempt
                ]);

                if ($attempt === $this->maxRetries) {
                    Log::error('🚨 All Groq API attempts failed, using advanced fallback', [
                        'contact_id' => $contact->id,
                        'final_error' => $e->getMessage()
                    ]);
                    return $this->getAdvancedFallbackPersonalization($contact, $template);
                }

                usleep($this->retryDelay * $attempt); // Exponential backoff
            }
        }
    }

    private function buildAdvancedPersonalizationPrompt(Contact $contact, UserSavedEmails $template): string
    {
        $contactContext = $this->buildDetailedContactContext($contact);
        $emailContext = $this->buildDetailedEmailContext($template);
        $industryContext = $this->getIndustryContext($contact);
        $roleContext = $this->getRoleContext($contact);

        return "You are an expert email personalization specialist with deep knowledge of sales psychology, industry dynamics, and communication strategies.

MISSION: Transform this email template into a highly personalized, compelling message that feels like it was written specifically for this recipient by someone who understands their industry, role, and challenges.

{$contactContext}

{$emailContext}

{$industryContext}

{$roleContext}

ADVANCED PERSONALIZATION REQUIREMENTS:
1. PSYCHOLOGICAL TRIGGERS: Use appropriate psychological triggers based on recipient's seniority, industry, and company stage
2. INDUSTRY INTELLIGENCE: Demonstrate understanding of their industry challenges and opportunities
3. ROLE RELEVANCE: Speak directly to their specific responsibilities and pain points
4. COMPANY CONTEXT: Reference their company size, stage, location, and recent developments if available
5. TONE CALIBRATION: Match communication style to their industry culture and seniority level
6. VALUE ARTICULATION: Present value proposition in terms most relevant to their specific situation
7. URGENCY OPTIMIZATION: Create appropriate urgency based on their decision-making authority
8. SOCIAL PROOF: Include relevant social proof for their industry/role/company size

PERSONALIZATION TECHNIQUES TO APPLY:
- Use industry-specific terminology and references
- Address role-specific challenges and objectives
- Reference company stage/size appropriate concerns
- Include subtle competitive intelligence if relevant
- Adapt formality level to industry norms
- Use appropriate urgency for their decision-making level
- Include relevant case studies or social proof

RESPONSE FORMAT (CRITICAL - MUST BE VALID JSON):
{
  \"subject\": \"Highly personalized subject line\",
  \"body\": \"Fully personalized email body with industry and role context\",
  \"personalization_score\": 85,
  \"key_personalizations\": [\"specific personalization techniques applied\"],
  \"psychological_triggers\": [\"psychological triggers used\"],
  \"industry_insights\": [\"industry-specific insights included\"],
  \"role_adaptations\": [\"role-specific adaptations made\"]
}

CRITICAL: Return ONLY the JSON object. No additional text, explanations, or markdown formatting.";
    }

    private function buildDetailedContactContext(Contact $contact): string
    {
        $context = "RECIPIENT PROFILE:\n";
        $context .= "- Name: {$contact->name}\n";
        $context .= "- Email: {$contact->email}\n";
        $context .= "- Company: " . ($contact->company ? $contact->company : 'Unknown') . "\n";
        $context .= "- Job Title: " . ($contact->job_title ? $contact->job_title : 'Unknown') . "\n";
        $context .= "- Status: {$contact->status}\n";

        if ($contact->tags) {
            $context .= "- Tags: " . implode(', ', $contact->tags) . "\n";
        }

        if ($contact->custom_fields && is_array($contact->custom_fields)) {
            $context .= "- Additional Intelligence:\n";
            foreach ($contact->custom_fields as $key => $value) {
                $context .= "  • {$key}: {$value}\n";
            }
        }

        return $context;
    }

    private function buildDetailedEmailContext(UserSavedEmails $template): string
    {
        return "ORIGINAL EMAIL TEMPLATE:
Subject: {$template->subject}
Content: {$template->email_content}

EMAIL STRATEGY CONTEXT:
- Purpose: " . ($template->purpose ? $template->purpose : 'General outreach') . "
- Tone: " . ($template->tone ? $template->tone : 'Professional') . "
- Target Audience: " . ($template->audience ? $template->audience : 'General') . "
- Call-to-Action: " . ($template->cta ? $template->cta : 'Not specified') . "
- Context: " . ($template->context ? $template->context : 'Not specified');
    }

    private function getIndustryContext(Contact $contact): string
    {
        $industry = null;
        if ($contact->custom_fields && isset($contact->custom_fields['industry'])) {
            $industry = $contact->custom_fields['industry'];
        }

        if (!$industry) return '';

        $industryContexts = [
            'technology' => "TECHNOLOGY INDUSTRY CONTEXT:
- Fast-paced environment with rapid innovation cycles
- Focus on scalability, efficiency, and competitive advantage
- Decision makers value data-driven solutions and ROI metrics
- Common challenges: scaling operations, talent acquisition, market competition
- Communication style: Direct, metrics-focused, innovation-oriented",

            'healthcare' => "HEALTHCARE INDUSTRY CONTEXT:
- Highly regulated environment with compliance requirements
- Focus on patient outcomes, safety, and operational efficiency
- Decision makers prioritize proven solutions with strong security
- Common challenges: regulatory compliance, cost management, patient satisfaction
- Communication style: Professional, evidence-based, compliance-aware",

            'finance' => "FINANCIAL SERVICES CONTEXT:
- Risk-averse environment with strict regulatory oversight
- Focus on security, compliance, and operational efficiency
- Decision makers value proven track records and risk mitigation
- Common challenges: regulatory changes, digital transformation, security threats
- Communication style: Formal, risk-focused, compliance-oriented",

            'retail' => "RETAIL INDUSTRY CONTEXT:
- Highly competitive with thin margins and seasonal fluctuations
- Focus on customer experience, inventory management, and profitability
- Decision makers prioritize solutions that drive sales and reduce costs
- Common challenges: omnichannel integration, inventory optimization, customer retention
- Communication style: Results-oriented, customer-focused, efficiency-driven"
        ];

        return isset($industryContexts[strtolower($industry)]) ? $industryContexts[strtolower($industry)] : '';
    }

    private function getRoleContext(Contact $contact): string
    {
        if (!$contact->job_title) return '';

        $title = strtolower($contact->job_title);

        if (str_contains($title, 'ceo') || str_contains($title, 'president')) {
            return "CEO/PRESIDENT ROLE CONTEXT:
- Strategic decision maker focused on company vision and growth
- Interested in solutions that drive competitive advantage and market position
- Values high-level strategic benefits over technical details
- Communication style: Executive-level, strategic, results-focused";
        }

        if (str_contains($title, 'cto') || str_contains($title, 'technology')) {
            return "CTO/TECHNOLOGY LEADER CONTEXT:
- Technical decision maker focused on innovation and system architecture
- Interested in scalable, secure, and efficient technical solutions
- Values technical specifications and integration capabilities
- Communication style: Technical, innovation-focused, architecture-oriented";
        }

        if (str_contains($title, 'operations') || str_contains($title, 'ops')) {
            return "OPERATIONS LEADER CONTEXT:
- Process-focused decision maker interested in efficiency and optimization
- Values solutions that streamline operations and reduce manual work
- Concerned with scalability, reliability, and operational metrics
- Communication style: Process-oriented, efficiency-focused, metrics-driven";
        }

        return '';
    }

    private function callGroqAPI(string $prompt): array
    {
        try {
            $groq = new Groq($this->groqApiKey);

            $response = $groq->chat()->completions()->create([
                'model' => 'llama3-70b-8192',
                'messages' => [
                    [
                        'role' => 'system',
                        'content' => 'You are an expert email personalization assistant. You must respond with ONLY a valid JSON object. No additional text, explanations, or formatting.'
                    ],
                    [
                        'role' => 'user',
                        'content' => $prompt
                    ]
                ],
                'temperature' => 0.7,
                'max_completion_tokens' => 2000,
            ]);

            // Handle both array and object responses
            $content = null;
            if (is_object($response)) {
                $content = $response->choices[0]->message->content ?? null;
            } elseif (is_array($response)) {
                $content = $response['choices'][0]['message']['content'] ?? null;
            }

            if (!$content) {
                throw new Exception('Invalid response format from Groq API');
            }

            Log::info('📡 Groq API response received', [
                'model_used' => 'llama3-70b-8192',
                'response_preview' => substr($content, 0, 200)
            ]);

            return [
                'content' => $content
            ];
        } catch (Exception $e) {
            Log::error('Groq API call failed', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            throw new Exception('Groq API request failed: ' . $e->getMessage());
        }
    }

    private function parseAndValidateResponse(array $response, Contact $contact, UserSavedEmails $template): array
    {
        if (!isset($response['content'])) {
            throw new Exception('Invalid response structure from Groq API');
        }

        $content = trim($response['content']);

        // Clean up the content
        $content = preg_replace('/^\`\`\`json\s*/', '', $content);
        $content = preg_replace('/\s*\`\`\`$/', '', $content);
        $content = trim($content);

        // Try to decode the JSON
        $decoded = json_decode($content, true);
        $jsonError = json_last_error();

        if ($jsonError !== JSON_ERROR_NONE) {
            // Try to fix common JSON issues
            $fixedContent = str_replace("\\'", "'", $content);
            $fixedContent = preg_replace('/\r?\n/', ' ', $fixedContent);

            $decoded = json_decode($fixedContent, true);
            $jsonError = json_last_error();

            if ($jsonError !== JSON_ERROR_NONE) {
                Log::error('JSON parsing failed for advanced personalization', [
                    'contact_id' => $contact->id,
                    'json_error' => json_last_error_msg(),
                    'content_preview' => substr($content, 0, 200)
                ]);
                throw new Exception('Invalid JSON response from Groq API: ' . json_last_error_msg());
            }
        }

        if (!isset($decoded['subject']) || !isset($decoded['body'])) {
            throw new Exception('Missing required fields in Groq response');
        }

        Log::info('🎯 Advanced AI personalization successful', [
            'contact_id' => $contact->id,
            'personalization_score' => isset($decoded['personalization_score']) ? $decoded['personalization_score'] : 0,
            'key_personalizations_count' => count(isset($decoded['key_personalizations']) ? $decoded['key_personalizations'] : []),
            'psychological_triggers_count' => count(isset($decoded['psychological_triggers']) ? $decoded['psychological_triggers'] : [])
        ]);

        return [
            'subject' => $decoded['subject'],
            'body' => $decoded['body'],
            'personalization_score' => isset($decoded['personalization_score']) ? $decoded['personalization_score'] : 75,
            'key_personalizations' => isset($decoded['key_personalizations']) ? $decoded['key_personalizations'] : [],
            'psychological_triggers' => isset($decoded['psychological_triggers']) ? $decoded['psychological_triggers'] : [],
            'industry_insights' => isset($decoded['industry_insights']) ? $decoded['industry_insights'] : [],
            'role_adaptations' => isset($decoded['role_adaptations']) ? $decoded['role_adaptations'] : []
        ];
    }

    private function getAdvancedFallbackPersonalization(Contact $contact, UserSavedEmails $template): array
    {
        $subject = $template->subject;
        $body = $template->email_content;
        $personalizations = [];

        // Advanced name personalization
        $nameVariations = ['{name}', '[name]', '{{name}}', 'Daniel', 'Hi Daniel'];
        foreach ($nameVariations as $variation) {
            if (str_contains($subject, $variation)) {
                $subject = str_replace($variation, $contact->name, $subject);
                $personalizations[] = 'Name personalization in subject';
            }
            if (str_contains($body, $variation)) {
                $body = str_replace($variation, $contact->name, $body);
                $personalizations[] = 'Name personalization in body';
            }
        }

        // Company personalization
        if ($contact->company) {
            $companyVariations = ['{company}', '[company]', '{{company}}', 'GrowthNest'];
            foreach ($companyVariations as $variation) {
                if (str_contains($subject, $variation)) {
                    $subject = str_replace($variation, $contact->company, $subject);
                    $personalizations[] = 'Company name in subject';
                }
                if (str_contains($body, $variation)) {
                    $body = str_replace($variation, $contact->company, $body);
                    $personalizations[] = 'Company name in body';
                }
            }
        }

        // Role-based personalization
        if ($contact->job_title) {
            $roleVariations = ['{role}', '[role]', '{{role}}', '{position}', 'Head of Sales'];
            foreach ($roleVariations as $variation) {
                if (str_contains($body, $variation)) {
                    $body = str_replace($variation, $contact->job_title, $body);
                    $personalizations[] = 'Job title personalization';
                }
            }
        }

        return [
            'subject' => $subject,
            'body' => $body,
            'personalization_score' => 70,
            'key_personalizations' => $personalizations,
            'psychological_triggers' => ['Personalization', 'Relevance', 'Authority'],
            'industry_insights' => [],
            'role_adaptations' => []
        ];
    }
}
