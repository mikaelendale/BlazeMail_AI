'use client';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Toggle } from '@/components/ui/toggle';
import { debounce } from 'lodash';
import {
    AlertCircle,
    AlignCenter,
    AlignJustify,
    AlignLeft,
    AlignRight,
    Bold,
    ChevronDown,
    Code,
    Copy,
    Download,
    ImageIcon,
    Italic,
    Link,
    List,
    ListOrdered,
    Paintbrush,
    Palette,
    Quote,
    Strikethrough,
    Table,
    Underline,
} from 'lucide-react';
import type React from 'react';
import { memo, useCallback, useEffect, useRef, useState } from 'react';

interface OptimizedEmailCanvasProps {
    subject: string;
    body: string;
    onSubjectChange: (value: string) => void;
    onBodyChange: (value: string) => void;
    onAISuggestion: (suggestion: string, selectedText: string) => void;
    isProcessingEdit: boolean;
}

const FONT_FAMILIES = [
    { name: 'Default', value: '' },
    { name: 'Arial', value: 'Arial, sans-serif' },
    { name: 'Helvetica', value: 'Helvetica, sans-serif' },
    { name: 'Times New Roman', value: 'Times New Roman, serif' },
    { name: 'Georgia', value: 'Georgia, serif' },
    { name: 'Verdana', value: 'Verdana, sans-serif' },
    { name: 'Courier New', value: 'Courier New, monospace' },
];

const FONT_SIZES = [
    { name: 'Small', value: '1' },
    { name: 'Normal', value: '3' },
    { name: 'Large', value: '5' },
    { name: 'Extra Large', value: '7' },
];

const PRESET_COLORS = [
    '#000000',
    '#333333',
    '#666666',
    '#999999',
    '#CCCCCC',
    '#FFFFFF',
    '#FF0000',
    '#FF6600',
    '#FFCC00',
    '#00FF00',
    '#0066FF',
    '#6600FF',
];

export const OptimizedEmailCanvas = memo(function OptimizedEmailCanvas({
    subject,
    body,
    onSubjectChange,
    onBodyChange,
    onAISuggestion,
    isProcessingEdit,
}: OptimizedEmailCanvasProps) {
    const editorRef = useRef<HTMLTextAreaElement>(null);
    const wysiwygRef = useRef<HTMLDivElement>(null);
    const subjectRef = useRef<HTMLInputElement>(null);

    // Single source of truth for content
    const [markdownContent, setMarkdownContent] = useState('');
    const [htmlContent, setHtmlContent] = useState('');
    const [isMarkdownMode, setIsMarkdownMode] = useState(true);
    const [isMobile, setIsMobile] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [spellCheckEnabled, setSpellCheckEnabled] = useState(true);
    const [wordCount, setWordCount] = useState(0);

    // Debounced body change
    const debouncedBodyChange = useCallback(
        debounce((value: string) => {
            onBodyChange(value);
        }, 300),
        [onBodyChange],
    );

    // Mobile detection
    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // Initialize content from props
    useEffect(() => {
        if (body && !markdownContent && !htmlContent) {
            // Convert initial HTML to markdown
            const markdown = body
                .replace(/<strong[^>]*>(.*?)<\/strong>/gi, '**$1**')
                .replace(/<b[^>]*>(.*?)<\/b>/gi, '**$1**')
                .replace(/<em[^>]*>(.*?)<\/em>/gi, '*$1*')
                .replace(/<i[^>]*>(.*?)<\/i>/gi, '*$1*')
                .replace(/<u[^>]*>(.*?)<\/u>/gi, '<u>$1</u>')
                .replace(/<del[^>]*>(.*?)<\/del>/gi, '~~$1~~')
                .replace(/<code[^>]*>(.*?)<\/code>/gi, '`$1`')
                .replace(/<blockquote[^>]*>(.*?)<\/blockquote>/gi, '> $1')
                .replace(/<a[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/gi, '[$2]($1)')
                .replace(/<img[^>]*src="([^"]*)"[^>]*alt="([^"]*)"[^>]*>/gi, '![$2]($1)')
                .replace(/<ul[^>]*>(.*?)<\/ul>/gis, (match, content) => {
                    return content.replace(/<li[^>]*>(.*?)<\/li>/gi, '- $1\n');
                })
                .replace(/<ol[^>]*>(.*?)<\/ol>/gis, (match, content) => {
                    let counter = 1;
                    return content.replace(/<li[^>]*>(.*?)<\/li>/gi, () => `${counter++}. $1\n`);
                })
                .replace(/<p[^>]*>(.*?)<\/p>/gi, '$1\n\n')
                .replace(/<br\s*\/?>/gi, '\n')
                .replace(/<div[^>]*>(.*?)<\/div>/gi, '$1\n')
                .replace(/<[^>]*>/g, '')
                .replace(/\n{3,}/g, '\n\n')
                .trim();

            setMarkdownContent(markdown);
            setHtmlContent(body);

            // Set initial content in editors
            if (editorRef.current) {
                editorRef.current.value = markdown;
            }
            if (wysiwygRef.current) {
                wysiwygRef.current.innerHTML = body;
            }
        }
    }, [body, markdownContent, htmlContent]);

    // Convert markdown to HTML
    const markdownToHtml = useCallback((markdown: string): string => {
        if (!markdown) return '<p>Start writing your email content...</p>';

        let html = markdown
            // Text formatting
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/~~(.*?)~~/g, '<del>$1</del>')
            .replace(/<u>(.*?)<\/u>/g, '<u>$1</u>')
            .replace(/`([^`]+)`/g, '<code>$1</code>')
            // Links and images
            .replace(/\[([^\]]+)\]$$([^)]+)$$/g, '<a href="$2">$1</a>')
            .replace(/!\[([^\]]*)\]$$([^)]+)$$/g, '<img src="$2" alt="$1" style="max-width: 100%;" />')
            // Quotes
            .replace(/^> (.+)/gm, '<blockquote>$1</blockquote>')
            // Lists
            .replace(/^\* (.+)/gm, '<li>$1</li>')
            .replace(/^\d+\. (.+)/gm, '<li>$1</li>')
            // Tables
            .replace(/^\|(.+)\|\s*$/gm, (match, content) => {
                const cells = content
                    .split('|')
                    .map((cell: string) => cell.trim())
                    .filter((cell: string) => cell);
                return `<tr>${cells.map((cell: string) => `<td>${cell}</td>`).join('')}</tr>`;
            })
            .replace(/^\|[\s\-|:]+\|\s*$/gm, '');

        // Wrap table rows
        html = html.replace(/(<tr>.*?<\/tr>\s*)+/gs, (match) => {
            const rows = match.match(/<tr>.*?<\/tr>/gs) || [];
            if (rows.length > 0) {
                const headerRow = rows[0];
                const bodyRows = rows.slice(1);
                return `<table border="1" style="border-collapse: collapse; width: 100%; margin: 1em 0;">
          <thead>${headerRow.replace(/<td>/g, '<th>').replace(/<\/td>/g, '</th>')}</thead>
          <tbody>${bodyRows.join('')}</tbody>
        </table>`;
            }
            return match;
        });

        // Wrap list items
        html = html.replace(/(<li>.*?<\/li>(?:\s*<li>.*?<\/li>)*)/gs, '<ul>$1</ul>');

        // Handle paragraphs
        html = html
            .split('\n')
            .map((line) => {
                line = line.trim();
                if (!line) return '';
                if (line.startsWith('<')) return line;
                return `<p>${line}</p>`;
            })
            .join('');

        return html;
    }, []);

    // Convert HTML to markdown
    const htmlToMarkdown = useCallback((html: string): string => {
        if (!html) return '';

        return html
            .replace(/<strong[^>]*>(.*?)<\/strong>/gi, '**$1**')
            .replace(/<b[^>]*>(.*?)<\/b>/gi, '**$1**')
            .replace(/<em[^>]*>(.*?)<\/em>/gi, '*$1*')
            .replace(/<i[^>]*>(.*?)<\/i>/gi, '*$1*')
            .replace(/<u[^>]*>(.*?)<\/u>/gi, '<u>$1</u>')
            .replace(/<del[^>]*>(.*?)<\/del>/gi, '~~$1~~')
            .replace(/<code[^>]*>(.*?)<\/code>/gi, '`$1`')
            .replace(/<blockquote[^>]*>(.*?)<\/blockquote>/gi, '> $1')
            .replace(/<a[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/gi, '[$2]($1)')
            .replace(/<img[^>]*src="([^"]*)"[^>]*alt="([^"]*)"[^>]*>/gi, '![$2]($1)')
            .replace(/<table[^>]*>([\s\S]*?)<\/table>/gi, (match, content) => {
                const rows = content.match(/<tr[^>]*>([\s\S]*?)<\/tr>/gi) || [];
                if (rows.length === 0) return match;

                let tableMarkdown = '\n';
                let isFirstRow = true;

                rows.forEach((row: string) => {
                    const cells = row.match(/<t[hd][^>]*>([\s\S]*?)<\/t[hd]>/gi) || [];
                    if (cells.length > 0) {
                        const cellContents = cells.map((cell: string) => cell.replace(/<t[hd][^>]*>([\s\S]*?)<\/t[hd]>/gi, '$1').trim());
                        tableMarkdown += '| ' + cellContents.join(' | ') + ' |\n';

                        if (isFirstRow) {
                            tableMarkdown += '|' + ' --- |'.repeat(cellContents.length) + '\n';
                            isFirstRow = false;
                        }
                    }
                });

                return tableMarkdown + '\n';
            })
            .replace(/<ul[^>]*>(.*?)<\/ul>/gis, (match, content) => {
                return content.replace(/<li[^>]*>(.*?)<\/li>/gi, '- $1\n');
            })
            .replace(/<ol[^>]*>(.*?)<\/ol>/gis, (match, content) => {
                let counter = 1;
                return content.replace(/<li[^>]*>(.*?)<\/li>/gi, () => `${counter++}. $1\n`);
            })
            .replace(/<p[^>]*>(.*?)<\/p>/gi, '$1\n\n')
            .replace(/<br\s*\/?>/gi, '\n')
            .replace(/<div[^>]*>(.*?)<\/div>/gi, '$1\n')
            .replace(/<[^>]*>/g, '')
            .replace(/\n{3,}/g, '\n\n')
            .trim();
    }, []);

    // Update word count
    useEffect(() => {
        const text = isMarkdownMode ? markdownContent : wysiwygRef.current?.textContent || '';
        setWordCount(text.split(/\s+/).filter((word) => word.length > 0).length);
    }, [markdownContent, isMarkdownMode]);

    // Handle markdown content change
    const handleMarkdownChange = useCallback(
        (e: React.ChangeEvent<HTMLTextAreaElement>) => {
            const newMarkdown = e.target.value;
            setMarkdownContent(newMarkdown);

            // Convert to HTML and update
            const newHtml = markdownToHtml(newMarkdown);
            setHtmlContent(newHtml);
            debouncedBodyChange(newHtml);

            // Update WYSIWYG content
            if (wysiwygRef.current) {
                wysiwygRef.current.innerHTML = newHtml;
            }
        },
        [markdownToHtml, debouncedBodyChange],
    );

    // Handle WYSIWYG content change
    const handleWysiwygChange = useCallback(() => {
        if (wysiwygRef.current) {
            const newHtml = wysiwygRef.current.innerHTML;
            setHtmlContent(newHtml);
            debouncedBodyChange(newHtml);

            // Convert to markdown and update
            const newMarkdown = htmlToMarkdown(newHtml);
            setMarkdownContent(newMarkdown);

            // Update markdown editor
            if (editorRef.current) {
                editorRef.current.value = newMarkdown;
            }
        }
    }, [htmlToMarkdown, debouncedBodyChange]);

    // Toggle between modes
    const toggleEditingMode = useCallback(() => {
        setIsMarkdownMode(!isMarkdownMode);

        // Small delay to ensure DOM is updated
        setTimeout(() => {
            if (!isMarkdownMode) {
                // Switching to markdown mode
                if (editorRef.current) {
                    editorRef.current.value = markdownContent;
                    editorRef.current.focus();
                }
            } else {
                // Switching to WYSIWYG mode
                if (wysiwygRef.current) {
                    wysiwygRef.current.innerHTML = htmlContent;
                    wysiwygRef.current.focus();
                }
            }
        }, 50);
    }, [isMarkdownMode, markdownContent, htmlContent]);

    // Execute WYSIWYG command
    const executeCommand = useCallback(
        (command: string, value?: string) => {
            if (!wysiwygRef.current) return;

            wysiwygRef.current.focus();
            document.execCommand(command, false, value);

            setTimeout(() => {
                handleWysiwygChange();
            }, 10);
        },
        [handleWysiwygChange],
    );

    // Insert markdown
    const insertMarkdown = useCallback(
        (before: string, after = '', placeholder = '') => {
            if (!editorRef.current) return;

            const textarea = editorRef.current;
            const start = textarea.selectionStart;
            const end = textarea.selectionEnd;
            const selectedText = textarea.value.substring(start, end);
            const textToInsert = selectedText || placeholder;

            const newText = before + textToInsert + after;
            const beforeText = textarea.value.substring(0, start);
            const afterText = textarea.value.substring(end);
            const newContent = beforeText + newText + afterText;

            // Update markdown content
            setMarkdownContent(newContent);
            textarea.value = newContent;

            // Convert to HTML and update
            const newHtml = markdownToHtml(newContent);
            setHtmlContent(newHtml);
            debouncedBodyChange(newHtml);

            // Update WYSIWYG
            if (wysiwygRef.current) {
                wysiwygRef.current.innerHTML = newHtml;
            }

            // Set cursor position
            setTimeout(() => {
                const newPos = start + before.length + textToInsert.length;
                textarea.setSelectionRange(newPos, newPos);
                textarea.focus();
            }, 0);
        },
        [markdownToHtml, debouncedBodyChange],
    );

    // Format actions
    const formatActions = {
        bold: () => (isMarkdownMode ? insertMarkdown('**', '**', 'bold text') : executeCommand('bold')),
        italic: () => (isMarkdownMode ? insertMarkdown('*', '*', 'italic text') : executeCommand('italic')),
        underline: () => (isMarkdownMode ? insertMarkdown('<u>', '</u>', 'underlined text') : executeCommand('underline')),
        strikethrough: () => (isMarkdownMode ? insertMarkdown('~~', '~~', 'strikethrough text') : executeCommand('strikeThrough')),
        quote: () => (isMarkdownMode ? insertMarkdown('> ', '', 'Quote text') : executeCommand('formatBlock', 'blockquote')),
        bulletList: () => (isMarkdownMode ? insertMarkdown('- ', '', 'List item') : executeCommand('insertUnorderedList')),
        numberedList: () => (isMarkdownMode ? insertMarkdown('1. ', '', 'List item') : executeCommand('insertOrderedList')),
        code: () => (isMarkdownMode ? insertMarkdown('`', '`', 'code') : executeCommand('formatBlock', 'code')),
        link: () => {
            if (isMarkdownMode) {
                insertMarkdown('[', '](url)', 'link text');
            } else {
                const url = prompt('Enter URL:');
                if (url) executeCommand('createLink', url);
            }
        },
        image: () => {
            if (isMarkdownMode) {
                insertMarkdown('![', '](image-url)', 'alt text');
            } else {
                const url = prompt('Enter image URL:');
                if (url) executeCommand('insertImage', url);
            }
        },
        table: () => {
            const tableMarkdown =
                '\n| Header 1 | Header 2 | Header 3 |\n|----------|----------|----------|\n| Cell 1   | Cell 2   | Cell 3   |\n| Cell 4   | Cell 5   | Cell 6   |\n\n';
            if (isMarkdownMode) {
                insertMarkdown(tableMarkdown, '', '');
            } else {
                const tableHtml =
                    '<table border="1" style="border-collapse: collapse; width: 100%;"><thead><tr><th>Header 1</th><th>Header 2</th><th>Header 3</th></tr></thead><tbody><tr><td>Cell 1</td><td>Cell 2</td><td>Cell 3</td></tr><tr><td>Cell 4</td><td>Cell 5</td><td>Cell 6</td></tr></tbody></table><br>';
                executeCommand('insertHTML', tableHtml);
            }
        },
        fontFamily: (font: string) => executeCommand('fontName', font),
        fontSize: (size: string) => executeCommand('fontSize', size),
        textColor: (color: string) => executeCommand('foreColor', color),
        backgroundColor: (color: string) => executeCommand('backColor', color),
        alignLeft: () => executeCommand('justifyLeft'),
        alignCenter: () => executeCommand('justifyCenter'),
        alignRight: () => executeCommand('justifyRight'),
        alignJustify: () => executeCommand('justifyFull'),
    };

    // Handle subject change
    const handleSubjectChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            onSubjectChange(e.target.value);
        },
        [onSubjectChange],
    );
 
    // Color picker component
    const ColorPicker = ({ onColorSelect, title }: { onColorSelect: (color: string) => void; title: string }) => (
        <Popover>
            <PopoverTrigger asChild>
                <Button variant="ghost" size="sm" title={title}>
                    <Paintbrush className="h-4 w-4" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-48 p-3">
                <div className="space-y-3">
                    <Label className="text-sm font-medium">{title}</Label>
                    <div className="grid grid-cols-6 gap-2">
                        {PRESET_COLORS.map((color) => (
                            <button
                                key={color}
                                className="h-6 w-6 rounded border hover:border-primary"
                                style={{ backgroundColor: color }}
                                onClick={() => onColorSelect(color)}
                            />
                        ))}
                    </div>
                    <Input type="color" className="h-8 w-full" onChange={(e) => onColorSelect(e.target.value)} />
                </div>
            </PopoverContent>
        </Popover>
    );

    // Unified toolbar
    const Toolbar = () => (
        <div className="flex items-center border-b bg-card px-3 py-2">
            {/* Scrollable left section */}
            <div
                className="flex-1 overflow-x-auto"
                style={{
                    scrollbarWidth: 'thin',
                    scrollbarColor: 'transparent transparent',
                }}
            >
                <div
                    className="flex scroll-smooth min-w-max items-center space-x-1 pb-1"
                    style={{
                        /* Hide scrollbar for Chrome, Safari and Opera */
                        scrollbarWidth: 'thin',
                        scrollbarColor: 'transparent transparent',
                    }}
                >
                    <style>
                        {`
                        /* Hide scrollbar for Chrome, Safari and Opera */
                        .scrollbar-invisible::-webkit-scrollbar {
                            height: 4px;
                            background: transparent;
                        }
                        .scrollbar-invisible::-webkit-scrollbar-thumb {
                            background: transparent;
                        }
                        `}
                    </style>
                    <div className="scrollbar-invisible flex scroll-smooth min-w-max items-center space-x-1 pb-1">
                        <Button
                            variant={isMarkdownMode ? 'default' : 'outline'}
                            size="sm"
                            onClick={toggleEditingMode}
                            className="h-7 flex-shrink-0 px-2 text-xs"
                        >
                            {isMarkdownMode ? <Code className="mr-1 h-3 w-3" /> : <Palette className="mr-1 h-3 w-3" />}
                            {isMarkdownMode ? 'MD' : 'Rich'}
                        </Button>

                        <div className="h-6 w-px flex-shrink-0 bg-border" />

                        <Toggle pressed={false} onPressedChange={formatActions.bold} size="sm" className="flex-shrink-0">
                            <Bold className="h-3 w-3" />
                        </Toggle>
                        <Toggle pressed={false} onPressedChange={formatActions.italic} size="sm" className="flex-shrink-0">
                            <Italic className="h-3 w-3" />
                        </Toggle>
                        <Toggle pressed={false} onPressedChange={formatActions.underline} size="sm" className="flex-shrink-0">
                            <Underline className="h-3 w-3" />
                        </Toggle>
                        <Toggle pressed={false} onPressedChange={formatActions.strikethrough} size="sm" className="flex-shrink-0">
                            <Strikethrough className="h-3 w-3" />
                        </Toggle>

                        <div className="h-6 w-px flex-shrink-0 bg-border" />

                        <Button variant="ghost" size="sm" onClick={formatActions.quote} className="h-8 w-8 flex-shrink-0 p-0">
                            <Quote className="h-3 w-3" />
                        </Button>
                        <Toggle pressed={false} onPressedChange={formatActions.bulletList} size="sm" className="flex-shrink-0">
                            <List className="h-3 w-3" />
                        </Toggle>
                        <Toggle pressed={false} onPressedChange={formatActions.numberedList} size="sm" className="flex-shrink-0">
                            <ListOrdered className="h-3 w-3" />
                        </Toggle>

                        <div className="h-6 w-px flex-shrink-0 bg-border" />

                        <Button variant="ghost" size="sm" onClick={formatActions.table} className="h-8 w-8 flex-shrink-0 p-0">
                            <Table className="h-3 w-3" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={formatActions.link} className="h-8 w-8 flex-shrink-0 p-0">
                            <Link className="h-3 w-3" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={formatActions.image} className="h-8 w-8 flex-shrink-0 p-0">
                            <ImageIcon className="h-3 w-3" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={formatActions.code} className="h-8 w-8 flex-shrink-0 p-0">
                            <Code className="h-3 w-3" />
                        </Button>

                        {!isMarkdownMode && (
                            <>
                                <div className="h-6 w-px flex-shrink-0 bg-border" />

                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="sm" className="h-8 flex-shrink-0 px-2 text-xs">
                                            Font <ChevronDown className="ml-1 h-3 w-3" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent>
                                        {FONT_FAMILIES.map((font) => (
                                            <DropdownMenuItem
                                                key={font.value}
                                                onClick={() => formatActions.fontFamily(font.value)}
                                                style={{ fontFamily: font.value }}
                                            >
                                                {font.name}
                                            </DropdownMenuItem>
                                        ))}
                                    </DropdownMenuContent>
                                </DropdownMenu>

                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="sm" className="h-8 flex-shrink-0 px-2 text-xs">
                                            Size <ChevronDown className="ml-1 h-3 w-3" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent>
                                        {FONT_SIZES.map((size) => (
                                            <DropdownMenuItem key={size.value} onClick={() => formatActions.fontSize(size.value)}>
                                                {size.name}
                                            </DropdownMenuItem>
                                        ))}
                                    </DropdownMenuContent>
                                </DropdownMenu>

                                <div className="flex-shrink-0">
                                    <ColorPicker onColorSelect={formatActions.textColor} title="Text Color" />
                                </div>
                                <div className="flex-shrink-0">
                                    <ColorPicker onColorSelect={formatActions.backgroundColor} title="Background Color" />
                                </div>

                                <div className="h-6 w-px flex-shrink-0 bg-border" />

                                <Button variant="ghost" size="sm" onClick={formatActions.alignLeft} className="h-8 w-8 flex-shrink-0 p-0">
                                    <AlignLeft className="h-3 w-3" />
                                </Button>
                                <Button variant="ghost" size="sm" onClick={formatActions.alignCenter} className="h-8 w-8 flex-shrink-0 p-0">
                                    <AlignCenter className="h-3 w-3" />
                                </Button>
                                <Button variant="ghost" size="sm" onClick={formatActions.alignRight} className="h-8 w-8 flex-shrink-0 p-0">
                                    <AlignRight className="h-3 w-3" />
                                </Button>
                                <Button variant="ghost" size="sm" onClick={formatActions.alignJustify} className="h-8 w-8 flex-shrink-0 p-0">
                                    <AlignJustify className="h-3 w-3" />
                                </Button>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Fixed right section - 3 items */}
            <div className="ml-2 flex flex-shrink-0 items-center space-x-1">
                <Badge variant="outline" className="text-xs">
                    {wordCount}
                </Badge>  
            </div>
        </div>
    );

    return (
        <div className="relative h-180 bg-background text-foreground">
            {error && (
                <Alert className="m-4 border-destructive bg-destructive/10">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription className="flex items-center justify-between">
                        {error}
                        <Button variant="ghost" size="sm" onClick={() => setError(null)} className="ml-2 h-6 w-6 p-0">
                            ×
                        </Button>
                    </AlertDescription>
                </Alert>
            )}

            <Toolbar />

            <div className="flex h-full flex-col p-3 md:p-6 lg:p-8">
                <input
                    ref={subjectRef}
                    type="text"
                    className="mb-4 w-full bg-transparent text-xl font-bold text-foreground placeholder-muted-foreground outline-none md:mb-6 md:text-2xl lg:mb-8 lg:text-4xl"
                    placeholder="Email subject..."
                    defaultValue={subject}
                    onChange={handleSubjectChange}
                    spellCheck={spellCheckEnabled}
                />

                <div className="min-h-0 flex-1">
                    {isMarkdownMode ? (
                        <textarea
                            ref={editorRef}
                            value={markdownContent}
                            onChange={handleMarkdownChange}
                            className="h-full w-full resize-none rounded-lg border border-border bg-card p-3 text-sm leading-relaxed text-foreground placeholder-muted-foreground outline-none focus:border-primary-foreground focus:ring-2 focus:ring-primary/20 md:p-4 md:text-base lg:p-6 lg:text-lg"
                            placeholder="Start writing your email content in Markdown..."
                            style={{ fontFamily: 'ui-monospace, SFMono-Regular, Consolas, monospace' }}
                            spellCheck={spellCheckEnabled}
                        />
                    ) : (
                        <div
                            ref={wysiwygRef}
                            contentEditable
                            suppressContentEditableWarning
                            className="prose prose-sm md:prose-base lg:prose-lg prose-neutral dark:prose-invert h-full w-full max-w-none overflow-y-auto rounded-lg border border-border bg-card p-3 text-sm leading-relaxed text-foreground outline-none focus:border-primary-foreground focus:ring-2 focus:ring-primary/20 md:p-4 md:text-base lg:p-6 lg:text-lg"
                            onInput={handleWysiwygChange}
                            spellCheck={spellCheckEnabled}
                            style={{
                                fontFamily: 'ui-sans-serif, system-ui, sans-serif',
                                minHeight: '100%',
                            }}
                        />
                    )}
                </div>
            </div>
        </div>
    );
});
