'use client';

import React, { useCallback, useRef, useState } from 'react';

interface ResizableLayoutProps {
    sidebar: React.ReactNode;
    main: React.ReactNode;
    defaultSidebarWidth?: number;
    minSidebarWidth?: number;
    maxSidebarWidth?: number;
}

export function ResizableLayout({ sidebar, main, defaultSidebarWidth = 320, minSidebarWidth = 280, maxSidebarWidth = 500 }: ResizableLayoutProps) {
    const [sidebarWidth, setSidebarWidth] = useState(defaultSidebarWidth);
    const [isResizing, setIsResizing] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        setIsResizing(true);
        e.preventDefault();
    }, []);

    const handleMouseMove = useCallback(
        (e: MouseEvent) => {
            if (!isResizing || !containerRef.current) return;

            const containerRect = containerRef.current.getBoundingClientRect();
            const newWidth = e.clientX - containerRect.left;

            if (newWidth >= minSidebarWidth && newWidth <= maxSidebarWidth) {
                setSidebarWidth(newWidth);
            }
        },
        [isResizing, minSidebarWidth, maxSidebarWidth],
    );

    const handleMouseUp = useCallback(() => {
        setIsResizing(false);
    }, []);

    // Add global mouse event listeners
    React.useEffect(() => {
        if (isResizing) {
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
            document.body.style.cursor = 'col-resize';
            document.body.style.userSelect = 'none';

            return () => {
                document.removeEventListener('mousemove', handleMouseMove);
                document.removeEventListener('mouseup', handleMouseUp);
                document.body.style.cursor = '';
                document.body.style.userSelect = '';
            };
        }
    }, [isResizing, handleMouseMove, handleMouseUp]);

    return (
        <div ref={containerRef} className="relative flex h-full">
            {/* Sidebar */}
            <div style={{ width: sidebarWidth }} className="mr-4 flex-shrink-0 rounded-2xl border border-border bg-card shadow-lg">
                {sidebar}
            </div>

            {/* Resizer */}
            <div
                className={`mx-1 w-1 cursor-col-resize rounded-full bg-border transition-colors duration-200 hover:bg-primary/50 ${
                    isResizing ? 'bg-primary' : ''
                }`}
                onMouseDown={handleMouseDown}
            >
                <div className="flex h-full w-full items-center justify-center">
                    <div className="h-8 w-0.5 rounded-full bg-muted-foreground/30"></div>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 overflow-hidden rounded-2xl border border-border bg-card shadow-lg">{main}</div>
        </div>
    );
}
