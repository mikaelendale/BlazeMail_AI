<?php

namespace App\Http\Controllers;

use App\Models\UserSavedEmails;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ScamCheckController extends Controller
{
    public function index(Request $request) {
        $emailId = $request->input('id');
        $savedEmail =  UserSavedEmails::find($emailId);

        if (!$savedEmail || $savedEmail->user_id !== auth()->id()) {
            abort(403, 'Unauthorized action.');
        }

        // Pass all the data for the next page
        return Inertia::render('user/email/scam-checker', [
            'email' => $savedEmail
        ]);
    }
}
