'use client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import SettingsLayout from '@/layouts/settings/layout';
import { Head } from '@inertiajs/react';
import {
    ArrowLeft,
    CheckCircle,
    Clock,
    Code,
    Globe,
    Mail,
    RefreshCw,
    Save,
    Send,
    Server,
    TestTube,
    Thermometer,
    Type,
    Unlink,
    XCircle,
} from 'lucide-react';
import { useState } from 'react';

interface AccountDetail {
    id: number;
    email: string;
    provider: 'google' | 'outlook' | 'smtp';
    status: 'active' | 'warming' | 'paused' | 'error' | 'pending';
    isConnected: boolean;
    dailyLimit: number;
    dailySent: number;
    warmupProgress: number;
    signature: {
        html: string;
        text: string;
        enabled: boolean;
    };
    settings: {
        autoWarmup: boolean;
        warmupDuration: number;
        dailyIncrease: number;
        trackingEnabled: boolean;
        replyToEnabled: boolean;
        replyToEmail: string;
        sendingSchedule: string;
        timezone: string;
        delayBetweenEmails: number;
    };
}

const mockAccountData: AccountDetail = {
    id: 1,
    email: 'campaigns@company.com',
    provider: 'google',
    status: 'active',
    isConnected: true,
    dailyLimit: 2000,
    dailySent: 847,
    warmupProgress: 100,
    signature: {
        html: `<div style="font-family: Arial, sans-serif; color: #333;">
  <p>Best regards,</p>
  <p><strong>John Smith</strong><br>
  Marketing Manager<br>
  <a href="mailto:campaigns@company.com">campaigns@company.com</a><br>
  <a href="https://company.com">www.company.com</a></p>
</div>`,
        text: `Best regards,

John Smith
Marketing Manager
campaigns@company.com
www.company.com`,
        enabled: true,
    },
    settings: {
        autoWarmup: true,
        warmupDuration: 30,
        dailyIncrease: 5,
        trackingEnabled: true,
        replyToEnabled: true,
        replyToEmail: 'support@company.com',
        sendingSchedule: 'business-hours',
        timezone: 'UTC-5',
        delayBetweenEmails: 30,
    },
};

export default function AccountDetail() {
    const [account, setAccount] = useState<AccountDetail>(mockAccountData);
    const [signatureView, setSignatureView] = useState<'code' | 'text'>('code');
    const [isTestingConnection, setIsTestingConnection] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const getProviderIcon = (provider: string) => {
        switch (provider) {
            case 'google':
                return <img src="https://api.iconify.design/logos/google-icon.svg" />;
            case 'outlook':
                return <img src="https://api.iconify.design/logos/microsoft-icon.svg" />;
            case 'smtp':
                return <Globe />;
            default:
                return <Mail className="h-4 w-4" />;
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'active':
                return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
            case 'warming':
                return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
            case 'paused':
                return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
            case 'error':
                return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
            default:
                return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
        }
    };
  

    const handleSave = async () => {
        setIsSaving(true);
        await new Promise((resolve) => setTimeout(resolve, 1500));
        console.log('Account settings saved:', account);
        setIsSaving(false);
    };

    const handleTestConnection = async () => {
        setIsTestingConnection(true);
        await new Promise((resolve) => setTimeout(resolve, 2000));
        setIsTestingConnection(false);
    };

    return (
        <AppLayout>
            <Head title="Social settings" />

            <SettingsLayout>
                {/* Header */}
                <div className="mb-8">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <div className="mb-2 flex items-center gap-2">
                                {getProviderIcon(account.provider)}
                                <h1 className="text-2xl font-bold text-foreground">{account.email}</h1>
                                <Badge className={getStatusColor(account.status)}>
                                    <span className="ml-1 capitalize">{account.status}</span>
                                </Badge>
                            </div>
                            <p className="text-muted-foreground">Account settings and configuration</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm" onClick={handleTestConnection} disabled={isTestingConnection}>
                                {isTestingConnection ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <TestTube className="mr-2 h-4 w-4" />}
                                Test
                            </Button>
                            <Button onClick={handleSave} disabled={isSaving}>
                                {isSaving ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                                Save
                            </Button>
                        </div>
                    </div>
                </div>

                <Tabs defaultValue="general" className="w-full">
                    <TabsList className="mb-6 grid w-full grid-cols-3">
                        <TabsTrigger value="general">General</TabsTrigger>
                        <TabsTrigger value="signature">Signature</TabsTrigger>
                        <TabsTrigger value="warmup">Warmup</TabsTrigger>
                    </TabsList>

                    {/* General Settings */}
                    <TabsContent value="general" className="space-y-6">
                        <Card className="border-0 border-none shadow-none">
                            <CardHeader>
                                <CardTitle className="text-lg">Basic Settings</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <Label className="text-base">Enable Account</Label>
                                        <p className="text-sm text-muted-foreground">Allow sending emails from this account</p>
                                    </div>
                                    <Switch
                                        checked={account.isConnected}
                                        onCheckedChange={(checked) => setAccount((prev) => ({ ...prev, isConnected: checked }))}
                                    />
                                </div>

                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                    <div>
                                        <Label htmlFor="dailyLimit">Daily Sending Limit</Label>
                                        <Input
                                            id="dailyLimit"
                                            type="number"
                                            value={account.dailyLimit}
                                            onChange={(e) => setAccount((prev) => ({ ...prev, dailyLimit: Number.parseInt(e.target.value) }))}
                                            className="mt-1"
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="dailySent">Today's Sent</Label>
                                        <Input id="dailySent" type="number" value={account.dailySent} disabled className="mt-1" />
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <Label className="text-base">Reply-To Email</Label>
                                            <p className="text-sm text-muted-foreground">Set custom reply-to address</p>
                                        </div>
                                        <Switch
                                            checked={account.settings.replyToEnabled}
                                            onCheckedChange={(checked) =>
                                                setAccount((prev) => ({
                                                    ...prev,
                                                    settings: { ...prev.settings, replyToEnabled: checked },
                                                }))
                                            }
                                        />
                                    </div>
                                    {account.settings.replyToEnabled && (
                                        <Input
                                            type="email"
                                            value={account.settings.replyToEmail}
                                            onChange={(e) =>
                                                setAccount((prev) => ({
                                                    ...prev,
                                                    settings: { ...prev.settings, replyToEmail: e.target.value },
                                                }))
                                            }
                                            placeholder="reply@company.com"
                                        />
                                    )}
                                </div>

                                <div className="flex items-center justify-between">
                                    <div>
                                        <Label className="text-base">Email Tracking</Label>
                                        <p className="text-sm text-muted-foreground">Track opens, clicks, and engagement</p>
                                    </div>
                                    <Switch
                                        checked={account.settings.trackingEnabled}
                                        onCheckedChange={(checked) =>
                                            setAccount((prev) => ({
                                                ...prev,
                                                settings: { ...prev.settings, trackingEnabled: checked },
                                            }))
                                        }
                                    />
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Signature Settings */}
                    <TabsContent value="signature" className="space-y-6">
                        <Card className="border-0 border-none shadow-none">
                            <CardHeader>
                                <CardTitle className="text-lg">Email Signature</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <Label className="text-base">Enable Signature</Label>
                                        <p className="text-sm text-muted-foreground">Automatically append signature to emails</p>
                                    </div>
                                    <Switch
                                        checked={account.signature.enabled}
                                        onCheckedChange={(checked) =>
                                            setAccount((prev) => ({
                                                ...prev,
                                                signature: { ...prev.signature, enabled: checked },
                                            }))
                                        }
                                    />
                                </div>

                                {account.signature.enabled && (
                                    <>
                                        <div className="flex items-center gap-2">
                                            <Button
                                                variant={signatureView === 'code' ? 'default' : 'outline'}
                                                size="sm"
                                                onClick={() => setSignatureView('code')}
                                            >
                                                <Code className="mr-2 h-4 w-4" />
                                                HTML
                                            </Button>
                                            <Button
                                                variant={signatureView === 'text' ? 'default' : 'outline'}
                                                size="sm"
                                                onClick={() => setSignatureView('text')}
                                            >
                                                <Type className="mr-2 h-4 w-4" />
                                                Text
                                            </Button>
                                        </div>

                                        {signatureView === 'code' ? (
                                            <div>
                                                <Label>HTML Signature</Label>
                                                <Textarea
                                                    value={account.signature.html}
                                                    onChange={(e) =>
                                                        setAccount((prev) => ({
                                                            ...prev,
                                                            signature: { ...prev.signature, html: e.target.value },
                                                        }))
                                                    }
                                                    className="mt-1 min-h-[150px] font-mono text-sm"
                                                    placeholder="Enter HTML signature..."
                                                />
                                            </div>
                                        ) : (
                                            <div>
                                                <Label>Plain Text Signature</Label>
                                                <Textarea
                                                    value={account.signature.text}
                                                    onChange={(e) =>
                                                        setAccount((prev) => ({
                                                            ...prev,
                                                            signature: { ...prev.signature, text: e.target.value },
                                                        }))
                                                    }
                                                    className="mt-1 min-h-[150px]"
                                                    placeholder="Enter plain text signature..."
                                                />
                                            </div>
                                        )}

                                        <div className="rounded-lg border border-border bg-muted/30 p-4">
                                            <Label className="text-sm font-medium">Preview</Label>
                                            <div
                                                className="mt-2 text-sm"
                                                dangerouslySetInnerHTML={{
                                                    __html:
                                                        signatureView === 'code'
                                                            ? account.signature.html
                                                            : account.signature.text.replace(/\n/g, '<br>'),
                                                }}
                                            />
                                        </div>
                                    </>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Warmup Settings */}
                    <TabsContent value="warmup" className="space-y-6">
                        <Card className="border-0 border-none shadow-none">
                            <CardHeader>
                                <CardTitle className="text-lg">Email Warmup</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <Label className="text-base">Auto Warmup</Label>
                                        <p className="text-sm text-muted-foreground">Gradually increase sending volume</p>
                                    </div>
                                    <Switch
                                        checked={account.settings.autoWarmup}
                                        onCheckedChange={(checked) =>
                                            setAccount((prev) => ({
                                                ...prev,
                                                settings: { ...prev.settings, autoWarmup: checked },
                                            }))
                                        }
                                    />
                                </div>

                                {account.settings.autoWarmup && (
                                    <>
                                        <div className="space-y-2">
                                            <Label>Warmup Duration: {account.settings.warmupDuration} days</Label>
                                            <Slider
                                                value={[account.settings.warmupDuration]}
                                                onValueChange={([value]) =>
                                                    setAccount((prev) => ({
                                                        ...prev,
                                                        settings: { ...prev.settings, warmupDuration: value },
                                                    }))
                                                }
                                                max={60}
                                                min={7}
                                                step={1}
                                                className="w-full"
                                            />
                                            <div className="flex justify-between text-xs text-muted-foreground">
                                                <span>7 days</span>
                                                <span>60 days</span>
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <Label>Daily Increase: {account.settings.dailyIncrease} emails/day</Label>
                                            <Slider
                                                value={[account.settings.dailyIncrease]}
                                                onValueChange={([value]) =>
                                                    setAccount((prev) => ({
                                                        ...prev,
                                                        settings: { ...prev.settings, dailyIncrease: value },
                                                    }))
                                                }
                                                max={20}
                                                min={1}
                                                step={1}
                                                className="w-full"
                                            />
                                            <div className="flex justify-between text-xs text-muted-foreground">
                                                <span>1 email</span>
                                                <span>20 emails</span>
                                            </div>
                                        </div>

                                        {account.status === 'warming' && (
                                            <div className="rounded-lg border border-border bg-muted/30 p-4">
                                                <Label className="text-sm font-medium">Current Progress</Label>
                                                <div className="mt-2">
                                                    <div className="mb-2 flex items-center justify-between text-sm">
                                                        <span>Warmup Progress</span>
                                                        <span className="font-medium">{account.warmupProgress}%</span>
                                                    </div>
                                                    <div className="h-2 rounded-full bg-muted">
                                                        <div
                                                            className="h-2 rounded-full bg-primary transition-all duration-300"
                                                            style={{ width: `${account.warmupProgress}%` }}
                                                        ></div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent> 
                </Tabs>
            </SettingsLayout>
        </AppLayout>
    );
}
