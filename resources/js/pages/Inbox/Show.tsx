'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import { router, usePage } from '@inertiajs/react';
import {
    Archive,
    ArrowLeft,
    ArrowRight,
    Bold,
    Forward,
    Italic,
    Link,
    Mail,
    Minimize2,
    MoreHorizontal,
    Paperclip,
    Reply,
    ReplyAll,
    Send,
    Smile,
    Sparkles,
    Star,
    StarOff,
    Trash2,
    X,
    Zap,
} from 'lucide-react';
import { useEffect, useState } from 'react';

// TypeScript interfaces
interface EmailMessage {
    id: number;
    subject: string;
    from_email: string;
    from_name: string;
    to_email: string;
    to_name: string;
    body_html: string;
    body_text: string;
    snippet: string;
    is_read: boolean;
    is_important: boolean;
    is_starred: boolean;
    is_cold_email: boolean;
    is_reply: boolean;
    has_attachments: boolean;
    attachments: any[];
    received_at: string;
    formatted_date: string;
    account: {
        id: number;
        email: string;
        provider: string;
    };
}

interface Props {
    message: EmailMessage;
    thread_messages: EmailMessage[];
    error?: string;
}

export default function EmailMessagePage({ message, thread_messages, error }: Props) {
    const { flash } = usePage().props as any;
    const [showRawContent, setShowRawContent] = useState(false);
    const [isStarring, setIsStarring] = useState(false);
    const [showReplyComposer, setShowReplyComposer] = useState(false);
    const [replyType, setReplyType] = useState<'reply' | 'reply-all' | 'forward'>('reply');
    const [replyContent, setReplyContent] = useState('');
    const [replySubject, setReplySubject] = useState('');
    const [isAiHelping, setIsAiHelping] = useState(false);
    const [aiSuggestion, setAiSuggestion] = useState('');

    // Show flash messages
    useEffect(() => {
        if (flash.success) {
            console.log('Success:', flash.success);
        }
        if (flash.error) {
            console.log('Error:', flash.error);
        }
    }, [flash]);

    // Handle star toggle
    const handleStarToggle = () => {
        setIsStarring(true);
        router.post(
            `/inbox/${message.id}/star`,
            {},
            {
                onFinish: () => setIsStarring(false),
                preserveScroll: true,
            },
        );
    };

    // Handle mark as important
    const handleMarkAsImportant = () => {
        router.post(
            `/inbox/${message.id}/important`,
            {},
            {
                preserveScroll: true,
            },
        );
    };

    // Handle delete
    const handleDelete = () => {
        if (confirm('Are you sure you want to delete this message?')) {
            router.delete('/inbox/messages', {
                data: {
                    message_ids: [message.id],
                },
                onSuccess: () => router.get('/inbox'),
            });
        }
    };

    // Handle reply actions
    const handleReply = (type: 'reply' | 'reply-all' | 'forward') => {
        setReplyType(type);
        setReplySubject(type === 'forward' ? `Fwd: ${message.subject}` : `Re: ${message.subject?.replace(/^Re:\s*/i, '') || ''}`);
        setShowReplyComposer(true);
    };

    // Handle AI assistance
    const handleAiAssist = async () => {
        setIsAiHelping(true);
        // Simulate AI response - replace with actual AI integration
        setTimeout(() => {
            const suggestions = [
                "Thank you for your email. I'll review this and get back to you shortly.",
                'I appreciate you reaching out. Let me look into this matter and respond accordingly.',
                "Thanks for the update. I'll take care of this right away.",
                "I've received your message and will address your concerns promptly.",
            ];
            setAiSuggestion(suggestions[Math.floor(Math.random() * suggestions.length)]);
            setIsAiHelping(false);
        }, 1500);
    };

    // Handle send reply
    const handleSendReply = () => {
        if (!replyContent.trim()) return;

        router.post(
            '/inbox/reply',
            {
                message_id: message.id,
                type: replyType,
                subject: replySubject,
                content: replyContent,
            },
            {
                onSuccess: () => {
                    setShowReplyComposer(false);
                    setReplyContent('');
                    setReplySubject('');
                    setAiSuggestion('');
                },
            },
        );
    };
    console.log('HTML Content:', message.body_html);

    // Get provider icon
    const getProviderIcon = (provider: string) => {
        switch (provider) {
            case 'gmail':
                return <img src="https://api.iconify.design/logos/google-icon.svg" className="h-4 w-4" alt="Gmail" />;
            case 'outlook':
                return <img src="https://api.iconify.design/logos/microsoft-outlook.svg" className="h-4 w-4" alt="Outlook" />;
            default:
                return <div className="h-2 w-2 rounded-full bg-gray-400" />;
        }
    };

    // Get initials for avatar
    const getInitials = (name: string, email: string) => {
        if (name) {
            return name
                .split(' ')
                .map((n) => n[0])
                .join('')
                .toUpperCase()
                .slice(0, 2);
        }
        return email.slice(0, 2).toUpperCase();
    };

    if (error) {
        return (
            <AppLayout>
                <div className="min-h-screen bg-background p-4">
                    <div className="mx-auto max-w-4xl">
                        <div className="py-16 text-center">
                            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                                <Mail className="h-8 w-8 text-muted-foreground" />
                            </div>
                            <h2 className="mb-2 text-xl font-semibold">Error Loading Message</h2>
                            <p className="mb-4 text-muted-foreground">{error}</p>
                            <Button onClick={() => window.history.back()} className="rounded-2xl">
                                Back to Inbox
                            </Button>
                        </div>
                    </div>
                </div>
            </AppLayout>
        );
    }

    return (
        <AppLayout>
            <div className="min-h-screen bg-background p-4">
                <div className="mx-auto max-w-4xl space-y-6">
                    {/* Header */}
                    <div className="rounded-3xl border bg-card p-5">
                        <div className="mb-4 flex items-start justify-between">
                            <Button variant="ghost" onClick={() => window.history.back()} className="-ml-2 rounded-2xl bg-transparent">
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Back to Inbox
                            </Button>
                            <div className="flex items-center gap-2">
                                <Button variant="ghost" size="sm" onClick={handleStarToggle} disabled={isStarring} className="rounded-xl">
                                    {message.is_starred ? (
                                        <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                                    ) : (
                                        <StarOff className="h-4 w-4" />
                                    )}
                                </Button>
                                <Button variant="ghost" size="sm" onClick={handleMarkAsImportant} className="rounded-xl">
                                    <Zap className={`h-4 w-4 ${message.is_important ? 'text-primary' : ''}`} />
                                </Button>
                                <Button variant="ghost" size="sm" onClick={handleDelete} className="rounded-xl">
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>

                        <div className="space-y-3 sm:pr-1">
                            <h1 className="text-2xl font-bold">{message.subject || '(No Subject)'}</h1>
                            <div className="flex gap-3">
                                {getProviderIcon(message.account.provider)}
                                <span className="text-muted-foreground">{message.account.email}</span>
                                {message.is_reply && (
                                    <Badge variant="outline" className="rounded-full">
                                        Reply
                                    </Badge>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Email Thread */}
                    <div className="space-y-6">
                        {thread_messages.map((msg, index) => (
                            <div
                                key={msg.id}
                                className={`rounded-3xl border bg-card p-6 shadow-sm transition-all ${
                                    msg.id === message.id ? 'bg-primary/5 ring-2 ring-primary/20' : ''
                                } ${
                                    // Zigzag pattern for thread messages too
                                    index % 2 === 0 ? 'ml-4' : 'mr-4'
                                }`}
                            >
                                {/* Message Header */}
                                <div className="mb-6 flex items-start gap-4">
                                    <Avatar className="h-12 w-12">
                                        <AvatarImage src={`https://api.dicebear.com/6.x/initials/svg?seed=${msg.from_email}`} />
                                        <AvatarFallback className="bg-primary/10 font-medium text-primary">
                                            {getInitials(msg.from_name || '', msg.from_email)}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="min-w-0 flex-1">
                                        <div className="mb-1 flex flex-wrap items-center gap-x-2 gap-y-1">
                                            <span className="max-w-xs truncate font-semibold">{msg.from_name || msg.from_email}</span>
                                            <span className="text-sm break-all text-muted-foreground">{'<' + msg.from_email + '>'}</span>
                                        </div>
                                        <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                                            <span>to {msg.to_name || msg.to_email}</span>
                                            <span>•</span>
                                            <span>{msg.formatted_date}</span>
                                            {msg.has_attachments && (
                                                <>
                                                    <span>•</span>
                                                    <div className="flex items-center gap-1">
                                                        <Paperclip className="h-3 w-3" />
                                                        <span>
                                                            {msg.attachments?.length || 0} attachment
                                                            {msg.attachments && msg.attachments.length === 1 ? '' : 's'}
                                                        </span>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Email Content */}
                                <div className="mb-6">
                                    {showRawContent ? (
                                        <div className="rounded-2xl bg-muted/30 p-4">
                                            <pre className="overflow-x-auto font-mono text-sm whitespace-pre-wrap text-foreground">
                                                {msg.body_text || msg.snippet}
                                            </pre>
                                        </div>
                                    ) : (
                                        <div className="rounded-2xl border bg-white p-6">
                                            {msg.body_html ? (
                                                <div className="email-container">
                                                    <div
                                                        dangerouslySetInnerHTML={{
                                                            __html: msg.body_html
                                                                // Minimal sanitization (keep most HTML intact)
                                                                .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '')
                                                                .replace(/javascript:/gi, '')
                                                                .replace(/\son\w+=(["']).*?\1/gi, '')
                                                                // Force images to be responsive
                                                                .replace(
                                                                    /<img([^>]*)>/gi,
                                                                    '<img $1 style="max-width:100%;height:auto;display:block;">',
                                                                )
                                                                // Ensure tables don't overflow
                                                                .replace(
                                                                    /<table([^>]*)>/gi,
                                                                    '<table $1 style="width:100%;border-collapse:collapse;">',
                                                                ),
                                                        }}
                                                    />
                                                </div>
                                            ) : (
                                                <div className="leading-relaxed whitespace-pre-wrap text-foreground">
                                                    {msg.body_text || msg.snippet}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* Attachments */}
                                {msg.has_attachments && msg.attachments && (
                                    <div className="mb-6">
                                        <h4 className="mb-3 flex items-center gap-2 font-medium">
                                            <Paperclip className="h-4 w-4" />
                                            Attachments
                                        </h4>
                                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                            {msg.attachments.map((attachment, idx) => (
                                                <div key={idx} className="flex items-center gap-3 rounded-2xl bg-muted/30 p-3">
                                                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                                                        <Archive className="h-4 w-4 text-primary" />
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                        <p className="truncate text-sm font-medium">{attachment.filename}</p>
                                                        <p className="text-xs text-muted-foreground">{Math.round(attachment.size / 1024)}KB</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Actions for current message */}
                                {msg.id === message.id && (
                                    <div className="flex flex-wrap items-center gap-2 border-t pt-4">
                                        <Button size="sm" className="rounded-2xl" onClick={() => handleReply('reply')}>
                                            <Reply className="mr-2 h-4 w-4" />
                                            Reply
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="rounded-2xl bg-transparent"
                                            onClick={() => handleReply('reply-all')}
                                        >
                                            <ReplyAll className="mr-2 h-4 w-4" />
                                            Reply All
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="rounded-2xl bg-transparent"
                                            onClick={() => handleReply('forward')}
                                        >
                                            <Forward className="mr-2 h-4 w-4" />
                                            Forward
                                        </Button>
                                        <Button size="sm" variant="ghost" onClick={() => setShowRawContent(!showRawContent)} className="rounded-2xl">
                                            {showRawContent ? 'Show Formatted' : 'Show Raw'}
                                        </Button>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Reply Composer */}
                    {showReplyComposer && (
                        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4">
                            <div className="max-h-[80vh] w-full max-w-4xl overflow-hidden rounded-t-3xl bg-card shadow-2xl">
                                {/* Composer Header */}
                                <div className="flex items-center justify-between border-b p-6">
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                                            <Reply className="h-4 w-4 text-primary" />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold capitalize">{replyType.replace('-', ' ')}</h3>
                                            <p className="text-sm text-muted-foreground">to {message.from_name || message.from_email}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Button variant="ghost" size="sm" className="rounded-xl">
                                            <Minimize2 className="h-4 w-4" />
                                        </Button>
                                        <Button variant="ghost" size="sm" onClick={() => setShowReplyComposer(false)} className="rounded-xl">
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>

                                {/* Composer Body */}
                                <div className="max-h-[60vh] space-y-4 overflow-y-auto p-6">
                                    {/* Subject */}
                                    <div>
                                        <Input
                                            placeholder="Subject"
                                            value={replySubject}
                                            onChange={(e) => setReplySubject(e.target.value)}
                                            className="rounded-2xl"
                                        />
                                    </div>

                                    {/* AI Suggestion */}
                                    {aiSuggestion && (
                                        <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4">
                                            <div className="flex items-start gap-3">
                                                <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-primary/10">
                                                    <Sparkles className="h-3 w-3 text-primary" />
                                                </div>
                                                <div className="flex-1">
                                                    <p className="mb-1 text-sm font-medium">AI Suggestion</p>
                                                    <p className="mb-3 text-sm text-muted-foreground">{aiSuggestion}</p>
                                                    <div className="flex gap-2">
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => setReplyContent(aiSuggestion)}
                                                            className="rounded-xl"
                                                        >
                                                            Use This
                                                        </Button>
                                                        <Button size="sm" variant="ghost" onClick={() => setAiSuggestion('')} className="rounded-xl">
                                                            Dismiss
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Text Editor */}
                                    <div className="space-y-3">
                                        {/* Toolbar */}
                                        <div className="flex items-center gap-2 rounded-2xl bg-muted/30 p-3">
                                            <Button variant="ghost" size="sm" className="rounded-xl">
                                                <Bold className="h-4 w-4" />
                                            </Button>
                                            <Button variant="ghost" size="sm" className="rounded-xl">
                                                <Italic className="h-4 w-4" />
                                            </Button>
                                            <Button variant="ghost" size="sm" className="rounded-xl">
                                                <Link className="h-4 w-4" />
                                            </Button>
                                            <Button variant="ghost" size="sm" className="rounded-xl">
                                                <Smile className="h-4 w-4" />
                                            </Button>
                                            <div className="flex-1" />
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={handleAiAssist}
                                                disabled={isAiHelping}
                                                className="rounded-xl bg-primary/10 text-primary hover:bg-primary/20"
                                            >
                                                <Sparkles className={`mr-2 h-4 w-4 ${isAiHelping ? 'animate-spin' : ''}`} />
                                                AI Assist
                                            </Button>
                                        </div>

                                        {/* Text Area */}
                                        <Textarea
                                            placeholder="Write your message..."
                                            value={replyContent}
                                            onChange={(e) => setReplyContent(e.target.value)}
                                            className="min-h-[200px] resize-none rounded-2xl"
                                        />
                                    </div>
                                </div>

                                {/* Composer Footer */}
                                <div className="flex items-center justify-between border-t bg-muted/20 p-6">
                                    <div className="flex items-center gap-2">
                                        <Button variant="ghost" size="sm" className="rounded-xl">
                                            <Paperclip className="mr-2 h-4 w-4" />
                                            Attach
                                        </Button>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Button variant="ghost" onClick={() => setShowReplyComposer(false)} className="rounded-2xl">
                                            Cancel
                                        </Button>
                                        <Button onClick={handleSendReply} disabled={!replyContent.trim()} className="rounded-2xl">
                                            <Send className="mr-2 h-4 w-4" />
                                            Send
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Navigation Footer */}
                    <div className="flex items-center justify-between rounded-3xl border bg-card p-6">
                        <Button variant="outline" onClick={() => window.history.back()} className="rounded-2xl bg-transparent">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Inbox
                        </Button>
                        <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm" className="rounded-2xl bg-transparent">
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                 
                            </Button>
                            <Button variant="outline" size="sm" className="rounded-2xl bg-transparent">
                                 
                                <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
