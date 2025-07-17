<?php

namespace App\Services\PromptEngineering\Contracts;

interface PromptStrategyInterface
{
    public function generateEmail(array $data, array $examples = []): array;
    public function refineEmail(array $data): array;
    public function selectExamples(array $examples, array $criteria): array;
}
