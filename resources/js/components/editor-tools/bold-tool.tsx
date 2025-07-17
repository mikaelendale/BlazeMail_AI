'use client';

export class BoldTool {
    static get isInline() {
        return true;
    }

    static get title() {
        return 'Bold';
    }

    get state() {
        return this._state;
    }

    set state(state) {
        this._state = state;
        this.button.classList.toggle('ce-inline-tool--active', state);
    }

    constructor({ api }) {
        this.api = api;
        this.button = null;
        this._state = false;
        this.tag = 'B';
        this.class = 'cdx-bold';
    }

    render() {
        this.button = document.createElement('button');
        this.button.type = 'button';
        this.button.innerHTML = `<svg width="12" height="14"><path d="M7.6 8.15c1.14 0 2.08-.37 2.08-1.52 0-1.15-.94-1.52-2.08-1.52H4.5v3.04h3.1zm-.45 4.85c1.4 0 2.35-.53 2.35-1.8 0-1.27-.95-1.8-2.35-1.8H4.5V13h2.65zM2 2v12h5.65c2.9 0 4.85-1.55 4.85-4.05 0-1.6-.9-2.85-2.35-3.3C11.15 6.2 12 5.05 12 3.5 12 1.4 10.25 2 7.65 2H2z"/></svg>`;
        this.button.classList.add('ce-inline-tool');
        this.button.classList.add('ce-inline-tool--bold');

        return this.button;
    }

    surround(range) {
        if (this.state) {
            this.unwrap(range);
        } else {
            this.wrap(range);
        }
    }

    wrap(range) {
        const selectedText = range.extractContents();
        const bold = document.createElement(this.tag);
        bold.classList.add(this.class);
        bold.appendChild(selectedText);
        range.insertNode(bold);
        this.api.selection.expandToTag(bold);
    }

    unwrap(range) {
        const bold = this.api.selection.findParentTag(this.tag, this.class);
        const text = range.extractContents();
        bold.remove();
        range.insertNode(text);
    }

    checkState() {
        const bold = this.api.selection.findParentTag(this.tag);
        this.state = !!bold;
    }

    static get sanitize() {
        return {
            b: {},
            strong: {
                class: 'cdx-bold',
            },
        };
    }
}
