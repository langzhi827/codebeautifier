/**
 * Created by harrylang on 16/11/11.
 */

var Element = require('./Element');
var Tag = require('./Tag');
var Token = require('./Token');
var createTokenizer = require('../codeMirrorTokenizer');
var AbortTokenization = require('../AbortTokenization');
var peekLast = require('../util').peekLast;

module.exports = HTMLModel;
/**
 * HTMLModel
 * @param text
 * @constructor
 */
function HTMLModel(text) {
    this._state = HTMLModel.ParseState.Initial;
    this._document = new Element("document");
    this._document.openTag = new Tag("document", 0, 0, {}, true, false);
    this._document.closeTag = new Tag("document", text.length, text.length, {}, false, false);

    this._stack = [this._document];

    this._tokens = [];
    this._tokenIndex = 0;
    this._build(text);
}

HTMLModel.prototype = {
    /**
     *
     * @param text
     * @private
     */
    _build: function (text) {
        var tokenizer = createTokenizer("text/html");
        var lastOffset = 0;
        var lowerCaseText = text.toLowerCase();
        while (true) {
            tokenizer(text.substring(lastOffset), processToken.bind(this, lastOffset));

            if (lastOffset >= text.length) {
                break;
            }
            var element = peekLast(this._stack);
            lastOffset = lowerCaseText.indexOf("</" + element.name, lastOffset);
            if (lastOffset === -1) {
                lastOffset = text.length;
            }
            var tokenStart = element.openTag.endOffset;
            var tokenEnd = lastOffset;
            var tokenValue = text.substring(tokenStart, tokenEnd);
            this._tokens.push(new Token(tokenValue, [], tokenStart, tokenEnd));
        }
        while (this._stack.length > 1) {
            var element = peekLast(this._stack);
            this._popElement(new Tag(element.name, text.length, text.length, {}, false, false));
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

            var tokenType = type ? type.split(" ") : [];
            var token = new Token(tokenValue, tokenType, tokenStart, tokenEnd);
            this._tokens.push(token);
            this._updateDOM(token);

            var element = peekLast(this._stack);
            if (element && (element.name === "script" || element.name === "style") && element.openTag.endOffset === lastOffset) {
                return AbortTokenization;
            }
        }
    },
    /**
     *
     * @param token
     * @private
     */
    _updateDOM: function (token) {
        var S = HTMLModel.ParseState;
        var value = token.value;
        var type = token.type;
        switch (this._state) {
            case S.Initial:
                if (type.indexOf("bracket") > -1 && (value === "<" || value === "</")) {
                    this._onStartTag(token);
                    this._state = S.Tag;
                }
                return;
            case S.Tag:
                if (type.indexOf("tag") > -1 && !(type.indexOf("bracket") > -1)) {
                    this._tagName = value.trim().toLowerCase();
                } else if (type.indexOf("attribute") > -1) {
                    this._attributeName = value.trim().toLowerCase();
                    this._attributes[this._attributeName] = "";
                    this._state = S.AttributeName;
                } else if (type.indexOf("bracket") > -1 && (value === ">" || value === "/>")) {
                    this._onEndTag(token);
                    this._state = S.Initial;
                }
                return;
            case S.AttributeName:
                if (!type.size && value === "=") {
                    this._state = S.AttributeValue;
                } else if (type.indexOf("bracket") > -1 && (value === ">" || value === "/>")) {
                    this._onEndTag(token);
                    this._state = S.Initial;
                }
                return;
            case S.AttributeValue:
                if (type.indexOf("string") > -1) {
                    this._attributes[this._attributeName] = value;
                    this._state = S.Tag;
                } else if (type.indexOf("bracket") > -1 && (value === ">" || value === "/>")) {
                    this._onEndTag(token);
                    this._state = S.Initial;
                }
                return;
        }
    },
    /**
     *
     * @param token
     * @private
     */
    _onStartTag: function (token) {
        this._tagName = "";
        this._tagStartOffset = token.startOffset;
        this._tagEndOffset = null;
        this._attributes = {};
        this._attributeName = "";
        this._isOpenTag = token.value === "<";
    },
    /**
     *
     * @param token
     * @private
     */
    _onEndTag: function (token) {
        this._tagEndOffset = token.endOffset;
        var selfClosingTag = token.value === "/>" || HTMLModel.SelfClosingTags.indexOf(this._tagName) > -1;
        var tag = new Tag(this._tagName, this._tagStartOffset, this._tagEndOffset, this._attributes, this._isOpenTag, selfClosingTag);
        this._onTagComplete(tag);
    },
    /**
     *
     * @param tag
     * @private
     */
    _onTagComplete: function (tag) {
        if (tag.isOpenTag) {
            var topElement = peekLast(this._stack);
            if (topElement !== this._document && topElement.openTag.selfClosingTag)
                this._popElement(autocloseTag(topElement, topElement.openTag.endOffset));
            else if ((topElement.name in HTMLModel.AutoClosingTags) && HTMLModel.AutoClosingTags[topElement.name].indexOf(tag.name) > -1)
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
            return new Tag(element.name, offset, offset, {}, false, false);
        }
    },
    /**
     *
     * @param closeTag
     * @private
     */
    _popElement: function (closeTag) {
        var element = this._stack.pop();
        element.closeTag = closeTag;
    },
    /**
     *
     * @param openTag
     * @private
     */
    _pushElement: function (openTag) {
        var topElement = peekLast(this._stack);
        var newElement = new Element(openTag.name);
        newElement.parent = topElement;
        topElement.children.push(newElement);
        newElement.openTag = openTag;
        this._stack.push(newElement);
    },
    /**
     *
     * @returns {*}
     */
    peekToken: function () {
        return this._tokenIndex < this._tokens.length ? this._tokens[this._tokenIndex] : null;
    },
    /**
     *
     * @returns {*}
     */
    nextToken: function () {
        return this._tokens[this._tokenIndex++];
    },
    /**
     *
     * @returns {*}
     */
    document: function () {
        return this._document;
    }

};

HTMLModel.SelfClosingTags = [
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
];

// @see https://www.w3.org/TR/html/syntax.html 8.1.2.4 Optional tags
HTMLModel.AutoClosingTags = {
    "head": ["body"],
    "li": ["li"],
    "dt": ["dt", "dd"],
    "dd": ["dt", "dd"],
    "p": ["address", "article", "aside", "blockquote", "div", "dl", "fieldset", "footer", "form", "h1", "h2", "h3", "h4", "h5", "h6", "header", "hgroup", "hr", "main", "nav", "ol", "p", "pre", "section", "table", "ul"],
    "rb": ["rb", "rt", "rtc", "rp"],
    "rt": ["rb", "rt", "rtc", "rp"],
    "rtc": ["rb", "rtc", "rp"],
    "rp": ["rb", "rt", "rtc", "rp"],
    "optgroup": ["optgroup"],
    "option": ["option", "optgroup"],
    "colgroup": ["colgroup"],
    "thead": ["tbody", "tfoot"],
    "tbody": ["tbody", "tfoot"],
    "tfoot": ["tbody"],
    "tr": ["tr"],
    "td": ["td", "th"],
    "th": ["td", "th"],
};

HTMLModel.ParseState = {
    Initial: "Initial",
    Tag: "Tag",
    AttributeName: "AttributeName",
    AttributeValue: "AttributeValue"
};



