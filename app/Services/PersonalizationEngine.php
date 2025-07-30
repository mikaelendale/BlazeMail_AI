<?php

namespace App\Services;

use App\Models\Contact;
use App\Models\UserSavedEmails;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Cache;
use LucianoTonet\GroqPHP\Groq;
use Exception;

// ADVANCED PERSONALIZATION ENGINE WITH INTELLIGENT MODEL ROTATION
class PersonalizationEngine
{
    private $groqApiKey;
    private $maxRetries = 2; // Reduced from 3 for speed
    private $retryDelay = 500000; // Reduced to 0.5 seconds

    // 🔥 OPTIMIZED: Reordered models by reliability (gemma2 first since it works)
    private $availableModels = [
        [
            'name' => 'gemma2-9b-it',
            'tokens_per_minute' => 15000,
            'priority' => 1, // Most reliable, use first
            'cache_key' => 'groq_rate_limit_gemma2'
        ],
        [
            'name' => 'llama-3.3-70b-versatile',
            'tokens_per_minute' => 12000,
            'priority' => 2,
            'cache_key' => 'groq_rate_limit_llama33'
        ],
        [
            'name' => 'moonshotai/kimi-k2-instruct',
            'tokens_per_minute' => 10000,
            'priority' => 3,
            'cache_key' => 'groq_rate_limit_kimi'
        ],
        [
            'name' => 'qwen/qwen3-32b',
            'tokens_per_minute' => 6000,
            'priority' => 4,
            'cache_key' => 'groq_rate_limit_qwen'
        ],
        [
            'name' => 'meta-llama/llama-4-scout-17b-16e-instruct',
            'tokens_per_minute' => 30000,
            'priority' => 5, // Moved to last due to JSON issues
            'cache_key' => 'groq_rate_limit_scout'
        ],
        [
            'name' => 'llama3-70b-8192',
            'tokens_per_minute' => 6000,
            'priority' => 6,
            'cache_key' => 'groq_rate_limit_llama3'
        ]
    ];

    private $safetyBuffer = 500; // Reduced buffer for speed
    private $modelUsageStats = [];
    private $failedModels = []; // Track temporarily failed models

    public function __construct()
    {
        $this->groqApiKey = config('services.groq.api_key');

        // Initialize model usage stats
        foreach ($this->availableModels as $model) {
            $this->modelUsageStats[$model['name']] = [
                'attempts' => 0,
                'successes' => 0,
                'failures' => 0,
                'rate_limit_hits' => 0
            ];
        }

        // Load failed models from cache
        $this->failedModels = Cache::get('failed_models', []);
    }

    public function personalizeWithAdvancedAI(Contact $contact, UserSavedEmails $template): array
    {
        if (empty($this->groqApiKey)) {
            Log::warning('🔑 No Groq API key, using ADVANCED fallback personalization');
            return $this->getAdvancedFallbackPersonalization($contact, $template);
        }

        // 🔥 OPTIMIZATION: Skip models that have failed recently
        $availableModels = array_filter($this->availableModels, function ($model) {
            return !in_array($model['name'], $this->failedModels);
        });

        // If all models are failed, reset the failed list
        if (empty($availableModels)) {
            $this->failedModels = [];
            Cache::forget('failed_models');
            $availableModels = $this->availableModels;
        }

        // Try each available model
        foreach ($availableModels as $modelConfig) {
            $modelName = $modelConfig['name'];
            $this->modelUsageStats[$modelName]['attempts']++;

            Log::info('🤖 Attempting personalization with optimized model', [
                'contact_id' => $contact->id,
                'model' => $modelName,
                'priority' => $modelConfig['priority']
            ]);

            for ($attempt = 1; $attempt <= $this->maxRetries; $attempt++) {
                try {
                    // Quick rate limit check
                    $rateLimitCheck = $this->checkModelRateLimit($modelConfig);

                    if (!$rateLimitCheck['can_proceed']) {
                        Log::info('🚦 Model rate limited, trying next', [
                            'model' => $modelName,
                            'available_tokens' => $rateLimitCheck['available_tokens']
                        ]);
                        $this->modelUsageStats[$modelName]['rate_limit_hits']++;
                        break; // Try next model
                    }

                    // Reduced delay for speed
                    if ($attempt > 1) {
                        $delay = min(2, $attempt); // Max 2 second delay
                        sleep($delay);
                    }

                    $prompt = $this->buildOptimizedPersonalizationPrompt($contact, $template);
                    $response = $this->callGroqAPI($prompt, $modelName);

                    // Estimate tokens used
                    $estimatedTokens = strlen($prompt) / 4 + 400; // Reduced estimation
                    $this->updateModelUsage($modelConfig, (int)$estimatedTokens);

                    $result = $this->parseAndValidateResponse($response, $contact, $template);
                    $result['model_used'] = $modelName;

                    $this->modelUsageStats[$modelName]['successes']++;

                    Log::info('✅ FAST personalization successful', [
                        'contact_id' => $contact->id,
                        'model_used' => $modelName,
                        'attempt' => $attempt,
                        'score' => $result['personalization_score'] ?? 0
                    ]);

                    return $result;
                } catch (Exception $e) {
                    $this->modelUsageStats[$modelName]['failures']++;

                    $isRateLimitError = str_contains($e->getMessage(), 'Rate limit reached');
                    $isJsonError = str_contains($e->getMessage(), 'Invalid JSON');

                    if ($isRateLimitError) {
                        Log::warning("⚠️ Rate limit for {$modelName}", ['contact_id' => $contact->id]);
                        $this->modelUsageStats[$modelName]['rate_limit_hits']++;
                        break; // Try next model
                    } elseif ($isJsonError && $attempt >= $this->maxRetries) {
                        // Mark model as temporarily failed for JSON issues
                        $this->markModelAsFailed($modelName);
                        Log::warning("🚫 Marking {$modelName} as failed due to JSON issues");
                        break;
                    }

                    if ($attempt < $this->maxRetries) {
                        usleep($this->retryDelay * $attempt);
                    }
                }
            }
        }

        // All models failed, use fallback
        Log::warning('🚨 All models failed, using fallback', ['contact_id' => $contact->id]);
        $fallback = $this->getAdvancedFallbackPersonalization($contact, $template);
        $fallback['model_used'] = 'fallback';
        return $fallback;
    }

    /**
     * 🔥 NEW: Mark model as temporarily failed
     */
    private function markModelAsFailed(string $modelName): void
    {
        if (!in_array($modelName, $this->failedModels)) {
            $this->failedModels[] = $modelName;
            // Cache for 10 minutes
            Cache::put('failed_models', $this->failedModels, now()->addMinutes(10));
        }
    }

    /**
     * 🔥 OPTIMIZED: Shorter, more focused prompt for speed
     */
    private function buildOptimizedPersonalizationPrompt(Contact $contact, UserSavedEmails $template): string
    {
        $contactInfo = "CONTACT: {$contact->name} ({$contact->job_title}) at {$contact->company}";
        $templateInfo = "TEMPLATE: {$template->subject}\n{$template->email_content}";

        return "You are an expert email personalizer. Transform this template for the specific contact.

{$contactInfo}

{$templateInfo}

REQUIREMENTS:
- Personalize with contact's name, company, and role
- Keep professional tone
- Include relevant industry insights
- Add psychological triggers (urgency, social proof)

CRITICAL: Respond with ONLY valid JSON (no markdown, no code blocks):
{
\"subject\": \"personalized subject\",
\"body\": \"personalized email body\",
\"personalization_score\": 85,
\"key_personalizations\": [\"list of changes made\"],
\"psychological_triggers\": [\"triggers used\"],
\"industry_insights\": [\"insights included\"],
\"role_adaptations\": [\"role-specific changes\"]
}";
    }

    private function callGroqAPI(string $prompt, string $modelName): array
    {
        try {
            $groq = new Groq($this->groqApiKey);

            $response = $groq->chat()->completions()->create([
                'model' => $modelName,
                'messages' => [
                    [
                        'role' => 'system',
                        'content' => 'You are an expert email personalizer. Respond with ONLY valid JSON. No markdown, no code blocks, no explanations.'
                    ],
                    [
                        'role' => 'user',
                        'content' => $prompt
                    ]
                ],
                'temperature' => 0.7,
                'max_completion_tokens' => 1500, // Reduced for speed
            ]);

            $content = null;
            if (is_object($response)) {
                $content = $response->choices[0]->message->content ?? null;
            } elseif (is_array($response)) {
                $content = $response['choices'][0]['message']['content'] ?? null;
            }

            if (!$content) {
                throw new Exception('Invalid response format from Groq API');
            }

            return ['content' => $content];
        } catch (Exception $e) {
            throw new Exception('Groq API request failed: ' . $e->getMessage());
        }
    }

    /**
     * 🔥 ENHANCED: Better JSON parsing with multiple cleanup strategies
     */
    private function parseAndValidateResponse(array $response, Contact $contact, UserSavedEmails $template): array
    {
        if (!isset($response['content'])) {
            throw new Exception('Invalid response structure from Groq API');
        }

        $content = trim($response['content']);

        // 🔥 MULTIPLE CLEANUP STRATEGIES for JSON parsing
        $cleanupStrategies = [
            // Strategy 1: Remove markdown code blocks
            function ($content) {
                return preg_replace('/^\`\`\`(?:json)?\s*|\s*\`\`\`$/m', '', $content);
            },
            // Strategy 2: Extract JSON from between first { and last }
            function ($content) {
                $start = strpos($content, '{');
                $end = strrpos($content, '}');
                if ($start !== false && $end !== false && $end > $start) {
                    return substr($content, $start, $end - $start + 1);
                }
                return $content;
            },
            // Strategy 3: Remove common prefixes/suffixes
            function ($content) {
                $content = preg_replace('/^(Here\'s|Here is|The JSON response is:?)\s*/i', '', $content);
                $content = preg_replace('/\s*(That\'s it!?|Hope this helps!?)$/i', '', $content);
                return $content;
            }
        ];

        $decoded = null;
        $lastError = '';

        foreach ($cleanupStrategies as $strategy) {
            $cleanedContent = $strategy($content);
            $cleanedContent = trim($cleanedContent);

            $decoded = json_decode($cleanedContent, true);
            if (json_last_error() === JSON_ERROR_NONE) {
                break; // Success!
            }
            $lastError = json_last_error_msg();
        }

        if ($decoded === null || json_last_error() !== JSON_ERROR_NONE) {
            Log::error('🚨 JSON parsing failed after all strategies', [
                'contact_id' => $contact->id,
                'json_error' => $lastError,
                'content_preview' => substr($content, 0, 300)
            ]);
            throw new Exception('Invalid JSON response from Groq API: ' . $lastError);
        }

        if (!isset($decoded['subject']) || !isset($decoded['body'])) {
            throw new Exception('Missing required fields in Groq response');
        }

        return [
            'subject' => $decoded['subject'],
            'body' => $decoded['body'],
            'personalization_score' => $decoded['personalization_score'] ?? 75,
            'key_personalizations' => $decoded['key_personalizations'] ?? [],
            'psychological_triggers' => $decoded['psychological_triggers'] ?? [],
            'industry_insights' => $decoded['industry_insights'] ?? [],
            'role_adaptations' => $decoded['role_adaptations'] ?? []
        ];
    }

    private function checkModelRateLimit(array $modelConfig): array
    {
        $cacheKey = $modelConfig['cache_key'];
        $tokensPerMinute = $modelConfig['tokens_per_minute'];

        $currentUsage = Cache::get($cacheKey, [
            'tokens_used' => 0,
            'last_reset' => now()->timestamp,
            'request_count' => 0
        ]);

        if (now()->timestamp - $currentUsage['last_reset'] >= 60) {
            $currentUsage = [
                'tokens_used' => 0,
                'last_reset' => now()->timestamp,
                'request_count' => 0
            ];
        }

        $availableTokens = $tokensPerMinute - $currentUsage['tokens_used'];
        $safeTokens = $availableTokens - $this->safetyBuffer;

        return [
            'can_proceed' => $safeTokens > 800, // Reduced threshold
            'available_tokens' => $availableTokens,
            'safe_tokens' => $safeTokens,
            'usage' => $currentUsage,
            'recommended_delay' => 1 // Fixed 1 second delay for speed
        ];
    }

    private function updateModelUsage(array $modelConfig, int $tokensUsed): void
    {
        $cacheKey = $modelConfig['cache_key'];

        $currentUsage = Cache::get($cacheKey, [
            'tokens_used' => 0,
            'last_reset' => now()->timestamp,
            'request_count' => 0
        ]);

        if (now()->timestamp - $currentUsage['last_reset'] >= 60) {
            $currentUsage = [
                'tokens_used' => 0,
                'last_reset' => now()->timestamp,
                'request_count' => 0
            ];
        }

        $currentUsage['tokens_used'] += $tokensUsed;
        $currentUsage['request_count']++;

        Cache::put($cacheKey, $currentUsage, now()->addMinutes(2));
    }

    public function getModelUsageStats(): array
    {
        return $this->modelUsageStats;
    }

    private function getAdvancedFallbackPersonalization(Contact $contact, UserSavedEmails $template): array
    {
        $subject = $template->subject;
        $body = $template->email_content;
        $personalizations = [];

        // Quick personalization replacements
        $replacements = [
            ['{name}', '[name]', '{{name}}'] => $contact->name,
            ['{company}', '[company]', '{{company}}'] => $contact->company ?? 'your company',
            ['{role}', '[role]', '{{role}}'] => $contact->job_title ?? 'your role'
        ];

        foreach ($replacements as $patterns => $replacement) {
            foreach ($patterns as $pattern) {
                if (str_contains($subject, $pattern)) {
                    $subject = str_replace($pattern, $replacement, $subject);
                    $personalizations[] = "Replaced {$pattern} in subject";
                }
                if (str_contains($body, $pattern)) {
                    $body = str_replace($pattern, $replacement, $body);
                    $personalizations[] = "Replaced {$pattern} in body";
                }
            }
        }

        return [
            'subject' => $subject,
            'body' => $body,
            'personalization_score' => 70,
            'key_personalizations' => $personalizations,
            'psychological_triggers' => ['Personalization', 'Relevance'],
            'industry_insights' => [],
            'role_adaptations' => []
        ];
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
        return "ORIGINAL EMAIL TEMPLATE:\nSubject: {$template->subject}\nContent: {$template->email_content}\n\nEMAIL STRATEGY CONTEXT:\n- Purpose: " . ($template->purpose ? $template->purpose : 'General outreach') . "\n- Tone: " . ($template->tone ? $template->tone : 'Professional') . "\n- Target Audience: " . ($template->audience ? $template->audience : 'General') . "\n- Call-to-Action: " . ($template->cta ? $template->cta : 'Not specified') . "\n- Context: " . ($template->context ? $template->context : 'Not specified');
    }

    private function getIndustryContext(Contact $contact): string
    {
        $industry = null;
        if ($contact->custom_fields && isset($contact->custom_fields['industry'])) {
            $industry = $contact->custom_fields['industry'];
        }

        if (!$industry) return '';

        $industryContexts = [
            'technology' => "TECHNOLOGY INDUSTRY CONTEXT:\n- Fast-paced environment with rapid innovation cycles\n- Focus on scalability, efficiency, and competitive advantage\n- Decision makers value data-driven solutions and ROI metrics\n- Common challenges: scaling operations, talent acquisition, market competition\n- Communication style: Direct, metrics-focused, innovation-oriented",
            'healthcare' => "HEALTHCARE INDUSTRY CONTEXT:\n- Highly regulated environment with compliance requirements\n- Focus on patient outcomes, safety, and operational efficiency\n- Decision makers prioritize proven solutions with strong security\n- Common challenges: regulatory compliance, cost management, patient satisfaction\n- Communication style: Professional, evidence-based, compliance-aware",
            'finance' => "FINANCIAL SERVICES CONTEXT:\n- Risk-averse environment with strict regulatory oversight\n- Focus on security, compliance, and operational efficiency\n- Decision makers value proven track records and risk mitigation\n- Common challenges: regulatory changes, digital transformation, security threats\n- Communication style: Formal, risk-focused, compliance-oriented",
            'retail' => "RETAIL INDUSTRY CONTEXT:\n- Highly competitive with thin margins and seasonal fluctuations\n- Focus on customer experience, inventory management, and profitability\n- Decision makers prioritize solutions that drive sales and reduce costs\n- Common challenges: omnichannel integration, inventory optimization, customer retention\n- Communication style: Results-oriented, customer-focused, efficiency-driven"
        ];

        return isset($industryContexts[strtolower($industry)]) ? $industryContexts[strtolower($industry)] : '';
    }

    private function getRoleContext(Contact $contact): string
    {
        if (!$contact->job_title) return '';

        $title = strtolower($contact->job_title);

        if (str_contains($title, 'ceo') || str_contains($title, 'president')) {
            return "CEO/PRESIDENT ROLE CONTEXT:\n- Strategic decision maker focused on company vision and growth\n- Interested in solutions that drive competitive advantage and market position\n- Values high-level strategic benefits over technical details\n- Communication style: Executive-level, strategic, results-focused";
        }

        if (str_contains($title, 'cto') || str_contains($title, 'technology')) {
            return "CTO/TECHNOLOGY LEADER CONTEXT:\n- Technical decision maker focused on innovation and system architecture\n- Interested in scalable, secure, and efficient technical solutions\n- Values technical specifications and integration capabilities\n- Communication style: Technical, innovation-focused, architecture-oriented";
        }

        if (str_contains($title, 'operations') || str_contains($title, 'ops')) {
            return "OPERATIONS LEADER CONTEXT:\n- Process-focused decision maker interested in efficiency and optimization\n- Values solutions that streamline operations and reduce manual work\n- Concerned with scalability, reliability, and operational metrics\n- Communication style: Process-oriented, efficiency-focused, metrics-driven";
        }

        return '';
    }
}
