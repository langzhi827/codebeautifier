/**
 * Created by harrylang on 16/11/11.
 */

/**
 * 获取字符串中某个标记的所有位置
 * @param string
 * @param mark
 * @returns {Array}
 */
exports.findAll = function (string, mark) {
    var matches = [];
    var i = string.indexOf(mark);
    while (i !== -1) {
        matches.push(i);
        i = string.indexOf(mark, i + mark.length);
    }
    return matches;
};

/**
 * 计算字符串中所有换行位置
 * @param string
 * @returns {Array|!Array.<number>|*}
 */
exports.computeLineEndings = function (string) {
    var endings = exports.findAll(string, "\n");
    endings.push(string.length);
    return endings;
};

/**
 * 二分查找函数（运用于有序区间，这也是运用二分查找的前提）
 * 返回一个非递减序列[first, last)中的第一个大于等于值val的位置
 * @param array
 * @param object
 * @param comparator
 * @param left
 * @param right
 * @returns {*}
 */
exports.lowerBound = function (array, object, comparator, left, right) {

    function defaultComparator(a, b) {
        return a < b ? -1 : (a > b ? 1 : 0);
    }

    comparator = comparator || defaultComparator;
    var l = left || 0;
    var r = right !== undefined ? right : array.length;
    while (l < r) {
        var m = (l + r) >> 1;
        if (comparator(object, array[m]) > 0) {
            l = m + 1;
        } else {
            r = m;
        }
    }
    return r;
};

/**
 *  获取数组中最后一个目标
 * @param array
 * @returns {*}
 */
exports.peekLast = function (array) {
    return array[array.length - 1];
};

/**
 * 判断当前字符串是否为空格
 * @param string
 * @returns {boolean}
 */
exports.isWhitespace = function (string) {
    return /^\s*$/.test(string);
};

/**
 * 判断对象是否为dom元素
 * @param obj
 * @returns {*}
 */
exports.isDom = function (obj) {
    if (typeof HTMLElement === 'object') {
        return obj instanceof HTMLElement;
    } else {
        return obj && typeof obj === 'object' && obj.nodeType === 1 && typeof obj.nodeName === 'string';
    }
};
