/**
 * Created by harrylang on 16/11/9.
 */

export default class Element {
    constructor(name) {
        this.name = name;
        this.children = [];
        this.parent = null;
        this.openTag = null;
        this.closeTag = null;
    }
}