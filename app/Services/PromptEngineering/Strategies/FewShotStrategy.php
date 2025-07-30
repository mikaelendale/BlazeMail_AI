<?php

namespace App\Services\PromptEngineering\Strategies;

use App\Services\PromptEngineering\Contracts\PromptStrategyInterface;
use LucianoTonet\GroqPHP\Groq;
use Illuminate\Support\Facades\Log;

class FewShotStrategy implements PromptStrategyInterface
{
    protected array $config;

    public function __construct(array $config)
    {
        $this->config = $config;
    }

    public function generateEmail(array $data, array $examples = []): array
    {
        $prompt = $this->buildFewShotPrompt($data, $examples);

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

    protected function buildFewShotPrompt(array $data, array $examples): string
    {
        $templates = $this->config['email_templates'];

        $isPersonalized = $data['personalization'] ?? false;
        $personalizationContext = $isPersonalized
            ? str_replace(
                ['{recipient}', '{audience}'],
                [$data['personalized_data']['recipient'] ?? 'the recipient', $data['personalized_data']['audience'] ?? 'their industry'],
                $templates['personalization_contexts']['enabled']
            )
            : $templates['personalization_contexts']['disabled'];

        $examplesText = $this->formatExamples($examples);
        $constraints = implode("\n- ", $templates['output_format']['constraints']);

        $recipient = $isPersonalized ? ($data['personalized_data']['recipient'] ?? 'N/A') : (isset($data['recipient']) ? $data['recipient'] : 'N/A');
        $audience = $isPersonalized ? ($data['personalized_data']['audience'] ?? 'N/A') : (isset($data['audience']) ? $data['audience'] : 'N/A');
        $purpose = isset($data['purpose']) ? $data['purpose'] : 'N/A';
        $tone = isset($data['tone']) ? $data['tone'] : 'professional';
        $cta = isset($data['cta']) ? $data['cta'] : 'N/A';

        return <<<EOD
You are a world-class SaaS cold email copywriter with 10+ years of experience.

CONTEXT: {$personalizationContext}

TRAINING EXAMPLES (Learn from these patterns):
{$examplesText}

YOUR TASK:
Generate an email using the patterns and style from the examples above.

EMAIL REQUIREMENTS:
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

CRITICAL: You MUST respond with ONLY a valid JSON object in this exact format:
{
    "subject": "Your email subject here",
    "body": "Your email body here"
}

Do NOT include any other text, explanations, or markdown formatting. Only return the JSON object.

Generate the email now:
EOD;
    }

    protected function buildRefinementPrompt(array $data): string
    {
        $templates = $this->config['refinement_templates'];

        $improvements = implode(', ', $data['feedback'] ?? []);
        $custom = trim($data['customFeedback'] ?? '');

        $guidelines = implode("\n- ", $templates['refinement_guidelines']);

        return <<<EOD
{$templates['system_role']}

ORIGINAL EMAIL:
Subject: {$data['currentSubject']}
Body: {$data['currentBody']}

REFINEMENT REQUIREMENTS:
- Requested improvements: {$improvements}
- Additional instructions: {$custom}

GUIDELINES:
- {$guidelines}

CRITICAL: You MUST respond with ONLY a valid JSON object in this exact format:
{
    "subject": "Refined subject line",
    "body": "Refined email body"
}

Do NOT include any other text, explanations, or markdown formatting. Only return the JSON object.

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
        $count = $this->config['example_selection']['selection_count'];

        $tone = isset($criteria['tone']) ? $criteria['tone'] : 'N/A';
        $purpose = isset($criteria['purpose']) ? $criteria['purpose'] : 'N/A';
        $audience = isset($criteria['audience']) ? $criteria['audience'] : 'N/A';

        return <<<EOD
Select the {$count} most relevant examples for few-shot learning.

AVAILABLE EXAMPLES:
{$metadataJson}

USER REQUEST:
Tone: {$tone}
Purpose: {$purpose}
Audience: {$audience}

Return ONLY a JSON array of indexes, e.g. [2, 5, 7, 12].
EOD;
    }

    protected function formatExamples(array $examples): string
    {
        $examplesText = '';
        foreach ($examples as $ex) {
            $examplesText .= <<<EX
EXAMPLE:
Subject: {$ex['Subject']}
Body: {$ex['FullEmailText']}
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
                    [
                        'role' => 'system',
                        'content' => 'You are a professional email copywriter. Always respond with valid JSON only. Never include explanations or markdown formatting.'
                    ],
                    ['role' => 'user', 'content' => mb_convert_encoding($prompt, 'UTF-8', 'UTF-8')],
                ],
                'temperature' => $modelConfig['temperature'],
                'max_completion_tokens' => $modelConfig['max_tokens'],
            ]);

            $content = trim($reply['choices'][0]['message']['content'] ?? '');

            // Log the raw response for debugging
            Log::info('Raw AI response', ['content' => $content]);

            // More aggressive JSON extraction
            $content = $this->extractJSON($content);

            $json = json_decode($content, true);

            if (json_last_error() !== JSON_ERROR_NONE) {
                Log::error('JSON decode error', [
                    'error' => json_last_error_msg(),
                    'content' => $content
                ]);
                throw new \Exception('JSON decode error: ' . json_last_error_msg());
            }

            if (is_array($json) && isset($json['subject'], $json['body'])) {
                return [
                    'emailSubject' => $json['subject'],
                    'emailBody' => $json['body'],
                    'prompt' => $prompt,
                ];
            } else {
                Log::error('Invalid JSON structure', ['json' => $json]);
                throw new \Exception('Invalid JSON response structure from AI');
            }
        } catch (\Exception $e) {
            Log::error("Groq API call failed for {$type}", [
                'error' => $e->getMessage(),
                'model' => $model,
                'trace' => $e->getTraceAsString()
            ]);
            throw $e;
        }
    }

    /**
     * Extract JSON from AI response with multiple fallback strategies
     */
    protected function extractJSON(string $content): string
    {
        // Remove common markdown formatting
        $content = preg_replace('/^```json\s*/i', '', $content);
        $content = preg_replace('/\s*```$/', '', $content);
        $content = preg_replace('/^```\s*/', '', $content);

        // Try to find JSON object pattern
        if (preg_match('/\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}/', $content, $matches)) {
            return $matches[0];
        }

        // If no JSON found, try to construct it from the content
        if (
            preg_match('/subject["\']?\s*:\s*["\']([^"\']+)["\']/', $content, $subjectMatch) &&
            preg_match('/body["\']?\s*:\s*["\']([^"\']+)["\']/', $content, $bodyMatch)
        ) {

            return json_encode([
                'subject' => $subjectMatch[1],
                'body' => $bodyMatch[1]
            ]);
        }

        // Last resort: return the content as is
        return $content;
    }

    protected function getFallbackExamples(array $examples): array
    {
        $count = $this->config['example_selection']['selection_count'];
        return array_slice($examples, 0, $count);
    }
}
