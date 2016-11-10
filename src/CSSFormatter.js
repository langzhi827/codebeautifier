/**
 * Created by harrylang on 16/11/8.
 */

import createTokenizer from './CodeMirrorTokenizer';
import {lowerBound} from "./util";

class CSSFormatter {
    constructor(builder) {
        this._builder = builder;
    }

    /**
     * 格式化入口
     * @param text  被格式化内容
     * @param lineEndings   所有换行(\n)结束位置
     * @param fromOffset    解析起始偏移量
     * @param toOffset  解析结束偏移量
     */
    format(text, lineEndings, fromOffset, toOffset) {
        this._lineEndings = lineEndings;    // 所有换行(\n)结束位置
        this._fromOffset = fromOffset;  // 解析起始偏移量
        this._toOffset = toOffset;  //  解析结束偏移量
        this._lastLine = -1;
        this._state = {};
        var tokenize = createTokenizer("text/css");
        // 是否在单词之间添加空格
        var oldEnforce = this._builder.setEnforceSpaceBetweenWords(false);
        tokenize(text.substring(this._fromOffset, this._toOffset), this._tokenCallback.bind(this));
        this._builder.setEnforceSpaceBetweenWords(oldEnforce);
    }

    /**
     * 处理分词后每个词
     * @param token 内容
     * @param type  类型  comment(注释)，tag(标签名)......
     * @param startPosition 起始位置
     * @private
     */
    _tokenCallback(token, type, startPosition) {
        startPosition += this._fromOffset;  // 重置当前word在整个文本中的起始位置

        var startLine = lowerBound(this._lineEndings, startPosition); // 获取当前词所在行数
        if (startLine !== this._lastLine) {
            this._state.eatWhitespace = true;
        }
        if (/^property/.test(type) && !this._state.inPropertyValue) {
            this._state.seenProperty = true;
        }
        this._lastLine = startLine;
        var isWhitespace = /^\s+$/.test(token);
        if (isWhitespace) {
            if (!this._state.eatWhitespace) {
                this._builder.addSoftSpace();
            }
            return;
        }
        this._state.eatWhitespace = false;
        if (token === "\n") {
            return;
        }
        if (token !== "}") {
            if (this._state.afterClosingBrace) {
                this._builder.addNewLine(true);
            }
            this._state.afterClosingBrace = false;
        }
        if (token === "}") {
            if (this._state.inPropertyValue) {
                this._builder.addNewLine();
            }
            this._builder.decreaseNestingLevel();
            this._state.afterClosingBrace = true;
            this._state.inPropertyValue = false;
        } else if (token === ":" && !this._state.inPropertyValue && this._state.seenProperty) {
            this._builder.addToken(token, startPosition);
            this._builder.addSoftSpace();
            this._state.eatWhitespace = true;
            this._state.inPropertyValue = true;
            this._state.seenProperty = false;
            return;
        } else if (token === "{") {
            this._builder.addSoftSpace();
            this._builder.addToken(token, startPosition);
            this._builder.addNewLine();
            this._builder.increaseNestingLevel();
            return;
        }

        this._builder.addToken(token, startPosition);

        if (type === "comment" && !this._state.inPropertyValue && !this._state.seenProperty)
            this._builder.addNewLine();
        if (token === ";" && this._state.inPropertyValue) {
            this._state.inPropertyValue = false;
            this._builder.addNewLine();
        } else if (token === "}") {
            this._builder.addNewLine();
        }
    }
}

export default CSSFormatter;