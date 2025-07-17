'use client';

import type React from 'react';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Menu } from 'lucide-react';

interface SidebarModalProps {
    isOpen: boolean;
    onClose: () => void;
    children: React.ReactNode;
}

export function SidebarModal({ isOpen, onClose, children }: SidebarModalProps) {
    return (
        <>
            {/* Mobile Menu Button */}
            <Button
                variant="outline"
                size="sm"
                onClick={() => !isOpen && onClose()}
                className="fixed bottom-4 left-4 z-50 rounded-lg border border-border bg-card shadow-lg md:hidden"
            >
                <p>Fill the form here</p>
            </Button>

            {/* Modal */}
            <Dialog open={isOpen} onOpenChange={onClose}>
                <DialogContent className="h-[90vh] rounded-2xl p-0 sm:max-w-[400px]">
                    <DialogHeader className="p-6 pb-0">
                        <DialogTitle className="sr-only">Email Generator Settings</DialogTitle>
                    </DialogHeader>
                    <div className="flex-1 overflow-hidden">{children}</div>
                </DialogContent>
            </Dialog>
        </>
    );
}
