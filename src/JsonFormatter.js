/**
 * Created by harrylang on 16/11/11.
 */

var createTokenizer = require('./codeMirrorTokenizer');
var lowerBound = require('./util');

/**
 * JSON格式化构造
 * @param builder
 * @constructor
 */
function JsonFormatter(builder) {
    this._builder = builder;
}

JsonFormatter.prototype = {
    /**
     * 格式化入口
     * @param text  被格式化内容
     * @param lineEndings   所有换行(\n)结束位置
     * @param fromOffset    解析起始偏移量
     * @param toOffset      解析结束偏移量
     */
    format: function (text, lineEndings, fromOffset, toOffset) {
        this._lineEndings = lineEndings;    // 所有换行(\n)结束位置
        this._fromOffset = fromOffset;  // 解析起始偏移量
        this._toOffset = toOffset;  //  解析结束偏移量
        this._state = {};
        this._preText = '';
        var tokenize = createTokenizer("text/javascript");
        // 是否在单词之间添加空格
        var oldEnforce = this._builder.setEnforceSpaceBetweenWords(false);
        tokenize(text.substring(this._fromOffset, this._toOffset), this._tokenCallback.bind(this));
        this._builder.setEnforceSpaceBetweenWords(oldEnforce);
    },
    /**
     *
     * @param token
     * @param type
     * @param startPosition
     * @private
     */
    _tokenCallback: function (token, type, startPosition) {
        startPosition += this._fromOffset;  // 重置当前word在整个文本中的起始位置

        if (token === "\n") {
            return;
        }

        if (token === "}" || token === "]") {
            if (this._state.afterClosingBrace && this._preText !== ',') {
                this._builder.addNewLine(true);
            }
            this._state.afterClosingBrace = false;
        }

        if (token === "{" || token === "[") {
            this._builder.addToken(token, startPosition);
            this._builder.addNewLine();
            this._builder.increaseNestingLevel();
            this._state.afterClosingBrace = true;

            this._preText = token;
            return;
        } else if (token === ":") {
            this._builder.addToken(token, startPosition);
            this._builder.addSoftSpace();

            this._preText = token;
            return;
        } else if (token === ",") {
            this._builder.addToken(token, startPosition);
            this._builder.addNewLine();

            this._preText = token;
            return;
        } else if (token === "}" || token === "]") {
            this._builder.decreaseNestingLevel();

            if (this._preText === '}' || this._preText === ']') {
                this._builder.addNewLine();
            }
            this._builder.addToken(token, startPosition);

            this._preText = token;
            return;
        }

        this._builder.addToken(token, startPosition);

        this._preText = token;

    }
};

module.exports = JsonFormatter;