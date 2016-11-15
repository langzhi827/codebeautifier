/**
 * Created by harrylang on 16/11/11.
 */
var CodeMirror = require('codemirror');
require('../node_modules/codemirror/mode/css/css');
require('../node_modules/codemirror/mode/htmlembedded/htmlembedded');
require('../node_modules/codemirror/mode/javascript/javascript');
var util = require('./util');
var FormattedContentBuilder = require('./FormattedContentBuilder');
var CSSFormatter = require('./CSSFormatter');
var JavaScriptFormatter = require('./JavaScriptFormatter');
var HTMLFormatter = require('./HTMLFormatter');
var JsonFormatter = require('./JsonFormatter');

var isDom = util.isDom;
var computeLineEndings = util.computeLineEndings;

// css
require('../node_modules/codemirror/lib/codemirror.css');

var mimeModes = {
    'html': 'htmlembedded',
    'xml': 'htmlembedded',
    'css': 'css',
    'javascript': 'javascript',
    'json': 'javascript'
};

/**
 * 代码美化入口
 * @param option
 */
exports.codebeautifier = function (option) {
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
        mode: mimeModes[option.type],
        readOnly: 'nocursor'

    });

    return content;

};
