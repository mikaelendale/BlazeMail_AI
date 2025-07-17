<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Comment;
use App\Models\Post;
use App\Models\User;
use Carbon\Carbon;

class CommentSeeder extends Seeder
{
    public function run(): void
    {
        $posts = Post::where('status', 'published')->get();
        $users = User::all();

        $comments = [
            'Great article! This really helped me understand the concept better.',
            'Thanks for sharing this. I\'ve been looking for exactly this information.',
            'Excellent tutorial. The examples are very clear and easy to follow.',
            'This is really useful. I\'ll definitely be implementing this in my next project.',
            'Well written and comprehensive. Keep up the great work!',
            'I have a question about the implementation. Could you provide more details?',
            'This approach worked perfectly for my use case. Thank you!',
            'Interesting perspective. I hadn\'t thought about it this way before.',
            'The code examples are really helpful. Thanks for including them.',
            'This is exactly what I needed. Bookmarking for future reference.',
            'Great explanation of complex concepts. Very beginner-friendly.',
            'I love how you break down the steps. Makes it easy to follow along.',
            'This tutorial saved me hours of research. Much appreciated!',
            'Clear and concise writing. Looking forward to more content like this.',
            'The practical examples really help solidify the concepts.',
        ];

        foreach ($posts as $post) {
            // Generate 3-8 comments per post
            $commentCount = rand(3, 8);

            for ($i = 0; $i < $commentCount; $i++) {
                $user = $users->random();
                $createdAt = Carbon::parse($post->published_at)->addDays(rand(1, 30));

                $comment = Comment::create([
                    'post_id' => $post->id,
                    'user_id' => $user->id,
                    'content' => $comments[array_rand($comments)],
                    'status' => rand(1, 10) > 2 ? 'approved' : 'pending', // 80% approved
                    'created_at' => $createdAt,
                    'updated_at' => $createdAt,
                ]);

                // 30% chance of having a reply
                if (rand(1, 10) <= 3) {
                    $replyUser = $users->where('id', '!=', $user->id)->random();
                    Comment::create([
                        'post_id' => $post->id,
                        'user_id' => $replyUser->id,
                        'parent_id' => $comment->id,
                        'content' => 'Thanks for your comment! ' . $comments[array_rand($comments)],
                        'status' => 'approved',
                        'created_at' => $createdAt->addHours(rand(1, 24)),
                        'updated_at' => $createdAt->addHours(rand(1, 24)),
                    ]);
                }
            }
        }
    }
}
