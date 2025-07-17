<?php

namespace App\Services\PromptEngineering\Strategies;

use App\Services\PromptEngineering\Contracts\PromptStrategyInterface;
use LucianoTonet\GroqPHP\Groq;
use Illuminate\Support\Facades\Log;

class RGCStrategy implements PromptStrategyInterface
{
    protected array $config;

    public function __construct(array $config)
    {
        $this->config = $config;
    }

    public function generateEmail(array $data, array $examples = []): array
    {
        $prompt = $this->buildRGCPrompt($data, $examples);
        
        return $this->callGroqAPI($prompt, $data['model'] ?? 'blazemail-lite');
    }

    public function refineEmail(array $data): array
    {
        $prompt = $this->buildRefinementPrompt($data);
        
        return $this->callGroqAPI($prompt, 'blazemail-lite', 'refinement');
    }

    public function selectExamples(array $examples, array $criteria): array
    {
        $prompt = $this->buildExampleSelectionPrompt($examples, $criteria);
        
        try {
            $groq = new Groq(config('services.groq.api_key'));
            $reply = $groq->chat()->completions()->create([
                'model' => 'llama3-8b-8192',
                'messages' => [
                    ['role' => 'system', 'content' => $this->config['example_selection']['system_role']],
                    ['role' => 'user', 'content' => $prompt],
                ],
                'temperature' => 0,
                'max_completion_tokens' => 100,
            ]);

            $indexesJson = $reply['choices'][0]['message']['content'] ?? '[]';
            
            // Extract JSON array from response
            if (preg_match('/\[(.*?)\]/s', $indexesJson, $matches)) {
                $indexesJson = '[' . $matches[1] . ']';
            }

            $selectedIndexes = json_decode($indexesJson, true);
            if (!is_array($selectedIndexes)) {
                return $this->getFallbackExamples($examples);
            }

            $selectedExamples = [];
            foreach ($selectedIndexes as $idx) {
                if (isset($examples[$idx])) {
                    $selectedExamples[] = $examples[$idx];
                }
            }

            return $selectedExamples;

        } catch (\Exception $e) {
            Log::warning('Example selection failed, using fallback', ['error' => $e->getMessage()]);
            return $this->getFallbackExamples($examples);
        }
    }

    protected function buildRGCPrompt(array $data, array $examples): string
    {
        $templates = $this->config['email_templates'];
        
        // Role
        $role = $templates['system_role'];
        
        // Context - Personalization
        $isPersonalized = $data['personalization'] ?? false;
        $personalizationContext = $isPersonalized 
            ? str_replace(
                ['{recipient}', '{audience}'], 
                [$data['personalized_data']['recipient'] ?? 'the recipient', $data['personalized_data']['audience'] ?? 'their industry'], 
                $templates['personalization_contexts']['enabled']
            )
            : $templates['personalization_contexts']['disabled'];

        // Goal - Tone and Purpose
        $tone = $data['tone'] ?? 'professional';
        $purpose = $data['purpose'] ?? 'introduction';
        
        $toneModifier = $templates['tone_modifiers'][$tone] ?? $templates['tone_modifiers']['professional'];
        $purposeFramework = $templates['purpose_frameworks'][$purpose] ?? $templates['purpose_frameworks']['introduction'];

        // Examples context
        $examplesText = $this->formatExamples($examples);

        // Constraints
        $constraints = implode("\n- ", $templates['output_format']['constraints']);
        $recipient = $isPersonalized ? ($data['personalized_data']['recipient'] ?? 'N/A') : (isset($data['recipient']) ? $data['recipient'] : 'N/A');
        $audience = $isPersonalized ? ($data['personalized_data']['audience'] ?? 'N/A') : (isset($data['audience']) ? $data['audience'] : 'N/A');
        $cta = isset($data['cta']) ? $data['cta'] : 'N/A';

        return <<<EOD
ROLE: {$role}

CONTEXT: {$personalizationContext}

TONE GUIDANCE: {$toneModifier}

PURPOSE FRAMEWORK: {$purposeFramework}

TRAINING EXAMPLES:
{$examplesText}

EMAIL DETAILS:
- Subject: {$data['subject']}
- Sender: {$data['sender']}
- Recipient: {$recipient}
- Context: {$data['context']}
- Purpose: {$purpose}
- Tone: {$tone}
- Audience: {$audience}
- Call To Action: {$cta}

CONSTRAINTS:
- {$constraints}

OUTPUT FORMAT:
{$templates['output_format']['instruction']}
{$templates['output_format']['example']}

Generate the email now:
EOD;
    }

    protected function buildRefinementPrompt(array $data): string
    {
        $templates = $this->config['refinement_templates'];
        
        $improvements = implode(', ', $data['feedback'] ?? []);
        $custom = trim($data['customFeedback'] ?? '');
        
        $isPersonalized = isset($data['personalized_data']) && ($data['personalized_data']['personalization'] ?? false);
        $personalizationContext = $isPersonalized 
            ? "This is a personalized email for {$data['personalized_data']['recipient']} targeting {$data['personalized_data']['audience']}. Maintain personalization."
            : "This is a generic email template.";

        $guidelines = implode("\n- ", $templates['refinement_guidelines']);

        return <<<EOD
ROLE: {$templates['system_role']}

CONTEXT: {$personalizationContext}

ORIGINAL EMAIL:
Subject: {$data['currentSubject']}
Body: {$data['currentBody']}

REFINEMENT REQUIREMENTS:
- Requested improvements: {$improvements}
- Additional instructions: {$custom}

REFINEMENT GUIDELINES:
- {$guidelines}

OUTPUT FORMAT:
Return ONLY a valid JSON object:
{"subject": "Refined subject line", "body": "Refined email body"}

Refine the email now:
EOD;
    }

    protected function buildExampleSelectionPrompt(array $examples, array $criteria): string
    {
        $metadataList = [];
        foreach ($examples as $i => $ex) {
            $metadataList[] = [
                'index' => $i,
                'tone' => $ex['Tone'] ?? '',
                'purpose' => $ex['Purpose'] ?? '',
                'audience' => $ex['Audience'] ?? '',
            ];
        }

        $metadataJson = json_encode($metadataList, JSON_PRETTY_PRINT);
        $selectionCriteria = implode("\n- ", $this->config['example_selection']['selection_criteria']);
        $count = $this->config['example_selection']['selection_count'];

        $tone = $criteria['tone'] ?? 'N/A';
        $purpose = $criteria['purpose'] ?? 'N/A';
        $audience = $criteria['audience'] ?? 'N/A';
        return <<<EOD
SELECTION CRITERIA:
- {$selectionCriteria}

AVAILABLE EXAMPLES METADATA:
{$metadataJson}

USER REQUEST:
Tone: {$tone}
Purpose: {$purpose}
Audience: {$audience}

Select the {$count} most relevant examples by index that best match the user's request.
Return ONLY a JSON array of the selected indexes, e.g. [2, 5, 7, 12]. Do not include any explanation or extra text.
EOD;
    }

    protected function formatExamples(array $examples): string
    {
        $examplesText = '';
        foreach ($examples as $ex) {
            $examplesText .= <<<EX
---
Subject: {$ex['Subject']}
Sender: {$ex['Sender']}
Recipient: {$ex['Recipient']}
Context: {$ex['Context']}
Purpose: {$ex['Purpose']}
Tone: {$ex['Tone']}
Audience: {$ex['Audience']}
CTA: {$ex['CTA']}
FullEmail: {$ex['FullEmailText']}
---

EX;
        }
        return $examplesText;
    }

    protected function callGroqAPI(string $prompt, string $model, string $type = 'generation'): array
    {
        try {
            $modelConfig = $this->config['models'][$model] ?? $this->config['models']['blazemail-lite'];
            
            $groq = new Groq(config('services.groq.api_key'));
            $reply = $groq->chat()->completions()->create([
                'model' => $modelConfig['groq_model'],
                'messages' => [
                    ['role' => 'system', 'content' => 'You are a professional email writer. Always respond with valid JSON only.'],
                    ['role' => 'user', 'content' => mb_convert_encoding($prompt, 'UTF-8', 'UTF-8')],
                ],
                'temperature' => $modelConfig['temperature'],
                'max_completion_tokens' => $modelConfig['max_tokens'],
            ]);

            $content = trim($reply['choices'][0]['message']['content'] ?? '');
            
            // Log the raw response for debugging
            Log::info('Raw AI Response', ['content' => $content]);
            
            // Clean JSON response - handle multiple formats
            $content = preg_replace('/^```json\s*/', '', $content);
            $content = preg_replace('/^```\s*/', '', $content);
            $content = preg_replace('/\s*```$/', '', $content);
            
            // Try to extract JSON from the response
            if (preg_match('/\{.*\}/s', $content, $matches)) {
                $content = $matches[0];
            }
            
            Log::info('Cleaned AI Response', ['content' => $content]);
            
            $json = json_decode($content, true);
            
            if (json_last_error() !== JSON_ERROR_NONE) {
                Log::error('JSON decode error', [
                    'error' => json_last_error_msg(),
                    'content' => $content
                ]);
                
                // Fallback: try to parse manually
                return $this->parseResponseManually($content);
            }

            if (is_array($json) && isset($json['subject'], $json['body'])) {
                return [
                    'emailSubject' => $json['subject'],
                    'emailBody' => $json['body'],
                    'prompt' => $prompt,
                ];
            } else {
                Log::error('Invalid JSON structure', ['json' => $json]);
                return $this->parseResponseManually($content);
            }

        } catch (\Exception $e) {
            Log::error("Groq API call failed for {$type}", [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            throw $e;
        }
    }

    protected function parseResponseManually(string $content): array
    {
        // Try to extract subject and body manually
        $subject = 'Generated Email Subject';
        $body = $content;
        
        // Look for subject patterns
        if (preg_match('/subject["\']?\s*:\s*["\']([^"\']+)["\']?/i', $content, $matches)) {
            $subject = $matches[1];
        }
        
        // Look for body patterns
        if (preg_match('/body["\']?\s*:\s*["\']([^"\']+)["\']?/i', $content, $matches)) {
            $body = $matches[1];
        } elseif (preg_match('/\{[^}]*\}/', $content)) {
            // If it looks like broken JSON, use the whole content as body
            $body = strip_tags($content);
        }
        
        return [
            'emailSubject' => $subject,
            'emailBody' => $body,
            'prompt' => '',
        ];
    }

    protected function getFallbackExamples(array $examples): array
    {
        $strategy = $this->config['example_selection']['fallback_strategy'];
        $count = $this->config['example_selection']['selection_count'];

        return match($strategy) {
            'first_n' => array_slice($examples, 0, $count),
            'random_selection' => collect($examples)->random(min($count, count($examples)))->toArray(),
            'balanced_selection' => $this->getBalancedSelection($examples, $count),
            default => array_slice($examples, 0, $count),
        };
    }

    protected function getBalancedSelection(array $examples, int $count): array
    {
        // Group by tone and purpose, then select evenly
        $grouped = collect($examples)->groupBy(function ($item) {
            return ($item['Tone'] ?? 'unknown') . '_' . ($item['Purpose'] ?? 'unknown');
        });

        $selected = [];
        $perGroup = max(1, floor($count / $grouped->count()));
        
        foreach ($grouped as $group) {
            $selected = array_merge($selected, $group->take($perGroup)->toArray());
            if (count($selected) >= $count) break;
        }

        return array_slice($selected, 0, $count);
    }
}
