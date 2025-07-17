'use client';

import { useEffect } from 'react';

interface OAuthResponseProps {
    success: boolean;
    url?: string;
    message?: string;
}

export default function OAuthResponse({ success, url, message }: OAuthResponseProps) {
    useEffect(() => {
        // This component is just used to pass data back to the parent
        // The actual OAuth URL handling is done in the parent component
    }, []);

    return (
        <div className="flex min-h-screen items-center justify-center">
            <div className="text-center">
                <div className="mx-auto h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600"></div>
                <p className="mt-4 text-gray-600">Loading OAuth...</p>
            </div>
        </div>
    );
}
