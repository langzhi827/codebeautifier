/**
 * Created by harrylang on 16/11/14.
 */
/**
 * 存储HTML元素信息
 * @param name
 * @constructor
 */
module.exports = function Element(name) {
    this.name = name;
    this.children = [];
    this.parent = null;
    this.openTag = null;
    this.closeTag = null;
};