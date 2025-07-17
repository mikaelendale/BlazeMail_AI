'use client';

interface MarkdownRendererProps {
    content: string;
    className?: string;
}

export default function MarkdownRenderer({ content, className = '' }: MarkdownRendererProps) {
    const formatMarkdown = (markdown: string): string => {
        if (!markdown) return '';

        return (
            markdown
                // Headers
                .replace(/^### (.*$)/gim, '<h3 class="text-xl font-semibold mt-6 mb-4 text-gray-900">$1</h3>')
                .replace(/^## (.*$)/gim, '<h2 class="text-2xl font-bold mt-8 mb-6 text-gray-900">$1</h2>')
                .replace(/^# (.*$)/gim, '<h1 class="text-3xl font-bold mt-8 mb-6 text-gray-900">$1</h1>')

                // Bold
                .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-gray-900">$1</strong>')
                .replace(/__(.*?)__/g, '<strong class="font-semibold text-gray-900">$1</strong>')

                // Italic
                .replace(/\*(.*?)\*/g, '<em class="italic">$1</em>')
                .replace(/_(.*?)_/g, '<em class="italic">$1</em>')

                // Code blocks
                .replace(
                    /```([\s\S]*?)```/g,
                    '<pre class="bg-gray-100 border border-gray-200 p-4 rounded-lg overflow-x-auto my-6"><code class="text-sm font-mono text-gray-800">$1</code></pre>',
                )
                .replace(/`(.*?)`/g, '<code class="bg-gray-100 px-2 py-1 rounded text-sm font-mono text-gray-800">$1</code>')

                // Links
                .replace(
                    /\[([^\]]+)\]$$([^)]+)$$/g,
                    '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:text-blue-800 underline transition-colors">$1</a>',
                )

                // Images
                .replace(/!\[([^\]]*)\]$$([^)]+)$$/g, '<img src="$2" alt="$1" class="max-w-full h-auto rounded-lg my-4 shadow-sm" />')

                // Blockquotes
                .replace(
                    /^> (.*$)/gim,
                    '<blockquote class="border-l-4 border-gray-300 pl-4 py-2 my-4 italic text-gray-700 bg-gray-50">$1</blockquote>',
                )

                // Unordered lists
                .replace(/^\* (.*$)/gim, '<li class="mb-2 ml-4">$1</li>')
                .replace(/^- (.*$)/gim, '<li class="mb-2 ml-4">$1</li>')

                // Ordered lists
                .replace(/^\d+\. (.*$)/gim, '<li class="mb-2 ml-4">$1</li>')

                // Horizontal rules
                .replace(/^---$/gim, '<hr class="my-8 border-gray-300" />')
                .replace(/^\*\*\*$/gim, '<hr class="my-8 border-gray-300" />')

                // Line breaks - convert double newlines to paragraph breaks
                .replace(/\n\n/g, '</p><p class="mb-4 leading-relaxed text-gray-700">')

                // Single line breaks
                .replace(/\n/g, '<br>')

                // Wrap content in paragraphs if it doesn't start with a block element
                .replace(/^(?!<[h|l|p|d|u|b])(.+)/gm, '<p class="mb-4 leading-relaxed text-gray-700">$1</p>')

                // Clean up list items by wrapping them in proper ul/ol tags
                .replace(/(<li.*?<\/li>)/gs, (match) => {
                    // Check if it's already wrapped in a list
                    if (match.includes('class="mb-2 ml-4"')) {
                        return `<ul class="list-disc list-inside mb-4 space-y-1 ml-4">${match}</ul>`;
                    }
                    return match;
                })

                // Remove duplicate ul/ol tags
                .replace(/<\/ul>\s*<ul[^>]*>/g, '')
                .replace(/<\/ol>\s*<ol[^>]*>/g, '')

                // Clean up empty paragraphs
                .replace(/<p[^>]*><\/p>/g, '')
        );
    };

    return <div className={`prose prose-lg max-w-none ${className}`} dangerouslySetInnerHTML={{ __html: formatMarkdown(content) }} />;
}
