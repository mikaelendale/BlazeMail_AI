<?php

namespace App\Http\Controllers;

use App\Models\UserSavedEmails;
use App\Services\CreditService;
use App\Services\PromptEngineering\PromptEngineeringService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\RateLimiter;
use Inertia\Inertia;
use Inertia\Response;

class EmailGenerateController extends Controller
{
    protected PromptEngineeringService $promptService;
    private CreditService $creditService;

    public function __construct(CreditService $creditService, PromptEngineeringService $promptService)
    {
        $this->creditService = $creditService;
        $this->promptService = $promptService;
    }

    public function store(Request $request): Response
    {
        $data = $request->validate([
            'sender' => 'required|string|max:255',
            'subject' => 'required|string|max:255',
            'context' => 'required|string|max:2000',
            'tone' => 'nullable|string|max:100',
            'recipient' => 'nullable|string|max:255',
            'purpose' => 'nullable|string|max:100',
            'model' => 'nullable|string|in:blazemail-70b,blazemail-lite',
            'cta' => 'nullable|string|max:255',
            'audience' => 'nullable|string|max:255',
            'personalization' => 'boolean',
            'personalized_data' => 'nullable|array',
            'personalized_data.recipient' => 'required_if:personalization,true|string|max:255',
            'personalized_data.audience' => 'required_if:personalization,true|string|max:255',
            'personalized_data.personalization' => 'boolean',
            'prompt_strategy' => 'nullable|string|in:rgc,few_shot,chain_of_thought',
        ]);

        // Determine the action type and strategy for credit deduction
        $actionType = 'email_generation';
        $strategy = $data['prompt_strategy'] ?? config('prompt-engineering.default_strategy', 'rgc');

        // Get strategy-based credit cost
        $creditCost = $this->creditService->getStrategyCreditCost($strategy);

        // Attempt to deduct credits before proceeding with AI generation
        $creditResult = $this->creditService->attemptCreditUsage(
            $request->user(),
            $actionType,
            $creditCost, // Use strategy-based cost
            [
                'request_data' => $data,
                'strategy' => $strategy,
                'credit_cost' => $creditCost
            ]
        );

        if (!$creditResult['success']) {
            // If credit deduction fails, return an error response
            return Inertia::render('user/email/generate', [
                'error' => $creditResult['message'],
                'submittedData' => $data,
                'strategy_costs' => $this->creditService->getStrategyCosts(),
                'user_balance' => $request->user()->credit_balance,
            ]);
        }

        // Sanitize inputs
        $data = $this->promptService->sanitizeInput($data);

        // Validate with prompt engineering service
        $validationErrors = $this->promptService->validateInput($data);
        if (!empty($validationErrors)) {
            // Refund credits if input validation fails after deduction
            $this->creditService->addCredits(
                $request->user(),
                $creditResult['credits_used'],
                'refund',
                'Email generation input validation failed - refund',
                ['failed_transaction_id' => $creditResult['transaction_id']]
            );

            return Inertia::render('user/email/generate', [
                'error' => implode('. ', $validationErrors),
                'submittedData' => $data,
                'strategy_costs' => $this->creditService->getStrategyCosts(),
                'user_balance' => $request->user()->fresh()->credit_balance,
            ]);
        }

        try {
            // Set prompt strategy
            $this->promptService->setStrategy($strategy);

            // Get training examples
            $examples = $this->promptService->getTrainingExamples();
            if (empty($examples)) {
                throw new \Exception('Training examples not available');
            }

            // Select relevant examples
            $isPersonalized = $data['personalization'] ?? false;
            $audience = $isPersonalized ? ($data['personalized_data']['audience'] ?? '') : ($data['audience'] ?? '');
            $selectedExamples = $this->promptService->selectExamples($examples, [
                'tone' => $data['tone'] ?? 'professional',
                'purpose' => $data['purpose'] ?? 'introduction',
                'audience' => $audience,
            ]);

            // Generate email
            $result = $this->promptService->generateEmail($data, $selectedExamples);

            return Inertia::render('user/email/generate', array_merge($result, [
                'submittedData' => $data,
                'success' => isset($result['emailSubject']) && isset($result['emailBody']),
                'strategy_used' => $strategy,
                'credits_used' => $creditResult['credits_used'],
                'remaining_balance' => $request->user()->fresh()->credit_balance,
                'strategy_costs' => $this->creditService->getStrategyCosts(),
                'current_strategy_cost' => $creditCost,
                'user_balance' => $request->user()->fresh()->credit_balance,
            ]));
        } catch (\Exception $e) {
            // Refund credits if AI generation fails
            $this->creditService->addCredits(
                $request->user(),
                $creditResult['credits_used'],
                'refund',
                'Email generation failed - refund',
                ['failed_transaction_id' => $creditResult['transaction_id']]
            );

            Log::error('Email generation failed', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'user_id' => Auth::id(),
                'data' => $data,
                'strategy' => $strategy,
                'credit_cost' => $creditCost,
                'line' => $e->getLine(),
                'file' => $e->getFile(),
            ]);

            return Inertia::render('user/email/generate', [
                'error' => 'Failed to generate email: AI generation error. Credits have been refunded.',
                'submittedData' => $data,
                'strategy_costs' => $this->creditService->getStrategyCosts(),
                'user_balance' => $request->user()->fresh()->credit_balance,
            ]);
        }
    }

    public function refine(Request $request): Response
    {
        $data = $request->validate([
            'currentSubject' => 'required|string|max:255',
            'currentBody' => 'required|string|max:5000',
            'feedback' => 'array',
            'customFeedback' => 'nullable|string|max:500',
            'prompt' => 'nullable|string',
            'personalized_data' => 'nullable|array',
            'prompt_strategy' => 'nullable|string|in:rgc,few_shot,chain_of_thought',
        ]);

        // Determine the action type and strategy for credit deduction
        $actionType = 'email_generation'; // Different action type for refinement
        $strategy = $data['prompt_strategy'] ?? 'few_shot'; // Default strategy for refinement

        // Get strategy-based credit cost
        $creditCost = $this->creditService->getStrategyCreditCost($strategy);

        // Attempt to deduct credits before proceeding with AI refinement
        $creditResult = $this->creditService->attemptCreditUsage(
            $request->user(),
            $actionType,
            $creditCost, // Use strategy-based cost
            [
                'request_data' => $data,
                'strategy' => $strategy,
                'credit_cost' => $creditCost
            ]
        );

        if (!$creditResult['success']) {
            // If credit deduction fails, return an error response
            return Inertia::render('user/email/generate', [
                'error' => $creditResult['message'],
                'emailSubject' => $data['currentSubject'],
                'emailBody' => $data['currentBody'],
                'prompt' => $data['prompt'],
                'strategy_costs' => $this->creditService->getStrategyCosts(),
                'user_balance' => $request->user()->credit_balance,
            ]);
        }

        try {
            // Set prompt strategy
            $this->promptService->setStrategy($strategy);

            // Refine email
            $result = $this->promptService->refineEmail($data);

            return Inertia::render('user/email/generate', array_merge($result, [
                'strategy_used' => $strategy,
                'credits_used' => $creditResult['credits_used'],
                'remaining_balance' => $request->user()->fresh()->credit_balance,
                'strategy_costs' => $this->creditService->getStrategyCosts(),
                'current_strategy_cost' => $creditCost,
                'user_balance' => $request->user()->fresh()->credit_balance,
            ]));
        } catch (\Exception $e) {
            // Refund credits if AI refinement fails
            $this->creditService->addCredits(
                $request->user(),
                $creditResult['credits_used'],
                'refund',
                'Email refinement failed - refund',
                ['failed_transaction_id' => $creditResult['transaction_id']]
            );

            Log::error('Email refinement failed', [
                'error' => $e->getMessage(),
                'user_id' => Auth::id(),
                'data' => $data,
                'strategy' => $strategy,
                'credit_cost' => $creditCost,
            ]);

            return Inertia::render('user/email/generate', [
                'emailSubject' => $data['currentSubject'],
                'emailBody' => $data['currentBody'],
                'prompt' => $data['prompt'],
                'error' => 'Failed to refine email. Credits have been refunded. Please try again.',
                'strategy_costs' => $this->creditService->getStrategyCosts(),
                'user_balance' => $request->user()->fresh()->credit_balance,
            ]);
        }
    }

    public function save(Request $request)
    {
        $data = $request->validate([
            'email_subject' => 'required|string|max:255',
            'email_content' => 'required|string|max:10000',
            'subject' => 'nullable|string|max:255',
            'sender' => 'nullable|string|max:255',
            'recipient' => 'nullable|string|max:255',
            'tone' => 'nullable|string|max:100',
            'purpose' => 'nullable|string|max:100',
            'prompt' => 'required|string',
            'audience' => 'nullable|string|max:255',
            'cta' => 'nullable|string|max:255',
            'model' => 'required|string',
            'context' => 'required|string|max:2000',
            'personalization' => 'boolean',
            'personalized_data' => 'nullable|array',
            'meta' => 'nullable|array',
            'strategy_used' => 'nullable|string',
        ]);

        $userEmail = UserSavedEmails::create([
            'user_id' => Auth::id(),
            'subject' => $data['email_subject'],
            'sender' => $data['sender'],
            'recipient' => $data['recipient'],
            'tone' => $data['tone'],
            'purpose' => $data['purpose'],
            'audience' => $data['audience'],
            'cta' => $data['cta'],
            'context' => $data['context'],
            'prompt' => $data['prompt'],
            'email_content' => $data['email_content'],
            'model_used' => $data['model'],
            'is_personalized' => $data['personalization'] ?? false,
            'personalized_data' => $data['personalized_data'] ?? null,
            'strategy_used' => $data['strategy_used'] ?? null,
            'meta' => $data['meta'],
        ]);

        return redirect()->route('user.email.generate.send', ['email_id' => $userEmail->id]);
    }

    /**
     * Get strategy costs for frontend (API endpoint)
     */
    public function getStrategyCosts(Request $request)
    {
        return response()->json([
            'strategy_costs' => $this->creditService->getStrategyCosts(),
            'user_balance' => $request->user()->credit_balance,
            'credit_info' => $this->creditService->getUserCreditInfo($request->user()),
        ]);
    }

    /**
     * Check if user can afford a specific strategy
     */
    public function checkStrategyAffordability(Request $request)
    {
        $strategy = $request->input('strategy', 'rgc');
        $cost = $this->creditService->getStrategyCreditCost($strategy);
        $user = $request->user();

        return response()->json([
            'can_afford' => $user->credit_balance >= $cost,
            'cost' => $cost,
            'balance' => $user->credit_balance,
            'shortfall' => max(0, $cost - $user->credit_balance),
            'strategy' => $strategy,
        ]);
    }

    public function testGroq()
    {
        try {
            $groq = new \LucianoTonet\GroqPHP\Groq(config('services.groq.api_key'));
            $reply = $groq->chat()->completions()->create([
                'model' => 'llama3-8b-8192',
                'messages' => [
                    ['role' => 'user', 'content' => 'Say hello'],
                ],
                'temperature' => 0.7,
                'max_completion_tokens' => 50,
            ]);

            Log::info('Groq API working!', $reply);
        } catch (\Exception $e) {
            Log::error('Groq API Error:', $e->getMessage());
        }
    }
}
