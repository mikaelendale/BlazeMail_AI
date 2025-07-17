'use client';

import type React from 'react';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import { router, useForm } from '@inertiajs/react';
import { AlertCircle, ArrowLeft, Bot, Building, Calendar, CheckCircle, Clock, Edit, Mail, MessageSquare, Phone, Send, Trash2 } from 'lucide-react';
import { useState } from 'react';

interface Contact {
    id: number;
    name: string;
    email: string;
    company: string;
    jobTitle: string;
    phone?: string;
    status: 'active' | 'inactive' | 'blocked';
    created_at: string;
    updated_at: string;
    custom_fields?: Record<string, any>;
    last_email?: {
        subject: string;
        sent_at: string;
        status: 'sent' | 'delivered' | 'opened' | 'clicked';
        content: string;
    };
    email_history?: Array<{
        id: number;
        subject: string;
        sent_at: string;
        status: 'sent' | 'delivered' | 'opened' | 'clicked';
        content: string;
    }>;
}

interface ContactDetailsProps {
    contact: Contact;
}

export default function ContactDetails({ contact }: ContactDetailsProps) {
    const [showEmailComposer, setShowEmailComposer] = useState(false);
    const [aiSuggestion, setAiSuggestion] = useState('');
    const [isGeneratingAI, setIsGeneratingAI] = useState(false);

    // Form for sending email
    const {
        data: emailData,
        setData: setEmailData,
        post: sendEmail,
        processing: sendingEmail,
        errors: emailErrors,
        reset: resetEmail,
    } = useForm({
        subject: '',
        message: '',
        contact_id: contact.id,
    });

    // Handle back navigation
    const handleBack = () => {
        router.get('/contacts');
    };

    // Handle send email
    const handleSendEmail = (e: React.FormEvent) => {
        e.preventDefault();
        sendEmail('/contacts/send-email', {
            onSuccess: () => {
                setShowEmailComposer(false);
                resetEmail();
            },
        });
    };

    // Generate AI reply suggestion
    const generateAIReply = async () => {
        setIsGeneratingAI(true);
        try {
            // Simulate AI generation - replace with actual API call
            await new Promise((resolve) => setTimeout(resolve, 2000));
            const suggestion = `Hi ${contact.name},

I hope this email finds you well. I wanted to follow up on our previous conversation and see how things are progressing at ${contact.company}.

Based on your role as ${contact.jobTitle}, I believe our latest solutions could be particularly valuable for your team. Would you be available for a brief call this week to discuss how we can help streamline your operations?

Looking forward to hearing from you.

Best regards`;
            setAiSuggestion(suggestion);
            setEmailData('message', suggestion);
        } catch (error) {
            console.error('Failed to generate AI reply:', error);
        } finally {
            setIsGeneratingAI(false);
        }
    };

    // Get status color and icon
    const getStatusInfo = (status: string) => {
        switch (status) {
            case 'active':
                return { color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200', icon: CheckCircle };
            case 'inactive':
                return { color: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200', icon: Clock };
            case 'blocked':
                return { color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200', icon: AlertCircle };
            default:
                return { color: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200', icon: Clock };
        }
    };

    // Get email status info
    const getEmailStatusInfo = (status: string) => {
        switch (status) {
            case 'sent':
                return { color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200', label: 'Sent' };
            case 'delivered':
                return { color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200', label: 'Delivered' };
            case 'opened':
                return { color: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200', label: 'Opened' };
            case 'clicked':
                return { color: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200', label: 'Clicked' };
            default:
                return { color: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200', label: 'Unknown' };
        }
    };

    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map((n) => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    const statusInfo = getStatusInfo(contact.status);
    const StatusIcon = statusInfo.icon;

    return (
        <AppLayout>
            <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
                <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
                    {/* Header */}
                    <div className="mb-8 flex items-center gap-4">
                        <Button variant="ghost" size="sm" onClick={handleBack} className="gap-2">
                            <ArrowLeft className="h-4 w-4" />
                            <span className="hidden sm:inline">Back to Contacts</span>
                        </Button>
                        <div className="flex-1">
                            <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl dark:text-slate-100">Contact Details</h1>
                        </div>
                        <div className="flex gap-2">
                            <Button variant="outline" size="sm">
                                <Edit className="h-4 w-4 sm:mr-2" />
                                <span className="hidden sm:inline">Edit</span>
                            </Button>
                            <Button variant="outline" size="sm" className="bg-transparent text-red-600 hover:bg-red-50 dark:text-red-400">
                                <Trash2 className="h-4 w-4 sm:mr-2" />
                                <span className="hidden sm:inline">Delete</span>
                            </Button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                        {/* Contact Information */}
                        <div className="lg:col-span-1">
                            <Card className="dark:bg-slate-800">
                                <CardHeader className="text-center">
                                    <Avatar className="mx-auto h-20 w-20">
                                        <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-lg font-semibold text-white">
                                            {getInitials(contact.name)}
                                        </AvatarFallback>
                                    </Avatar>
                                    <CardTitle className="text-xl">{contact.name}</CardTitle>
                                    <Badge className={statusInfo.color}>
                                        <StatusIcon className="mr-1 h-3 w-3" />
                                        {contact.status}
                                    </Badge>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="flex items-center gap-3">
                                        <Mail className="h-4 w-4 text-slate-400" />
                                        <div>
                                            <p className="text-sm font-medium text-slate-900 dark:text-slate-100">Email</p>
                                            <p className="text-sm text-slate-600 dark:text-slate-400">{contact.email}</p>
                                        </div>
                                    </div>

                                    {contact.phone && (
                                        <div className="flex items-center gap-3">
                                            <Phone className="h-4 w-4 text-slate-400" />
                                            <div>
                                                <p className="text-sm font-medium text-slate-900 dark:text-slate-100">Phone</p>
                                                <p className="text-sm text-slate-600 dark:text-slate-400">{contact.phone}</p>
                                            </div>
                                        </div>
                                    )}

                                    <div className="flex items-center gap-3">
                                        <Building className="h-4 w-4 text-slate-400" />
                                        <div>
                                            <p className="text-sm font-medium text-slate-900 dark:text-slate-100">Company</p>
                                            <p className="text-sm text-slate-600 dark:text-slate-400">{contact.company || 'Not specified'}</p>
                                        </div>
                                    </div>

                                    {contact.jobTitle && (
                                        <div className="flex items-center gap-3">
                                            <Building className="h-4 w-4 text-slate-400" />
                                            <div>
                                                <p className="text-sm font-medium text-slate-900 dark:text-slate-100">Job Title</p>
                                                <p className="text-sm text-slate-600 dark:text-slate-400">{contact.jobTitle}</p>
                                            </div>
                                        </div>
                                    )}

                                    <div className="flex items-center gap-3">
                                        <Calendar className="h-4 w-4 text-slate-400" />
                                        <div>
                                            <p className="text-sm font-medium text-slate-900 dark:text-slate-100">Added</p>
                                            <p className="text-sm text-slate-600 dark:text-slate-400">
                                                {new Date(contact.created_at).toLocaleDateString()}
                                            </p>
                                        </div>
                                    </div>

                                    <Separator />

                                    <Button
                                        onClick={() => setShowEmailComposer(!showEmailComposer)}
                                        className="w-full gap-2 bg-blue-600 hover:bg-blue-700"
                                    >
                                        <MessageSquare className="h-4 w-4" />
                                        Send Email
                                    </Button>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Email History & Composer */}
                        <div className="lg:col-span-2">
                            <div className="space-y-6">
                                {/* Last Email */}
                                {contact.last_email && (
                                    <Card className="dark:bg-slate-800">
                                        <CardHeader>
                                            <CardTitle className="flex items-center gap-2">
                                                <Mail className="h-5 w-5" />
                                                Last Email Sent
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="space-y-3">
                                                <div className="flex items-center justify-between">
                                                    <h4 className="font-medium text-slate-900 dark:text-slate-100">{contact.last_email.subject}</h4>
                                                    <Badge className={getEmailStatusInfo(contact.last_email.status).color}>
                                                        {getEmailStatusInfo(contact.last_email.status).label}
                                                    </Badge>
                                                </div>
                                                <p className="text-sm text-slate-600 dark:text-slate-400">
                                                    Sent {new Date(contact.last_email.sent_at).toLocaleString()}
                                                </p>
                                                <div className="rounded-lg bg-slate-50 p-3 dark:bg-slate-700">
                                                    <p className="text-sm text-slate-700 dark:text-slate-300">
                                                        {contact.last_email.content.substring(0, 200)}...
                                                    </p>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                )}

                                {/* Email Composer */}
                                {showEmailComposer && (
                                    <Card className="dark:bg-slate-800">
                                        <CardHeader>
                                            <CardTitle className="flex items-center gap-2">
                                                <Send className="h-5 w-5" />
                                                Compose Email
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <form onSubmit={handleSendEmail} className="space-y-4">
                                                <div>
                                                    <Label htmlFor="subject">Subject</Label>
                                                    <Input
                                                        id="subject"
                                                        value={emailData.subject}
                                                        onChange={(e) => setEmailData('subject', e.target.value)}
                                                        placeholder="Enter email subject"
                                                        className={emailErrors.subject ? 'border-red-500' : ''}
                                                    />
                                                    {emailErrors.subject && <p className="mt-1 text-sm text-red-600">{emailErrors.subject}</p>}
                                                </div>

                                                <div>
                                                    <div className="mb-2 flex items-center justify-between">
                                                        <Label htmlFor="message">Message</Label>
                                                        <Button
                                                            type="button"
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={generateAIReply}
                                                            disabled={isGeneratingAI}
                                                            className="gap-2 bg-transparent"
                                                        >
                                                            <Bot className="h-4 w-4" />
                                                            {isGeneratingAI ? 'Generating...' : 'AI Suggest'}
                                                        </Button>
                                                    </div>
                                                    <Textarea
                                                        id="message"
                                                        value={emailData.message}
                                                        onChange={(e) => setEmailData('message', e.target.value)}
                                                        placeholder="Type your message here..."
                                                        rows={8}
                                                        className={emailErrors.message ? 'border-red-500' : ''}
                                                    />
                                                    {emailErrors.message && <p className="mt-1 text-sm text-red-600">{emailErrors.message}</p>}
                                                </div>

                                                <div className="flex gap-3">
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        onClick={() => setShowEmailComposer(false)}
                                                        className="flex-1"
                                                    >
                                                        Cancel
                                                    </Button>
                                                    <Button type="submit" disabled={sendingEmail} className="flex-1">
                                                        {sendingEmail ? 'Sending...' : 'Send Email'}
                                                    </Button>
                                                </div>
                                            </form>
                                        </CardContent>
                                    </Card>
                                )}

                                {/* Email History */}
                                {contact.email_history && contact.email_history.length > 0 && (
                                    <Card className="dark:bg-slate-800">
                                        <CardHeader>
                                            <CardTitle className="flex items-center gap-2">
                                                <Clock className="h-5 w-5" />
                                                Email History
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="space-y-4">
                                                {contact.email_history.map((email) => (
                                                    <div key={email.id} className="border-l-2 border-slate-200 pl-4 dark:border-slate-700">
                                                        <div className="flex items-center justify-between">
                                                            <h4 className="font-medium text-slate-900 dark:text-slate-100">{email.subject}</h4>
                                                            <Badge className={getEmailStatusInfo(email.status).color}>
                                                                {getEmailStatusInfo(email.status).label}
                                                            </Badge>
                                                        </div>
                                                        <p className="text-sm text-slate-600 dark:text-slate-400">
                                                            {new Date(email.sent_at).toLocaleString()}
                                                        </p>
                                                        <p className="mt-2 text-sm text-slate-700 dark:text-slate-300">
                                                            {email.content.substring(0, 150)}...
                                                        </p>
                                                    </div>
                                                ))}
                                            </div>
                                        </CardContent>
                                    </Card>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
