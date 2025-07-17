<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class Analytics extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'post_id',
        'session_id',
        'ip_address',
        'user_agent',
        'referrer',
        'source',
        'medium',
        'campaign',
        'country',
        'city',
        'device_type',
        'browser',
        'os',
        'time_on_page',
        'is_bounce',
    ];

    protected $casts = [
        'is_bounce' => 'boolean',
    ];

    public function post()
    {
        return $this->belongsTo(Post::class);
    }

    public static function trackPageView($postId, $request)
    {
        $userAgent = $request->userAgent();
        $referrer = $request->header('referer');

        // Parse referrer to determine source and medium
        $source = 'direct';
        $medium = 'none';

        if ($referrer) {
            $parsedUrl = parse_url($referrer);
            $domain = $parsedUrl['host'] ?? '';

            // Determine source based on referrer
            if (str_contains($domain, 'google.com')) {
                $source = 'google';
                $medium = 'organic';
            } elseif (str_contains($domain, 'bing.com')) {
                $source = 'bing';
                $medium = 'organic';
            } elseif (str_contains($domain, 'yahoo.com')) {
                $source = 'yahoo';
                $medium = 'organic';
            } elseif (str_contains($domain, 'facebook.com')) {
                $source = 'facebook';
                $medium = 'social';
            } elseif (str_contains($domain, 'twitter.com') || str_contains($domain, 'x.com')) {
                $source = 'twitter';
                $medium = 'social';
            } elseif (str_contains($domain, 'linkedin.com')) {
                $source = 'linkedin';
                $medium = 'social';
            } elseif (str_contains($domain, 'instagram.com')) {
                $source = 'instagram';
                $medium = 'social';
            } else {
                $source = $domain;
                $medium = 'referral';
            }
        }

        // Detect device type
        $deviceType = 'desktop';
        if (preg_match('/Mobile|Android|iPhone|iPad/', $userAgent)) {
            $deviceType = preg_match('/iPad/', $userAgent) ? 'tablet' : 'mobile';
        }

        // Detect browser
        $browser = 'unknown';
        if (preg_match('/Chrome/', $userAgent)) $browser = 'chrome';
        elseif (preg_match('/Firefox/', $userAgent)) $browser = 'firefox';
        elseif (preg_match('/Safari/', $userAgent)) $browser = 'safari';
        elseif (preg_match('/Edge/', $userAgent)) $browser = 'edge';

        // Detect OS
        $os = 'unknown';
        if (preg_match('/Windows/', $userAgent)) $os = 'windows';
        elseif (preg_match('/Mac/', $userAgent)) $os = 'macos';
        elseif (preg_match('/Linux/', $userAgent)) $os = 'linux';
        elseif (preg_match('/Android/', $userAgent)) $os = 'android';
        elseif (preg_match('/iOS/', $userAgent)) $os = 'ios';

        return self::create([
            'post_id' => $postId,
            'session_id' => session()->getId(),
            'ip_address' => $request->ip(),
            'user_agent' => $userAgent,
            'referrer' => $referrer,
            'source' => $source,
            'medium' => $medium,
            'device_type' => $deviceType,
            'browser' => $browser,
            'os' => $os,
        ]);
    }
}
