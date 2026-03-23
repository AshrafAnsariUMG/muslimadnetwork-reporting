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
        'key' => env('POSTMARK_API_KEY'),
    ],

    'resend' => [
        'key' => env('RESEND_API_KEY'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],

    'ummahpass' => [
        'client_id' => env('UMMAHPASS_CLIENT_ID'),
        'client_secret' => env('UMMAHPASS_CLIENT_SECRET'),
        'redirect_uri' => env('UMMAHPASS_REDIRECT_URI'),
        'base_url' => 'https://ummahpass.com',
    ],

    'cm360' => [
        'profile_id' => env('CM360_PROFILE_ID'),
        'advertiser_id' => env('CM360_ADVERTISER_ID'),
        'refresh_token' => env('CM360_REFRESH_TOKEN'),
        'client_id' => env('CM360_OAUTH_CLIENT_ID'),
        'client_secret' => env('CM360_OAUTH_CLIENT_SECRET'),
    ],

    'gmail' => [
        'client_id' => env('GMAIL_OAUTH_CLIENT_ID'),
        'client_secret' => env('GMAIL_OAUTH_CLIENT_SECRET'),
        'refresh_token' => env('GMAIL_REFRESH_TOKEN'),
        'from_address' => env('GMAIL_FROM_ADDRESS'),
    ],

];
