'use client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import { router } from '@inertiajs/react'; 
import { AlertTriangle, ArrowLeft, BarChart3, CheckCircle, Clock, Eye, Filter, Mail, Search, Send, Settings, Tag, Users, X } from 'lucide-react';
import { useEffect, useState } from 'react';

interface EmailAccount {
    id: number;
    email: string;
    provider: string;
    status: 'active' | 'warming' | 'paused' | 'suspended';
    daily_limit: number;
    reputation: 'excellent' | 'good' | 'fair' | 'poor';
    warmup_progress: number;
    is_verified: boolean;
    can_send: boolean;
    remaining_limit: number;
}

interface Contact {
    id: number;
    email: string;
    first_name?: string;
    last_name?: string;
    company?: string;
    classification?: string;
    tags?: string[];
}

interface ContactStats {
    total_contacts: number;
    classifications: Record<string, number>;
    all_tags: string[];
}

interface Campaign {
    id: number;
    name: string;
    is_setup_complete: boolean;
    email_account_id?: number;
    recipient_settings?: any;
    campaign_settings?: any;
    sending_schedule: string;
    notes?: string;
}

interface Props {
    campaign: Campaign;
    email_accounts: EmailAccount[];
    contact_stats: ContactStats;
    system_info: {
        timezone: string;
        current_time: string;
    };
    // Make these optional and provide proper defaults
    search_results?: Contact[];
    recipient_preview?: {
        count: number;
        preview: Contact[];
    };
}

export default function CampaignSetup({
    campaign,
    email_accounts,
    contact_stats,
    system_info,
    search_results = [], // Ensure it's always an array
    recipient_preview,
}: Props) {
    const [selectedEmailAccount, setSelectedEmailAccount] = useState<string>(campaign.email_account_id?.toString() || '');
    const [recipientType, setRecipientType] = useState<'all' | 'classification' | 'tags' | 'selected'>('all');
    const [selectedClassifications, setSelectedClassifications] = useState<string[]>([]);
    const [selectedTags, setSelectedTags] = useState<string[]>([]);
    const [selectedContacts, setSelectedContacts] = useState<number[]>([]);
    const [sendingSchedule, setSendingSchedule] = useState(campaign.sending_schedule || 'business-hours');
    const [unsubscribeEnabled, setUnsubscribeEnabled] = useState(true);
    const [notes, setNotes] = useState(campaign.notes || '');

    // Contact search and selection
    const [contactSearch, setContactSearch] = useState('');
    const [showContactModal, setShowContactModal] = useState(false);
    const [recipientCount, setRecipientCount] = useState(0);
    const [recipientPreviewData, setRecipientPreviewData] = useState<Contact[]>([]);

    // Unsubscribe warning modal
    const [showUnsubscribeWarning, setShowUnsubscribeWarning] = useState(false);

    // Load existing settings
    useEffect(() => {
        if (campaign.recipient_settings) {
            const settings = campaign.recipient_settings;
            setRecipientType(settings.type || 'all');
            setSelectedClassifications(settings.classifications || []);
            setSelectedTags(settings.tags || []);
            setSelectedContacts(settings.selected_contacts || []);
        }
        if (campaign.campaign_settings) {
            setUnsubscribeEnabled(campaign.campaign_settings.unsubscribe_enabled ?? true);
        }
    }, [campaign]);

    // Update recipient count when filters change
    useEffect(() => {
        if (recipientType === 'all') {
            setRecipientCount(contact_stats.total_contacts);
            setRecipientPreviewData([]);
        } else if (recipientType === 'selected') {
            setRecipientCount(selectedContacts.length);
            setRecipientPreviewData([]);
        } else {
            // Only call updateRecipientCount for classification and tags
            updateRecipientCount();
        }
    }, [recipientType, selectedClassifications, selectedTags, selectedContacts]);

    // Handle recipient preview data from server
    useEffect(() => {
        if (recipient_preview) {
            setRecipientCount(recipient_preview.count);
            setRecipientPreviewData(recipient_preview.preview);
        }
    }, [recipient_preview]);

    // Debug effect to see what props we're getting
    useEffect(() => {
        console.log('Props received:', {
            search_results,
            recipient_preview,
            search_results_type: typeof search_results,
            search_results_is_array: Array.isArray(search_results),
        });
    }, [search_results, recipient_preview]);

    const updateRecipientCount = () => {
        if (recipientType === 'all' || recipientType === 'selected') return;

        // Use Inertia to get recipient count
        router.get(
            route('user.email.campaign.setup', campaign.id),
            {
                filter_type: recipientType,
                classifications: selectedClassifications,
                tags: selectedTags,
                get_preview: true,
            },
            {
                preserveState: true,
                preserveScroll: true,
                only: ['recipient_preview'],
            },
        );
    };

    const handleContactSearch = (value: string) => {
        setContactSearch(value);

        if (value.trim()) {
            // Use Inertia to search contacts
            router.get(
                route('user.email.campaign.setup', campaign.id),
                {
                    search: value,
                    get_contacts: true,
                },
                {
                    preserveState: true,
                    preserveScroll: true,
                    only: ['search_results'],
                },
            );
        }
    };

    const toggleContactSelection = (contactId: number) => {
        setSelectedContacts((prev) => (prev.includes(contactId) ? prev.filter((id) => id !== contactId) : [...prev, contactId]));
    };

    const handleClassificationToggle = (classification: string) => {
        setSelectedClassifications((prev) => (prev.includes(classification) ? prev.filter((c) => c !== classification) : [...prev, classification]));
    };

    const handleTagToggle = (tag: string) => {
        setSelectedTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]));
    };

    const handleUnsubscribeToggle = (enabled: boolean) => {
        if (!enabled) {
            setShowUnsubscribeWarning(true);
        } else {
            setUnsubscribeEnabled(enabled);
        }
    };

    const confirmUnsubscribeDisable = () => {
        setUnsubscribeEnabled(false);
        setShowUnsubscribeWarning(false);
    };

    const handleSaveSetup = () => {
        const setupData = {
            email_account_id: Number.parseInt(selectedEmailAccount),
            recipient_settings: {
                type: recipientType,
                classifications: selectedClassifications,
                tags: selectedTags,
                selected_contacts: selectedContacts,
            },
            campaign_settings: {
                unsubscribe_enabled: unsubscribeEnabled,
            },
            sending_schedule: sendingSchedule,
            notes: notes,
        };

        console.log('🚀 CAMPAIGN SETUP DATA:', setupData);

        // Use Inertia to save setup
        router.patch(route('user.email.campaign.updateSetup', campaign.id), setupData, {
            onSuccess: () => {
                console.log('Campaign setup completed successfully!');
            },
            onError: (errors) => {
                console.error('Setup failed:', errors);
            },
        });
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'active':
            case 'excellent':
                return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
            case 'warming':
            case 'good':
                return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
            case 'paused':
            case 'fair':
                return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
            case 'suspended':
            case 'poor':
                return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
            default:
                return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
        }
    };

    const isSetupValid = selectedEmailAccount && recipientCount > 0;

    return (
        <AppLayout>
            <div className="min-h-screen bg-background p-4 md:p-6 lg:p-8">
                <div className="mx-auto max-w-6xl">
                    {/* Header */}
                    <div className="mb-8">
                        <div className="mb-4 flex items-center gap-4">
                            <Button variant="ghost" size="sm" className="rounded-2xl" onClick={() => router.get(route('user.email.campaign', campaign.id))}>
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Back to Campaign
                            </Button>
                        </div>
                        <div>
                            <h1 className="mb-3 text-3xl font-bold text-primary lg:text-4xl">Campaign Setup</h1>
                            <p className="text-lg text-secondary">Configure "{campaign.name}" for launch</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
                        {/* Main Configuration */}
                        <div className="space-y-6 lg:col-span-2">
                            {/* Email Account Selection */}
                            <Card className="rounded-3xl border border-accent bg-card">
                                <CardHeader className="pb-4">
                                    <CardTitle className="flex items-center gap-2 text-lg">
                                        <Mail className="h-5 w-5 text-primary" />
                                        Select Sending Account
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="space-y-3">
                                        {email_accounts.map((account) => (
                                            <div
                                                key={account.id}
                                                className={`cursor-pointer rounded-2xl border p-4 transition-all duration-200 hover:shadow-md ${
                                                    selectedEmailAccount === account.id.toString()
                                                        ? 'border-primary bg-primary/5'
                                                        : 'border-accent bg-muted/30'
                                                }`}
                                                onClick={() => setSelectedEmailAccount(account.id.toString())}
                                            >
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <div className="rounded-xl bg-primary/10 p-2">
                                                            <Mail className="h-4 w-4 text-primary" />
                                                        </div>
                                                        <div>
                                                            <p className="font-medium text-primary">{account.email}</p>
                                                            <p className="text-xs text-muted-foreground">{account.provider}</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <Badge className={`text-xs ${getStatusColor(account.reputation)}`}>
                                                            {account.reputation}
                                                        </Badge>
                                                        <Badge className={`text-xs ${getStatusColor(account.status)}`}>{account.status}</Badge>
                                                        {!account.is_verified && (
                                                            <Badge variant="destructive" className="text-xs">
                                                                Unverified
                                                            </Badge>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                                                    <span>Daily Limit: {account.daily_limit}</span>
                                                    <span>Remaining: {account.remaining_limit}</span>
                                                </div>
                                                {account.status === 'warming' && (
                                                    <div className="mt-3">
                                                        <div className="mb-1 flex items-center justify-between text-xs text-muted-foreground">
                                                            <span>Warmup Progress</span>
                                                            <span>{account.warmup_progress}%</span>
                                                        </div>
                                                        <div className="h-2 rounded-full bg-muted">
                                                            <div
                                                                className="h-2 rounded-full bg-primary"
                                                                style={{ width: `${account.warmup_progress}%` }}
                                                            ></div>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Recipient Selection */}
                            <Card className="rounded-3xl border border-accent bg-card">
                                <CardHeader className="pb-4">
                                    <CardTitle className="flex items-center gap-2 text-lg">
                                        <Users className="h-5 w-5 text-primary" />
                                        Select Recipients
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    {/* Recipient Type Selection */}
                                    <div className="space-y-3">
                                        <Label className="text-sm font-medium">Recipient Selection Method</Label>
                                        <div className="grid grid-cols-2 gap-3">
                                            <Button
                                                variant={recipientType === 'all' ? 'default' : 'outline'}
                                                onClick={() => setRecipientType('all')}
                                                className="rounded-2xl"
                                            >
                                                All Contacts
                                            </Button>
                                            <Button
                                                variant={recipientType === 'classification' ? 'default' : 'outline'}
                                                onClick={() => setRecipientType('classification')}
                                                className="rounded-2xl"
                                            >
                                                By Classification
                                            </Button>
                                            <Button
                                                variant={recipientType === 'tags' ? 'default' : 'outline'}
                                                onClick={() => setRecipientType('tags')}
                                                className="rounded-2xl"
                                            >
                                                By Tags
                                            </Button>
                                            <Button
                                                variant={recipientType === 'selected' ? 'default' : 'outline'}
                                                onClick={() => {
                                                    setRecipientType('selected');
                                                    setShowContactModal(true);
                                                }}
                                                className="rounded-2xl"
                                            >
                                                Select Manually
                                            </Button>
                                        </div>
                                    </div>

                                    {/* Classification Selection */}
                                    {recipientType === 'classification' && (
                                        <div className="space-y-3">
                                            <Label className="text-sm font-medium">Select Classifications</Label>
                                            <div className="flex flex-wrap gap-2">
                                                {Object.entries(contact_stats.classifications).map(([classification, count]) => (
                                                    <Button
                                                        key={classification}
                                                        variant={selectedClassifications.includes(classification) ? 'default' : 'outline'}
                                                        size="sm"
                                                        onClick={() => handleClassificationToggle(classification)}
                                                        className="rounded-2xl"
                                                    >
                                                        {classification} ({count})
                                                    </Button>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Tags Selection */}
                                    {recipientType === 'tags' && (
                                        <div className="space-y-3">
                                            <Label className="text-sm font-medium">Select Tags</Label>
                                            <div className="flex flex-wrap gap-2">
                                                {contact_stats.all_tags.map((tag) => (
                                                    <Button
                                                        key={tag}
                                                        variant={selectedTags.includes(tag) ? 'default' : 'outline'}
                                                        size="sm"
                                                        onClick={() => handleTagToggle(tag)}
                                                        className="rounded-2xl"
                                                    >
                                                        <Tag className="mr-1 h-3 w-3" />
                                                        {tag}
                                                    </Button>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Selected Contacts Summary */}
                                    {recipientType === 'selected' && (
                                        <div className="space-y-3">
                                            <div className="flex items-center justify-between">
                                                <Label className="text-sm font-medium">Selected Contacts</Label>
                                                <Button size="sm" onClick={() => setShowContactModal(true)} className="rounded-2xl">
                                                    <Search className="mr-1 h-3 w-3" />
                                                    Search & Select
                                                </Button>
                                            </div>
                                            <div className="rounded-2xl border border-accent bg-muted/30 p-4">
                                                <p className="text-sm text-muted-foreground">{selectedContacts.length} contacts selected</p>
                                            </div>
                                        </div>
                                    )}

                                    {/* Recipient Preview */}
                                    {recipientCount > 0 && recipientPreviewData.length > 0 && (
                                        <div className="space-y-3">
                                            <Label className="text-sm font-medium">Preview ({recipientCount} total)</Label>
                                            <div className="space-y-2">
                                                {recipientPreviewData.slice(0, 5).map((contact) => (
                                                    <div key={contact.id} className="flex items-center gap-2 text-sm">
                                                        <div className="h-2 w-2 rounded-full bg-primary"></div>
                                                        <span>{contact.email}</span>
                                                        {contact.first_name && <span className="text-muted-foreground">({contact.first_name})</span>}
                                                    </div>
                                                ))}
                                                {recipientPreviewData.length > 5 && (
                                                    <p className="text-xs text-muted-foreground">...and {recipientCount - 5} more contacts</p>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            {/* Campaign Settings */}
                            <Card className="rounded-3xl border border-accent bg-card">
                                <CardHeader className="pb-4">
                                    <CardTitle className="flex items-center gap-2 text-lg">
                                        <Settings className="h-5 w-5 text-primary" />
                                        Campaign Settings
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="space-y-2">
                                        <Label className="text-sm font-medium">Sending Schedule</Label>
                                        <Select value={sendingSchedule} onValueChange={setSendingSchedule}>
                                            <SelectTrigger className="rounded-2xl">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="business-hours">Business Hours (9 AM - 5 PM)</SelectItem>
                                                <SelectItem value="extended">Extended Hours (8 AM - 8 PM)</SelectItem>
                                                <SelectItem value="24-7">24/7 Sending</SelectItem>
                                                <SelectItem value="custom">Custom Schedule</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <p className="text-xs text-muted-foreground">
                                            System timezone: {system_info.timezone} | Current time: {system_info.current_time}
                                        </p>
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <div>
                                            <Label className="text-sm font-medium">Unsubscribe Link</Label>
                                            <p className="text-xs text-muted-foreground">Include unsubscribe option (recommended)</p>
                                        </div>
                                        <Switch checked={unsubscribeEnabled} onCheckedChange={handleUnsubscribeToggle} />
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-sm font-medium">Campaign Notes (Optional)</Label>
                                        <Textarea
                                            placeholder="Add any notes or special instructions for this campaign..."
                                            value={notes}
                                            onChange={(e) => setNotes(e.target.value)}
                                            className="min-h-[80px] rounded-2xl"
                                            maxLength={1000}
                                        />
                                        <p className="text-xs text-muted-foreground">
                                            {notes.length}/1000 characters • Notes help track campaign purpose and strategy
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Summary Sidebar */}
                        <div className="space-y-6">
                            <Card className="sticky top-6 rounded-3xl border border-accent bg-card">
                                <CardHeader className="pb-4">
                                    <CardTitle className="flex items-center gap-2 text-lg">
                                        <BarChart3 className="h-5 w-5 text-primary" />
                                        Setup Summary
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="space-y-4">
                                        <div className="rounded-2xl border border-accent bg-muted/30 p-4">
                                            <div className="mb-2 flex items-center justify-between">
                                                <span className="text-sm font-medium text-muted-foreground">Total Recipients</span>
                                                <Users className="h-4 w-4 text-muted-foreground" />
                                            </div>
                                            <p className="text-2xl font-bold text-primary">{recipientCount.toLocaleString()}</p>
                                        </div>

                                        <div className="rounded-2xl border border-accent bg-muted/30 p-4">
                                            <div className="mb-2 flex items-center justify-between">
                                                <span className="text-sm font-medium text-muted-foreground">Selection Method</span>
                                                <Filter className="h-4 w-4 text-muted-foreground" />
                                            </div>
                                            <p className="text-lg font-semibold text-primary capitalize">{recipientType.replace('-', ' ')}</p>
                                        </div>

                                        <div className="rounded-2xl border border-accent bg-muted/30 p-4">
                                            <div className="mb-2 flex items-center justify-between">
                                                <span className="text-sm font-medium text-muted-foreground">Schedule</span>
                                                <Clock className="h-4 w-4 text-muted-foreground" />
                                            </div>
                                            <p className="text-sm font-medium text-primary capitalize">{sendingSchedule.replace('-', ' ')}</p>
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <h4 className="font-medium text-primary">Setup Status</h4>
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-2">
                                                {selectedEmailAccount ? (
                                                    <CheckCircle className="h-4 w-4 text-green-600" />
                                                ) : (
                                                    <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                                                )}
                                                <span className="text-sm">Email Account Selected</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {recipientCount > 0 ? (
                                                    <CheckCircle className="h-4 w-4 text-green-600" />
                                                ) : (
                                                    <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                                                )}
                                                <span className="text-sm">Recipients Selected</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {unsubscribeEnabled ? (
                                                    <CheckCircle className="h-4 w-4 text-green-600" />
                                                ) : (
                                                    <AlertTriangle className="h-4 w-4 text-yellow-600" />
                                                )}
                                                <span className="text-sm">Compliance Settings</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <Button
                                            variant="outline"
                                            className="w-full rounded-2xl border-primary/20 bg-primary/5 hover:bg-primary/10"
                                            onClick={() => router.get(route('user.email.campaign.show', campaign.id))}
                                        >
                                            <Eye className="mr-2 h-4 w-4" />
                                            Preview Campaign
                                        </Button>
                                        <Button className="w-full rounded-2xl" onClick={handleSaveSetup} disabled={!isSetupValid}>
                                            <Send className="mr-2 h-4 w-4" />
                                            Complete Setup
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>

                {/* Contact Search Modal */}
                <Dialog open={showContactModal} onOpenChange={setShowContactModal}>
                    <DialogContent className="max-w-4xl rounded-3xl">
                        <DialogHeader>
                            <DialogTitle>Search & Select Contacts</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                            <div className="flex items-center gap-2">
                                <div className="relative flex-1">
                                    <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                    <Input
                                        placeholder="Search by email, name, or company..."
                                        value={contactSearch}
                                        onChange={(e) => handleContactSearch(e.target.value)}
                                        className="rounded-2xl pl-10"
                                    />
                                </div>
                                <Button variant="outline" onClick={() => setShowContactModal(false)} className="rounded-2xl">
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>

                            <div className="max-h-96 space-y-2 overflow-y-auto">
                                {Array.isArray(search_results) && search_results.length > 0 ? (
                                    search_results.map((contact) => (
                                        <div key={contact.id} className="flex items-center gap-3 rounded-2xl border p-3 hover:bg-muted/50">
                                            <Checkbox
                                                checked={selectedContacts.includes(contact.id)}
                                                onCheckedChange={() => toggleContactSelection(contact.id)}
                                            />
                                            <div className="flex-1">
                                                <p className="font-medium">{contact.email}</p>
                                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                    {contact.first_name && (
                                                        <span>
                                                            {contact.first_name} {contact.last_name}
                                                        </span>
                                                    )}
                                                    {contact.company && <span>• {contact.company}</span>}
                                                    {contact.classification && (
                                                        <Badge variant="outline" className="text-xs">
                                                            {contact.classification}
                                                        </Badge>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                ) : contactSearch ? (
                                    <p className="text-center text-muted-foreground">No contacts found</p>
                                ) : (
                                    <p className="text-center text-muted-foreground">Start typing to search contacts</p>
                                )}
                            </div>

                            <div className="flex items-center justify-between border-t pt-4">
                                <p className="text-sm text-muted-foreground">{selectedContacts.length} contacts selected</p>
                                <Button onClick={() => setShowContactModal(false)} className="rounded-2xl">
                                    Done
                                </Button>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>

                {/* Unsubscribe Warning Modal */}
                <Dialog open={showUnsubscribeWarning} onOpenChange={setShowUnsubscribeWarning}>
                    <DialogContent className="max-w-md rounded-3xl">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                <AlertTriangle className="h-5 w-5 text-yellow-600" />
                                Unsubscribe Link Recommended
                            </DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                            <p className="text-sm text-muted-foreground">
                                Including an unsubscribe link is strongly recommended and may be required by law in many jurisdictions. It also helps
                                maintain good sender reputation and reduces spam complaints.
                            </p>
                            <div className="flex justify-end gap-3">
                                <Button variant="outline" onClick={() => setShowUnsubscribeWarning(false)} className="rounded-2xl">
                                    Keep Enabled
                                </Button>
                                <Button variant="destructive" onClick={confirmUnsubscribeDisable} className="rounded-2xl">
                                    Disable Anyway
                                </Button>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>
        </AppLayout>
    );
}
