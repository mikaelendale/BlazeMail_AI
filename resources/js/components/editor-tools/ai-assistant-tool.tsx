'use client';

export class AIAssistantTool {
    static get isInline() {
        return true;
    }

    static get title() {
        return 'AI Assistant';
    }

    constructor({ api, config }) {
        this.api = api;
        this.config = config;
        this.button = null;
        this.onAISuggestion = config.onAISuggestion || (() => {});
    }

    render() {
        this.button = document.createElement('button');
        this.button.type = 'button';
        this.button.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>`;
        this.button.classList.add('ce-inline-tool');
        this.button.classList.add('ce-inline-tool--ai');
        this.button.title = 'Ask AI';

        return this.button;
    }

    surround(range) {
        const selectedText = range.toString();
        if (selectedText) {
            this.showAIPopover(selectedText, range);
        }
    }

    showAIPopover(selectedText, range) {
        // Trigger the AI popover through the config callback
        this.onAISuggestion(selectedText, range);
    }

    checkState() {
        // AI tool doesn't have a persistent state
        return false;
    }
}
