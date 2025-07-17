'use client';

import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
    ArrowLeft,
    Bold,
    Check,
    ChevronDown,
    ChevronRight,
    Code,
    Italic,
    Languages,
    Link,
    Minus,
    Palette,
    Plus,
    RotateCcw,
    Sparkles,
    Strikethrough,
    Type,
    Underline,
    Zap,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

interface SelectionToolbarProps {
    onFormatText: (format: string, selectedText: string) => void;
    onAISuggestion: (suggestion: string, selectedText: string) => void;
    isProcessingEdit: boolean;
}

export function CustomSelectionToolbar({ onFormatText, onAISuggestion, isProcessingEdit }: SelectionToolbarProps) {
    const [selection, setSelection] = useState<{
        text: string;
        range: Range;
        rect: DOMRect;
    } | null>(null);
    const [showToolbar, setShowToolbar] = useState(false);
    const [showAIPopover, setShowAIPopover] = useState(false);
    const [toolbarPosition, setToolbarPosition] = useState({ x: 0, y: 0 });
    const [isMobile, setIsMobile] = useState(false);

    const toolbarRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    useEffect(() => {
        const handleSelectionChange = () => {
            const windowSelection = window.getSelection();
            if (windowSelection && windowSelection.toString().trim()) {
                const selectedText = windowSelection.toString();
                const range = windowSelection.getRangeAt(0);
                const rect = range.getBoundingClientRect();

                // Check if selection is within editor
                const editorElement = document.querySelector('.codex-editor');
                if (editorElement && editorElement.contains(range.commonAncestorContainer)) {
                    setSelection({
                        text: selectedText,
                        range: range.cloneRange(),
                        rect,
                    });

                    // Position toolbar
                    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
                    const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;

                    setToolbarPosition({
                        x: Math.max(20, Math.min(rect.left + scrollLeft + rect.width / 2 - 200, window.innerWidth - 420)),
                        y: rect.top + scrollTop - 70,
                    });

                    setShowToolbar(true);
                    setShowAIPopover(false);
                }
            } else {
                clearSelection();
            }
        };

        const handleMouseUp = () => {
            setTimeout(handleSelectionChange, 10);
        };

        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as Element;
            if (!target.closest('.custom-selection-toolbar') && !target.closest('.ai-popover') && !target.closest('.codex-editor')) {
                clearSelection();
            }
        };

        document.addEventListener('mouseup', handleMouseUp);
        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('selectionchange', handleSelectionChange);

        return () => {
            document.removeEventListener('mouseup', handleMouseUp);
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('selectionchange', handleSelectionChange);
        };
    }, []);

    const clearSelection = () => {
        setSelection(null);
        setShowToolbar(false);
        setShowAIPopover(false);
    };

    const handleFormat = (format: string) => {
        if (selection) {
            onFormatText(format, selection.text);
            // Keep selection for multiple formatting
            setTimeout(() => {
                const windowSelection = window.getSelection();
                if (windowSelection && selection.range) {
                    windowSelection.removeAllRanges();
                    windowSelection.addRange(selection.range);
                }
            }, 100);
        }
    };

    const showAIOptions = () => {
        setShowToolbar(false);
        setShowAIPopover(true);
    };

    const backToToolbar = () => {
        setShowAIPopover(false);
        setShowToolbar(true);
    };

    const handleAISuggestion = (suggestion: string) => {
        if (selection) {
            onAISuggestion(suggestion, selection.text);
            clearSelection();
        }
    };

    if (!showToolbar && !showAIPopover) return null;

    return (
        <>
            {/* Format Toolbar */}
            {showToolbar && selection && (
                <div
                    ref={toolbarRef}
                    className={`custom-selection-toolbar fixed z-50 transform rounded-lg border border-border bg-card p-2 shadow-xl transition-all duration-300 ease-out animate-in fade-in-0 slide-in-from-top-2 zoom-in-95 ${
                        isMobile ? 'max-w-[90vw] overflow-x-auto' : ''
                    }`}
                    style={{ left: toolbarPosition.x, top: toolbarPosition.y }}
                >
                    <div className={`flex items-center gap-1 ${isMobile ? 'min-w-max' : ''}`}>
                        {/* Format Options */}
                        <Button variant="ghost" size="sm" onClick={() => handleFormat('bold')} className="h-8 w-8 p-0">
                            <Bold className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleFormat('italic')} className="h-8 w-8 p-0">
                            <Italic className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleFormat('underline')} className="h-8 w-8 p-0">
                            <Underline className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleFormat('strikethrough')} className="h-8 w-8 p-0">
                            <Strikethrough className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleFormat('code')} className="h-8 w-8 p-0">
                            <Code className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleFormat('link')} className="h-8 w-8 p-0">
                            <Link className="h-4 w-4" />
                        </Button>

                        <Separator orientation="vertical" className="mx-1 h-6" />

                        {/* Ask AI Button */}
                        <Button variant="ghost" size="sm" onClick={showAIOptions} className="h-8 px-2 text-xs">
                            <Zap className="mr-1 h-3 w-3" />
                            Ask AI
                            <ChevronDown className="ml-1 h-3 w-3" />
                        </Button>
                    </div>
                </div>
            )}

            {/* AI Popover */}
            {showAIPopover && selection && (
                <div
                    className="ai-popover fixed z-50 w-80 max-w-[90vw] transform rounded-lg border border-border bg-card shadow-xl transition-all duration-300 ease-out animate-in fade-in-0 slide-in-from-top-2 zoom-in-95"
                    style={{ left: toolbarPosition.x, top: toolbarPosition.y }}
                >
                    <div className="border-b border-border p-3">
                        <div className="mb-2 flex items-center gap-2">
                            <Button variant="ghost" size="sm" onClick={backToToolbar} className="h-6 w-6 p-0">
                                <ArrowLeft className="h-3 w-3" />
                            </Button>
                            <Sparkles className="h-4 w-4 text-primary" />
                            <span className="text-sm font-medium text-foreground">Ask AI anything...</span>
                        </div>
                        <div className="ml-8 text-xs text-muted-foreground">
                            Selected: "{selection.text.substring(0, 50)}
                            {selection.text.length > 50 ? '...' : ''}"
                        </div>
                    </div>

                    <div className="p-2">
                        <div className="mb-3">
                            <div className="mb-2 text-xs font-medium text-muted-foreground">✨ Quick fixes</div>
                            <div className="space-y-1">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-full justify-start text-xs hover:bg-purple-50 hover:text-purple-700"
                                    onClick={() => handleAISuggestion('Improve writing')}
                                    disabled={isProcessingEdit}
                                >
                                    <Sparkles className="mr-2 h-3 w-3 text-purple-500" />
                                    Improve writing
                                    <RotateCcw className="ml-auto h-3 w-3" />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-full justify-start text-xs hover:bg-green-50 hover:text-green-700"
                                    onClick={() => handleAISuggestion('Fix spelling & grammar')}
                                    disabled={isProcessingEdit}
                                >
                                    <Check className="mr-2 h-3 w-3 text-green-500" />
                                    Fix spelling & grammar
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-full justify-start text-xs hover:bg-blue-50 hover:text-blue-700"
                                    onClick={() => handleAISuggestion('Make more professional')}
                                    disabled={isProcessingEdit}
                                >
                                    <Languages className="mr-2 h-3 w-3 text-blue-500" />
                                    Make more professional
                                    <ChevronRight className="ml-auto h-3 w-3" />
                                </Button>
                            </div>
                        </div>

                        <div>
                            <div className="mb-2 text-xs font-medium text-muted-foreground">🎯 Edit</div>
                            <div className="space-y-1">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-full justify-start text-xs hover:bg-purple-50 hover:text-purple-700"
                                    onClick={() => handleAISuggestion('Make longer')}
                                    disabled={isProcessingEdit}
                                >
                                    <Plus className="mr-2 h-3 w-3 text-purple-500" />
                                    Make longer
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-full justify-start text-xs hover:bg-purple-50 hover:text-purple-700"
                                    onClick={() => handleAISuggestion('Make shorter')}
                                    disabled={isProcessingEdit}
                                >
                                    <Minus className="mr-2 h-3 w-3 text-purple-500" />
                                    Make shorter
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-full justify-start text-xs hover:bg-purple-50 hover:text-purple-700"
                                    onClick={() => handleAISuggestion('Change tone to friendly')}
                                    disabled={isProcessingEdit}
                                >
                                    <Palette className="mr-2 h-3 w-3 text-purple-500" />
                                    Change tone
                                    <ChevronRight className="ml-auto h-3 w-3" />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-full justify-start text-xs hover:bg-purple-50 hover:text-purple-700"
                                    onClick={() => handleAISuggestion('Simplify language')}
                                    disabled={isProcessingEdit}
                                >
                                    <Type className="mr-2 h-3 w-3 text-purple-500" />
                                    Simplify language
                                </Button>
                            </div>
                        </div>
                    </div>

                    {isProcessingEdit && (
                        <div className="border-t border-border p-3">
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <div className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
                                Processing with AI...
                            </div>
                        </div>
                    )}
                </div>
            )}
        </>
    );
}
