'use client';

import React, { useCallback, useRef, useState } from 'react';

interface ThreePanelLayoutProps {
    sidebar: React.ReactNode;
    main: React.ReactNode;
    aiPanel: React.ReactNode;
    defaultSidebarWidth?: number;
    defaultAIPanelWidth?: number;
    minPanelWidth?: number;
    maxPanelWidth?: number;
}

export function ThreePanelLayout({
    sidebar,
    main,
    aiPanel,
    defaultSidebarWidth = 320,
    defaultAIPanelWidth = 320,
    minPanelWidth = 250,
    maxPanelWidth = 400,
}: ThreePanelLayoutProps) {
    const [sidebarWidth, setSidebarWidth] = useState(defaultSidebarWidth);
    const [aiPanelWidth, setAIPanelWidth] = useState(defaultAIPanelWidth);
    const [activeResizer, setActiveResizer] = useState<'left' | 'right' | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    const handleMouseDown = useCallback(
        (resizer: 'left' | 'right') => (e: React.MouseEvent) => {
            setActiveResizer(resizer);
            e.preventDefault();
        },
        [],
    );

    const handleMouseMove = useCallback(
        (e: MouseEvent) => {
            if (!activeResizer || !containerRef.current) return;

            const containerRect = containerRef.current.getBoundingClientRect();

            if (activeResizer === 'left') {
                const newWidth = e.clientX - containerRect.left;
                if (newWidth >= minPanelWidth && newWidth <= maxPanelWidth) {
                    setSidebarWidth(newWidth);
                }
            } else if (activeResizer === 'right') {
                const newWidth = containerRect.right - e.clientX;
                if (newWidth >= minPanelWidth && newWidth <= maxPanelWidth) {
                    setAIPanelWidth(newWidth);
                }
            }
        },
        [activeResizer, minPanelWidth, maxPanelWidth],
    );

    const handleMouseUp = useCallback(() => {
        setActiveResizer(null);
    }, []);

    React.useEffect(() => {
        if (activeResizer) {
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
    }, [activeResizer, handleMouseMove, handleMouseUp]);

    return (
        <div ref={containerRef} className="relative flex h-full gap-4">
            {/* Sidebar */}
            <div style={{ width: sidebarWidth }} className="flex-shrink-0 rounded-2xl  bg-card ">
                {sidebar}
            </div>

            {/* Left Resizer */}
            <div
                className={`group relative w-2 cursor-col-resize rounded-full bg-gradient-to-b from-border via-muted-foreground/20 to-border transition-all duration-300 hover:from-primary/30 hover:via-primary/50 hover:to-primary/30 ${
                    activeResizer === 'left' ? 'from-primary/50 via-primary to-primary/50 shadow-lg shadow-primary/20' : ''
                }`}
                onMouseDown={handleMouseDown('left')}
            >
                <div className="flex h-full w-full items-center justify-center">
                    <div className="h-12 w-1 rounded-full bg-muted-foreground/20 transition-colors duration-200 group-hover:bg-primary/40"></div>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 overflow-hidden rounded-2xl bg-primary-foreground">{main}</div>

            {/* Right Resizer */}
            <div
                className={`group relative w-2 cursor-col-resize rounded-full bg-gradient-to-b from-border via-muted-foreground/20 to-border transition-all duration-300 hover:from-primary/30 hover:via-primary/50 hover:to-primary/30 ${
                    activeResizer === 'right' ? 'from-primary/50 via-primary to-primary/50 shadow-lg shadow-primary/20' : ''
                }`}
                onMouseDown={handleMouseDown('right')}
            >
                <div className="flex h-full w-full items-center justify-center">
                    <div className="h-12 w-1 rounded-full bg-muted-foreground/20 transition-colors duration-200 group-hover:bg-primary/40"></div>
                </div>
            </div>

            {/* AI Panel */}
            <div style={{ width: aiPanelWidth }} className="flex-shrink-0 rounded-2xl border border-border bg-card shadow-lg">
                {aiPanel}
            </div>
        </div>
    );
}
