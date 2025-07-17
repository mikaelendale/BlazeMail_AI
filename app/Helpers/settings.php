<?php

use App\Models\AppSetting; 

if (!function_exists('app_setting')) {
    function app_setting($key, $default = null)
    {
        static $settings;
        if (!$settings) {
            $settings = AppSetting::all()->pluck('value', 'key');
        }
        return $settings[$key] ?? $default;
    }
}