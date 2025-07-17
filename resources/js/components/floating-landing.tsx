'use client';

import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useMobileNavigation } from '@/hooks/use-mobile-navigation';
import { Link, router } from '@inertiajs/react';
import { HelpCircle, LogOut } from 'lucide-react';
import { useState } from 'react';

export default function FloatingLandiing() {
    const [logoutOpen, setLogoutOpen] = useState(false);
    const [supportOpen, setSupportOpen] = useState(false);
    const cleanup = useMobileNavigation();


    const handleContactSupport = () => {  
        // Add your support contact logic here
        router.visit('/support');
    };

    return (
        <div className="fixed right-6 bottom-6 z-50">
            <div className="flex items-center gap-3 rounded-full border border-gray-200/30 bg-white/20 p-2 opacity-50 shadow-lg backdrop-blur-sm transition-all duration-300 hover:bg-primary-foreground hover:opacity-100 hover:backdrop-blur-md">
                {/* Support Button */}
                <Popover open={supportOpen} onOpenChange={setSupportOpen}>
                    <PopoverTrigger asChild>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-10 w-10 rounded-full bg-blue-50 text-blue-600 opacity-40 transition-all duration-200 hover:scale-105 hover:bg-blue-100 hover:text-blue-700 hover:opacity-100"
                        >
                            <HelpCircle className="h-4 w-4" />
                            <span className="sr-only">Support</span>
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-64 p-4" side="top" align="end">
                        <div className="space-y-3">
                            <h4 className="text-sm font-medium">Contact Support Team</h4>
                            <p className="text-sm text-muted-foreground">
                                Need help? Our support team is here to assist you with any questions or issues.
                            </p>
                            <div className="flex justify-end gap-2">
                                <Button variant="outline" size="sm" onClick={() => setSupportOpen(false)}>
                                    Cancel
                                </Button>
                                <Button
                                    size="sm"
                                    onClick={handleContactSupport}
                                    className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-800 dark:text-primary dark:hover:bg-blue-900"
                                >
                                    Contact Team
                                </Button>
                            </div>
                        </div>
                    </PopoverContent>
                </Popover>
            </div>
        </div>
    );
}
