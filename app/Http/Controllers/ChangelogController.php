<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class ChangelogController extends Controller
{
    public function index()
    {
        // try {

        // } catch (\Exception $e) {
        //     $changelogContent = "# Changelog\n\nChangelog content could not be loaded.";
        // }
        // dd($changelogContent);
        $changelogContent = file_get_contents(resource_path('/markdown/CHANGELOG.md'));
        // dd($changelogContent);
        return Inertia::render('changelog', [
            'changelogContent' => $changelogContent,
            'pageTitle' => 'Changelog – BlazeMail',
            'pageDescription' => 'Stay up to date with the latest updates to BlazeMail',
            'currentVersion' => 'v0',
            'lastUpdated' => 'January 15, 2024'
        ]);
    }
}
