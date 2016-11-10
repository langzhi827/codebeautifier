/**
 * Created by harrylang on 16/11/9.
 */

import Element from './Element';
import Tag from './Tag';
import Token from './Token';
import createTokenizer from '../CodeMirrorTokenizer';
import AbortTokenization from '../AbortTokenization';
import {peekLast} from '../util';

/**
 *
 */
export default class HTMLModel {
    constructor(text) {
        this._state = HTMLModel.ParseState.Initial;
        this._document = new Element("document");
        this._document.openTag = new Tag("document", 0, 0, new Map(), true, false);
        this._document.closeTag = new Tag("document", text.length, text.length, new Map(), false, false);

        this._stack = [this._document];

        this._tokens = [];
        this._tokenIndex = 0;
        this._build(text);
    }

    _build(text) {
        var tokenizer = createTokenizer("text/html");
        var lastOffset = 0;
        var lowerCaseText = text.toLowerCase();

        while (true) {
            tokenizer(text.substring(lastOffset), processToken.bind(this, lastOffset));

            if (lastOffset >= text.length)
                break;
            var element = peekLast(this._stack);
            lastOffset = lowerCaseText.indexOf("</" + element.name, lastOffset);
            if (lastOffset === -1)
                lastOffset = text.length;
            var tokenStart = element.openTag.endOffset;
            var tokenEnd = lastOffset;
            var tokenValue = text.substring(tokenStart, tokenEnd);
            this._tokens.push(new Token(tokenValue, new Set(), tokenStart, tokenEnd));
        }

        while (this._stack.length > 1) {
            var element = peekLast(this._stack);
            this._popElement(new Tag(element.name, text.length, text.length, new Map(), false, false));
        }

        /**
         * @param baseOffset
         * @param tokenValue
         * @param type
         * @param tokenStart
         * @param tokenEnd
         * @returns {*}
         */
        function processToken(baseOffset, tokenValue, type, tokenStart, tokenEnd) {
            tokenStart += baseOffset;
            tokenEnd += baseOffset;
            lastOffset = tokenEnd;

            var tokenType = type ? new Set(type.split(" ")) : new Set();
            var token = new Token(tokenValue, tokenType, tokenStart, tokenEnd);
            this._tokens.push(token);
            this._updateDOM(token);

            var element = peekLast(this._stack);
            if (element && (element.name === "script" || element.name === "style") && element.openTag.endOffset === lastOffset)
                return AbortTokenization;
        }
    }

    _updateDOM(token) {
        var S = HTMLModel.ParseState;
        var value = token.value;
        var type = token.type;
        switch (this._state) {
            case S.Initial:
                if (type.has("bracket") && (value === "<" || value === "</")) {
                    this._onStartTag(token);
                    this._state = S.Tag;
                }
                return;
            case S.Tag:
                if (type.has("tag") && !type.has("bracket")) {
                    this._tagName = value.trim().toLowerCase();
                } else if (type.has("attribute")) {
                    this._attributeName = value.trim().toLowerCase();
                    this._attributes.set(this._attributeName, "");
                    this._state = S.AttributeName;
                } else if (type.has("bracket") && (value === ">" || value === "/>")) {
                    this._onEndTag(token);
                    this._state = S.Initial;
                }
                return;
            case S.AttributeName:
                if (!type.size && value === "=") {
                    this._state = S.AttributeValue;
                } else if (type.has("bracket") && (value === ">" || value === "/>")) {
                    this._onEndTag(token);
                    this._state = S.Initial;
                }
                return;
            case S.AttributeValue:
                if (type.has("string")) {
                    this._attributes.set(this._attributeName, value);
                    this._state = S.Tag;
                } else if (type.has("bracket") && (value === ">" || value === "/>")) {
                    this._onEndTag(token);
                    this._state = S.Initial;
                }
                return;
        }
    }

    _onStartTag(token) {
        this._tagName = "";
        this._tagStartOffset = token.startOffset;
        this._tagEndOffset = null;
        this._attributes = new Map();
        this._attributeName = "";
        this._isOpenTag = token.value === "<";
    }

    _onEndTag(token) {
        this._tagEndOffset = token.endOffset;
        var selfClosingTag = token.value === "/>" || HTMLModel.SelfClosingTags.has(this._tagName);
        var tag = new Tag(this._tagName, this._tagStartOffset, this._tagEndOffset, this._attributes, this._isOpenTag, selfClosingTag);
        this._onTagComplete(tag);
    }

    _onTagComplete(tag) {
        if (tag.isOpenTag) {
            var topElement = peekLast(this._stack);
            if (topElement !== this._document && topElement.openTag.selfClosingTag)
                this._popElement(autocloseTag(topElement, topElement.openTag.endOffset));
            else if ((topElement.name in HTMLModel.AutoClosingTags) && HTMLModel.AutoClosingTags[topElement.name].has(tag.name))
                this._popElement(autocloseTag(topElement, tag.startOffset));
            this._pushElement(tag);
            return;
        }

        while (this._stack.length > 1 && peekLast(this._stack).name !== tag.name)
            this._popElement(autocloseTag(peekLast(this._stack), tag.startOffset));
        if (this._stack.length === 1)
            return;
        this._popElement(tag);

        /**
         * @param element
         * @param offset
         * @returns {*}
         */
        function autocloseTag(element, offset) {
            return new Tag(element.name, offset, offset, new Map(), false, false);
        }
    }

    _popElement(closeTag) {
        var element = this._stack.pop();
        element.closeTag = closeTag;
    }

    _pushElement(openTag) {
        var topElement = peekLast(this._stack);
        var newElement = new Element(openTag.name);
        newElement.parent = topElement;
        topElement.children.push(newElement);
        newElement.openTag = openTag;
        this._stack.push(newElement);
    }


    peekToken() {
        return this._tokenIndex < this._tokens.length ? this._tokens[this._tokenIndex] : null;
    }

    nextToken() {
        return this._tokens[this._tokenIndex++];
    }

    document() {
        return this._document;
    }

}

HTMLModel.SelfClosingTags = new Set([
    "area",
    "base",
    "br",
    "col",
    "command",
    "embed",
    "hr",
    "img",
    "input",
    "keygen",
    "link",
    "meta",
    "param",
    "source",
    "track",
    "wbr"
]);

// @see https://www.w3.org/TR/html/syntax.html 8.1.2.4 Optional tags
HTMLModel.AutoClosingTags = {
    "head": new Set(["body"]),
    "li": new Set(["li"]),
    "dt": new Set(["dt", "dd"]),
    "dd": new Set(["dt", "dd"]),
    "p": new Set(["address", "article", "aside", "blockquote", "div", "dl", "fieldset", "footer", "form", "h1", "h2", "h3", "h4", "h5", "h6", "header", "hgroup", "hr", "main", "nav", "ol", "p", "pre", "section", "table", "ul"]),
    "rb": new Set(["rb", "rt", "rtc", "rp"]),
    "rt": new Set(["rb", "rt", "rtc", "rp"]),
    "rtc": new Set(["rb", "rtc", "rp"]),
    "rp": new Set(["rb", "rt", "rtc", "rp"]),
    "optgroup": new Set(["optgroup"]),
    "option": new Set(["option", "optgroup"]),
    "colgroup": new Set(["colgroup"]),
    "thead": new Set(["tbody", "tfoot"]),
    "tbody": new Set(["tbody", "tfoot"]),
    "tfoot": new Set(["tbody"]),
    "tr": new Set(["tr"]),
    "td": new Set(["td", "th"]),
    "th": new Set(["td", "th"]),
};

HTMLModel.ParseState = {
    Initial: "Initial",
    Tag: "Tag",
    AttributeName: "AttributeName",
    AttributeValue: "AttributeValue"
};




