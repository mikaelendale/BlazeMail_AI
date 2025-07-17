'use client';

export class ItalicTool {
    static get isInline() {
        return true;
    }

    static get title() {
        return 'Italic';
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
        this.tag = 'I';
        this.class = 'cdx-italic';
    }

    render() {
        this.button = document.createElement('button');
        this.button.type = 'button';
        this.button.innerHTML = `<svg width="4" height="14"><line x1="2" y1="2" x2="2" y2="12" stroke="currentColor" strokeWidth="2" transform="skewX(-15)"/></svg>`;
        this.button.classList.add('ce-inline-tool');
        this.button.classList.add('ce-inline-tool--italic');

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
        const italic = document.createElement(this.tag);
        italic.classList.add(this.class);
        italic.appendChild(selectedText);
        range.insertNode(italic);
        this.api.selection.expandToTag(italic);
    }

    unwrap(range) {
        const italic = this.api.selection.findParentTag(this.tag, this.class);
        const text = range.extractContents();
        italic.remove();
        range.insertNode(text);
    }

    checkState() {
        const italic = this.api.selection.findParentTag(this.tag);
        this.state = !!italic;
    }

    static get sanitize() {
        return {
            i: {},
            em: {
                class: 'cdx-italic',
            },
        };
    }
}
