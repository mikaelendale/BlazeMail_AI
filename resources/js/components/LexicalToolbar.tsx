'use client';

import { Button } from '@/Components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/Components/ui/select';
import { $isListNode, INSERT_ORDERED_LIST_COMMAND, INSERT_UNORDERED_LIST_COMMAND, REMOVE_LIST_COMMAND } from '@lexical/list';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $isHeadingNode } from '@lexical/rich-text';
import { $setBlocksType } from '@lexical/selection';
import { $findMatchingParent, mergeRegister } from '@lexical/utils';
import {
    $getSelection,
    $isRangeSelection,
    CAN_REDO_COMMAND,
    CAN_UNDO_COMMAND,
    FORMAT_ELEMENT_COMMAND,
    FORMAT_TEXT_COMMAND,
    REDO_COMMAND,
    SELECTION_CHANGE_COMMAND,
    UNDO_COMMAND,
} from 'lexical';
import { AlignCenter, AlignJustify, AlignLeft, AlignRight, Bold, Code, Italic, Redo, Strikethrough, Underline, Undo } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

const LowPriority = 1;

const supportedBlockTypes = new Set(['paragraph', 'quote', 'code', 'h1', 'h2', 'h3', 'h4', 'h5', 'ul', 'ol']);

const blockTypeToBlockName = {
    code: 'Code Block',
    h1: 'Large Heading',
    h2: 'Medium Heading',
    h3: 'Small Heading',
    h4: 'Heading',
    h5: 'Heading',
    ol: 'Numbered List',
    paragraph: 'Normal',
    quote: 'Quote',
    ul: 'Bulleted List',
};

function Divider() {
    return <div className="mx-1 h-6 w-px bg-gray-300" />;
}

export function LexicalToolbar() {
    const [editor] = useLexicalComposerContext();
    const toolbarRef = useRef(null);
    const [canUndo, setCanUndo] = useState(false);
    const [canRedo, setCanRedo] = useState(false);
    const [blockType, setBlockType] = useState('paragraph');
    const [selectedElementKey, setSelectedElementKey] = useState(null);
    const [isBold, setIsBold] = useState(false);
    const [isItalic, setIsItalic] = useState(false);
    const [isUnderline, setIsUnderline] = useState(false);
    const [isStrikethrough, setIsStrikethrough] = useState(false);
    const [isCode, setIsCode] = useState(false);

    const updateToolbar = useCallback(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
            const anchorNode = selection.anchor.getNode();
            const element = anchorNode.getKey() === 'root' ? anchorNode : anchorNode.getTopLevelElementOrThrow();
            const elementKey = element.getKey();
            const elementDOM = editor.getElementByKey(elementKey);
            if (elementDOM !== null) {
                setSelectedElementKey(elementKey);
                if ($isListNode(element)) {
                    const parentList = $findMatchingParent(anchorNode, (parent) => $isListNode(parent) && parent.getParent()?.getKey() === 'root');
                    const type = parentList ? parentList.getTag() : element.getTag();
                    setBlockType(type);
                } else {
                    const type = $isHeadingNode(element) ? element.getTag() : element.getType();
                    setBlockType(type);
                }
            }
            // Update text format
            setIsBold(selection.hasFormat('bold'));
            setIsItalic(selection.hasFormat('italic'));
            setIsUnderline(selection.hasFormat('underline'));
            setIsStrikethrough(selection.hasFormat('strikethrough'));
            setIsCode(selection.hasFormat('code'));
        }
    }, [editor]);

    useEffect(() => {
        return mergeRegister(
            editor.registerUpdateListener(({ editorState }) => {
                editorState.read(() => {
                    updateToolbar();
                });
            }),
            editor.registerCommand(
                SELECTION_CHANGE_COMMAND,
                (_payload, newEditor) => {
                    updateToolbar();
                    return false;
                },
                LowPriority,
            ),
            editor.registerCommand(
                CAN_UNDO_COMMAND,
                (payload) => {
                    setCanUndo(payload);
                    return false;
                },
                LowPriority,
            ),
            editor.registerCommand(
                CAN_REDO_COMMAND,
                (payload) => {
                    setCanRedo(payload);
                    return false;
                },
                LowPriority,
            ),
        );
    }, [editor, updateToolbar]);

    const formatParagraph = () => {
        if (blockType !== 'paragraph') {
            editor.update(() => {
                const selection = $getSelection();
                if ($isRangeSelection(selection)) {
                    $setBlocksType(selection, () => $createParagraphNode());
                }
            });
        }
    };

    const formatLargeHeading = () => {
        if (blockType !== 'h1') {
            editor.update(() => {
                const selection = $getSelection();
                if ($isRangeSelection(selection)) {
                    $setBlocksType(selection, () => $createHeadingNode('h1'));
                }
            });
        }
    };

    const formatSmallHeading = () => {
        if (blockType !== 'h2') {
            editor.update(() => {
                const selection = $getSelection();
                if ($isRangeSelection(selection)) {
                    $setBlocksType(selection, () => $createHeadingNode('h2'));
                }
            });
        }
    };

    const formatBulletList = () => {
        if (blockType !== 'ul') {
            editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined);
        } else {
            editor.dispatchCommand(REMOVE_LIST_COMMAND, undefined);
        }
    };

    const formatNumberedList = () => {
        if (blockType !== 'ol') {
            editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined);
        } else {
            editor.dispatchCommand(REMOVE_LIST_COMMAND, undefined);
        }
    };

    const formatQuote = () => {
        if (blockType !== 'quote') {
            editor.update(() => {
                const selection = $getSelection();
                if ($isRangeSelection(selection)) {
                    $setBlocksType(selection, () => $createQuoteNode());
                }
            });
        }
    };

    const formatCode = () => {
        if (blockType !== 'code') {
            editor.update(() => {
                const selection = $getSelection();
                if ($isRangeSelection(selection)) {
                    $setBlocksType(selection, () => $createCodeNode());
                }
            });
        }
    };

    return (
        <div className="toolbar flex items-center gap-1 border-b bg-gray-50 p-2" ref={toolbarRef}>
            <Button
                variant="ghost"
                size="sm"
                disabled={!canUndo}
                onClick={() => {
                    editor.dispatchCommand(UNDO_COMMAND, undefined);
                }}
                className="h-8 w-8 p-0"
                aria-label="Undo"
            >
                <Undo className="h-4 w-4" />
            </Button>
            <Button
                variant="ghost"
                size="sm"
                disabled={!canRedo}
                onClick={() => {
                    editor.dispatchCommand(REDO_COMMAND, undefined);
                }}
                className="h-8 w-8 p-0"
                aria-label="Redo"
            >
                <Redo className="h-4 w-4" />
            </Button>
            <Divider />
            {supportedBlockTypes.has(blockType) && (
                <>
                    <Select
                        value={blockType}
                        onValueChange={(value) => {
                            if (value === 'paragraph') formatParagraph();
                            else if (value === 'h1') formatLargeHeading();
                            else if (value === 'h2') formatSmallHeading();
                            else if (value === 'ul') formatBulletList();
                            else if (value === 'ol') formatNumberedList();
                            else if (value === 'quote') formatQuote();
                            else if (value === 'code') formatCode();
                        }}
                    >
                        <SelectTrigger className="h-8 w-[140px]">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="paragraph">Normal</SelectItem>
                            <SelectItem value="h1">Heading 1</SelectItem>
                            <SelectItem value="h2">Heading 2</SelectItem>
                            <SelectItem value="h3">Heading 3</SelectItem>
                            <SelectItem value="ul">Bullet List</SelectItem>
                            <SelectItem value="ol">Numbered List</SelectItem>
                            <SelectItem value="quote">Quote</SelectItem>
                            <SelectItem value="code">Code Block</SelectItem>
                        </SelectContent>
                    </Select>
                    <Divider />
                </>
            )}
            <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                    editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'bold');
                }}
                className={`h-8 w-8 p-0 ${isBold ? 'bg-gray-200' : ''}`}
                aria-label="Format Bold"
            >
                <Bold className="h-4 w-4" />
            </Button>
            <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                    editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'italic');
                }}
                className={`h-8 w-8 p-0 ${isItalic ? 'bg-gray-200' : ''}`}
                aria-label="Format Italics"
            >
                <Italic className="h-4 w-4" />
            </Button>
            <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                    editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'underline');
                }}
                className={`h-8 w-8 p-0 ${isUnderline ? 'bg-gray-200' : ''}`}
                aria-label="Format Underline"
            >
                <Underline className="h-4 w-4" />
            </Button>
            <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                    editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'strikethrough');
                }}
                className={`h-8 w-8 p-0 ${isStrikethrough ? 'bg-gray-200' : ''}`}
                aria-label="Format Strikethrough"
            >
                <Strikethrough className="h-4 w-4" />
            </Button>
            <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                    editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'code');
                }}
                className={`h-8 w-8 p-0 ${isCode ? 'bg-gray-200' : ''}`}
                aria-label="Insert Code"
            >
                <Code className="h-4 w-4" />
            </Button>
            <Divider />
            <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                    editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'left');
                }}
                className="h-8 w-8 p-0"
                aria-label="Left Align"
            >
                <AlignLeft className="h-4 w-4" />
            </Button>
            <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                    editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'center');
                }}
                className="h-8 w-8 p-0"
                aria-label="Center Align"
            >
                <AlignCenter className="h-4 w-4" />
            </Button>
            <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                    editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'right');
                }}
                className="h-8 w-8 p-0"
                aria-label="Right Align"
            >
                <AlignRight className="h-4 w-4" />
            </Button>
            <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                    editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'justify');
                }}
                className="h-8 w-8 p-0"
                aria-label="Justify Align"
            >
                <AlignJustify className="h-4 w-4" />
            </Button>
        </div>
    );
}

// Helper functions that need to be imported from lexical
function $createParagraphNode() {
    const { $createParagraphNode } = require('lexical');
    return $createParagraphNode();
}

function $createHeadingNode(headingTag: string) {
    const { $createHeadingNode } = require('@lexical/rich-text');
    return $createHeadingNode(headingTag);
}

function $createQuoteNode() {
    const { $createQuoteNode } = require('@lexical/rich-text');
    return $createQuoteNode();
}

function $createCodeNode() {
    const { $createCodeNode } = require('@lexical/code');
    return $createCodeNode();
}
