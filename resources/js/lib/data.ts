export interface User {
    id: string;
    name: string;
    title: string;
    email: string;
    phone: string;
    location: string;
    bio: string;
    avatarUrl?: string;
    status: 'active' | 'inactive' | 'pending';
    lastLogin: string;
    memberSince: string;
}

export interface RecentAction {
    id: string;
    action: string;
    date: string;
    status: 'success' | 'failed' | 'pending';
    details?: string;
}

export const mockUser: User = {
    id: 'user-123',
    name: 'Jane Doe',
    title: 'Senior Product Manager at InnovateTech',
    email: 'jane.doe@innovatetech.com',
    phone: '+1 (555) 987-6543',
    location: 'Austin, TX',
    bio: 'A results-driven product leader with a passion for creating user-centric solutions. Experienced in agile methodologies and cross-functional team leadership. Enjoys cycling and exploring new tech gadgets.',
    avatarUrl: '/placeholder.svg?height=96&width=96',
    status: 'active',
    lastLogin: '2025-07-15 10:30 AM',
    memberSince: '2023-01-20',
};

export const mockRecentActions: RecentAction[] = [
    {
        id: 'action-001',
        action: 'Password Reset',
        date: '2025-07-15 11:00 AM',
        status: 'success',
        details: 'Initiated by admin.',
    },
    {
        id: 'action-002',
        action: 'Profile Update',
        date: '2025-07-14 03:45 PM',
        status: 'success',
        details: 'Updated contact information.',
    },
    {
        id: 'action-003',
        action: 'Login Attempt',
        date: '2025-07-14 09:15 AM',
        status: 'failed',
        details: 'Incorrect password.',
    },
    {
        id: 'action-004',
        action: 'Account Deactivation Request',
        date: '2025-07-13 01:20 PM',
        status: 'pending',
        details: 'Awaiting approval.',
    },
    {
        id: 'action-005',
        action: 'Email Change',
        date: '2025-07-12 05:00 PM',
        status: 'success',
        details: 'Email changed from old@example.com to new@example.com.',
    },
];
