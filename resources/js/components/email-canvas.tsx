'use client';

import type React from 'react';

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

interface SelectionData {
    text: string;
    range: Range;
    rect: DOMRect;
}

interface EmailCanvasProps {
    subject: string;
    body: string;
    onSubjectChange: (value: string) => void;
    onBodyChange: (value: string) => void;
    onAISuggestion: (suggestion: string, selectedText: string) => void;
    isProcessingEdit: boolean;
}

export function EmailCanvas({ subject, body, onSubjectChange, onBodyChange, onAISuggestion, isProcessingEdit }: EmailCanvasProps) {
    const [selection, setSelection] = useState<SelectionData | null>(null);
    const [showFormatToolbar, setShowFormatToolbar] = useState(false);
    const [showAIPopover, setShowAIPopover] = useState(false);
    const [toolbarPosition, setToolbarPosition] = useState({ x: 0, y: 0 });
    const [isMobile, setIsMobile] = useState(false);

    const subjectRef = useRef<HTMLDivElement>(null);
    const bodyRef = useRef<HTMLDivElement>(null);
    const savedRange = useRef<Range | null>(null);

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // Convert markdown to HTML for visual rendering
    const markdownToHtml = (text: string) => {
        return text
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/<u>(.*?)<\/u>/g, '<u>$1</u>')
            .replace(/`(.*?)`/g, '<code class="code-highlight">$1</code>')
            .replace(/~~(.*?)~~/g, '<del>$1</del>')
            .replace(/\n/g, '<br>');
    };

    // Check if selected text has specific formatting
    const isTextFormatted = (text: string, format: string) => {
        switch (format) {
            case 'bold':
                return body.includes(`**${text}**`);
            case 'italic':
                return body.includes(`*${text}*`) && !body.includes(`**${text}**`);
            case 'underline':
                return body.includes(`<u>${text}</u>`);
            case 'code':
                return body.includes(`\`${text}\``);
            case 'strikethrough':
                return body.includes(`~~${text}~~`);
            default:
                return false;
        }
    };

    // Handle text selection
    const handleTextSelection = (e: React.MouseEvent) => {
        // Small delay to ensure selection is complete
        setTimeout(() => {
            const windowSelection = window.getSelection();
            if (windowSelection && windowSelection.toString().trim()) {
                const selectedText = windowSelection.toString();
                const range = windowSelection.getRangeAt(0);
                const rect = range.getBoundingClientRect();

                savedRange.current = range.cloneRange();

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
                    y: rect.top + scrollTop - 60,
                });

                setShowFormatToolbar(true);
                setShowAIPopover(false);
            } else {
                // Clear selection if no text selected
                clearSelection();
            }
        }, 10);
    };

    // Clear selection and toolbars
    const clearSelection = () => {
        setSelection(null);
        setShowFormatToolbar(false);
        setShowAIPopover(false);
        savedRange.current = null;
    };

    // Handle clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as Element;
            if (!target.closest('.format-toolbar') && !target.closest('.ai-popover') && !target.closest('[contenteditable]')) {
                clearSelection();
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Handle keyboard events for proper text editing
    const handleKeyDown = (e: React.KeyboardEvent, field: 'subject' | 'body') => {
        // Allow Enter key for new lines in body
        if (e.key === 'Enter' && field === 'body') {
            e.preventDefault();
            document.execCommand('insertHTML', false, '<br><br>');
            return;
        }

        // Prevent Enter in subject
        if (e.key === 'Enter' && field === 'subject') {
            e.preventDefault();
            return;
        }

        // Clear selection on typing
        if (e.key.length === 1 || e.key === 'Backspace' || e.key === 'Delete') {
            clearSelection();
        }
    };

    // Restore selection
    const restoreSelection = () => {
        if (savedRange.current) {
            const windowSelection = window.getSelection();
            if (windowSelection) {
                windowSelection.removeAllRanges();
                windowSelection.addRange(savedRange.current);
            }
        }
    };

    // Toggle formatting
    const toggleFormatting = (format: 'bold' | 'italic' | 'underline' | 'code' | 'strikethrough') => {
        if (!selection) return;

        const selectedText = selection.text;
        let newBody = body;
        const isFormatted = isTextFormatted(selectedText, format);

        if (isFormatted) {
            // Remove formatting
            switch (format) {
                case 'bold':
                    newBody = newBody.replace(`**${selectedText}**`, selectedText);
                    break;
                case 'italic':
                    newBody = newBody.replace(`*${selectedText}*`, selectedText);
                    break;
                case 'underline':
                    newBody = newBody.replace(`<u>${selectedText}</u>`, selectedText);
                    break;
                case 'code':
                    newBody = newBody.replace(`\`${selectedText}\``, selectedText);
                    break;
                case 'strikethrough':
                    newBody = newBody.replace(`~~${selectedText}~~`, selectedText);
                    break;
            }
        } else {
            // Add formatting
            let newText = selectedText;
            switch (format) {
                case 'bold':
                    newText = `**${selectedText}**`;
                    break;
                case 'italic':
                    newText = `*${selectedText}*`;
                    break;
                case 'underline':
                    newText = `<u>${selectedText}</u>`;
                    break;
                case 'code':
                    newText = `\`${selectedText}\``;
                    break;
                case 'strikethrough':
                    newText = `~~${selectedText}~~`;
                    break;
            }
            newBody = newBody.replace(selectedText, newText);
        }

        onBodyChange(newBody);
        setTimeout(restoreSelection, 100);
    };

    // Show AI options
    const showAIOptions = () => {
        setShowFormatToolbar(false);
        setShowAIPopover(true);
    };

    // Back to format toolbar
    const backToFormatToolbar = () => {
        setShowAIPopover(false);
        setShowFormatToolbar(true);
    };

    // Handle AI suggestion
    const handleAISuggestion = (suggestion: string) => {
        if (!selection) return;
        onAISuggestion(suggestion, selection.text);
    };

    return (
        <div className="email-canvas relative mx-auto max-w-4xl p-8">
            {/* Subject */}
            <div className="group mb-8">
                <h1
                    ref={subjectRef}
                    className="email-subject text-4xl leading-tight font-bold text-foreground outline-none"
                    contentEditable
                    suppressContentEditableWarning
                    onMouseUp={handleTextSelection}
                    onKeyDown={(e) => handleKeyDown(e, 'subject')}
                    onBlur={(e) => onSubjectChange(e.currentTarget.textContent || '')}
                    dangerouslySetInnerHTML={{ __html: markdownToHtml(subject) }}
                />
            </div>

            {/* Body */}
            <div className="prose prose-lg group max-w-none">
                <div
                    ref={bodyRef}
                    className="email-body min-h-[400px] leading-relaxed text-foreground outline-none"
                    contentEditable
                    suppressContentEditableWarning
                    onMouseUp={handleTextSelection}
                    onKeyDown={(e) => handleKeyDown(e, 'body')}
                    onBlur={(e) => onBodyChange(e.currentTarget.textContent || '')}
                    dangerouslySetInnerHTML={{ __html: markdownToHtml(body) }}
                />
            </div>

            {/* Format Toolbar */}
            {showFormatToolbar && selection && (
                <div
                    className={`format-toolbar fixed z-50 translate-y-0 scale-100 transform rounded-lg border border-border bg-card p-2 opacity-100 shadow-xl transition-all duration-300 ease-out ${
                        isMobile ? 'max-w-[90vw] overflow-x-auto' : ''
                    }`}
                    style={{ left: toolbarPosition.x, top: toolbarPosition.y }}
                >
                    <div className={`flex items-center gap-1 ${isMobile ? 'min-w-max' : ''}`}>
                        <Button
                            variant={isTextFormatted(selection.text, 'bold') ? 'default' : 'ghost'}
                            size="sm"
                            onClick={() => toggleFormatting('bold')}
                            className="h-8 w-8 p-0"
                        >
                            <Bold className="h-4 w-4" />
                        </Button>
                        <Button
                            variant={isTextFormatted(selection.text, 'italic') ? 'default' : 'ghost'}
                            size="sm"
                            onClick={() => toggleFormatting('italic')}
                            className="h-8 w-8 p-0"
                        >
                            <Italic className="h-4 w-4" />
                        </Button>
                        <Button
                            variant={isTextFormatted(selection.text, 'underline') ? 'default' : 'ghost'}
                            size="sm"
                            onClick={() => toggleFormatting('underline')}
                            className="h-8 w-8 p-0"
                        >
                            <Underline className="h-4 w-4" />
                        </Button>
                        <Button
                            variant={isTextFormatted(selection.text, 'strikethrough') ? 'default' : 'ghost'}
                            size="sm"
                            onClick={() => toggleFormatting('strikethrough')}
                            className="h-8 w-8 p-0"
                        >
                            <Strikethrough className="h-4 w-4" />
                        </Button>
                        <Button
                            variant={isTextFormatted(selection.text, 'code') ? 'default' : 'ghost'}
                            size="sm"
                            onClick={() => toggleFormatting('code')}
                            className="h-8 w-8 p-0"
                        >
                            <Code className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <Link className="h-4 w-4" />
                        </Button>

                        <Separator orientation="vertical" className="mx-1 h-6" />

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
                    className="ai-popover fixed z-50 w-80 max-w-[90vw] translate-y-0 scale-100 transform rounded-lg border border-border bg-card opacity-100 shadow-xl transition-all duration-300 ease-out"
                    style={{ left: toolbarPosition.x, top: toolbarPosition.y }}
                >
                    <div className="border-b border-border p-3">
                        <div className="mb-2 flex items-center gap-2">
                            <Button variant="ghost" size="sm" onClick={backToFormatToolbar} className="h-6 w-6 p-0">
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
                            <div className="mb-2 text-xs font-medium text-muted-foreground">Quick fixes</div>
                            <div className="space-y-1">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-full justify-start text-xs"
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
                                    className="h-8 w-full justify-start text-xs"
                                    onClick={() => handleAISuggestion('Fix spelling & grammar')}
                                    disabled={isProcessingEdit}
                                >
                                    <Check className="mr-2 h-3 w-3 text-green-500" />
                                    Fix spelling & grammar
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-full justify-start text-xs"
                                    onClick={() => handleAISuggestion('Translate to')}
                                    disabled={isProcessingEdit}
                                >
                                    <Languages className="mr-2 h-3 w-3 text-blue-500" />
                                    Translate to
                                    <ChevronRight className="ml-auto h-3 w-3" />
                                </Button>
                            </div>
                        </div>

                        <div>
                            <div className="mb-2 text-xs font-medium text-muted-foreground">Edit</div>
                            <div className="space-y-1">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-full justify-start text-xs"
                                    onClick={() => handleAISuggestion('Make longer')}
                                    disabled={isProcessingEdit}
                                >
                                    <Plus className="mr-2 h-3 w-3 text-purple-500" />
                                    Make longer
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-full justify-start text-xs"
                                    onClick={() => handleAISuggestion('Make shorter')}
                                    disabled={isProcessingEdit}
                                >
                                    <Minus className="mr-2 h-3 w-3 text-purple-500" />
                                    Make shorter
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-full justify-start text-xs"
                                    onClick={() => handleAISuggestion('Change tone')}
                                    disabled={isProcessingEdit}
                                >
                                    <Palette className="mr-2 h-3 w-3 text-purple-500" />
                                    Change tone
                                    <ChevronRight className="ml-auto h-3 w-3" />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-full justify-start text-xs"
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
                                Processing...
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
