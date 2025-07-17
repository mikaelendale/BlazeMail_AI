<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Post;
use App\Models\Category;
use App\Models\Tag;
use Illuminate\Http\Response;

class SitemapController extends Controller
{
    public function index()
    {
        $posts = Post::published()
            ->select('slug', 'updated_at')
            ->orderBy('updated_at', 'desc')
            ->get();

        $categories = Category::select('slug', 'updated_at')->get();
        $tags = Tag::select('slug', 'updated_at')->get();

        $xml = '<?xml version="1.0" encoding="UTF-8"?>';
        $xml .= '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">';

        // Homepage
        $xml .= '<url>';
        $xml .= '<loc>' . route('blog.index') . '</loc>';
        $xml .= '<changefreq>daily</changefreq>';
        $xml .= '<priority>1.0</priority>';
        $xml .= '</url>';

        // Posts
        foreach ($posts as $post) {
            $xml .= '<url>';
            $xml .= '<loc>' . route('blog.show', $post->slug) . '</loc>';
            $xml .= '<lastmod>' . $post->updated_at->toAtomString() . '</lastmod>';
            $xml .= '<changefreq>weekly</changefreq>';
            $xml .= '<priority>0.8</priority>';
            $xml .= '</url>';
        }

        // Categories
        foreach ($categories as $category) {
            $xml .= '<url>';
            $xml .= '<loc>' . route('blog.category', $category->slug) . '</loc>';
            $xml .= '<lastmod>' . $category->updated_at->toAtomString() . '</lastmod>';
            $xml .= '<changefreq>weekly</changefreq>';
            $xml .= '<priority>0.6</priority>';
            $xml .= '</url>';
        }

        // Tags
        foreach ($tags as $tag) {
            $xml .= '<url>';
            $xml .= '<loc>' . route('blog.tag', $tag->slug) . '</loc>';
            $xml .= '<lastmod>' . $tag->updated_at->toAtomString() . '</lastmod>';
            $xml .= '<changefreq>monthly</changefreq>';
            $xml .= '<priority>0.4</priority>';
            $xml .= '</url>';
        }

        $xml .= '</urlset>';

        return response($xml, 200, [
            'Content-Type' => 'application/xml'
        ]);
    }
}
