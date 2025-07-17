'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import AppLayout from '@/layouts/app-layout';
import { router } from '@inertiajs/react';
import { Bell, Check, Download, ExternalLink, Eye, Mail, Shield, Users } from 'lucide-react';
import { useState } from 'react';

interface Notification {
    id: string;
    title: string;
    description?: string;
    timestamp: string;
    isRead: boolean;
    type: 'email' | 'security' | 'team' | 'system';
    actionLabel?: string;
    actionUrl?: string;
}

interface NotificationsPageProps {
    notifications: Notification[];
}

const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
        case 'email':
            return <Mail className="h-5 w-5" />;
        case 'security':
            return <Shield className="h-5 w-5" />;
        case 'team':
            return <Users className="h-5 w-5" />;
        case 'system':
            return <Bell className="h-5 w-5" />;
        default:
            return <Bell className="h-5 w-5" />;
    }
};

const getNotificationIconColor = (type: Notification['type']) => {
    switch (type) {
        case 'email':
            return 'text-blue-500';
        case 'security':
            return 'text-red-500';
        case 'team':
            return 'text-green-500';
        case 'system':
            return 'text-gray-500';
        default:
            return 'text-gray-500';
    }
};

const getActionIcon = (actionLabel?: string) => {
    if (!actionLabel) return <Eye className="h-4 w-4" />;

    if (actionLabel.toLowerCase().includes('download')) {
        return <Download className="h-4 w-4" />;
    }
    if (actionLabel.toLowerCase().includes('view') || actionLabel.toLowerCase().includes('review')) {
        return <Eye className="h-4 w-4" />;
    }
    return <ExternalLink className="h-4 w-4" />;
};

export default function NotificationsPage({ notifications: initialNotifications }: NotificationsPageProps) {
    const [notificationsList, setNotificationsList] = useState<Notification[]>(initialNotifications);
    const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const unreadCount = notificationsList.filter((n) => !n.isRead).length;

    const markAllAsRead = () => {
        router.post(
            '/notifications/mark-all-read',
            {},
            {
                onSuccess: () => {
                    setNotificationsList((prev) =>
                        prev.map((notification) => ({
                            ...notification,
                            isRead: true,
                        })),
                    );
                },
            },
        );
    };

    const markAsRead = (id: string) => {
        router.post(
            `/notifications/${id}/mark-read`,
            {},
            {
                onSuccess: () => {
                    setNotificationsList((prev) =>
                        prev.map((notification) => (notification.id === id ? { ...notification, isRead: true } : notification)),
                    );
                },
            },
        );
    };

    const handleNotificationClick = (notification: Notification) => {
        setSelectedNotification(notification);
        setIsModalOpen(true);

        // Mark as read when opened
        if (!notification.isRead) {
            markAsRead(notification.id);
        }
    };

    const handleAction = (notification: Notification) => {
        if (notification.actionUrl) {
            router.visit(notification.actionUrl);
        }
        setIsModalOpen(false);
    };

    const handleMarkAsUnread = (notification: Notification) => {
        router.post(
            `/notifications/${notification.id}/mark-unread`,
            {},
            {
                onSuccess: () => {
                    setNotificationsList((prev) => prev.map((n) => (n.id === notification.id ? { ...n, isRead: false } : n)));
                },
            },
        );
        setIsModalOpen(false);
    };

    return (
        <AppLayout>
            <div className="container mx-auto max-w-4xl px-4 py-8">
                {/* Header */}
                <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3">
                        <div>
                            <h1 className="text-xl font-semibold">Notifications</h1>
                            <p className="text-sm text-muted-foreground">{unreadCount > 0 ? `${unreadCount} unread` : 'All caught up!'}</p>
                        </div>
                    </div>

                    {unreadCount > 0 && (
                        <Button onClick={markAllAsRead} variant="outline" size="sm" className="flex items-center gap-2 bg-transparent">
                            <Check className="h-3 w-3 text-primary" />
                            Mark all read
                        </Button>
                    )}
                </div>

                {/* Notifications List */}
                <div className="space-y-2">
                    {notificationsList.length === 0 ? (
                        <Card>
                            <CardContent className="flex flex-col items-center justify-center py-12">
                                <Bell className="mb-4 h-12 w-12 text-muted-foreground" />
                                <h3 className="mb-2 text-lg font-medium">No notifications</h3>
                                <p className="text-center text-muted-foreground">{"You're all caught up! New notifications will appear here."}</p>
                            </CardContent>
                        </Card>
                    ) : (
                        notificationsList.map((notification) => (
                            <Card
                                key={notification.id}
                                className={`cursor-pointer transition-all hover:shadow-sm ${
                                    !notification.isRead ? 'bg-accent-blue-950/10 border-l-2 border-primary' : 'hover:bg-muted/30'
                                }`}
                                onClick={() => handleNotificationClick(notification)}
                            >
                                <CardContent className="p-4">
                                    <div className="flex items-center justify-between gap-3">
                                        {/* Left side - Icon and content */}
                                        <div className="flex min-w-0 flex-1 items-center gap-3">
                                            <div className={`flex-shrink-0 ${getNotificationIconColor(notification.type)}`}>
                                                {getNotificationIcon(notification.type)}
                                            </div>

                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-center gap-2">
                                                    <h3
                                                        className={`truncate text-sm font-medium ${!notification.isRead ? 'text-foreground' : 'text-muted-foreground'}`}
                                                    >
                                                        {notification.title}
                                                    </h3>
                                                    {!notification.isRead && <div className="h-1.5 w-1.5 flex-shrink-0 rounded-full bg-blue-500" />}
                                                </div>

                                                {notification.description && (
                                                    <p className="mt-0.5 truncate text-xs text-muted-foreground">{notification.description}</p>
                                                )}
                                            </div>
                                        </div>

                                        {/* Right side - Timestamp */}
                                        <div className="flex flex-shrink-0 items-center gap-3">
                                            <span className="text-xs whitespace-nowrap text-muted-foreground">{notification.timestamp}</span>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))
                    )}
                </div>

                {/* Load More Button (for pagination) */}
                {notificationsList.length > 0 && (
                    <div className="mt-8 flex justify-center">
                        <Button variant="outline" className="w-full bg-transparent sm:w-auto">
                            Load more notifications
                        </Button>
                    </div>
                )}

                {/* Notification Modal */}
                <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                    <DialogContent className="sm:max-w-[500px]">
                        {selectedNotification && (
                            <>
                                <DialogHeader>
                                    <div className="mb-2 flex items-center gap-3">
                                        <div className={`${getNotificationIconColor(selectedNotification.type)}`}>
                                            {getNotificationIcon(selectedNotification.type)}
                                        </div>
                                        <DialogTitle className="text-left">{selectedNotification.title}</DialogTitle>
                                    </div>
                                    <DialogDescription className="text-left text-sm leading-relaxed">
                                        {selectedNotification.description || 'No additional details available.'}
                                    </DialogDescription>
                                    <div className="flex items-center justify-between pt-2 text-xs text-muted-foreground">
                                        <span>{selectedNotification.timestamp}</span>
                                        <span className="capitalize">{selectedNotification.type} notification</span>
                                    </div>
                                </DialogHeader>

                                <DialogFooter className="flex-col gap-2 sm:flex-row">
                                    <div className="flex w-full gap-2 sm:w-auto">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleMarkAsUnread(selectedNotification)}
                                            className="flex-1 sm:flex-none"
                                        >
                                            Mark unread
                                        </Button>

                                        {selectedNotification.actionLabel && selectedNotification.actionUrl && (
                                            <Button
                                                onClick={() => handleAction(selectedNotification)}
                                                size="sm"
                                                className="flex flex-1 items-center gap-2 sm:flex-none"
                                            >
                                                {getActionIcon(selectedNotification.actionLabel)}
                                                {selectedNotification.actionLabel}
                                            </Button>
                                        )}
                                    </div>
                                </DialogFooter>
                            </>
                        )}
                    </DialogContent>
                </Dialog>
            </div>
        </AppLayout>
    );
}
