<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AppSetting;
use Illuminate\Http\Request;
use Inertia\Inertia;

class AppSettingController extends Controller
{
    public function index()
    {  
        $settings = AppSetting::all();
        return Inertia::render('admin/app-settings',[
            'settings' => $settings
        ]);
    }
    public function store(Request $request)
    {
        $data = $request->validate([
            'settings' => 'required|array',
            'settings.*.key' => 'required|string',
            'settings.*.value' => 'required|string',
        ]);

        foreach ($data['settings'] as $setting) {
            AppSetting::updateOrCreate(
                ['key' => $setting['key']],
                ['value' => $setting['value']]
            );
        }

        return redirect()->back()->with('success', 'Settings updated successfully.');
    }
}
