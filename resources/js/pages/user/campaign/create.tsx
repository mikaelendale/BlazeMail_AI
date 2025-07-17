'use client';
import AppLogo from '@/components/app-logo';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import { router } from '@inertiajs/react';
import {
    ArrowDown,
    ArrowUp,
    ChevronDown,
    ChevronUp,
    Clock,
    Edit,
    Edit3,
    Eye,
    Loader2,
    Mail,
    Paperclip,
    Plus,
    Rocket,
    TrainTrack,
    Trash2,
} from 'lucide-react';
import { useEffect, useState } from 'react';

interface EmailGroup {
    id: number;
    title: string;
    delay: { days: number; hours: number; minutes: number };
    emails: EmailData[];
}

interface ChatMessage {
    id: number;
    type: 'user' | 'ai' | 'status';
    content: string;
    timestamp: Date;
}

interface Campaign {
    name: string;
    groups: EmailGroup[];
    createdAt: Date;
    startingDate: string;
}

export interface EmailData {
    id: number;
    subject: string;
    email_content: string; // Updated to match backend
}

const STORAGE_KEY = 'campaign_progress';

export default function EmailSequenceGenerator({ emails }: { emails: EmailData[] }) {
    // Email library - all created emails
    const [emailLibrary, setEmailLibrary] = useState<EmailData[]>(emails);

    // Start with empty groups - fully dynamic
    const [emailGroups, setEmailGroups] = useState<EmailGroup[]>([]);

    const [selectedEmail, setSelectedEmail] = useState<EmailData | null>(null);
    const [aiPrompt, setAiPrompt] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [isAddGroupModalOpen, setIsAddGroupModalOpen] = useState(false);
    const [isAddEmailModalOpen, setIsAddEmailModalOpen] = useState(false);
    const [isEditGroupModalOpen, setIsEditGroupModalOpen] = useState(false);
    const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
    const [isLaunchModalOpen, setIsLaunchModalOpen] = useState(false);
    const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null);
    const [editingGroup, setEditingGroup] = useState<EmailGroup | null>(null);
    const [campaignName, setCampaignName] = useState('');
    const [startingDate, setStartingDate] = useState('');
    const [newGroup, setNewGroup] = useState({
        title: '',
        delay: { days: 1, hours: 0, minutes: 0 },
        selectedEmails: [] as number[],
    });
    const [newEmail, setNewEmail] = useState({
        subject: '',
        content: '',
    });
    const [editingDelay, setEditingDelay] = useState<number | null>(null);
    const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
    const [isAddEmailToGroupModalOpen, setIsAddEmailToGroupModalOpen] = useState(false);
    const [newEmailToGroup, setNewEmailToGroup] = useState({
        selectedEmails: [] as number[],
        createNew: false,
        newEmail: { subject: '', content: '' },
    });

    // Load saved progress from localStorage on component mount
    useEffect(() => {
        const savedProgress = localStorage.getItem(STORAGE_KEY);
        if (savedProgress) {
            try {
                const parsed = JSON.parse(savedProgress);
                if (parsed.emailGroups) {
                    setEmailGroups(parsed.emailGroups);
                }
                if (parsed.campaignName) {
                    setCampaignName(parsed.campaignName);
                }
                if (parsed.startingDate) {
                    setStartingDate(parsed.startingDate);
                }
                if (parsed.chatMessages) {
                    setChatMessages(
                        parsed.chatMessages.map((msg: any) => ({
                            ...msg,
                            timestamp: new Date(msg.timestamp),
                        })),
                    );
                }
            } catch (error) {
                console.error('Error loading saved progress:', error);
            }
        }
    }, []);

    // Save progress to localStorage whenever state changes
    useEffect(() => {
        const progressData = {
            emailGroups,
            campaignName,
            startingDate,
            chatMessages,
            lastSaved: new Date().toISOString(),
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(progressData));
    }, [emailGroups, campaignName, startingDate, chatMessages]);

    // Console log the sequence JSON whenever it changes - now functional
    useEffect(() => {
        if (emailGroups.length > 0) {
            const sequenceData = {
                totalGroups: emailGroups.length,
                totalEmails: emailGroups.reduce((total, group) => total + group.emails.length, 0),
                groups: emailGroups.map((group, index) => ({
                    groupIndex: index + 1,
                    groupId: group.id,
                    title: group.title,
                    delay: group.delay,
                    delayFormatted: formatDelay(group.delay),
                    emailCount: group.emails.length,
                    emails: group.emails.map((email) => ({
                        id: email.id,
                        subject: email.subject,
                        contentPreview: email.email_content.substring(0, 100) + '...',
                    })),
                })),
                timeline: (() => {
                    let cumulativeTime = 0;
                    return emailGroups.map((group, index) => {
                        const groupTime = cumulativeTime;
                        cumulativeTime += group.delay.days * 24 * 60 + group.delay.hours * 60 + group.delay.minutes;
                        return {
                            groupIndex: index + 1,
                            groupTitle: group.title,
                            sendsAt: `${Math.floor(groupTime / (24 * 60))}d ${Math.floor((groupTime % (24 * 60)) / 60)}h ${groupTime % 60}m`,
                            emailIds: group.emails.map((e) => e.id),
                        };
                    });
                })(),
            };
            console.log('Email Sequence Data:', sequenceData);
        }
    }, [emailGroups]);

    const formatDelay = (delay: { days: number; hours: number; minutes: number }) => {
        const parts = [];
        if (delay.days > 0) parts.push(`${delay.days}d`);
        if (delay.hours > 0) parts.push(`${delay.hours}h`);
        if (delay.minutes > 0) parts.push(`${delay.minutes}m`);
        return parts.length > 0 ? parts.join(' ') : 'Immediately';
    };

    const handleGenerate = async () => {
        if (!aiPrompt.trim()) return;

        const userMessage: ChatMessage = {
            id: Date.now(),
            type: 'user',
            content: aiPrompt,
            timestamp: new Date(),
        };
        setChatMessages((prev) => [...prev, userMessage]);
        setIsGenerating(true);
        setAiPrompt('');

        setTimeout(() => {
            const aiMessage: ChatMessage = {
                id: Date.now() + 1,
                type: 'ai',
                content: `I've analyzed your sequence request: "${userMessage.content}". I can help you optimize the timing, reorder emails, or adjust the sequence flow. What specific changes would you like me to make?`,
                timestamp: new Date(),
            };
            const statusMessage: ChatMessage = {
                id: Date.now() + 2,
                type: 'status',
                content: 'Sequence analysis complete',
                timestamp: new Date(),
            };
            setChatMessages((prev) => [...prev, aiMessage, statusMessage]);
            setIsGenerating(false);
        }, 2000);
    };

    const handleAddGroup = () => {
        if (!newGroup.title.trim() || newGroup.selectedEmails.length === 0) return;

        const selectedEmailObjects = emailLibrary.filter((email) => newGroup.selectedEmails.includes(email.id));
        const newGroupData: EmailGroup = {
            id: Date.now(),
            title: newGroup.title,
            delay: newGroup.delay,
            emails: selectedEmailObjects,
        };

        setEmailGroups((prev) => [...prev, newGroupData]);
        setNewGroup({ title: '', delay: { days: 1, hours: 0, minutes: 0 }, selectedEmails: [] });
        setIsAddGroupModalOpen(false);
    };

    const handleEditGroup = () => {
        if (!editingGroup || !editingGroup.title.trim()) return;
        setEmailGroups((prev) => prev.map((group) => (group.id === editingGroup.id ? editingGroup : group)));
        setIsEditGroupModalOpen(false);
        setEditingGroup(null);
    }; 

    const handleLaunchCampaign = () => {
        if (!campaignName.trim() || !startingDate.trim() || emailGroups.length === 0) return;

        const campaign: Campaign = {
            name: campaignName,
            groups: emailGroups,
            createdAt: new Date(),
            startingDate: startingDate,
        };

        // Send campaign data to backend
        const campaignData = {
            name: campaign.name,
            starting_date: campaign.startingDate,
            groups: campaign.groups.map((group, index) => ({
                title: group.title,
                delay_days: group.delay.days,
                delay_hours: group.delay.hours,
                delay_minutes: group.delay.minutes,
                order: index + 1,
                emails: group.emails.map((email, emailIndex) => ({
                    email_id: email.id,
                    order: emailIndex + 1,
                })),
            })),
        };

        // Console log comprehensive campaign data
        console.log('LAUNCHING CAMPAIGN:', {
            campaignName: campaign.name,
            createdAt: campaign.createdAt,
            startingDate: campaign.startingDate,
            launchingDate: new Date().toISOString(),
            totalGroups: campaign.groups.length,
            totalEmails: campaign.groups.reduce((total, group) => total + group.emails.length, 0),
            campaignData: campaign,
            backendPayload: campaignData,
            detailedSequence: campaign.groups.map((group, index) => ({
                groupIndex: index + 1,
                groupId: group.id,
                groupTitle: group.title,
                delay: group.delay,
                delayFormatted: formatDelay(group.delay),
                emailCount: group.emails.length,
                emails: group.emails.map((email) => ({
                    emailId: email.id,
                    subject: email.subject,
                    contentPreview: email.email_content.substring(0, 100) + '...',
                })),
            })),
            timelineBreakdown: (() => {
                let cumulativeTime = 0;
                return campaign.groups.map((group, index) => {
                    const groupTime = cumulativeTime;
                    cumulativeTime += group.delay.days * 24 * 60 + group.delay.hours * 60 + group.delay.minutes;
                    return {
                        groupIndex: index + 1,
                        groupTitle: group.title,
                        sendsAt: `${Math.floor(groupTime / (24 * 60))}d ${Math.floor((groupTime % (24 * 60)) / 60)}h ${groupTime % 60}m`,
                        emailIds: group.emails.map((e) => e.id),
                    };
                });
            })(),
        });

        // Send to backend
        router.post(route('user.email.campaign.store'), campaignData, {
            onSuccess: () => {
                // Clear localStorage after successful save
                localStorage.removeItem(STORAGE_KEY);

                setIsLaunchModalOpen(false);
                setCampaignName('');
                setStartingDate('');
                setEmailGroups([]);

                const successMessage: ChatMessage = {
                    id: Date.now(),
                    type: 'status',
                    content: `Campaign "${campaign.name}" launched successfully! Starting on ${new Date(startingDate).toLocaleDateString()}. Check console for full details.`,
                    timestamp: new Date(),
                };
                setChatMessages((prev) => [...prev, successMessage]);
            },
            onError: (errors) => {
                console.error('Campaign launch failed:', errors);
                const errorMessage: ChatMessage = {
                    id: Date.now(),
                    type: 'status',
                    content: `Failed to launch campaign. Please try again.`,
                    timestamp: new Date(),
                };
                setChatMessages((prev) => [...prev, errorMessage]);
            },
        });
    };

    const deleteEmail = (groupId: number, emailId: number) => {
        setEmailGroups(
            (prev) =>
                prev
                    .map((group) => {
                        if (group.id === groupId) {
                            const updatedEmails = group.emails.filter((email) => email.id !== emailId);
                            return updatedEmails.length > 0 ? { ...group, emails: updatedEmails } : null;
                        }
                        return group;
                    })
                    .filter(Boolean) as EmailGroup[],
        );

        if (selectedEmail?.id === emailId) {
            const firstAvailableEmail = emailLibrary[0] || null;
            setSelectedEmail(firstAvailableEmail);
        }
    };

    const deleteGroup = (groupId: number) => {
        setEmailGroups((prev) => prev.filter((group) => group.id !== groupId));
    };

    const moveGroup = (groupId: number, direction: 'up' | 'down') => {
        setEmailGroups((prev) => {
            const groups = [...prev];
            const currentIndex = groups.findIndex((group) => group.id === groupId);
            if (direction === 'up' && currentIndex > 0) {
                [groups[currentIndex], groups[currentIndex - 1]] = [groups[currentIndex - 1], groups[currentIndex]];
            } else if (direction === 'down' && currentIndex < groups.length - 1) {
                [groups[currentIndex], groups[currentIndex + 1]] = [groups[currentIndex + 1], groups[currentIndex]];
            }
            return groups;
        });
    };

    const moveEmailInGroup = (groupId: number, emailId: number, direction: 'up' | 'down') => {
        setEmailGroups((prev) =>
            prev.map((group) => {
                if (group.id === groupId) {
                    const emails = [...group.emails];
                    const currentIndex = emails.findIndex((email) => email.id === emailId);
                    if (direction === 'up' && currentIndex > 0) {
                        [emails[currentIndex], emails[currentIndex - 1]] = [emails[currentIndex - 1], emails[currentIndex]];
                    } else if (direction === 'down' && currentIndex < emails.length - 1) {
                        [emails[currentIndex], emails[currentIndex + 1]] = [emails[currentIndex + 1], emails[currentIndex]];
                    }
                    return { ...group, emails };
                }
                return group;
            }),
        );
    };

    const updateDelay = (groupId: number, newDelay: { days: number; hours: number; minutes: number }) => {
        setEmailGroups((prev) => prev.map((group) => (group.id === groupId ? { ...group, delay: newDelay } : group)));
        setEditingDelay(null);
    };

    const getAccentColor = (groupIndex: number) => {
        const colors = ['border-l-gray-500 dark:border-l-primary/50 bg-gray-50 dark:bg-emerald-900/20'];
        return colors[groupIndex % colors.length];
    };

    const getEmailDotColor = (groupIndex: number) => {
        const colors = [
            'bg-gradient-to-r from-blue-500 to-blue-600',
            'bg-gradient-to-r from-emerald-500 to-emerald-600',
            'bg-gradient-to-r from-purple-500 to-purple-600',
            'bg-gradient-to-r from-orange-500 to-orange-600',
            'bg-gradient-to-r from-pink-500 to-pink-600',
            'bg-gradient-to-r from-indigo-500 to-indigo-600',
            'bg-gradient-to-r from-cyan-500 to-cyan-600',
            'bg-gradient-to-r from-rose-500 to-rose-600',
        ];
        return colors[groupIndex % colors.length];
    };

    const handleEmailSelection = (emailId: number) => {
        setNewGroup((prev) => ({
            ...prev,
            selectedEmails: prev.selectedEmails.includes(emailId)
                ? prev.selectedEmails.filter((id) => id !== emailId)
                : [...prev.selectedEmails, emailId],
        }));
    };

    const openEditGroup = (group: EmailGroup) => {
        setEditingGroup({ ...group });
        setIsEditGroupModalOpen(true);
    };

    const handleAddEmailToGroup = () => {
        if (!selectedGroupId) return;
        if (newEmailToGroup.createNew) {
            if (!newEmailToGroup.newEmail.subject.trim() || !newEmailToGroup.newEmail.content.trim()) return;
            const newEmailData: EmailData = {
                id: Date.now(),
                subject: newEmailToGroup.newEmail.subject,
                email_content: newEmailToGroup.newEmail.content, // Updated field name
            };
            setEmailLibrary((prev) => [...prev, newEmailData]);
            setEmailGroups((prev) =>
                prev.map((group) => (group.id === selectedGroupId ? { ...group, emails: [...group.emails, newEmailData] } : group)),
            );
        } else {
            if (newEmailToGroup.selectedEmails.length === 0) return;
            const selectedEmailObjects = emailLibrary.filter((email) => newEmailToGroup.selectedEmails.includes(email.id));
            setEmailGroups((prev) =>
                prev.map((group) =>
                    group.id === selectedGroupId
                        ? {
                              ...group,
                              emails: [...group.emails, ...selectedEmailObjects.filter((email) => !group.emails.some((e) => e.id === email.id))],
                          }
                        : group,
                ),
            );
        }
        setNewEmailToGroup({ selectedEmails: [], createNew: false, newEmail: { subject: '', content: '' } });
        setIsAddEmailToGroupModalOpen(false);
        setSelectedGroupId(null);
    };

    const handleEmailSelectionForGroup = (emailId: number) => {
        setNewEmailToGroup((prev) => ({
            ...prev,
            selectedEmails: prev.selectedEmails.includes(emailId)
                ? prev.selectedEmails.filter((id) => id !== emailId)
                : [...prev.selectedEmails, emailId],
        }));
    };

    // Clear saved progress function
    const clearSavedProgress = () => {
        localStorage.removeItem(STORAGE_KEY);
        setEmailGroups([]);
        setCampaignName('');
        setStartingDate('');
        setChatMessages([]);
    };

    return (
        <AppLayout>
            <div className="min-h-screen bg-background p-4 md:p-6 lg:p-8">
                <div className="mx-auto max-w-7xl">
                    {/* Header */}
                    <div className="mb-8">
                        <div className="flex items-center justify-between">
                            <div>
                                <h1 className="mb-3 text-3xl font-bold text-primary lg:text-4xl">Email Sequence Generator</h1>
                                <p className="text-lg text-secondary">Design and manage your email marketing campaigns</p>
                            </div>
                            {emailGroups.length > 0 && (
                                <Button variant="outline" size="sm" onClick={clearSavedProgress} className="rounded-2xl">
                                    Clear Progress
                                </Button>
                            )}
                        </div>
                    </div>
                    <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
                        {/* Email Sequence Canvas */}
                        <div className="lg:col-span-3">
                            <div className="rounded-3xl border border-accent bg-white/80 shadow-2xl shadow-blue-500/10 backdrop-blur-xl dark:bg-primary-foreground dark:shadow-purple-500/10">
                                <div className="border-b border-accent p-4 md:p-6">
                                    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                                        <div>
                                            <h2 className="text-lg font-semibold text-primary md:text-xl">Sequence Canvas</h2>
                                            <p className="mt-1 text-xs text-secondary">Plan and organize your email flow</p>
                                            {emailGroups.length > 0 && (
                                                <p className="mt-1 text-xs text-green-600">
                                                    {emailGroups.length} groups •{' '}
                                                    {emailGroups.reduce((total, group) => total + group.emails.length, 0)} emails
                                                </p>
                                            )}
                                        </div>
                                        <Button
                                            size="sm"
                                            className="w-full sm:w-auto md:px-6"
                                            disabled={emailGroups.length === 0}
                                            onClick={() => setIsLaunchModalOpen(true)}
                                        >
                                            Launch Campaign
                                        </Button>
                                    </div>
                                </div>
                                <div className="p-3 md:p-6">
                                    <ScrollArea className="h-[500px] pr-2 md:h-[600px] md:pr-4 lg:h-[800px]">
                                        <div className="space-y-4">
                                            {emailGroups.length === 0 ? (
                                                <div className="flex h-48 items-center justify-center md:h-64">
                                                    <div className="px-4 text-center">
                                                        <h3 className="mb-2 text-base font-medium text-primary md:text-lg">
                                                            Start Your First Sequence
                                                        </h3>
                                                        <p className="mb-6 text-xs text-secondary md:text-sm">
                                                            Create your first email group to begin building your campaign
                                                        </p>
                                                        <Button
                                                            onClick={() => setIsAddGroupModalOpen(true)}
                                                            className="from-sand-200 via-sand-100 text-sand-900 hover:from-sand-300 hover:via-sand-200 w-full rounded-2xl border-0 bg-gradient-to-r to-amber-100 px-4 shadow-lg shadow-yellow-200/25 hover:to-amber-200 sm:w-auto md:px-6"
                                                            style={{
                                                                background: 'linear-gradient(90deg, #f5e9da 0%, #f9f6f1 50%, #fdf6e3 100%)',
                                                                color: '#7c6f57',
                                                            }}
                                                        >
                                                            <Plus className="mr-2 h-4 w-4" />
                                                            Create Group
                                                        </Button>
                                                    </div>
                                                </div>
                                            ) : (
                                                emailGroups.map((group, groupIndex) => (
                                                    <div key={group.id} className="space-y-3">
                                                        {/* Email Group Card */}
                                                        <div
                                                            className={`border-l-4 ${getAccentColor(groupIndex)} rounded-2xl border border-white/30 border-t-secondary border-r-secondary border-b-secondary shadow-lg backdrop-blur-sm transition-all duration-300 dark:border-gray-700/50`}
                                                        >
                                                            <div className="p-3 md:p-4">
                                                                <div className="mb-3 flex items-center justify-between">
                                                                    <div className="flex min-w-0 flex-1 items-center gap-2 md:gap-3">
                                                                        <div className="flex items-center gap-1 md:gap-2">
                                                                            <h3 className="truncate text-sm font-semibold text-gray-900 md:text-base dark:text-gray-100">
                                                                                {group.title}
                                                                            </h3>
                                                                        </div>
                                                                    </div>
                                                                    <div className="flex flex-shrink-0 items-center gap-0.5 md:gap-1">
                                                                        {groupIndex > 0 && (
                                                                            <Button
                                                                                variant="ghost"
                                                                                size="sm"
                                                                                className="h-7 w-7 rounded-xl p-0 hover:bg-white/50 md:h-8 md:w-8 dark:hover:bg-gray-700/50"
                                                                                onClick={() => moveGroup(group.id, 'up')}
                                                                            >
                                                                                <ChevronUp className="h-3 w-3 md:h-4 md:w-4" />
                                                                            </Button>
                                                                        )}
                                                                        {groupIndex < emailGroups.length - 1 && (
                                                                            <Button
                                                                                variant="ghost"
                                                                                size="sm"
                                                                                className="h-7 w-7 rounded-xl p-0 hover:bg-white/50 md:h-8 md:w-8 dark:hover:bg-gray-700/50"
                                                                                onClick={() => moveGroup(group.id, 'down')}
                                                                            >
                                                                                <ChevronDown className="h-3 w-3 md:h-4 md:w-4" />
                                                                            </Button>
                                                                        )}
                                                                        <Button
                                                                            variant="ghost"
                                                                            size="sm"
                                                                            className="h-7 w-7 rounded-xl p-0 hover:bg-white/50 md:h-8 md:w-8 dark:hover:bg-gray-700/50"
                                                                            onClick={() => openEditGroup(group)}
                                                                        >
                                                                            <Edit className="h-3 w-3 md:h-4 md:w-4" />
                                                                        </Button>
                                                                        <Button
                                                                            variant="ghost"
                                                                            size="sm"
                                                                            className="h-7 w-7 rounded-xl p-0 text-red-500 hover:bg-red-50 hover:text-red-700 md:h-8 md:w-8 dark:hover:bg-red-900/20"
                                                                            onClick={() => deleteGroup(group.id)}
                                                                        >
                                                                            <Trash2 className="h-3 w-3 md:h-4 md:w-4" />
                                                                        </Button>
                                                                    </div>
                                                                </div>
                                                                <div className="space-y-2">
                                                                    {group.emails.map((email, emailIndex) => (
                                                                        <div
                                                                            key={email.id}
                                                                            className="group flex items-center gap-2 rounded-xl border border-white/40 bg-white/60 p-2 shadow-sm backdrop-blur-sm transition-all duration-200 hover:bg-white/80 md:gap-3 md:p-3 dark:border-gray-600/50 dark:bg-gray-700/60 dark:hover:bg-gray-700/80"
                                                                        >
                                                                            <div
                                                                                className={`h-2 w-2 ${getEmailDotColor(groupIndex)} flex-shrink-0 rounded-full shadow-sm`}
                                                                            ></div>
                                                                            <div className="min-w-0 flex-1">
                                                                                <p className="truncate text-xs font-medium text-gray-900 md:text-sm dark:text-gray-100">
                                                                                    <span className="block md:hidden">
                                                                                        {email.subject.substring(0, 15)}...
                                                                                    </span>
                                                                                    <span className="hidden md:block lg:hidden">
                                                                                        {email.subject.substring(0, 30)}...
                                                                                    </span>
                                                                                    <span className="hidden lg:block">
                                                                                        {email.subject.length > 50
                                                                                            ? email.subject.substring(0, 50) + '...'
                                                                                            : email.subject}
                                                                                    </span>
                                                                                </p>
                                                                                <p className="truncate text-xs text-gray-600 dark:text-gray-400">
                                                                                    <span className="block md:hidden">
                                                                                        {email.email_content.substring(0, 15)}...
                                                                                    </span>
                                                                                    <span className="hidden md:block lg:hidden">
                                                                                        {email.email_content.substring(0, 40)}...
                                                                                    </span>
                                                                                    <span className="hidden lg:block">
                                                                                        {email.email_content.length > 80
                                                                                            ? email.email_content.substring(0, 80) + '...'
                                                                                            : email.email_content}
                                                                                    </span>
                                                                                </p>
                                                                            </div>
                                                                            <div className="flex flex-shrink-0 items-center gap-0.5 opacity-100 transition-opacity md:gap-1 md:opacity-0 md:group-hover:opacity-100">
                                                                                <Button
                                                                                    variant="ghost"
                                                                                    size="sm"
                                                                                    className="h-6 w-6 rounded-lg p-0 md:h-7 md:w-7"
                                                                                    onClick={() => {
                                                                                        setSelectedEmail(email);
                                                                                        setIsPreviewModalOpen(true);
                                                                                    }}
                                                                                >
                                                                                    <Eye className="h-3 w-3" />
                                                                                </Button>
                                                                                {emailIndex > 0 && (
                                                                                    <Button
                                                                                        variant="ghost"
                                                                                        size="sm"
                                                                                        className="h-6 w-6 rounded-lg p-0 md:h-7 md:w-7"
                                                                                        onClick={() => moveEmailInGroup(group.id, email.id, 'up')}
                                                                                    >
                                                                                        <ChevronUp className="h-3 w-3" />
                                                                                    </Button>
                                                                                )}
                                                                                {emailIndex < group.emails.length - 1 && (
                                                                                    <Button
                                                                                        variant="ghost"
                                                                                        size="sm"
                                                                                        className="h-6 w-6 rounded-lg p-0 md:h-7 md:w-7"
                                                                                        onClick={() => moveEmailInGroup(group.id, email.id, 'down')}
                                                                                    >
                                                                                        <ChevronDown className="h-3 w-3" />
                                                                                    </Button>
                                                                                )}
                                                                                <Button
                                                                                    variant="ghost"
                                                                                    size="sm"
                                                                                    className="h-6 w-6 rounded-lg p-0 text-red-500 hover:text-red-700 md:h-7 md:w-7"
                                                                                    onClick={() => deleteEmail(group.id, email.id)}
                                                                                >
                                                                                    <Trash2 className="h-3 w-3" />
                                                                                </Button>
                                                                            </div>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    className="mt-2 h-7 w-full rounded-xl border border-dashed border-gray-300 text-xs text-gray-600 transition-all duration-200 hover:border-gray-400 hover:bg-white/50 md:h-8 dark:border-gray-600 dark:text-gray-400 dark:hover:border-gray-500 dark:hover:bg-gray-700/50"
                                                                    onClick={() => {
                                                                        setSelectedGroupId(group.id);
                                                                        setIsAddEmailToGroupModalOpen(true);
                                                                    }}
                                                                >
                                                                    <Plus className="mr-1 h-3 w-3" />
                                                                    Add Email
                                                                </Button>
                                                            </div>
                                                        </div>
                                                        {/* Time Delay Between Groups */}
                                                        {groupIndex < emailGroups.length - 1 && (
                                                            <div className="flex items-center justify-center py-2">
                                                                <div className="flex items-center gap-2 rounded-2xl border border-accent bg-primary-foreground px-3 py-2 backdrop-blur-sm md:gap-3 md:px-4 dark:border-gray-700/50">
                                                                    <ArrowDown className="h-3 w-3 text-secondary md:h-4 md:w-4" />
                                                                    <Clock className="h-3 w-3 text-primary md:h-4 md:w-4" />
                                                                    {editingDelay === group.id ? (
                                                                        <div className="flex items-center gap-1 md:gap-2">
                                                                            <Select
                                                                                value={group.delay.days.toString()}
                                                                                onValueChange={(value) =>
                                                                                    updateDelay(group.id, {
                                                                                        ...group.delay,
                                                                                        days: Number.parseInt(value),
                                                                                    })
                                                                                }
                                                                            >
                                                                                <SelectTrigger className="h-6 w-12 rounded-lg text-xs md:h-7 md:w-16">
                                                                                    <SelectValue />
                                                                                </SelectTrigger>
                                                                                <SelectContent>
                                                                                    {Array.from({ length: 31 }, (_, i) => (
                                                                                        <SelectItem key={i} value={i.toString()}>
                                                                                            {i}d
                                                                                        </SelectItem>
                                                                                    ))}
                                                                                </SelectContent>
                                                                            </Select>
                                                                            <Select
                                                                                value={group.delay.hours.toString()}
                                                                                onValueChange={(value) =>
                                                                                    updateDelay(group.id, {
                                                                                        ...group.delay,
                                                                                        hours: Number.parseInt(value),
                                                                                    })
                                                                                }
                                                                            >
                                                                                <SelectTrigger className="h-6 w-12 rounded-lg text-xs md:h-7 md:w-16">
                                                                                    <SelectValue />
                                                                                </SelectTrigger>
                                                                                <SelectContent>
                                                                                    {Array.from({ length: 24 }, (_, i) => (
                                                                                        <SelectItem key={i} value={i.toString()}>
                                                                                            {i}h
                                                                                        </SelectItem>
                                                                                    ))}
                                                                                </SelectContent>
                                                                            </Select>
                                                                            <Select
                                                                                value={group.delay.minutes.toString()}
                                                                                onValueChange={(value) =>
                                                                                    updateDelay(group.id, {
                                                                                        ...group.delay,
                                                                                        minutes: Number.parseInt(value),
                                                                                    })
                                                                                }
                                                                            >
                                                                                <SelectTrigger className="h-6 w-12 rounded-lg text-xs md:h-7 md:w-16">
                                                                                    <SelectValue />
                                                                                </SelectTrigger>
                                                                                <SelectContent>
                                                                                    {Array.from({ length: 60 }, (_, i) => (
                                                                                        <SelectItem key={i} value={i.toString()}>
                                                                                            {i}m
                                                                                        </SelectItem>
                                                                                    ))}
                                                                                </SelectContent>
                                                                            </Select>
                                                                        </div>
                                                                    ) : (
                                                                        <span
                                                                            className="flex cursor-pointer items-center gap-1 text-xs font-medium text-gray-600 transition-colors hover:text-gray-900 md:gap-2 md:text-sm dark:text-gray-400 dark:hover:text-gray-200"
                                                                            onClick={() => setEditingDelay(group.id)}
                                                                        >
                                                                            {formatDelay(group.delay)}
                                                                            <Edit3 className="h-3 w-3" />
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                ))
                                            )}
                                            {/* Add New Group Button */}
                                            {emailGroups.length > 0 && (
                                                <div
                                                    className="cursor-pointer rounded-2xl border-2 border-dashed border-accent bg-gradient-to-r backdrop-blur-sm transition-all duration-200 hover:border-accent-foreground"
                                                    onClick={() => setIsAddGroupModalOpen(true)}
                                                >
                                                    <div className="p-4 md:p-6">
                                                        <div className="flex items-center justify-center gap-2 text-secondary md:gap-3">
                                                            <Plus className="h-4 w-4 md:h-5 md:w-5" />
                                                            <span className="text-sm font-medium md:text-base">Add Email Group</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                            {/* Generating Animation */}
                                            {isGenerating && (
                                                <div className="animate-pulse rounded-2xl border border-blue-300 bg-gradient-to-r from-blue-100/80 via-indigo-100/80 to-purple-100/80 shadow-lg backdrop-blur-sm dark:border-blue-600 dark:from-blue-900/30 dark:via-indigo-900/30 dark:to-purple-900/30">
                                                    <div className="p-6">
                                                        <div className="flex items-center justify-center gap-3 text-blue-600 dark:text-blue-400">
                                                            <Loader2 className="h-5 w-5 animate-spin" />
                                                            <span className="font-medium">AI is analyzing your sequence...</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </ScrollArea>
                                </div>
                            </div>
                        </div>
                        {/* AI Assistant Sidebar */}
                        <div className="space-y-6">
                            {/* Sequence AI */}
                            <div className="rounded-3xl border border-accent bg-primary-foreground shadow-2xl backdrop-blur-xl">
                                <div className="border-b border-accent p-6">
                                    <h3 className="text-lg font-semibold text-primary">Sequence AI</h3>
                                    <p className="mt-1 text-sm text-secondary">AI-powered optimization</p>
                                </div>
                                {/* Chat Messages */}
                                <div className="h-64 p-4">
                                    <ScrollArea className="h-full">
                                        <div className="space-y-3">
                                            {chatMessages.length === 0 ? (
                                                <div className="py-8 text-center">
                                                    <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl">
                                                        <AppLogo />
                                                    </div>
                                                    <p className="text-sm text-secondary">Ask me to optimize your sequence</p>
                                                </div>
                                            ) : (
                                                chatMessages.map((message) => (
                                                    <div
                                                        key={message.id}
                                                        className={`rounded-2xl p-3 text-sm backdrop-blur-sm ${
                                                            message.type === 'user'
                                                                ? 'ml-4 border border-accent bg-accent text-primary shadow-sm'
                                                                : message.type === 'status'
                                                                  ? 'mr-4 mb-2 border border-accent text-emerald-800 shadow-sm dark:text-emerald-400'
                                                                  : 'mr-4 border border-accent bg-white/80 text-primary shadow-sm dark:bg-primary-foreground'
                                                        }`}
                                                    >
                                                        {message.type === 'status' && <TrainTrack className="mr-2 inline h-4 w-4" />}
                                                        {message.content}
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </ScrollArea>
                                </div>
                                {/* AI Chat Input */}
                                <div className="border-t border-accent p-4">
                                    <div className="flex items-center gap-2">
                                        <Input
                                            value={aiPrompt}
                                            onChange={(e) => setAiPrompt(e.target.value)}
                                            placeholder="Optimize my sequence..."
                                            className="flex-1 rounded-2xl border-gray-300/50 bg-white/50 backdrop-blur-sm dark:border-gray-600/50 dark:bg-gray-700/50"
                                            disabled={isGenerating}
                                            onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
                                        />
                                        <Button
                                            size="sm"
                                            className="h-10 w-10 rounded-2xl p-0"
                                            onClick={handleGenerate}
                                            disabled={isGenerating || !aiPrompt.trim()}
                                        >
                                            {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowUp className="h-4 w-4" />}
                                        </Button>
                                    </div>
                                </div>
                            </div>
                            {/* Quick Actions */}
                            <div className="rounded-3xl bg-background">
                                <div className="p-6">
                                    <h3 className="mb-4 text-lg font-semibold text-primary">Quick Actions</h3>
                                    <div className="space-y-3">
                                        <Button onClick={() => setIsAddGroupModalOpen(true)} className="w-full justify-start rounded-2xl border-0">
                                            <Plus className="mr-2 h-4 w-4" />
                                            Add Email Group
                                        </Button>
                                        <Button
                                            onClick={() => setIsAddEmailModalOpen(true)}
                                            className="w-full justify-start rounded-2xl border-0"
                                            variant="outline"
                                        >
                                            <Mail className="mr-2 h-4 w-4" />
                                            Create New Email
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                {/* All the modals remain the same but with updated field references */}
                {/* Launch Campaign Modal */}
                <Dialog open={isLaunchModalOpen} onOpenChange={setIsLaunchModalOpen}>
                    <DialogContent className="max-w-md rounded-3xl border-accent bg-primary-foreground">
                        <DialogHeader>
                            <DialogTitle className="text-center dark:text-gray-100">Launch Campaign</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-6">
                            <div className="text-center">
                                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30">
                                    <Rocket className="h-8 w-8 text-green-600 dark:text-green-400" />
                                </div>
                                <p className="text-sm text-secondary">Ready to launch your email sequence? Set up your campaign details below.</p>
                            </div>
                            <div>
                                <Label htmlFor="campaignName" className="">
                                    Campaign Name
                                </Label>
                                <Input
                                    id="campaignName"
                                    value={campaignName}
                                    onChange={(e) => setCampaignName(e.target.value)}
                                    placeholder="e.g., Welcome Series 2024, Product Launch..."
                                    className="mt-2 rounded-2xl dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                                />
                            </div>
                            <div>
                                <Label htmlFor="startingDate" className="dark:text-gray-200">
                                    Starting Date
                                </Label>
                                <div className="relative mt-2">
                                    <Input
                                        id="startingDate"
                                        type="date"
                                        value={startingDate}
                                        onChange={(e) => setStartingDate(e.target.value)}
                                        className="rounded-2xl"
                                        min={new Date().toISOString().split('T')[0]}
                                    />
                                </div>
                            </div>
                            <div className="rounded-2xl border border-blue-200/50 bg-gradient-to-r from-blue-50 to-purple-50 p-4 dark:border-blue-700/50 dark:from-blue-900/20 dark:to-purple-900/20">
                                <h4 className="mb-2 font-medium text-gray-900 dark:text-gray-100">Campaign Summary</h4>
                                <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                                    <p>{emailGroups.reduce((total, group) => total + group.emails.length, 0)} total emails</p>
                                    <p>{emailGroups.length} email groups</p>
                                    <p>{emailGroups.length > 0 ? formatDelay(emailGroups[emailGroups.length - 1].delay) : '0'} total duration</p>
                                </div>
                            </div>
                            <div className="flex justify-end gap-3">
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        setIsLaunchModalOpen(false);
                                        setCampaignName('');
                                        setStartingDate('');
                                    }}
                                    className="rounded-2xl dark:border-gray-600 dark:text-gray-300"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    onClick={handleLaunchCampaign}
                                    disabled={!campaignName.trim() || !startingDate.trim() || emailGroups.length === 0}
                                    className="from-sand-200 via-sand-100 text-sand-900 hover:from-sand-300 hover:via-sand-200 w-full rounded-2xl border-0 bg-gradient-to-r to-amber-100 px-4 shadow-lg shadow-yellow-200/25 hover:to-amber-200 sm:w-auto md:px-6"
                                    style={{
                                        background: 'linear-gradient(90deg, #f5e9da 0%, #f9f6f1 50%, #fdf6e3 100%)',
                                        color: '#7c6f57',
                                    }}
                                >
                                    Launch Now
                                </Button>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>

                {/* Add Group Modal */}
                <Dialog open={isAddGroupModalOpen} onOpenChange={setIsAddGroupModalOpen}>
                    <DialogContent className="max-w-2xl rounded-3xl dark:border-accent dark:bg-primary-foreground">
                        <DialogHeader>
                            <DialogTitle className="dark:text-gray-100">Add New Email Group</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-6">
                            <div>
                                <Label htmlFor="groupTitle" className="dark:text-gray-200">
                                    Group Title
                                </Label>
                                <Input
                                    id="groupTitle"
                                    value={newGroup.title}
                                    onChange={(e) => setNewGroup((prev) => ({ ...prev, title: e.target.value }))}
                                    placeholder="e.g., Welcome Series, Onboarding, Follow-up..."
                                    className="rounded-2xl bg-accent"
                                />
                            </div>
                            <div>
                                <Label className="">Select Emails for this Group</Label>
                                <div className="mt-2 max-h-64 space-y-2 overflow-y-auto rounded-2xl border border-accent">
                                    {emailLibrary.map((email) => (
                                        <div key={email.id} className="flex items-start space-x-3 rounded-xl p-2 hover:bg-background/50">
                                            <Checkbox
                                                id={`email-${email.id}`}
                                                checked={newGroup.selectedEmails.includes(email.id)}
                                                onCheckedChange={() => handleEmailSelection(email.id)}
                                                className="mt-1"
                                            />
                                            <div className="min-w-0 flex-1">
                                                <label
                                                    htmlFor={`email-${email.id}`}
                                                    className="block cursor-pointer text-xs font-medium text-primary sm:text-sm md:text-base"
                                                >
                                                    {email.subject.length > 40 ? email.subject.slice(0, 37) + '...' : email.subject}
                                                </label>
                                                <p className="truncate text-[10px] text-secondary sm:text-xs md:text-sm">
                                                    {email.email_content.length > 20 ? email.email_content.slice(0, 27) + '...' : email.email_content}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                {emailLibrary.length === 0 && (
                                    <p className="mt-2 text-sm text-primary">No emails available. Create some emails first.</p>
                                )}
                            </div>
                            <div>
                                <Label className="">Send After Previous Group</Label>
                                <div className="mt-2 flex gap-2">
                                    <Select
                                        value={newGroup.delay.days.toString()}
                                        onValueChange={(value) =>
                                            setNewGroup((prev) => ({ ...prev, delay: { ...prev.delay, days: Number.parseInt(value) } }))
                                        }
                                    >
                                        <SelectTrigger className="w-24 rounded-2xl bg-accent">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {Array.from({ length: 31 }, (_, i) => (
                                                <SelectItem key={i} value={i.toString()}>
                                                    {i} days
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <Select
                                        value={newGroup.delay.hours.toString()}
                                        onValueChange={(value) =>
                                            setNewGroup((prev) => ({ ...prev, delay: { ...prev.delay, hours: Number.parseInt(value) } }))
                                        }
                                    >
                                        <SelectTrigger className="w-24 rounded-2xl border-accent bg-accent">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {Array.from({ length: 24 }, (_, i) => (
                                                <SelectItem key={i} value={i.toString()}>
                                                    {i} hrs
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <Select
                                        value={newGroup.delay.minutes.toString()}
                                        onValueChange={(value) =>
                                            setNewGroup((prev) => ({ ...prev, delay: { ...prev.delay, minutes: Number.parseInt(value) } }))
                                        }
                                    >
                                        <SelectTrigger className="w-24 rounded-2xl border-accent bg-accent">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {Array.from({ length: 60 }, (_, i) => (
                                                <SelectItem key={i} value={i.toString()}>
                                                    {i} min
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <div className="flex justify-end gap-3">
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        setIsAddGroupModalOpen(false);
                                        setNewGroup({ title: '', delay: { days: 1, hours: 0, minutes: 0 }, selectedEmails: [] });
                                    }}
                                    className="rounded-2xl border-accent bg-accent"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    onClick={handleAddGroup}
                                    disabled={!newGroup.title.trim() || newGroup.selectedEmails.length === 0}
                                    className="rounded-2xl"
                                >
                                    Add Group
                                </Button>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>

                {/* Edit Group Modal */}
                <Dialog open={isEditGroupModalOpen} onOpenChange={setIsEditGroupModalOpen}>
                    <DialogContent className="max-w-2xl rounded-3xl border-accent">
                        <DialogHeader>
                            <DialogTitle className="">Edit Email Group</DialogTitle>
                        </DialogHeader>
                        {editingGroup && (
                            <div className="space-y-6">
                                <div>
                                    <Label htmlFor="editGroupTitle" className="">
                                        Group Title
                                    </Label>
                                    <Input
                                        id="editGroupTitle"
                                        value={editingGroup.title}
                                        onChange={(e) => setEditingGroup((prev) => (prev ? { ...prev, title: e.target.value } : null))}
                                        placeholder="Enter group title..."
                                        className="rounded-2xl bg-accent"
                                    />
                                </div>
                                <div>
                                    <Label className="">Delay Settings</Label>
                                    <div className="mt-2 flex gap-2">
                                        <Select
                                            value={editingGroup.delay.days.toString()}
                                            onValueChange={(value) =>
                                                setEditingGroup((prev) =>
                                                    prev ? { ...prev, delay: { ...prev.delay, days: Number.parseInt(value) } } : null,
                                                )
                                            }
                                        >
                                            <SelectTrigger className="w-24 rounded-2xl border-accent">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {Array.from({ length: 31 }, (_, i) => (
                                                    <SelectItem key={i} value={i.toString()}>
                                                        {i} days
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <Select
                                            value={editingGroup.delay.hours.toString()}
                                            onValueChange={(value) =>
                                                setEditingGroup((prev) =>
                                                    prev ? { ...prev, delay: { ...prev.delay, hours: Number.parseInt(value) } } : null,
                                                )
                                            }
                                        >
                                            <SelectTrigger className="w-24 rounded-2xl border-accent">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {Array.from({ length: 24 }, (_, i) => (
                                                    <SelectItem key={i} value={i.toString()}>
                                                        {i} hrs
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <Select
                                            value={editingGroup.delay.minutes.toString()}
                                            onValueChange={(value) =>
                                                setEditingGroup((prev) =>
                                                    prev ? { ...prev, delay: { ...prev.delay, minutes: Number.parseInt(value) } } : null,
                                                )
                                            }
                                        >
                                            <SelectTrigger className="w-24 rounded-2xl border-accent">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {Array.from({ length: 60 }, (_, i) => (
                                                    <SelectItem key={i} value={i.toString()}>
                                                        {i} min
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                                <div className="flex justify-end gap-3">
                                    <Button
                                        variant="outline"
                                        onClick={() => {
                                            setIsEditGroupModalOpen(false);
                                            setEditingGroup(null);
                                        }}
                                        className="rounded-2xl"
                                    >
                                        Cancel
                                    </Button>
                                    <Button onClick={handleEditGroup} disabled={!editingGroup.title.trim()} className="rounded-2xl">
                                        Save Changes
                                    </Button>
                                </div>
                            </div>
                        )}
                    </DialogContent>
                </Dialog>

                {/* Email Preview Modal */}
                <Dialog open={isPreviewModalOpen} onOpenChange={setIsPreviewModalOpen}>
                    <DialogContent className="max-h-[90vh] max-w-3xl rounded-3xl dark:bg-primary-foreground">
                        <DialogHeader>
                            <DialogTitle className="dark:text-gray-100">Email Preview</DialogTitle>
                        </DialogHeader>
                        <ScrollArea className="max-h-[70vh]">
                            <div className="space-y-6 p-1">
                                <div>
                                    <label className="mb-3 block text-sm font-medium text-primary">Subject Line</label>
                                    <div className="rounded-2xl border border-accent bg-accent p-4">
                                        <p className="font-medium text-primary">{selectedEmail?.subject}</p>
                                    </div>
                                </div>
                                <div>
                                    <label className="mb-3 block text-sm font-medium text-primary">Email Content</label>
                                    <div className="min-h-[200px] rounded-2xl border border-accent bg-accent p-4">
                                        <p className="leading-relaxed whitespace-pre-wrap text-primary">{selectedEmail?.email_content}</p>
                                    </div>
                                </div>
                                <div>
                                    <label className="mb-3 block text-sm font-medium text-secondary">Attachments</label>
                                    <div className="rounded-2xl border border-accent bg-accent p-4">
                                        <div className="flex items-center gap-2 text-primary">
                                            <Paperclip className="h-4 w-4" />
                                            <span className="text-sm">No attachments</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </ScrollArea>
                    </DialogContent>
                </Dialog>

                {/* Add Email to Group Modal */}
                <Dialog open={isAddEmailToGroupModalOpen} onOpenChange={setIsAddEmailToGroupModalOpen}>
                    <DialogContent className="max-w-2xl rounded-3xl border-accent bg-primary-foreground">
                        <DialogHeader>
                            <DialogTitle className="">Add Email to Group</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-6">
                            <div className="flex items-center space-x-4">
                                <Button
                                    variant={!newEmailToGroup.createNew ? 'default' : 'outline'}
                                    onClick={() => setNewEmailToGroup((prev) => ({ ...prev, createNew: false }))}
                                    className="rounded-2xl"
                                >
                                    Select Existing
                                </Button>
                                <Button
                                    variant={newEmailToGroup.createNew ? 'default' : 'outline'}
                                    onClick={() => setNewEmailToGroup((prev) => ({ ...prev, createNew: true }))}
                                    className="rounded-2xl"
                                >
                                    Create New
                                </Button>
                            </div>
                            {!newEmailToGroup.createNew ? (
                                <div>
                                    <Label className="">Select Emails to Add</Label>
                                    <div className="mt-2 max-h-64 space-y-2 overflow-y-auto rounded-2xl border-accent p-3">
                                        {emailLibrary
                                            .filter((email) => {
                                                const currentGroup = emailGroups.find((g) => g.id === selectedGroupId);
                                                return !currentGroup?.emails.some((e) => e.id === email.id);
                                            })
                                            .map((email) => (
                                                <div key={email.id} className="flex items-start space-x-3 rounded-xl p-2 hover:bg-background/50">
                                                    <Checkbox
                                                        id={`group-email-${email.id}`}
                                                        checked={newEmailToGroup.selectedEmails.includes(email.id)}
                                                        onCheckedChange={() => handleEmailSelectionForGroup(email.id)}
                                                        className="mt-1"
                                                    />
                                                    <div className="min-w-0 flex-1">
                                                        <label
                                                            htmlFor={`group-email-${email.id}`}
                                                            className="block cursor-pointer text-xs font-medium text-primary sm:text-sm md:text-base"
                                                        >
                                                            {email.subject.length > 40 ? email.subject.slice(0, 37) + '...' : email.subject}
                                                        </label>
                                                        <p className="truncate text-[10px] text-secondary sm:text-xs md:text-sm">
                                                            {email.email_content.length > 20
                                                                ? email.email_content.slice(0, 27) + '...'
                                                                : email.email_content}
                                                        </p>
                                                    </div>
                                                </div>
                                            ))}
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div className="rounded-2xl border border-accent bg-accent p-4 shadow">
                                        <div className="mb-2 text-base font-semibold text-primary">New Email ?</div>
                                        <div className="text-sm text-secondary">To use email you have to generate and save your email first .</div>
                                        <Button
                                            variant="outline"
                                            className="mt-2 rounded-2xl bg-transparent"
                                            onClick={() => {
                                                router.get('/email/generate');
                                            }}
                                        >
                                            Go to Email Library Page
                                        </Button>
                                    </div>
                                </div>
                            )}
                            <div className="flex justify-end gap-3">
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        setIsAddEmailToGroupModalOpen(false);
                                        setNewEmailToGroup({ selectedEmails: [], createNew: false, newEmail: { subject: '', content: '' } });
                                        setSelectedGroupId(null);
                                    }}
                                    className="rounded-2xl"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    onClick={handleAddEmailToGroup}
                                    disabled={
                                        newEmailToGroup.createNew
                                            ? !newEmailToGroup.newEmail.subject.trim() || !newEmailToGroup.newEmail.content.trim()
                                            : newEmailToGroup.selectedEmails.length === 0
                                    }
                                    className="rounded-2xl"
                                >
                                    Add Email{newEmailToGroup.selectedEmails.length > 1 ? 's' : ''}
                                </Button>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>
        </AppLayout>
    );
}
