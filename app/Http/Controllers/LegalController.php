<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class LegalController extends Controller
{
    public function privacy()
    {
        try {
            $privacyContent = file_get_contents(
                resource_path('markdown/PRIVACY_POLICY.md')
            );
        } catch (\Exception $e) {
            $privacyContent = "# Privacy Policy\n\nPrivacy policy content could not be loaded.";
        }

        return Inertia::render('Legal/Privacy', [
            'content' => $privacyContent,
            'pageTitle' => 'Privacy Policy – BlazeMail',
            'pageDescription' => 'Learn how BlazeMail protects your privacy and handles your data',
            'lastUpdated' => 'January 15, 2024',
            'pageType' => 'privacy'
        ]);
    }

    public function terms()
    {
        try {
            $termsContent = file_get_contents(
                resource_path('markdown/TERMS_OF_SERVICE.md')
            );
        } catch (\Exception $e) {
            $termsContent = "# Terms of Service\n\nTerms of service content could not be loaded.";
        }

        return Inertia::render('Legal/Terms', [
            'content' => $termsContent,
            'pageTitle' => 'Terms of Service – BlazeMail',
            'pageDescription' => 'Read the terms and conditions for using BlazeMail services',
            'lastUpdated' => 'January 15, 2024',
            'pageType' => 'terms'
        ]);
    }
}
