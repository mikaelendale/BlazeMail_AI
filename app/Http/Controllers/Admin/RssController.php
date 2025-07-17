<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Post;
use Illuminate\Http\Response;

class RssController extends Controller
{
    public function index()
    {
        $posts = Post::published()
            ->with('author')
            ->latest('published_at')
            ->take(20)
            ->get();

        $xml = '<?xml version="1.0" encoding="UTF-8"?>';
        $xml .= '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">';
        $xml .= '<channel>';
        $xml .= '<title>Your Blog Name</title>';
        $xml .= '<description>Latest posts from Your Blog</description>';
        $xml .= '<link>' . route('blog.index') . '</link>';
        $xml .= '<atom:link href="' . route('rss') . '" rel="self" type="application/rss+xml" />';
        $xml .= '<language>en-us</language>';
        $xml .= '<lastBuildDate>' . now()->toRssString() . '</lastBuildDate>';

        foreach ($posts as $post) {
            $xml .= '<item>';
            $xml .= '<title><![CDATA[' . $post->title . ']]></title>';
            $xml .= '<description><![CDATA[' . $post->excerpt . ']]></description>';
            $xml .= '<link>' . route('blog.show', $post->slug) . '</link>';
            $xml .= '<guid>' . route('blog.show', $post->slug) . '</guid>';
            $xml .= '<pubDate>' . $post->published_at->toRssString() . '</pubDate>';
            $xml .= '<author>' . $post->author->email . ' (' . $post->author->name . ')</author>';
            if ($post->featured_image) {
                $xml .= '<enclosure url="' . $post->featured_image . '" type="image/jpeg" />';
            }
            $xml .= '</item>';
        }

        $xml .= '</channel>';
        $xml .= '</rss>';

        return response($xml, 200, [
            'Content-Type' => 'application/rss+xml'
        ]);
    }
}
