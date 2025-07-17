<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Mailgun, Postmark, AWS and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'postmark' => [
        'token' => env('POSTMARK_TOKEN'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'resend' => [
        'key' => env('RESEND_KEY'),
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],
    'github' => [
        'client_id' => env('GITHUB_CLIENT_ID'),
        'client_secret' => env('GITHUB_CLIENT_SECRET'),
        'redirect' => env('GITHUB_REDIRECT_URI', 'http://localhost:8000/auth/github/callback'),
    ],
    'google' => [
        'client_id' => env('GOOGLE_CLIENT_ID'),
        'client_secret' => env('GOOGLE_CLIENT_SECRET'),
        'redirect' => env('GOOGLE_REDIRECT_URI', 'http://localhost:8000/auth/google/callback'),
    ],
    // Separate Google config for email connections (won't interfere with auth)
    'gmail' => [
        'client_id' => env('GMAIL_CLIENT_ID'),
        'client_secret' => env('GMAIL_CLIENT_SECRET'),
        'redirect_uri' => env('GMAIL_REDIRECT_URI', env('APP_URL') . '/oauth/gmail/callback'),
    ],

    'email_limits' => [
        'daily_max' => env('EMAIL_DAILY_MAX', 10000),
        'hourly_max' => env('EMAIL_HOURLY_MAX', 500),
        'warmup_max_days' => env('WARMUP_MAX_DAYS', 30),
    ],
    'paddle' => [
        // Price IDs    
        'growth_monthly_price_id' => env('PADDLE_GROWTH_MONTHLY_PRICE_ID'),
        'scale_monthly_price_id' => env('PADDLE_SCALE_MONTHLY_PRICE_ID'),
        'growth_annual_price_id' => env('PADDLE_GROWTH_ANNUAL_PRICE_ID'),
        'scale_annual_price_id' => env('PADDLE_SCALE_ANNUAL_PRICE_ID'),
        // Price amounts
        'growth_monthly_amount' => env('GROWTH_MONTHLY_SUBSCRIPTION_AMOUNT'),
        'growth_annual_amount' => env('GROWTH_ANNUAL_SUBSCRIPTION_AMOUNT'),
        'scale_monthly_amount' => env('SCALE_MONTHLY_SUBSCRIPTION_AMOUNT'),
        'scale_annual_amount' => env('SCALE_ANNUAL_SUBSCRIPTION_AMOUNT'),
    ],
    // NEW: Credit amounts per plan
    'credits' => [
        'free_plan_monthly' => 50, // Credits for free users, monthly
        'growth_plan_monthly' => 2000, // Credits for Growth plan, monthly
        'scale_plan_monthly' => 5000, // Credits for Scale plan, monthly
    ],
    'groq' => [
        'api_key' => env('GROQ_API_KEY'),
        'model' => env('GROQ_MODEL', 'llama3-70b-8192'),
    ],
];
