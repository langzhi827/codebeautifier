/**
 * Created by harrylang on 16/11/8.
 */

export default class FormattedContentBuilder {
    constructor(indentString) {
        this._lastOriginalPosition = 0;

        this._formattedContent = [];    // 存储已经格式化的文本
        this._formattedContentLength = 0;   // 存储已格式化文本长度
        this._lastFormattedPosition = 0;

        this._mapping = {original: [0], formatted: [0]};

        this._nestingLevel = 0; // 嵌套级别（深度）
        this._indentString = indentString;
        this._cachedIndents = new Map();    // 存储嵌套级别缩进，最多可存储二十层的嵌套

        this._newLines = 0;
        this._softSpace = false;
        this._hardSpaces = 0;
        this._enforceSpaceBetweenWords = true;  //是否在单词之间强制设置空格
    }

    /**
     * 在单词之间强制设置空格
     * @param value
     * @returns {boolean|*}
     */
    setEnforceSpaceBetweenWords(value) {
        var oldValue = this._enforceSpaceBetweenWords;
        this._enforceSpaceBetweenWords = value;
        return oldValue;
    }

    /**
     * 添加格式化内容
     * @param token
     * @param offset
     */
    addToken(token, offset) {
        var last = this._formattedContent[this._formattedContent.length - 1];
        // \w表示字符类（包括大小写字母，数字）
        if (this._enforceSpaceBetweenWords && last && /\w/.test(last[last.length - 1]) && /\w/.test(token)) {
            this.addSoftSpace();
        }
        this._appendFormatting();

        // Insert token. 插入token
        this._addMappingIfNeeded(offset);
        this._addText(token);
    }

    addSoftSpace() {
        if (!this._hardSpaces) {
            this._softSpace = true;
        }
    }

    addHardSpace() {
        this._softSpace = false;
        ++this._hardSpaces;
    }

    /**
     * 添加换行
     * @param noSquash
     */
    addNewLine(noSquash) {
        // Avoid leading newlines. 避免引导换行
        if (!this._formattedContentLength) {
            return;
        }
        if (noSquash) {
            ++this._newLines;
        } else {
            this._newLines = this._newLines || 1;
        }
    }

    /**
     * 增加嵌套级别
     */
    increaseNestingLevel() {
        this._nestingLevel += 1;
    }

    /**
     * 减少嵌套级别
     */
    decreaseNestingLevel() {
        if (this._nestingLevel > 0)
            this._nestingLevel -= 1;
    }

    /**
     * @private
     */
    _appendFormatting() {
        // 是否换行
        if (this._newLines) {
            for (var i = 0; i < this._newLines; ++i) {
                this._addText("\n");
            }
            this._addText(this._indent());
        } else if (this._softSpace) {
            this._addText(" ");
        }
        if (this._hardSpaces) {
            for (var i = 0; i < this._hardSpaces; ++i)
                this._addText(" ");
        }
        this._newLines = 0;
        this._softSpace = false;
        this._hardSpaces = 0;
    }

    /**
     * 返回格式化后文本
     * @returns {string}
     */
    content() {
        return this._formattedContent.join("") + (this._newLines ? "\n" : "");
    }

    /**
     * @returns {{original: number[], formatted: number[]}|*}
     */
    mapping() {
        return this._mapping;
    }

    /**
     * 获取当前行缩进
     * @returns {*}
     * @private
     */
    _indent() {
        var cachedValue = this._cachedIndents.get(this._nestingLevel);
        if (cachedValue) {
            return cachedValue;
        }

        var fullIndent = "";
        for (var i = 0; i < this._nestingLevel; ++i) {
            fullIndent += this._indentString;
        }

        // Cache a maximum of 20 nesting level indents.
        // 最多可存储二十层嵌套缩进
        if (this._nestingLevel <= 20) {
            this._cachedIndents.set(this._nestingLevel, fullIndent);
        }
        return fullIndent;
    }

    /**
     * 记录已经格式化内容和长度
     * @param text
     * @private
     */
    _addText(text) {
        this._formattedContent.push(text);
        this._formattedContentLength += text.length;
    }

    /**
     * 记录格式化过程中的位置
     * @param originalPosition
     * @private
     */
    _addMappingIfNeeded(originalPosition) {
        if (originalPosition - this._lastOriginalPosition === this._formattedContentLength - this._lastFormattedPosition)
            return;
        this._mapping.original.push(originalPosition);
        this._lastOriginalPosition = originalPosition;
        this._mapping.formatted.push(this._formattedContentLength);
        this._lastFormattedPosition = this._formattedContentLength;
    }

}

