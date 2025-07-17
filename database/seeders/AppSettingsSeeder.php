<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class AppSettingsSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        DB::table('app_settings')->insert([
            ['key' => 'app_name', 'value' => 'BlazeMail.ai'],
            ['key' => 'app_logo_url', 'value' => '/storage/settings/logo.png'],
            ['key' => 'support_email', 'value' => 'support@blazemail.ai'],
            ['key' => 'timezone', 'value' => 'Africa/Addis_Ababa'],
            ['key' => 'smtp_host', 'value' => 'smtp.mailtrap.io'],
            ['key' => 'smtp_port', 'value' => '587'],
            ['key' => 'smtp_user', 'value' => 'smtp-user'],
            ['key' => 'smtp_password', 'value' => 'smtp-password'],
            ['key' => 'smtp_encryption', 'value' => 'tls'],
            ['key' => 'paddle_vendor_id', 'value' => '123456'],
            ['key' => 'paddle_sandbox_mode', 'value' => 'true'],
            ['key' => 'model_default', 'value' => 'llama3-8b-8192'],
            ['key' => 'ai_max_tokens', 'value' => '500'],
            ['key' => 'rate_limit_daily', 'value' => '50'],
            ['key' => 'email_from_name', 'value' => 'BlazeMail.ai'],
            ['key' => 'email_from_address', 'value' => 'no-reply@blazemail.ai'],
            ['key' => 'plan_basic_limit_emails', 'value' => '500'],
            ['key' => 'plan_pro_limit_emails', 'value' => '2000'],
            ['key' => 'plan_basic_price', 'value' => '19'],
            ['key' => 'plan_pro_price', 'value' => '49'],
        ]);
    }
}
