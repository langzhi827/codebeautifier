/**
 * Created by harrylang on 16/11/14.
 */
/**
 * HTML标签信息存储
 * @param name
 * @param startOffset
 * @param endOffset
 * @param attributes
 * @param isOpenTag
 * @param selfClosingTag
 * @constructor
 */
module.exports = function Tag(name, startOffset, endOffset, attributes, isOpenTag, selfClosingTag) {
    this.name = name;
    this.startOffset = startOffset;
    this.endOffset = endOffset;
    this.attributes = attributes;
    this.isOpenTag = isOpenTag;
    this.selfClosingTag = selfClosingTag;
};
