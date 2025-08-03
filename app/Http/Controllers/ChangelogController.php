<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class ChangelogController extends Controller
{
    public function index()
    {
        try {
            $changelogPath = resource_path('markdown/CHANGELOG.md');
            $changelogContent = file_get_contents($changelogPath);

            // Process images in markdown - convert relative paths to absolute URLs
            $changelogContent = $this->processImages($changelogContent);

            // Extract last updated date (first YYYY-MM-DD found after a version header)
            $lastUpdated = null;
            if (preg_match('/^##\s*\[[^\]]+\]\s*-\s*(\d{4}-\d{2}-\d{2})/m', $changelogContent, $matches)) {
                $lastUpdated = $matches[1];
            }
        } catch (\Exception $e) {
            $changelogContent = "# Changelog\n\nChangelog content could not be loaded.";
            $lastUpdated = null;
        }

        return Inertia::render('changelog', [
            'changelogContent' => $changelogContent,
            'pageTitle' => 'Changelog – BlazeMail',
            'pageDescription' => 'Stay up to date with the latest updates to BlazeMail',
            'currentVersion' => 'v0.3.2',
            'lastUpdated' => $lastUpdated,
        ]);
    }

    /**
     * Process images in markdown content
     */
    private function processImages($content)
    {
        // Convert relative image paths to absolute URLs
        $content = preg_replace_callback(
            '/!\[([^\]]*)\]$$([^)]+)$$/',
            function ($matches) {
                $alt = $matches[1];
                $src = $matches[2];

                // If it's already an absolute URL, leave it as is
                if (filter_var($src, FILTER_VALIDATE_URL)) {
                    return $matches[0];
                }

                // Convert relative path to absolute URL
                if (strpos($src, '/') === 0) {
                    // Absolute path from root
                    $absoluteUrl = url($src);
                } else {
                    // Relative path - assume it's in public/images/changelog/
                    $absoluteUrl = asset('images/changelog/' . $src);
                }

                return "![{$alt}]({$absoluteUrl})";
            },
            $content
        );

        return $content;
    }

    /**
     * Upload image for changelog
     */
    public function uploadImage(Request $request)
    {
        $request->validate([
            'image' => 'required|image|mimes:jpeg,png,jpg,gif,svg|max:2048',
        ]);

        if ($request->file('image')) {
            $imageName = time() . '.' . $request->image->extension();
            $request->image->move(public_path('images/changelog'), $imageName);

            return response()->json([
                'success' => true,
                'url' => asset('images/changelog/' . $imageName),
                'filename' => $imageName
            ]);
        }

        return response()->json(['success' => false], 400);
    }
}
