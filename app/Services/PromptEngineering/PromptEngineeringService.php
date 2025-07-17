<?php

namespace App\Services\PromptEngineering;

use App\Services\PromptEngineering\Contracts\PromptStrategyInterface;
use App\Services\PromptEngineering\Exceptions\PromptEngineeringException;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

class PromptEngineeringService
{
    protected array $config;
    protected PromptStrategyInterface $strategy;

    public function __construct()
    {
        $this->config = config('prompt-engineering');
    }

    /**
     * Set the prompt strategy
     */
    public function setStrategy(string $strategyName): self
    {
        if (!isset($this->config['strategies'][$strategyName])) {
            throw new PromptEngineeringException("Strategy '{$strategyName}' not found");
        }

        $strategyConfig = $this->config['strategies'][$strategyName];
        $this->strategy = new $strategyConfig['class']($this->config);

        return $this;
    }

    /**
     * Generate email using the selected strategy
     */
    public function generateEmail(array $data, array $examples = []): array
    {
        if (!isset($this->strategy)) {
            $this->setStrategy($this->config['default_strategy']);
        }

        return $this->strategy->generateEmail($data, $examples);
    }

    /**
     * Refine existing email
     */
    public function refineEmail(array $data): array
    {
        if (!isset($this->strategy)) {
            $this->setStrategy($this->config['default_strategy']);
        }

        return $this->strategy->refineEmail($data);
    }

    /**
     * Select relevant examples from training data
     */
    public function selectExamples(array $examples, array $criteria): array
    {
        if (!isset($this->strategy)) {
            $this->setStrategy($this->config['default_strategy']);
        }

        return $this->strategy->selectExamples($examples, $criteria);
    }

    /**
     * Get cached examples or load from CSV
     */
    public function getTrainingExamples(): array
    {
        if (!$this->config['cache']['enabled']) {
            return $this->loadExamplesFromCsv();
        }

        return Cache::remember(
            $this->config['cache']['examples_key'],
            $this->config['cache']['examples_ttl'],
            fn() => $this->loadExamplesFromCsv()
        );
    }

    /**
     * Load examples from CSV file
     */
    protected function loadExamplesFromCsv(): array
    {
        $examples = [];
        $csvPath = public_path('training_csv_for_blazemail.csv');

        if (!file_exists($csvPath)) {
            Log::warning('Training CSV file not found', ['path' => $csvPath]);
            return [];
        }

        if (($handle = fopen($csvPath, 'r')) !== false) {
            $headers = fgetcsv($handle);
            if (!$headers) {
                fclose($handle);
                return [];
            }

            while (($row = fgetcsv($handle)) !== false) {
                if (count($row) < count($headers)) continue;

                $example = array_combine($headers, $row);
                // Ensure UTF-8 encoding
                $example = array_map(function ($value) {
                    return mb_convert_encoding($value, 'UTF-8', 'UTF-8');
                }, $example);

                $examples[] = $example;
            }
            fclose($handle);
        }

        return $examples;
    }

    /**
     * Validate input data
     */
    public function validateInput(array $data): array
    {
        $rules = $this->config['validation'];
        $errors = [];

        // Validate subject length
        if (isset($data['subject'])) {
            $subjectLength = strlen($data['subject']);
            if ($subjectLength < $rules['min_subject_length']) {
                $errors[] = "Subject must be at least {$rules['min_subject_length']} characters";
            }
            if ($subjectLength > $rules['max_subject_length']) {
                $errors[] = "Subject must not exceed {$rules['max_subject_length']} characters";
            }
        }

        // Validate context length
        if (isset($data['context'])) {
            $contextLength = strlen($data['context']);
            if ($contextLength < $rules['min_context_length']) {
                $errors[] = "Context must be at least {$rules['min_context_length']} characters";
            }
            if ($contextLength > $rules['max_context_length']) {
                $errors[] = "Context must not exceed {$rules['max_context_length']} characters";
            }
        }

        return $errors;
    }

    /**
     * Get model configuration
     */
    public function getModelConfig(string $model): array
    {
        return $this->config['models'][$model] ?? $this->config['models']['blazemail-lite'];
    }

    /**
     * Sanitize input data
     */
    public function sanitizeInput(array $data): array
    {
        $sanitized = [];
        foreach ($data as $key => $value) {
            if (is_string($value)) {
                $sanitized[$key] = strip_tags(trim($value));
            } elseif (is_array($value)) {
                $sanitized[$key] = $this->sanitizeInput($value);
            } else {
                $sanitized[$key] = $value;
            }
        }
        return $sanitized;
    }
}
