<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Analytics;
use App\Models\Post;
use Carbon\Carbon;

class AnalyticsSeeder extends Seeder
{
    public function run(): void
    {
        $posts = Post::where('status', 'published')->get();

        $sources = ['google', 'facebook', 'twitter', 'linkedin', 'direct', 'github', 'dev.to'];
        $mediums = ['organic', 'social', 'referral', 'direct', 'email'];
        $devices = ['desktop', 'mobile', 'tablet'];
        $browsers = ['chrome', 'firefox', 'safari', 'edge'];
        $operatingSystems = ['windows', 'macos', 'linux', 'android', 'ios'];

        foreach ($posts as $post) {
            $publishedDate = Carbon::parse($post->published_at);
            $daysSincePublished = $publishedDate->diffInDays(now());

            // Generate analytics data for each day since publication
            for ($day = 0; $day < $daysSincePublished; $day++) {
                $currentDate = $publishedDate->copy()->addDays($day);
                $viewsPerDay = rand(5, 50); // Random views per day

                for ($view = 0; $view < $viewsPerDay; $view++) {
                    $source = $sources[array_rand($sources)];
                    $medium = $source === 'direct' ? 'none' : $mediums[array_rand($mediums)];

                    if ($source === 'google') $medium = 'organic';
                    if (in_array($source, ['facebook', 'twitter', 'linkedin'])) $medium = 'social';

                    Analytics::create([
                        'post_id' => $post->id,
                        'session_id' => 'sess_' . uniqid(),
                        'ip_address' => $this->generateRandomIP(),
                        'user_agent' => $this->generateUserAgent(),
                        'referrer' => $source !== 'direct' ? "https://{$source}.com" : null,
                        'source' => $source,
                        'medium' => $medium,
                        'campaign' => rand(1, 10) > 8 ? 'newsletter_' . date('Y_m') : null,
                        'country' => $this->getRandomCountry(),
                        'city' => $this->getRandomCity(),
                        'device_type' => $devices[array_rand($devices)],
                        'browser' => $browsers[array_rand($browsers)],
                        'os' => $operatingSystems[array_rand($operatingSystems)],
                        'time_on_page' => rand(30, 600), // 30 seconds to 10 minutes
                        'is_bounce' => rand(1, 10) > 6, // 40% bounce rate
                        'created_at' => $currentDate->addMinutes(rand(0, 1439)), // Random time during the day
                    ]);
                }
            }
        }
    }

    private function generateRandomIP(): string
    {
        return rand(1, 255) . '.' . rand(1, 255) . '.' . rand(1, 255) . '.' . rand(1, 255);
    }

    private function generateUserAgent(): string
    {
        $userAgents = [
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0',
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Safari/605.1.15',
            'Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1',
        ];

        return $userAgents[array_rand($userAgents)];
    }

    private function getRandomCountry(): string
    {
        $countries = ['United States', 'United Kingdom', 'Canada', 'Germany', 'France', 'Australia', 'Japan', 'India', 'Brazil', 'Netherlands'];
        return $countries[array_rand($countries)];
    }

    private function getRandomCity(): string
    {
        $cities = ['New York', 'London', 'Toronto', 'Berlin', 'Paris', 'Sydney', 'Tokyo', 'Mumbai', 'São Paulo', 'Amsterdam'];
        return $cities[array_rand($cities)];
    }
}
