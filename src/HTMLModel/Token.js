/**
 * Created by harrylang on 16/11/9.
 */
export default class Token {
    constructor(value, type, startOffset, endOffset) {
        this.value = value;
        this.type = type;
        this.startOffset = startOffset;
        this.endOffset = endOffset;
    }
}