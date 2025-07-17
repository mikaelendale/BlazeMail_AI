<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cookie;
use Inertia\Inertia;

class LandingPageController extends Controller
{
    public function index()
    {
        // $referralCode = session()->has('referral_code') ? session('referral_code') : null;
        // dd(decrypt($referralCode));
        return Inertia::render('welcome');
    }
    public function pricing()
    {
        return Inertia::render('pricing');
    }
    public function features()
    {
        return Inertia::render('features');
    }
}
