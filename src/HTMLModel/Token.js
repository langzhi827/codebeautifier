/**
 * Created by harrylang on 16/11/14.
 */
/**
 * 存储HTML分词后信息
 * @param value  文本内容
 * @param type  类型
 * @param startOffset   解析起始偏移量
 * @param endOffset 解析结束偏移量
 * @constructor
 */
module.exports = function Token(value, type, startOffset, endOffset) {
    this.value = value;
    this.type = type;
    this.startOffset = startOffset;
    this.endOffset = endOffset;
};