<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Default Prompt Strategy
    |--------------------------------------------------------------------------
    */
    'default_strategy' => env('PROMPT_STRATEGY', 'chain_of_thought'),

    /*
    |--------------------------------------------------------------------------
    | Prompt Strategies
    |--------------------------------------------------------------------------
    */
    'strategies' => [
        'rgc' => [
            'class' => App\Services\PromptEngineering\Strategies\RGCStrategy::class,
            'temperature' => 0.7,
            'max_tokens' => 500,
        ],
        'few_shot' => [
            'class' => App\Services\PromptEngineering\Strategies\FewShotStrategy::class,
            'temperature' => 0.6,
            'max_tokens' => 600,
        ],
        'chain_of_thought' => [
            'class' => App\Services\PromptEngineering\Strategies\ChainOfThoughtStrategy::class,
            'temperature' => 0.5,
            'max_tokens' => 800,
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Email Generation Templates
    |--------------------------------------------------------------------------
    */
    'email_templates' => [
        'system_role' => 'You are a world-class SaaS cold email copywriter with 10+ years of experience. You specialize in creating high-converting, personalized emails that drive engagement and results.',

        'personalization_contexts' => [
            'enabled' => 'PERSONALIZATION ACTIVE: This email is specifically crafted for {recipient} who works in the {audience} space. Make it highly relevant and personal.',
            'disabled' => 'GENERIC TEMPLATE: Create a versatile email template that can be used across different recipients and audiences.',
        ],

        'tone_modifiers' => [
            'professional' => 'Maintain a business-appropriate, polished tone with industry-standard language.',
            'friendly' => 'Use a warm, approachable tone that builds rapport while remaining professional.',
            'casual' => 'Write in a relaxed, conversational style that feels natural and authentic.',
            'persuasive' => 'Employ compelling language and psychological triggers to drive action.',
            'formal' => 'Use traditional business language with proper etiquette and structure.',
            'conversational' => 'Write as if speaking directly to the recipient in a one-on-one conversation.',
        ],

        'purpose_frameworks' => [
            'follow-up' => 'Structure as a follow-up that references previous interaction and moves the conversation forward.',
            'introduction' => 'Create a compelling first impression that establishes credibility and value proposition.',
            'sales-pitch' => 'Focus on benefits, social proof, and clear value proposition with strong call-to-action.',
            'demo-request' => 'Build interest and urgency around seeing the product in action.',
            'networking' => 'Emphasize mutual benefit and relationship building over direct selling.',
            'thank-you' => 'Express genuine gratitude while subtly reinforcing the relationship.',
        ],

        'output_format' => [
            'instruction' => 'Return ONLY a valid JSON object with exactly this structure:',
            'example' => '{"subject": "Compelling subject line here", "body": "Complete email body without subject line"}',
            'constraints' => [
                'No explanations or additional text outside the JSON',
                'No markdown formatting in JSON values',
                'Subject line should be 6-10 words and compelling',
                'Email body should be 50-150 words unless specified otherwise',
                'Include proper email structure with greeting, body, and sign-off',
                'Ensure the call-to-action is clear and actionable',
            ],
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Refinement Templates
    |--------------------------------------------------------------------------
    */
    'refinement_templates' => [
        'system_role' => 'You are an expert email communication specialist who excels at refining emails to improve clarity, professionalism, and effectiveness while maintaining the original intent.',

        'improvement_focus' => [
            'clarity' => 'Simplify complex sentences, improve readability, and ensure the message is crystal clear.',
            'tone' => 'Adjust the formality level and emotional tone to better match the intended audience and purpose.',
            'concise' => 'Remove unnecessary words and redundancy while preserving all important information.',
            'professional' => 'Enhance business language, structure, and overall professional presentation.',
            'persuasive' => 'Strengthen compelling elements, call-to-action, and psychological triggers.',
            'friendly' => 'Add warmth and approachability while maintaining professional boundaries.',
        ],

        'refinement_guidelines' => [
            'Maintain the original intent and core message',
            'Improve clarity, professionalism, and readability',
            'Ensure proper email etiquette and structure',
            'Keep the tone appropriate for the context',
            'Make only necessary changes - avoid over-editing',
            'Ensure the subject line is compelling and relevant',
            'Structure the body with proper paragraphs and flow',
            'Use active voice where appropriate',
            'Remove redundancy and improve conciseness',
            'Maintain politeness and professionalism',
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Example Selection Criteria
    |--------------------------------------------------------------------------
    */
    'example_selection' => [
        'system_role' => 'You are a helpful assistant specialized in professional email writing and pattern matching.',
        'selection_count' => 4,
        'selection_criteria' => [
            'Prioritize examples that match the requested tone',
            'Consider purpose alignment as secondary priority',
            'Factor in audience similarity when available',
            'Ensure variety in email structures and approaches',
        ],
        'fallback_strategy' => 'random_selection', // 'first_n', 'random_selection', 'balanced_selection'
    ],

    /*
    |--------------------------------------------------------------------------
    | Model Configurations
    |--------------------------------------------------------------------------
    */
    'models' => [
        'blazemail-70b' => [
            'groq_model' => 'llama3-70b-8192',
            'temperature' => 0.7,
            'max_tokens' => 500,
            'description' => 'Advanced model for complex, nuanced emails',
        ],
        'blazemail-lite' => [
            'groq_model' => 'llama3-8b-8192',
            'temperature' => 0.6,
            'max_tokens' => 400,
            'description' => 'Fast, efficient model for standard emails',
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Validation Rules
    |--------------------------------------------------------------------------
    */
    'validation' => [
        'min_subject_length' => 5,
        'max_subject_length' => 100,
        'min_context_length' => 10,
        'max_context_length' => 2000,
        'max_custom_tone_length' => 50,
        'max_custom_purpose_length' => 50,
    ],

    /*
    |--------------------------------------------------------------------------
    | Caching Configuration
    |--------------------------------------------------------------------------
    */
    'cache' => [
        'examples_ttl' => 3600, // 1 hour
        'examples_key' => 'email_examples',
        'enabled' => env('PROMPT_CACHE_ENABLED', true),
    ],
];
