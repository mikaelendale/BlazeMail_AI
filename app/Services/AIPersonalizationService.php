<?php

namespace App\Services;

use App\Models\Contact;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Http;
use LucianoTonet\GroqPHP\Groq;

class AIPersonalizationService
{
    /**
     * Personalize email content for a specific recipient
     */
    public function personalizeEmail(array $data): array
    {
        try {
            $recipient = $data['recipient'];
            $emailTemplate = $data['email_template'];
            $campaignContext = $data['campaign_context'];

            Log::info('🤖 Starting email personalization', [
                'recipient_id' => $recipient->id,
                'recipient_email' => $recipient->email,
                'email_template_id' => $emailTemplate['id'],
                'campaign_name' => $campaignContext['campaign_name']
            ]);

            // Extract recipient information
            $recipientData = [
                'name' => $recipient->name, // Use 'name' directly from the updated Contact model
                'email' => $recipient->email,
                'company' => $recipient->company,
                'job_title' => $recipient->job_title,
                'classification' => $recipient->classification,
                'tags' => $recipient->tags ?? [],
                'custom_fields' => $recipient->custom_fields ?? [], // Include custom fields
            ];

            // Personalize subject line
            $personalizedSubject = $this->personalizeText(
                $emailTemplate['subject'],
                $recipientData,
                $campaignContext
            );

            // Personalize email content
            $personalizedContent = $this->personalizeText(
                $emailTemplate['email_content'],
                $recipientData,
                $campaignContext
            );

            // Add unsubscribe link if enabled
            if ($campaignContext['unsubscribe_enabled'] ?? true) {
                $personalizedContent = $this->addUnsubscribeLink(
                    $personalizedContent,
                    $recipient,
                    $campaignContext
                );
            }

            // Add tracking pixels if enabled
            $personalizedContent = $this->addTrackingPixel(
                $personalizedContent,
                $recipient,
                $campaignContext
            );

            Log::info('✅ Email personalization completed', [
                'recipient_id' => $recipient->id,
                'original_subject_length' => strlen($emailTemplate['subject']),
                'personalized_subject_length' => strlen($personalizedSubject),
                'original_content_length' => strlen($emailTemplate['email_content']),
                'personalized_content_length' => strlen($personalizedContent)
            ]);

            // Log the personalized subject and content
            Log::debug('📧 Personalized Email Details', [
                'recipient_email' => $recipient->email,
                'personalized_subject' => $personalizedSubject,
                'personalized_content_preview' => substr($personalizedContent, 0, 500) . (strlen($personalizedContent) > 500 ? '...' : ''),
            ]);

            return [
                'subject' => $personalizedSubject,
                'content' => $personalizedContent,
                'recipient_data' => $recipientData,
                'personalization_applied' => true,
            ];
        } catch (\Exception $e) {
            Log::error('❌ Email personalization failed', [
                'recipient_id' => $data['recipient']->id ?? null,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            // Return original content as fallback
            return [
                'subject' => $data['email_template']['subject'],
                'content' => $data['email_template']['email_content'],
                'recipient_data' => [],
                'personalization_applied' => false,
                'error' => $e->getMessage(),
            ];
        }
    }

    /**
     * Personalize text with recipient data
     */
    private function personalizeText(string $text, array $recipientData, array $campaignContext): string
    {
        // Basic placeholder replacements
        $placeholders = [
            '{{name}}' => $recipientData['name'] ?? 'there',
            '{{company}}' => $recipientData['company'] ?? 'your company',
            '{{email}}' => $recipientData['email'] ?? '',
            '{{job_title}}' => $recipientData['job_title'] ?? '',
            '{{classification}}' => $recipientData['classification'] ?? '',
            '{{campaign_name}}' => $campaignContext['campaign_name'] ?? '',
            '{{sender_name}}' => $campaignContext['sender_info']['name'] ?? '',
            '{{sender_email}}' => $campaignContext['sender_info']['email'] ?? '',
        ];

        // Replace placeholders
        $personalizedText = str_replace(
            array_keys($placeholders),
            array_values($placeholders),
            $text
        );

        // Advanced AI personalization using Groq
        if (config('services.groq.api_key')) {
            $personalizedText = $this->applyAIPersonalization(
                $personalizedText,
                $recipientData,
                $campaignContext
            );
        }

        return $personalizedText;
    }

    /**
     * Apply AI-powered personalization using Groq
     */
    private function applyAIPersonalization(string $text, array $recipientData, array $campaignContext): string
    {
        try {
            // Only apply AI if text contains AI markers like {{ai_personalize}}
            if (!str_contains($text, '{{ai_personalize}}')) {
                return $text;
            }

            $prompt = $this->buildAIPrompt($text, $recipientData, $campaignContext);

            $groq = new Groq(config('services.groq.api_key'));

            $reply = $groq->chat()->completions()->create([
                'model' => 'llama3-8b-8192', // Using the model you provided
                'messages' => [
                    ['role' => 'system', 'content' => 'You are an expert email personalization assistant. Personalize the email content based on the recipient information provided. Keep the same tone and structure but make it more personal and relevant.'],
                    ['role' => 'user', 'content' => $prompt],
                ],
                'temperature' => 0.7, // Adjusted temperature for more creative personalization
                'max_tokens' => 1000, // Using max_tokens instead of max_completion_tokens
            ]);

            $personalizedText = $reply->choices[0]->message->content ?? $text;

            Log::info('🤖 Groq AI personalization applied', [
                'recipient_email' => $recipientData['email'],
                'tokens_used' => $reply->usage->total_tokens ?? 0
            ]);

            return $personalizedText;
        } catch (\Exception $e) {
            Log::warning('⚠️ Groq AI personalization failed, using basic personalization', [
                'error' => $e->getMessage(),
                'recipient_email' => $recipientData['email']
            ]);
        }
        // Remove AI markers and return basic personalized text
        return str_replace('{{ai_personalize}}', '', $text);
    }

    /**
     * Build AI prompt for personalization
     */
    private function buildAIPrompt(string $text, array $recipientData, array $campaignContext): string
    {
        $recipientInfo = "Recipient Info:\n";
        foreach ($recipientData as $key => $value) {
            if (is_array($value)) {
                $value = implode(', ', $value);
            }
            if (!empty($value)) {
                $recipientInfo .= "- " . ucfirst(str_replace('_', ' ', $key)) . ": {$value}\n";
            }
        }

        return "Personalize this email for the recipient:\n\n" .
            $recipientInfo . "\n" .
            "Email Template:\n{$text}\n\n" .
            "Make it personal and relevant while maintaining professionalism. Do not include any introductory or concluding remarks outside the email content itself.";
    }

    /**
     * Add unsubscribe link to email content
     */
    private function addUnsubscribeLink(string $content, Contact $recipient, array $campaignContext): string
    {
        $unsubscribeUrl = route('unsubscribe', [
            'token' => encrypt([
                'contact_id' => $recipient->id,
                'campaign_id' => $campaignContext['campaign_id'] ?? null,
                'timestamp' => time()
            ])
        ]);
        $unsubscribeHtml = "\n\n<hr style='margin: 20px 0; border: none; border-top: 1px solid #eee;'>\n" .
            "<p style='font-size: 12px; color: #666; text-align: center;'>\n" .
            "If you no longer wish to receive these emails, you can " .
            "<a href='{$unsubscribeUrl}' style='color: #666;'>unsubscribe here</a>.\n" .
            "</p>";
        return $content . $unsubscribeHtml;
    }

    /**
     * Add tracking pixel to email content
     */
    private function addTrackingPixel(string $content, Contact $recipient, array $campaignContext): string
    {
        $trackingUrl = route('email.track.open', [
            'token' => encrypt([
                'contact_id' => $recipient->id,
                'campaign_id' => $campaignContext['campaign_id'] ?? null,
                'timestamp' => time()
            ])
        ]);
        $trackingPixel = "<img src='{$trackingUrl}' width='1' height='1' style='display:none;' alt=''>";
        return $content . $trackingPixel;
    }
}
