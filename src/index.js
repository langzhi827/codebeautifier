/**
 * Created by harrylang on 16/11/8.
 */

import CodeMirror from "codemirror";
import "../node_modules/codemirror/mode/css/css";
import "../node_modules/codemirror/mode/htmlembedded/htmlembedded";
import "../node_modules/codemirror/mode/javascript/javascript";

import {isDom,computeLineEndings} from "./util";
import FormattedContentBuilder from "./FormattedContentBuilder";
import CSSFormatter from "./CSSFormatter";
import JavaScriptFormatter from "./JavaScriptFormatter";
import HTMLFormatter from "./HTMLFormatter";
import JsonFormatter from "./JsonFormatter";

let mimeModes = {
    'html': 'htmlembedded',
    'xml': 'htmlembedded',
    'css': 'css',
    'javascript': 'javascript',
    'json': 'javascript'
};

window.codebeautifier = function (option) { // element, type, text, indentString
    option = option || {};
    if (!isDom(option.element) || !option.type || !option.text) {
        return;
    }
    var indent = option.indent || "    ";
    var formatter = null;

    var builder = new FormattedContentBuilder(indent);

    switch (option.type) {
        case "html":
        case "xml":
            formatter = new HTMLFormatter(builder);
            break;
        case "css":
            formatter = new CSSFormatter(builder);
            break;
        case "javascript":
            formatter = new JavaScriptFormatter(builder);
            break;
        case "json":
            formatter = new JsonFormatter(builder);
            break;
        default:
            console.error("Unsupport type name: " + option.type);
            return;
    }
    var lineEndings = computeLineEndings(option.text);
    formatter.format(option.text, lineEndings, 0, option.text.length);
    var content = builder.content();

    CodeMirror(option.element, {
        value: content,
        mode: mimeModes[option.type]
    });

};
