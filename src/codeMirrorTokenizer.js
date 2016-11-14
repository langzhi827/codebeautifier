/**
 * Created by harrylang on 16/11/11.
 */
var CodeMirror = require('codemirror');
var lowerBound = require("./util").lowerBound;
var AbortTokenization = require('./AbortTokenization')

/**
 * 利用CodeMirror(http://codemirror.net/)对指定格式文本进行分词,
 * 返回一个函数，将分词后的内容传给callback
 *
 * @param mimeType  MIME (Multipurpose Internet Mail Extensions) 是描述消息内容类型的因特网标准。
 * @returns {tokenize}
 */
module.exports = function createTokenizer(mimeType) {
    // help: http://www.uedsc.com/write-codemirror-a-mode.html
    var mode = CodeMirror.getMode({indentUnit: 2}, mimeType);
    var state = CodeMirror.startState(mode);

    /**
     * 对解析后的词进行特定处理
     * @param line
     * @param callback
     */
    function tokenize(line, callback) {

        var stream = new CodeMirror.StringStream(line);

        while (!stream.eol()) {
            var style = mode.token(stream, state);
            var value = stream.current();

            if (callback(value, style, stream.start, stream.start + value.length) === AbortTokenization) {
                return;
            }
            stream.start = stream.pos;
        }

    }

    return tokenize;
};