/**
 * Created by harrylang on 16/11/14.
 */
var JavaScriptFormatter = require('./JavaScriptFormatter');
var CSSFormatter = require('./CSSFormatter');
var HTMLModel = require('./HTMLModel/HTMLModel');
var isWhitespace = require('./util').isWhitespace;

module.exports = HTMLFormatter;
/**
 * HTML格式化解析
 * @param builder
 * @constructor
 */
function HTMLFormatter(builder) {
    this._builder = builder;
    this._jsFormatter = new JavaScriptFormatter(builder);
    this._cssFormatter = new CSSFormatter(builder);
}

HTMLFormatter.prototype = {
    /**
     *
     * @param text
     * @param lineEndings
     */
    format: function (text, lineEndings) {
        this._text = text;
        this._lineEndings = lineEndings;
        this._model = new HTMLModel(text);
        this._walk(this._model.document());
    },
    /**
     *
     * @param element
     * @param offset
     * @private
     */
    _formatTokensTill: function (element, offset) {
        while (this._model.peekToken() && this._model.peekToken().startOffset < offset) {
            var token = this._model.nextToken();
            this._formatToken(element, token);
        }
    },
    /**
     *
     * @param element
     * @private
     */
    _walk: function (element) {
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
    },
    /**
     *
     * @param element
     * @private
     */
    _beforeOpenTag: function (element) {
        if (!element.children.length || element === this._model.document()) {
            return;
        }
        this._builder.addNewLine();
    },
    /**
     *
     * @param element
     * @private
     */
    _afterOpenTag: function (element) {
        if (!element.children.length || element === this._model.document()) {
            return;
        }
        this._builder.increaseNestingLevel();
        this._builder.addNewLine();
    },
    /**
     *
     * @param element
     * @private
     */
    _beforeCloseTag: function (element) {
        if (!element.children.length || element === this._model.document())
            return;
        this._builder.decreaseNestingLevel();
        this._builder.addNewLine();
    },
    /**
     *
     * @param element
     * @private
     */
    _afterCloseTag: function (element) {
        this._builder.addNewLine();
    },
    /**
     *
     * @param element
     * @param token
     * @private
     */
    _formatToken: function (element, token) {
        if (isWhitespace(token.value)) {
            return;
        }
        if (token.type.indexOf("comment") > -1 || token.type.indexOf("meta") > -1) {
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
            var mimeType = element.openTag.attributes["type"] ? element.openTag.attributes["type"].toLowerCase() : null;
            if (!mimeType || HTMLFormatter.SupportedJavaScriptMimeTypes.indexOf(mimeType) > -1) {
                this._jsFormatter.format(this._text, this._lineEndings, token.startOffset, token.endOffset);
            } else {
                this._builder.addToken(token.value, token.startOffset);
                this._builder.addNewLine();
            }
            this._builder.decreaseNestingLevel();
            return;
        }

        if (!isBodyToken && token.type.indexOf("attribute") > -1) {
            this._builder.addSoftSpace();
        }

        this._builder.addToken(token.value, token.startOffset);
    }
};


HTMLFormatter.SupportedJavaScriptMimeTypes = [
    "text/javascript",
    "text/ecmascript",
    "application/javascript",
    "application/ecmascript"
];
