/**
 * Created by harrylang on 16/11/9.
 */

var acorn = require('acorn');
import {computeLineEndings} from './util';

class AcornTokenizer {
    constructor(content) {
        this._content = content;
        this._comments = [];   // 存储被解析文本注释信息
        // ecmaVersion:指示要解析的ECMAScript版本。 必须为3，5，6（2015），7（2016）或8（2017）。
        // 这影响对严格模式的支持，保留字的集合和对新的语法特征的支持。 默认值为7。
        /**
         onComment:
         1、如果为一个函数，将为此函数传递这些参数：

         block：如果注释是块注释，则为true，如果是行注释，则为false。
         text：注释的内容。
         start：注释开始的字符偏移量。
         end：注释结束的字符偏移量。
         当locations选项打开时，注释的开始和结束的{line, column}将作为两个附加参数传递。

         2、如果为数组，会按照下面的格式，将注释信息push到当前这个数组里：
         {
             "type": "Line" | "Block",
             "value": "comment text",
             "start": Number,
             "end": Number,
             // If `locations` option is on:
             "loc": {
             "start": {line: Number, column: Number}
             "end": {line: Number, column: Number}
             },
             // If `ranges` option is on:
             "range": [Number, Number]
         }
         */
        this._tokenizer = acorn.tokenizer(this._content, {ecmaVersion: 6, onComment: this._comments});
        this._lineEndings = computeLineEndings(this._content); // 所有换行(\n)结束位置
        this._lineNumber = 0;
        this._tokenLineStart = 0;
        this._tokenLineEnd = 0;
        this._nextTokenInternal();
    }

    static punctuator(token, values) {
        return token.type !== acorn.tokTypes.num &&
            token.type !== acorn.tokTypes.regexp &&
            token.type !== acorn.tokTypes.string &&
            token.type !== acorn.tokTypes.name && !token.type.keyword &&
            (!values || (token.type.label.length === 1 && values.indexOf(token.type.label) !== -1));
    }


    static keyword(token, keyword) {
        return !!token.type.keyword &&
            token.type !== acorn.tokTypes._true &&
            token.type !== acorn.tokTypes._false &&
            token.type !== acorn.tokTypes._null &&
            (!keyword || token.type.keyword === keyword);
    }


    static identifier(token, identifier) {
        return token.type === acorn.tokTypes.name && (!identifier || token.value === identifier);
    }

    static lineComment(token) {
        return token.type === "Line";
    }

    static blockComment(token) {
        return token.type === "Block";
    }

    _nextTokenInternal() {
        if (this._comments.length) {
            return this._comments.shift();
        }
        var token = this._bufferedToken;
        this._bufferedToken = this._tokenizer.getToken();
        return token;
    }

    _rollLineNumberToPosition(position) {
        while (this._lineNumber + 1 < this._lineEndings.length && position > this._lineEndings[this._lineNumber]) {
            ++this._lineNumber;
        }
        return this._lineNumber;
    }

    nextToken() {
        var token = this._nextTokenInternal();
        if (token.type === acorn.tokTypes.eof) {
            return null;
        }

        this._tokenLineStart = this._rollLineNumberToPosition(token.start);
        this._tokenLineEnd = this._rollLineNumberToPosition(token.end);
        this._tokenColumnStart = this._tokenLineStart > 0 ? token.start - this._lineEndings[this._tokenLineStart - 1] - 1 : token.start;
        return token;
    }

    /**
     * 获取分词
     * @returns {*}
     */
    peekToken() {
        if (this._comments.length) {
            return this._comments[0];
        }
        return this._bufferedToken.type !== acorn.tokTypes.eof ? this._bufferedToken : null;
    }

    tokenLineStart() {
        return this._tokenLineStart;
    }

    tokenLineEnd() {
        return this._tokenLineEnd;
    }

    tokenColumnStart() {
        return this._tokenColumnStart;
    }
}

export default AcornTokenizer;
