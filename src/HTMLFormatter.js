/**
 * Created by harrylang on 16/11/9.
 */

import JavaScriptFormatter from './JavaScriptFormatter';
import CSSFormatter from './CSSFormatter';
import HTMLModel from './HTMLModel/HTMLModel';
import {isWhitespace} from './util';

/**
 *
 */
class HTMLFormatter {
    constructor(builder) {
        this._builder = builder;
        this._jsFormatter = new JavaScriptFormatter(builder);
        this._cssFormatter = new CSSFormatter(builder);
    }

    format(text, lineEndings) {
        this._text = text;
        this._lineEndings = lineEndings;
        this._model = new HTMLModel(text);
        this._walk(this._model.document());
    }

    _formatTokensTill(element, offset) {
        while (this._model.peekToken() && this._model.peekToken().startOffset < offset) {
            var token = this._model.nextToken();
            this._formatToken(element, token);
        }
    }

    _walk(element) {
        if (element.parent) {
            this._formatTokensTill(element.parent, element.openTag.startOffset);
        }
        this._beforeOpenTag(element);
        this._formatTokensTill(element, element.openTag.endOffset);
        this._afterOpenTag(element);
        for (var i = 0; i < element.children.length; ++i) {
            this._walk(element.children[i]);
        }
        this._formatTokensTill(element, element.closeTag.startOffset);
        this._beforeCloseTag(element);
        this._formatTokensTill(element, element.closeTag.endOffset);
        this._afterCloseTag(element);
    }

    _beforeOpenTag(element) {
        if (!element.children.length || element === this._model.document()) {
            return;
        }
        this._builder.addNewLine();
    }

    _afterOpenTag(element) {
        if (!element.children.length || element === this._model.document()) {
            return;
        }
        this._builder.increaseNestingLevel();
        this._builder.addNewLine();
    }

    _beforeCloseTag(element) {
        if (!element.children.length || element === this._model.document())
            return;
        this._builder.decreaseNestingLevel();
        this._builder.addNewLine();
    }

    _afterCloseTag(element) {
        this._builder.addNewLine();
    }

    _formatToken(element, token) {
        if (isWhitespace(token.value)) {
            return;
        }
        if (token.type.has("comment") || token.type.has("meta")) {
            this._builder.addNewLine();
            this._builder.addToken(token.value.trim(), token.startOffset);
            this._builder.addNewLine();
            return;
        }

        var isBodyToken = element.openTag.endOffset <= token.startOffset && token.startOffset < element.closeTag.startOffset;
        if (isBodyToken && element.name === "style") {
            this._builder.addNewLine();
            this._builder.increaseNestingLevel();
            this._cssFormatter.format(this._text, this._lineEndings, token.startOffset, token.endOffset);
            this._builder.decreaseNestingLevel();
            return;
        }
        if (isBodyToken && element.name === "script") {
            this._builder.addNewLine();
            this._builder.increaseNestingLevel();
            var mimeType = element.openTag.attributes.has("type") ? element.openTag.attributes.get("type").toLowerCase() : null;
            if (!mimeType || HTMLFormatter.SupportedJavaScriptMimeTypes.has(mimeType)) {
                this._jsFormatter.format(this._text, this._lineEndings, token.startOffset, token.endOffset);
            } else {
                this._builder.addToken(token.value, token.startOffset);
                this._builder.addNewLine();
            }
            this._builder.decreaseNestingLevel();
            return;
        }

        if (!isBodyToken && token.type.has("attribute")) {
            this._builder.addSoftSpace();
        }

        this._builder.addToken(token.value, token.startOffset);
    }

}

HTMLFormatter.SupportedJavaScriptMimeTypes = new Set([
    "text/javascript",
    "text/ecmascript",
    "application/javascript",
    "application/ecmascript"
]);

export default HTMLFormatter;