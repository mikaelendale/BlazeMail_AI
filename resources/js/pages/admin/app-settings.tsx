'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AdminAppLayout from '@/layouts/admin-app-layout';
import { router } from '@inertiajs/react';
import { Eye, EyeOff, Save, Upload } from 'lucide-react';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';

interface Setting {
    id: number;
    key: string;
    value: string;
    created_at: string;
    updated_at: string;
}

interface AppSettingsProps {
    settings: Setting[];
}

export default function AppSettings({ settings = [] }: AppSettingsProps) {
    // Transform settings array into key-value object for easier access
    const settingsMap = useMemo(() => {
        const map: Record<string, string> = {};
        settings.forEach((setting) => {
            map[setting.key] = setting.value;
        });
        return map;
    }, [settings]);

    // State for all settings
    const [formData, setFormData] = useState(settingsMap);
    const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});
    const [isLoading, setIsLoading] = useState(false);

    // Helper function to get setting value with fallback
    const getSetting = (key: string, fallback = '') => {
        return formData[key] || fallback;
    };

    // Helper function to update setting
    const updateSetting = (key: string, value: string) => {
        setFormData((prev) => ({
            ...prev,
            [key]: value,
        }));
    };

    // Toggle password visibility
    const togglePasswordVisibility = (key: string) => {
        setShowPasswords((prev) => ({
            ...prev,
            [key]: !prev[key],
        }));
    };

    // Save settings to backend
    const saveSettings = async () => {
        setIsLoading(true);
        try {
            // Convert formData back to array format for backend
            router.post(route('admin.app-settings.store'), {
                settings: Object.entries(formData).map(([key, value]) => ({
                    key,
                    value,
                })),
            }, {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success('Settings saved successfully!');
                },
                onError: (error) => {
                    console.error('Error saving settings:', error);
                    toast.error('Failed to save settings');
                },
            });
        } catch (error) {
            console.error('Error saving settings:', error);
            toast.error('Failed to save settings');
        } finally {
            setIsLoading(false);
        }
    };

    const maskPassword = (password: string) => {
        if (password.length <= 8) return password;
        return password.substring(0, 4) + '****' + password.substring(password.length - 4);
    };

    return (
        <AdminAppLayout>
            <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
                <div className="mb-6">
                    <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">App Settings</h1>
                    <p className="mt-2 text-sm text-muted-foreground">Configure your application settings and preferences</p>
                </div>

                <div className="space-y-8">
                    {/* General Settings */}
                    <Card>
                        <CardHeader>
                            <CardTitle>General Settings</CardTitle>
                            <CardDescription>Basic application configuration</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="app_name">Application Name</Label>
                                    <Input
                                        id="app_name"
                                        value={getSetting('app_name')}
                                        onChange={(e) => updateSetting('app_name', e.target.value)}
                                        placeholder="Enter app name"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="app_logo_url">Logo URL</Label>
                                    <div className="flex gap-2">
                                        <Input
                                            id="app_logo_url"
                                            value={getSetting('app_logo_url')}
                                            onChange={(e) => updateSetting('app_logo_url', e.target.value)}
                                            placeholder="/storage/settings/logo.png"
                                        />
                                        <Button variant="outline" size="sm">
                                            <Upload className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="support_email">Support Email</Label>
                                    <Input
                                        id="support_email"
                                        type="email"
                                        value={getSetting('support_email')}
                                        onChange={(e) => updateSetting('support_email', e.target.value)}
                                        placeholder="support@example.com"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="timezone">Timezone</Label>
                                    <Select value={getSetting('timezone')} onValueChange={(value) => updateSetting('timezone', value)}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select timezone" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Africa/Addis_Ababa">Africa/Addis_Ababa</SelectItem>
                                            <SelectItem value="America/New_York">America/New_York</SelectItem>
                                            <SelectItem value="Europe/London">Europe/London</SelectItem>
                                            <SelectItem value="Asia/Tokyo">Asia/Tokyo</SelectItem>
                                            <SelectItem value="UTC">UTC</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    {/* Email Settings */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Email Configuration</CardTitle>
                            <CardDescription>SMTP and email sending settings</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="email_from_name">From Name</Label>
                                    <Input
                                        id="email_from_name"
                                        value={getSetting('email_from_name')}
                                        onChange={(e) => updateSetting('email_from_name', e.target.value)}
                                        placeholder="Your App Name"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="email_from_address">From Address</Label>
                                    <Input
                                        id="email_from_address"
                                        type="email"
                                        value={getSetting('email_from_address')}
                                        onChange={(e) => updateSetting('email_from_address', e.target.value)}
                                        placeholder="no-reply@example.com"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="smtp_host">SMTP Host</Label>
                                    <Input
                                        id="smtp_host"
                                        value={getSetting('smtp_host')}
                                        onChange={(e) => updateSetting('smtp_host', e.target.value)}
                                        placeholder="smtp.mailtrap.io"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="smtp_port">SMTP Port</Label>
                                    <Input
                                        id="smtp_port"
                                        type="number"
                                        value={getSetting('smtp_port')}
                                        onChange={(e) => updateSetting('smtp_port', e.target.value)}
                                        placeholder="587"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="smtp_user">SMTP Username</Label>
                                    <Input
                                        id="smtp_user"
                                        value={getSetting('smtp_user')}
                                        onChange={(e) => updateSetting('smtp_user', e.target.value)}
                                        placeholder="smtp-user"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="smtp_password">SMTP Password</Label>
                                    <div className="relative">
                                        <Input
                                            id="smtp_password"
                                            type={showPasswords.smtp_password ? 'text' : 'password'}
                                            value={
                                                showPasswords.smtp_password ? getSetting('smtp_password') : maskPassword(getSetting('smtp_password'))
                                            }
                                            onChange={(e) => updateSetting('smtp_password', e.target.value)}
                                            className="pr-10"
                                        />
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            className="absolute top-0 right-0 h-full px-3 py-2 hover:bg-transparent"
                                            onClick={() => togglePasswordVisibility('smtp_password')}
                                        >
                                            {showPasswords.smtp_password ? (
                                                <EyeOff className="h-4 w-4 text-muted-foreground" />
                                            ) : (
                                                <Eye className="h-4 w-4 text-muted-foreground" />
                                            )}
                                        </Button>
                                    </div>
                                </div>
                                <div className="space-y-2 md:col-span-2">
                                    <Label htmlFor="smtp_encryption">SMTP Encryption</Label>
                                    <Select value={getSetting('smtp_encryption')} onValueChange={(value) => updateSetting('smtp_encryption', value)}>
                                        <SelectTrigger className="w-full md:w-48">
                                            <SelectValue placeholder="Select encryption" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="tls">TLS</SelectItem>
                                            <SelectItem value="ssl">SSL</SelectItem>
                                            <SelectItem value="none">None</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    {/* AI Settings */}
                    <Card>
                        <CardHeader>
                            <CardTitle>AI Configuration</CardTitle>
                            <CardDescription>AI model and generation settings</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                                <div className="space-y-2">
                                    <Label htmlFor="model_default">Default AI Model</Label>
                                    <Select value={getSetting('model_default')} onValueChange={(value) => updateSetting('model_default', value)}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select model" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="llama3-8b-8192">Llama 3 8B</SelectItem>
                                            <SelectItem value="llama3-70b-8192">Llama 3 70B</SelectItem>
                                            <SelectItem value="mixtral-8x7b-32768">Mixtral 8x7B</SelectItem>
                                            <SelectItem value="gemma-7b-it">Gemma 7B</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="ai_max_tokens">Max Tokens</Label>
                                    <Input
                                        id="ai_max_tokens"
                                        type="number"
                                        value={getSetting('ai_max_tokens')}
                                        onChange={(e) => updateSetting('ai_max_tokens', e.target.value)}
                                        placeholder="500"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="rate_limit_daily">Daily Rate Limit</Label>
                                    <Input
                                        id="rate_limit_daily"
                                        type="number"
                                        value={getSetting('rate_limit_daily')}
                                        onChange={(e) => updateSetting('rate_limit_daily', e.target.value)}
                                        placeholder="50"
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    {/* Payment Settings */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Payment Configuration</CardTitle>
                            <CardDescription>Paddle payment gateway settings</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="paddle_vendor_id">Paddle Vendor ID</Label>
                                    <Input
                                        id="paddle_vendor_id"
                                        value={getSetting('paddle_vendor_id')}
                                        onChange={(e) => updateSetting('paddle_vendor_id', e.target.value)}
                                        placeholder="123456"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="paddle_sandbox_mode">Sandbox Mode</Label>
                                    <Select
                                        value={getSetting('paddle_sandbox_mode')}
                                        onValueChange={(value) => updateSetting('paddle_sandbox_mode', value)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select mode" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="true">Enabled (Testing)</SelectItem>
                                            <SelectItem value="false">Disabled (Production)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    {/* Subscription Plans */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Subscription Plans</CardTitle>
                            <CardDescription>Configure pricing and limits for subscription plans</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                                {/* Basic Plan */}
                                <div className="space-y-4">
                                    <h3 className="text-lg font-semibold">Basic Plan</h3>
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="plan_basic_price">Price (USD)</Label>
                                            <Input
                                                id="plan_basic_price"
                                                type="number"
                                                value={getSetting('plan_basic_price')}
                                                onChange={(e) => updateSetting('plan_basic_price', e.target.value)}
                                                placeholder="19"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="plan_basic_limit_emails">Email Limit (per month)</Label>
                                            <Input
                                                id="plan_basic_limit_emails"
                                                type="number"
                                                value={getSetting('plan_basic_limit_emails')}
                                                onChange={(e) => updateSetting('plan_basic_limit_emails', e.target.value)}
                                                placeholder="500"
                                            />
                                        </div>
                                    </div>
                                </div>
                                {/* Pro Plan */}
                                <div className="space-y-4">
                                    <h3 className="text-lg font-semibold">Pro Plan</h3>
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="plan_pro_price">Price (USD)</Label>
                                            <Input
                                                id="plan_pro_price"
                                                type="number"
                                                value={getSetting('plan_pro_price')}
                                                onChange={(e) => updateSetting('plan_pro_price', e.target.value)}
                                                placeholder="49"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="plan_pro_limit_emails">Email Limit (per month)</Label>
                                            <Input
                                                id="plan_pro_limit_emails"
                                                type="number"
                                                value={getSetting('plan_pro_limit_emails')}
                                                onChange={(e) => updateSetting('plan_pro_limit_emails', e.target.value)}
                                                placeholder="2000"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    {/* Save Button */}
                    <div className="flex justify-end">
                        <Button onClick={saveSettings} disabled={isLoading} size="lg">
                            <Save className="mr-2 h-4 w-4" />
                            {isLoading ? 'Saving...' : 'Save All Settings'}
                        </Button>
                    </div>
                </div>
            </main>
        </AdminAppLayout>
    );
}
