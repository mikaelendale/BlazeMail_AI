'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import AppLayout from '@/layouts/app-layout';
import { AlertTriangle, CheckCircle, Clock, Edit3, FileText, Mail, Shield, ShieldAlert, ShieldCheck, Sparkles, User, Zap } from 'lucide-react';
import { useState } from 'react';

// Sample email data
const sampleEmail = {
    from: 'security@paypal-verification.com',
    to: 'user@example.com',
    subject: 'Urgent: Verify Your PayPal Account - Action Required',
    date: 'Dec 25, 2024 at 3:47 PM',
    content: `Dear Valued Customer,

We have detected unusual activity on your PayPal account. For your security, we have temporarily limited access to your account.

To restore full access, please verify your identity immediately by clicking the link below:

VERIFY YOUR ACCOUNT NOW

If you do not verify within 24 hours, your account will be permanently suspended.

This is an automated message. Please do not reply to this email.

Best regards,
PayPal Security Team

© 2024 PayPal Holdings, Inc. All rights reserved.`,
};

export default function Component() {
    const [isScanning, setIsScanning] = useState(false);
    const [scanComplete, setScanComplete] = useState(false);
    const [scamScore, setScamScore] = useState(0);

    const handleScan = () => {
        setIsScanning(true);
        setScanComplete(false);

        // Simulate scanning process
        setTimeout(() => {
            setScamScore(87); // High scam probability
            setIsScanning(false);
            setScanComplete(true);
        }, 3000);
    };

    const getScoreColor = (score: number) => {
        if (score >= 70) return 'text-destructive';
        if (score >= 40) return 'text-secondary-foreground';
        return 'text-primary';
    };

    const getScoreLabel = (score: number) => {
        if (score >= 70) return 'High Risk';
        if (score >= 40) return 'Medium Risk';
        return 'Low Risk';
    };

    const getScoreIcon = (score: number) => {
        if (score >= 70) return <ShieldAlert className="h-6 w-6 text-destructive" />;
        if (score >= 40) return <AlertTriangle className="h-6 w-6 text-secondary-foreground" />;
        return <ShieldCheck className="h-6 w-6 text-primary" />;
    };

    return (
        <AppLayout>
            <div className="min-h-screen">
                <div className="mx-auto max-w-[1600px]">
                    {/* Header */}
                    <div className="grid h-[calc(100vh-280px)] grid-cols-1 gap-8 xl:grid-cols-5">
                        <div className="xl:col-span-3">
                            <Card className="border-0 bg-card">
                                <CardContent className="h-[calc(100%-120px)] overflow-hidden p-0">
                                    <div className="scrollbar-thin scrollbar-thumb-muted/50 scrollbar-track-transparent hover:scrollbar-thumb-muted h-full space-y-8 overflow-y-auto p-8">
                                        {/* Email Metadata */}
                                        <div className="space-y-4 rounded-2xl border border-border bg-muted/50 p-6">
                                            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                                <div className="space-y-3">
                                                    <div className="flex items-center gap-3">
                                                        <div className="rounded-lg bg-background p-1.5 shadow-sm">
                                                            <User className="h-4 w-4 text-primary" />
                                                        </div>
                                                        <div className="flex-1">
                                                            <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">From</p>
                                                            <p className="mt-0.5 text-sm font-medium text-foreground">{sampleEmail.from}</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        <div className="rounded-lg bg-background p-1.5 shadow-sm">
                                                            <Mail className="h-4 w-4 text-primary" />
                                                        </div>
                                                        <div className="flex-1">
                                                            <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">To</p>
                                                            <p className="mt-0.5 text-sm text-foreground">{sampleEmail.to}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="space-y-3">
                                                    <div className="flex items-center gap-3">
                                                        <div className="rounded-lg bg-background p-1.5 shadow-sm">
                                                            <Clock className="h-4 w-4 text-primary" />
                                                        </div>
                                                        <div className="flex-1">
                                                            <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">Date</p>
                                                            <p className="mt-0.5 text-sm text-foreground">{sampleEmail.date}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            <Separator className="bg-border" />
                                            <div>
                                                <p className="mb-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">Subject</p>
                                                <h2 className="text-lg leading-relaxed font-medium text-foreground">{sampleEmail.subject}</h2>
                                            </div>
                                        </div>
                                        {/* Email Content */}
                                        <div className="rounded-2xl border border-border bg-card p-8 shadow-sm">
                                            <div className="mb-4">
                                                <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">Message Content</p>
                                            </div>
                                            <div className="prose prose-slate max-w-none">
                                                <pre className="font-sans text-sm leading-relaxed font-light whitespace-pre-wrap text-foreground">
                                                    {sampleEmail.content}
                                                </pre>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Analysis & Refinement Side */}
                        <div className="xl:col-span-2">
                            <div className="h-full space-y-6">
                                {!scanComplete ? (
                                    <Card className="border-0 bg-card">
                                        <CardHeader className="px-8 py-10 text-center">
                                            <CardTitle className="mb-3 text-2xl font-bold text-foreground">Security Analysis</CardTitle>
                                            <CardDescription className="mx-auto max-w-sm text-base leading-relaxed text-muted-foreground">
                                                Deploy advanced AI algorithms to detect threats, analyze patterns, and assess email authenticity
                                            </CardDescription>
                                        </CardHeader>
                                        <CardContent className="px-8 pb-10">
                                            <div className="space-y-8">
                                                <div className="rounded-2xl border border-border bg-muted/50 p-6">
                                                    <div className="space-y-4">
                                                        <div className="flex items-center gap-3">
                                                            <CheckCircle className="h-4 w-4 text-muted-foreground" />
                                                            <span className="text-sm text-muted-foreground">Sender reputation verification</span>
                                                        </div>
                                                        <div className="flex items-center gap-3">
                                                            <CheckCircle className="h-4 w-4 text-muted-foreground" />
                                                            <span className="text-sm text-muted-foreground">Malicious link detection</span>
                                                        </div>
                                                        <div className="flex items-center gap-3">
                                                            <CheckCircle className="h-4 w-4 text-muted-foreground" />
                                                            <span className="text-sm text-muted-foreground">Phishing pattern recognition</span>
                                                        </div>
                                                        <div className="flex items-center gap-3">
                                                            <CheckCircle className="h-4 w-4 text-muted-foreground" />
                                                            <span className="text-sm text-muted-foreground">Content authenticity assessment</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                {isScanning ? (
                                                    <div className="space-y-6 text-center">
                                                        <div className="flex items-center justify-center">
                                                            <div className="h-12 w-12 animate-spin rounded-full border-2 border-muted border-t-primary"></div>
                                                        </div>
                                                        <div>
                                                            <p className="mb-2 font-medium text-foreground">Analyzing Email Security</p>
                                                            <p className="text-sm text-muted-foreground">
                                                                Processing threat indicators and patterns...
                                                            </p>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="flex justify-center">
                                                        <Button variant={'outline'} onClick={handleScan} className="h-10 items-center justify-center text-base font-medium">
                                                            Begin Security Analysis
                                                        </Button>
                                                    </div>
                                                )}
                                            </div>
                                        </CardContent>
                                    </Card>
                                ) : (
                                    <div className="space-y-6">
                                        {/* Results Card */}
                                        <Card className="border-0 bg-card shadow-xl">
                                            <CardHeader className="px-8 py-8 text-center">
                                                <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl border border-destructive/20 bg-destructive/10 shadow-sm">
                                                    {getScoreIcon(scamScore)}
                                                </div>
                                                <CardTitle className="mb-2 text-2xl font-light text-foreground">Analysis Complete</CardTitle>
                                                <CardDescription className="text-muted-foreground">Comprehensive security assessment</CardDescription>
                                            </CardHeader>
                                            <CardContent className="px-8 pb-8">
                                                <div className="space-y-6 text-center">
                                                    <div className="space-y-3">
                                                        <div className="text-5xl font-light">
                                                            <span className={getScoreColor(scamScore)}>{scamScore}</span>
                                                            <span className="ml-1 text-2xl text-muted-foreground">/100</span>
                                                        </div>
                                                        <Badge
                                                            variant={scamScore >= 70 ? 'destructive' : scamScore >= 40 ? 'secondary' : 'default'}
                                                            className="rounded-full px-4 py-1.5 text-sm font-medium"
                                                        >
                                                            {getScoreLabel(scamScore)}
                                                        </Badge>
                                                    </div>

                                                    <div className="rounded-2xl bg-muted/50 p-1">
                                                        <Progress value={scamScore} className="h-3 w-full" />
                                                    </div>

                                                    <div className="rounded-2xl border border-border bg-muted/50 p-6 text-left">
                                                        <h4 className="mb-4 text-center font-medium text-foreground">Risk Assessment</h4>
                                                        <div className="space-y-3">
                                                            <div className="flex items-center justify-between">
                                                                <span className="text-sm text-muted-foreground">Sender Domain</span>
                                                                <Badge variant="destructive" className="px-2 py-0.5 text-xs">
                                                                    Critical
                                                                </Badge>
                                                            </div>
                                                            <div className="flex items-center justify-between">
                                                                <span className="text-sm text-muted-foreground">Language Patterns</span>
                                                                <Badge variant="destructive" className="px-2 py-0.5 text-xs">
                                                                    High Risk
                                                                </Badge>
                                                            </div>
                                                            <div className="flex items-center justify-between">
                                                                <span className="text-sm text-muted-foreground">Content Structure</span>
                                                                <Badge variant="secondary" className="px-2 py-0.5 text-xs">
                                                                    Medium
                                                                </Badge>
                                                            </div>
                                                            <div className="flex items-center justify-between">
                                                                <span className="text-sm text-muted-foreground">Threat Indicators</span>
                                                                <Badge variant="destructive" className="px-2 py-0.5 text-xs">
                                                                    Critical
                                                                </Badge>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>

                                        {/* AI Refinement Card */}
                                        <Card className="border-0 bg-card shadow-xl">
                                            <CardHeader className="border-b border-border px-8 py-6">
                                                <div className="flex items-center gap-3">
                                                    <div className="rounded-xl bg-muted p-2 shadow-sm">
                                                        <Sparkles className="h-5 w-5 text-primary" />
                                                    </div>
                                                    <div>
                                                        <CardTitle className="text-lg font-medium text-foreground">AI Email Refiner</CardTitle>
                                                        <CardDescription className="mt-1 text-muted-foreground">
                                                            Intelligent content optimization
                                                        </CardDescription>
                                                    </div>
                                                </div>
                                            </CardHeader>
                                            <CardContent className="px-8 py-6">
                                                <div className="space-y-4">
                                                    <div className="grid grid-cols-1 gap-3">
                                                        <Button
                                                            variant="outline"
                                                            className="h-12 justify-start rounded-xl border-border text-left hover:bg-muted/50"
                                                            onClick={() => console.log('Professional refinement')}
                                                        >
                                                            <div className="mr-3 rounded-lg bg-primary/10 p-1.5">
                                                                <Shield className="h-4 w-4 text-primary" />
                                                            </div>
                                                            <div className="text-left">
                                                                <p className="text-sm font-medium text-foreground">Professional Tone</p>
                                                                <p className="text-xs text-muted-foreground">Enhance formal communication</p>
                                                            </div>
                                                        </Button>

                                                        <Button
                                                            variant="outline"
                                                            className="h-12 justify-start rounded-xl border-border text-left hover:bg-muted/50"
                                                            onClick={() => console.log('Urgency reduction')}
                                                        >
                                                            <div className="mr-3 rounded-lg bg-secondary/20 p-1.5">
                                                                <Zap className="h-4 w-4 text-secondary-foreground" />
                                                            </div>
                                                            <div className="text-left">
                                                                <p className="text-sm font-medium text-foreground">Reduce Urgency</p>
                                                                <p className="text-xs text-muted-foreground">Remove pressure tactics</p>
                                                            </div>
                                                        </Button>

                                                        <Button
                                                            variant="outline"
                                                            className="h-12 justify-start rounded-xl border-border text-left hover:bg-muted/50"
                                                            onClick={() => console.log('Clarity improvement')}
                                                        >
                                                            <div className="mr-3 rounded-lg bg-accent/20 p-1.5">
                                                                <FileText className="h-4 w-4 text-accent-foreground" />
                                                            </div>
                                                            <div className="text-left">
                                                                <p className="text-sm font-medium text-foreground">Improve Clarity</p>
                                                                <p className="text-xs text-muted-foreground">Enhance readability</p>
                                                            </div>
                                                        </Button>

                                                        <Button
                                                            variant="outline"
                                                            className="h-12 justify-start rounded-xl border-border text-left hover:bg-muted/50"
                                                            onClick={() => console.log('Grammar correction')}
                                                        >
                                                            <div className="mr-3 rounded-lg bg-primary/10 p-1.5">
                                                                <Edit3 className="h-4 w-4 text-primary" />
                                                            </div>
                                                            <div className="text-left">
                                                                <p className="text-sm font-medium text-foreground">Grammar Check</p>
                                                                <p className="text-xs text-muted-foreground">Fix linguistic errors</p>
                                                            </div>
                                                        </Button>
                                                    </div>

                                                    <Separator className="bg-border" />

                                                    <Button
                                                        variant="ghost"
                                                        className="h-10 w-full rounded-xl text-muted-foreground hover:text-foreground"
                                                        onClick={() => {
                                                            setScanComplete(false);
                                                            setScamScore(0);
                                                        }}
                                                    >
                                                        Analyze New Email
                                                    </Button>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
