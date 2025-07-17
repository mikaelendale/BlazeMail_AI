<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\NewsletterSubscription;
use Illuminate\Support\Str;

class NewsletterSeeder extends Seeder
{
    public function run(): void
    {
        $subscribers = [
            ['email' => 'subscriber1@example.com', 'name' => 'Alice Johnson'],
            ['email' => 'subscriber2@example.com', 'name' => 'Bob Smith'],
            ['email' => 'subscriber3@example.com', 'name' => 'Carol Davis'],
            ['email' => 'subscriber4@example.com', 'name' => 'David Wilson'],
            ['email' => 'subscriber5@example.com', 'name' => 'Emma Brown'],
            ['email' => 'subscriber6@example.com', 'name' => 'Frank Miller'],
            ['email' => 'subscriber7@example.com', 'name' => 'Grace Taylor'],
            ['email' => 'subscriber8@example.com', 'name' => 'Henry Anderson'],
            ['email' => 'subscriber9@example.com', 'name' => 'Ivy Thomas'],
            ['email' => 'subscriber10@example.com', 'name' => 'Jack Martinez'],
        ];

        foreach ($subscribers as $subscriber) {
            NewsletterSubscription::create([
                'email' => $subscriber['email'],
                'name' => $subscriber['name'],
                'email_verified_at' => now(),
                'is_active' => true,
                'preferences' => [
                    'categories' => ['Web Development', 'Technology News'],
                    'frequency' => 'weekly',
                ],
            ]);
        }

        // Add some unverified subscriptions
        for ($i = 11; $i <= 15; $i++) {
            NewsletterSubscription::create([
                'email' => "pending{$i}@example.com",
                'name' => "Pending User {$i}",
                'verification_token' => Str::random(60),
                'is_active' => false,
            ]);
        }
    }
}
