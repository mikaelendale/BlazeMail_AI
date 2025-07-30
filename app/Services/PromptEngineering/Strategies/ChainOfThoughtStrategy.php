<?php

namespace App\Services\PromptEngineering\Strategies;

use App\Services\PromptEngineering\Contracts\PromptStrategyInterface;
use LucianoTonet\GroqPHP\Groq;
use Illuminate\Support\Facades\Log;

class ChainOfThoughtStrategy implements PromptStrategyInterface
{
    protected array $config;

    public function __construct(array $config)
    {
        $this->config = $config;
    }

    public function generateEmail(array $data, array $examples = []): array
    {
        $prompt = $this->buildChainOfThoughtPrompt($data, $examples);

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

    protected function buildChainOfThoughtPrompt(array $data, array $examples): string
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
You are a world-class SaaS cold email copywriter. Think step by step, but respond with ONLY valid JSON.

CONTEXT: {$personalizationContext}

REQUIREMENTS:
- Subject: {$data['subject']}
- Sender: {$data['sender']}
- Recipient: {$recipient}
- Context: {$data['context']}
- Purpose: {$purpose}
- Tone: {$tone}
- Audience: {$audience}
- Call To Action: {$cta}

EXAMPLES:
{$examplesText}

CONSTRAINTS:
- {$constraints}

Think through this step by step:
1. Analyze the requirements and context
2. Consider the examples and best practices
3. Craft an email that meets all requirements
4. Ensure proper tone and personalization

IMPORTANT: Respond with ONLY this JSON format, no other text:
{
    "subject": "email subject here",
    "body": "complete email body here"
}
EOD;
    }

    protected function buildRefinementPrompt(array $data): string
    {
        $templates = $this->config['refinement_templates'];

        $improvements = implode(', ', $data['feedback'] ?? []);
        $custom = trim($data['customFeedback'] ?? '');

        $guidelines = implode("\n- ", $templates['refinement_guidelines']);

        return <<<EOD
You are refining an email. Think step by step, but respond with ONLY valid JSON.

ORIGINAL EMAIL:
Subject: {$data['currentSubject']}
Body: {$data['currentBody']}

FEEDBACK TO ADDRESS:
- Improvements needed: {$improvements}
- Custom feedback: {$custom}

GUIDELINES:
- {$guidelines}

Think through the refinement process:
1. Identify what needs improvement
2. Apply the feedback systematically
3. Ensure the refined version is better

IMPORTANT: Respond with ONLY this JSON format, no other text:
{
    "subject": "refined subject line",
    "body": "refined email body"
}
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
Select the {$count} most relevant examples. Respond with ONLY a JSON array.

AVAILABLE EXAMPLES:
{$metadataJson}

CRITERIA:
Tone: {$tone}
Purpose: {$purpose}
Audience: {$audience}

Respond with ONLY a JSON array of indexes: [1, 3, 5]
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
Purpose: {$ex['Purpose']}
Tone: {$ex['Tone']}
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
                        'content' => 'You are a professional email copywriter. You MUST respond with ONLY valid JSON in the exact format requested. Do not include any explanatory text, reasoning, or additional content outside the JSON.'
                    ],
                    ['role' => 'user', 'content' => mb_convert_encoding($prompt, 'UTF-8', 'UTF-8')],
                ],
                'temperature' => $modelConfig['temperature'],
                'max_completion_tokens' => $modelConfig['max_tokens'],
            ]);

            $content = trim($reply['choices'][0]['message']['content'] ?? '');

            // More aggressive JSON extraction
            // First, try to find the last complete JSON object
            if (preg_match_all('/\{[^{}]*"subject"[^{}]*"body"[^{}]*\}/s', $content, $matches)) {
                $jsonContent = end($matches[0]); // Get the last match
            } else {
                // Try to extract any JSON-like structure at the end
                if (preg_match('/.*(\{.*\})\s*$/s', $content, $matches)) {
                    $jsonContent = $matches[1];
                } else {
                    $jsonContent = $content;
                }
            }

            // Clean up the JSON
            $jsonContent = preg_replace('/^\`\`\`json\s*/', '', $jsonContent);
            $jsonContent = preg_replace('/\s*\`\`\`$/', '', $jsonContent);
            $jsonContent = trim($jsonContent);

            // Remove any text before the opening brace
            if (preg_match('/\{.*\}/s', $jsonContent, $matches)) {
                $jsonContent = $matches[0];
            }

            $json = json_decode($jsonContent, true);

            if (is_array($json) && isset($json['subject'], $json['body'])) {
                return [
                    'emailSubject' => $json['subject'],
                    'emailBody' => $json['body'],
                    'prompt' => $prompt,
                ];
            } else {
                // Log for debugging
                Log::error("Failed to parse JSON response", [
                    'raw_content' => $content,
                    'extracted_json' => $jsonContent,
                    'json_error' => json_last_error_msg(),
                    'type' => $type
                ]);

                // Try one more fallback - manual extraction
                if (
                    preg_match('/"subject"\s*:\s*"([^"]*)"/', $content, $subjectMatch) &&
                    preg_match('/"body"\s*:\s*"([^"]*(?:\\.[^"]*)*)"/', $content, $bodyMatch)
                ) {

                    return [
                        'emailSubject' => $subjectMatch[1],
                        'emailBody' => str_replace('\n', "\n", $bodyMatch[1]),
                        'prompt' => $prompt,
                    ];
                }

                throw new \Exception('Could not extract valid JSON from AI response');
            }
        } catch (\Exception $e) {
            Log::error("Groq API call failed for {$type}", [
                'error' => $e->getMessage(),
                'model' => $model
            ]);
            throw $e;
        }
    }

    protected function getFallbackExamples(array $examples): array
    {
        $count = $this->config['example_selection']['selection_count'];
        return array_slice($examples, 0, $count);
    }
}
