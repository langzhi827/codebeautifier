/**
 * Created by harrylang on 16/11/8.
 */

import CodeMirror from 'codemirror';
import AbortTokenization from './AbortTokenization';

export default function createTokenizer(mimeType) {
    // http://www.uedsc.com/write-codemirror-a-mode.html
    // http://codemirror.net/
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

            //console.log(value);

            if (callback(value, style, stream.start, stream.start + value.length) === AbortTokenization) {
                return;
            }
            stream.start = stream.pos;
        }

    }

    return tokenize;
};