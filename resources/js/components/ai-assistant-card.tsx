'use client';

import type React from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ArrowUpIcon, Send, Sparkles } from 'lucide-react';
import { memo, useCallback, useState } from 'react';
import AppLogo from './app-logo';
import CreditStatus from './CreditStatus';

interface OptimizedAICardProps {
    onAISuggestion: (suggestion: string, selectedText?: string) => void;
    onCancel: () => void;
    isProcessing: boolean;
    hasContent: boolean;
}

export const OptimizedAICard = memo(function OptimizedAICard({ onAISuggestion, onCancel, isProcessing, hasContent }: OptimizedAICardProps) {
    const [inputValue, setInputValue] = useState('');
    const [lastUsed, setLastUsed] = useState<string | null>(null);

    const handleSuggestionClick = useCallback(
        (suggestion: string) => {
            setLastUsed(suggestion);
            onAISuggestion(suggestion);

            // Haptic feedback on mobile
            if ('vibrate' in navigator) {
                navigator.vibrate(50);
            }
        },
        [onAISuggestion],
    );

    const handleCustomSubmit = useCallback(() => {
        if (!inputValue.trim() || isProcessing) return;

        setLastUsed(inputValue);
        onAISuggestion(inputValue);
        setInputValue('');

        // Haptic feedback
        if ('vibrate' in navigator) {
            navigator.vibrate([50, 100, 50]);
        }
    }, [inputValue, isProcessing, onAISuggestion]);

    const handleKeyDown = useCallback(
        (e: React.KeyboardEvent) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleCustomSubmit();
            }
        },
        [handleCustomSubmit],
    );

    const suggestions = [
        'Make this more concise',
        'Make this sound more professional',
        'Expand on this with more detail',
        'Turn this into a timeline',
        'Rewrite this for a 5 year old',
        'Turn this into a haiku',
    ];

    return (
        <Card className="flex h-full flex-col overflow-hidden">
            <CreditStatus/>
            <CardHeader className="border-b border-border/50 pb-4">
                <CardTitle className="flex items-center gap-2 text-lg">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg border bg-background">
                        <AppLogo />
                    </div>
                    <div>
                        <span className="text-foreground">Blaze edit</span>
                        <p className="text-xs font-normal text-muted-foreground">
                            {isProcessing ? 'Processing...' : 'AI-powered content enhancement'}
                        </p>
                    </div>
                </CardTitle>
            </CardHeader>

            <CardContent className="flex-1 space-y-4 overflow-y-auto p-4">
                {!hasContent ? (
                    <div className="flex flex-col items-center justify-center py-8">
                        <div className="mb-4 rounded-full p-4">
                            <AppLogo />
                        </div>
                        <p className="mb-2 max-w-xs text-center text-sm text-muted-foreground">Generate content to see AI suggestions</p>
                    </div>
                ) : (
                    <>
                        {/* AI Greeting */}
                        <div className="space-y-2">
                            <p className="text-sm text-foreground">👋 Hi there, I'm your AI design partner.</p>
                            <p className="text-xs text-muted-foreground">
                                Click on a suggestion below or type your own instruction to refine your email.
                            </p>
                        </div>

                        {/* Processing Indicator */}
                        {isProcessing && (
                            <div className="flex items-center gap-3 rounded-lg border border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 p-3 text-sm text-blue-700">
                                <div className="relative">
                                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-300 border-t-blue-600"></div>
                                    <div className="absolute inset-0 h-4 w-4 animate-ping rounded-full border border-blue-400 opacity-20"></div>
                                </div>
                                <span className="flex-1 font-medium">AI is refining your email...</span>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={onCancel}
                                    className="h-7 border-red-200 px-3 text-xs text-red-600 hover:bg-red-50"
                                >
                                    Cancel
                                </Button>
                            </div>
                        )}

                        {/* Suggestions */}
                        <div className="space-y-2">
                            <p className="text-xs text-muted-foreground">Here are some ways I can help:</p>
                            <div className="flex flex-wrap gap-2">
                                {suggestions.map((suggestion, index) => (
                                    <Button
                                        key={index}
                                        variant="outline"
                                        size="sm"
                                        className={`h-8 text-xs transition-all duration-200 ${
                                            lastUsed === suggestion ? 'border-accent text-primary' : 'border-accent text-primary'
                                        }`}
                                        onClick={() => handleSuggestionClick(suggestion)}
                                        disabled={isProcessing}
                                    >
                                        {suggestion}
                                    </Button>
                                ))}
                            </div>
                        </div>
                    </>
                )}
            </CardContent>

            {/* Bottom Generation Bar */}
            {!hasContent ? (
                <div className="border-t border-border/50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                    <div className="flex items-center justify-center p-4">
                        <p>Generate email first1.</p>
                    </div>
                </div>
                
            ) : (
                <div className="border-t border-border/50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                    <div className="space-y-2 p-4">
                        <div className="relative flex items-center rounded-full border border-input bg-background px-3 py-1 shadow-sm focus-within:ring-2 focus-within:ring-primary/20">
                            <Input
                                placeholder="Custom instructions..."
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                onKeyDown={handleKeyDown}
                                disabled={isProcessing}
                                className="flex-1 rounded-full border-none bg-transparent px-0 py-2 focus:ring-0 focus-visible:ring-0"
                            />
                            <Button
                                size="icon"
                                onClick={handleCustomSubmit}
                                disabled={!inputValue.trim() || isProcessing}
                                className="ml-2 h-8 w-8 rounded-full p-0 transition-all duration-200"
                                type="button"
                            >
                                {isProcessing ? (
                                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                                ) : (
                                    <ArrowUpIcon className="h-4 w-4" />
                                )}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </Card>
    );
});
