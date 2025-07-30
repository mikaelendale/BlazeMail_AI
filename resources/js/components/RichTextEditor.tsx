'use client';
import { useEffect } from 'react';

import { $convertFromMarkdownString, $convertToMarkdownString } from '@lexical/markdown';
import { AutoFocusPlugin } from '@lexical/react/LexicalAutoFocusPlugin';
import { CheckListPlugin } from '@lexical/react/LexicalCheckListPlugin';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { LinkPlugin } from '@lexical/react/LexicalLinkPlugin';
import { ListPlugin } from '@lexical/react/LexicalListPlugin';
import { MarkdownShortcutPlugin } from '@lexical/react/LexicalMarkdownShortcutPlugin';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { TabIndentationPlugin } from '@lexical/react/LexicalTabIndentationPlugin';

import { Label } from '@/components/ui/label';
import { CodeHighlightNode, CodeNode } from '@lexical/code';
import { AutoLinkNode, LinkNode } from '@lexical/link';
import { ListItemNode, ListNode } from '@lexical/list';
import { HeadingNode, QuoteNode } from '@lexical/rich-text';
import { TableCellNode, TableNode, TableRowNode } from '@lexical/table';
import { LexicalToolbar } from './LexicalToolbar';

const theme = {
    ltr: 'ltr',
    rtl: 'rtl',
    placeholder: 'editor-placeholder',
    paragraph: 'editor-paragraph',
    quote: 'editor-quote',
    heading: {
        h1: 'editor-heading-h1',
        h2: 'editor-heading-h2',
        h3: 'editor-heading-h3',
        h4: 'editor-heading-h4',
        h5: 'editor-heading-h5',
        h6: 'editor-heading-h6',
    },
    list: {
        nested: {
            listitem: 'editor-nested-listitem',
        },
        ol: 'editor-list-ol',
        ul: 'editor-list-ul',
        listitem: 'editor-listitem',
    },
    image: 'editor-image',
    link: 'editor-link',
    text: {
        bold: 'editor-text-bold',
        italic: 'editor-text-italic',
        overflowed: 'editor-text-overflowed',
        hashtag: 'editor-text-hashtag',
        underline: 'editor-text-underline',
        strikethrough: 'editor-text-strikethrough',
        underlineStrikethrough: 'editor-text-underlineStrikethrough',
        code: 'editor-text-code',
    },
    code: 'editor-code',
    codeHighlight: {
        atrule: 'editor-tokenAttr',
        attr: 'editor-tokenAttr',
        boolean: 'editor-tokenProperty',
        builtin: 'editor-tokenSelector',
        cdata: 'editor-tokenComment',
        char: 'editor-tokenSelector',
        class: 'editor-tokenFunction',
        'class-name': 'editor-tokenFunction',
        comment: 'editor-tokenComment',
        constant: 'editor-tokenProperty',
        deleted: 'editor-tokenProperty',
        doctype: 'editor-tokenComment',
        entity: 'editor-tokenOperator',
        function: 'editor-tokenFunction',
        important: 'editor-tokenVariable',
        inserted: 'editor-tokenSelector',
        keyword: 'editor-tokenAttr',
        namespace: 'editor-tokenVariable',
        number: 'editor-tokenProperty',
        operator: 'editor-tokenOperator',
        prolog: 'editor-tokenComment',
        property: 'editor-tokenProperty',
        punctuation: 'editor-tokenPunctuation',
        regex: 'editor-tokenVariable',
        selector: 'editor-tokenSelector',
        string: 'editor-tokenSelector',
        symbol: 'editor-tokenProperty',
        tag: 'editor-tokenProperty',
        url: 'editor-tokenOperator',
        variable: 'editor-tokenVariable',
    },
};

function onError(error: Error) {
    console.error(error);
}

function MarkdownPlugin({ onChange }: { onChange: (markdown: string) => void }) {
    const [editor] = useLexicalComposerContext();

    useEffect(() => {
        return editor.registerUpdateListener(({ editorState }) => {
            editorState.read(() => {
                const markdown = $convertToMarkdownString();
                onChange(markdown);
            });
        });
    }, [editor, onChange]);

    return null;
}

function InitialValuePlugin({ value }: { value: string }) {
    const [editor] = useLexicalComposerContext();

    useEffect(() => {
        if (value) {
            editor.update(() => {
                $convertFromMarkdownString(value);
            });
        }
    }, [editor, value]);

    return null;
}

interface RichTextEditorProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    label?: string;
    error?: string;
    height?: number;
}

export default function RichTextEditor({
    value,
    onChange,
    placeholder = 'Enter some rich text...',
    label,
    error,
    height = 400,
}: RichTextEditorProps) {
    const initialConfig = {
        namespace: 'MyEditor',
        theme,
        onError,
        nodes: [
            HeadingNode,
            ListNode,
            ListItemNode,
            QuoteNode,
            CodeNode,
            CodeHighlightNode,
            TableNode,
            TableCellNode,
            TableRowNode,
            AutoLinkNode,
            LinkNode,
        ],
    };

    return (
        <div className="space-y-2">
            {label && <Label className="text-sm font-medium text-gray-700">{label}</Label>}

            <div className={`rounded-md border ${error ? 'border-red-500' : 'border-gray-300'}`}>
                <LexicalComposer initialConfig={initialConfig}>
                    <div className="editor-container">
                        <LexicalToolbar />
                        <div className="editor-inner">
                            <RichTextPlugin
                                contentEditable={<ContentEditable className="editor-input" style={{ minHeight: `${height}px` }} />}
                                placeholder={<div className="editor-placeholder">{placeholder}</div>}
                                ErrorBoundary={LexicalErrorBoundary}
                            />
                            <HistoryPlugin />
                            <AutoFocusPlugin />
                            <ListPlugin />
                            <LinkPlugin />
                            <CheckListPlugin />
                            <TabIndentationPlugin />
                            <MarkdownShortcutPlugin />
                            <MarkdownPlugin onChange={onChange} />
                            <InitialValuePlugin value={value} />
                        </div>
                    </div>
                </LexicalComposer>
            </div>

            {error && <p className="text-sm text-red-500">{error}</p>}

            <style jsx global>{`
                .editor-container {
                    background: #fff;
                    border-radius: 6px;
                    color: #000;
                    position: relative;
                    line-height: 20px;
                    font-weight: 400;
                    text-align: left;
                    border-top-left-radius: 10px;
                    border-top-right-radius: 10px;
                }

                .editor-inner {
                    background: #fff;
                    position: relative;
                }

                .editor-input {
                    min-height: ${height}px;
                    resize: none;
                    font-size: 15px;
                    caret-color: rgb(5, 5, 5);
                    position: relative;
                    tab-size: 1;
                    outline: 0;
                    padding: 15px 10px;
                    caret-color: #444;
                }

                .editor-placeholder {
                    color: #999;
                    overflow: hidden;
                    position: absolute;
                    text-overflow: ellipsis;
                    top: 15px;
                    left: 10px;
                    font-size: 15px;
                    user-select: none;
                    display: inline-block;
                    pointer-events: none;
                }

                .editor-paragraph {
                    margin: 0;
                    margin-bottom: 8px;
                    position: relative;
                }

                .editor-paragraph:last-child {
                    margin-bottom: 0;
                }

                .editor-heading-h1 {
                    font-size: 24px;
                    color: rgb(5, 5, 5);
                    font-weight: 700;
                    margin: 0;
                    margin-bottom: 12px;
                    padding: 0;
                }

                .editor-heading-h2 {
                    font-size: 20px;
                    color: rgb(5, 5, 5);
                    font-weight: 700;
                    margin: 0;
                    margin-top: 10px;
                    margin-bottom: 8px;
                    padding: 0;
                }

                .editor-heading-h3 {
                    font-size: 18px;
                    color: rgb(5, 5, 5);
                    font-weight: 600;
                    margin: 0;
                    margin-top: 10px;
                    margin-bottom: 6px;
                    padding: 0;
                }

                .editor-quote {
                    margin: 0;
                    margin-left: 20px;
                    margin-bottom: 10px;
                    font-size: 15px;
                    color: rgb(101, 103, 107);
                    border-left-color: rgb(206, 208, 212);
                    border-left-width: 4px;
                    border-left-style: solid;
                    padding-left: 16px;
                }

                .editor-list-ol {
                    padding: 0;
                    margin: 0;
                    margin-left: 16px;
                }

                .editor-list-ul {
                    padding: 0;
                    margin: 0;
                    margin-left: 16px;
                }

                .editor-listitem {
                    margin: 8px 32px 8px 32px;
                }

                .editor-nested-listitem {
                    list-style-type: none;
                }

                .editor-text-bold {
                    font-weight: bold;
                }

                .editor-text-italic {
                    font-style: italic;
                }

                .editor-text-underline {
                    text-decoration: underline;
                }

                .editor-text-strikethrough {
                    text-decoration: line-through;
                }

                .editor-text-underlineStrikethrough {
                    text-decoration: underline line-through;
                }

                .editor-text-code {
                    background-color: rgb(240, 242, 245);
                    padding: 1px 0.25rem;
                    font-family: Menlo, Consolas, Monaco, monospace;
                    font-size: 94%;
                }

                .editor-link {
                    color: rgb(33, 111, 219);
                    text-decoration: none;
                }

                .editor-link:hover {
                    text-decoration: underline;
                    cursor: pointer;
                }

                .editor-code {
                    background-color: rgb(240, 242, 245);
                    font-family: Menlo, Consolas, Monaco, monospace;
                    display: block;
                    padding: 8px 8px 8px 52px;
                    line-height: 1.53;
                    font-size: 13px;
                    margin: 0;
                    margin-top: 8px;
                    margin-bottom: 8px;
                    tab-size: 2;
                    overflow-x: auto;
                    position: relative;
                }
            `}</style>

            <div className="text-xs text-gray-500">
                <p>Modern rich text editor with Markdown support. Use **bold**, *italic*, # headings, and more!</p>
            </div>
        </div>
    );
}
