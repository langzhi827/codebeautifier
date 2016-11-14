/**
 * Created by harrylang on 16/11/11.
 */

/**
 *
 * @param beforeVisit   访问前
 * @param afterVisit    访问后
 * @constructor
 */
function ESTreeWalker(beforeVisit, afterVisit) {
    this._beforeVisit = beforeVisit;
    this._afterVisit = afterVisit || new Function();
    this._walkNulls = false;
};

ESTreeWalker.prototype = {
    /**
     *
     * @param value
     */
    setWalkNulls: function (value) {
        this._walkNulls = value;
    },
    /**
     *
     * @param ast
     */
    walk: function (ast) {
        this._innerWalk(ast, null);
    },
    /**
     *
     * @param node
     * @param parent
     * @private
     */
    _innerWalk: function (node, parent) {
        if (!node && parent && this._walkNulls) {
            node = ({
                type: "Literal",
                raw: "null",
                value: null
            });
        }

        if (!node) {
            return;
        }
        node.parent = parent;

        if (this._beforeVisit.call(null, node) === ESTreeWalker.SkipSubtree) {
            this._afterVisit.call(null, node);
            return;
        }

        var walkOrder = ESTreeWalker._walkOrder[node.type];
        if (!walkOrder) {
            console.error("Walk order not defined for " + node.type);
            return;
        }

        if (node.type === "TemplateLiteral") {
            var templateLiteral = /** @type {!ESTree.TemplateLiteralNode} */ (node);
            var expressionsLength = templateLiteral.expressions.length;
            for (var i = 0; i < expressionsLength; ++i) {
                this._innerWalk(templateLiteral.quasis[i], templateLiteral);
                this._innerWalk(templateLiteral.expressions[i], templateLiteral);
            }
            this._innerWalk(templateLiteral.quasis[expressionsLength], templateLiteral);
        } else {
            for (var i = 0; i < walkOrder.length; ++i) {
                var entity = node[walkOrder[i]];
                if (Array.isArray(entity))
                    this._walkArray(entity, node);
                else
                    this._innerWalk(entity, node);
            }
        }

        this._afterVisit.call(null, node);
    },
    /**
     *
     * @param nodeArray
     * @param parentNode
     * @private
     */
    _walkArray: function (nodeArray, parentNode) {
        for (var i = 0; i < nodeArray.length; ++i) {
            this._innerWalk(nodeArray[i], parentNode);
        }
    }
};
/**
 *
 * @type {{}}
 */
ESTreeWalker.SkipSubtree = {};
/**
 *
 * @type {{ArrayExpression: string[], ArrowFunctionExpression: string[], AssignmentExpression: string[], BinaryExpression: string[], BlockStatement: string[], BreakStatement: string[], CallExpression: string[], CatchClause: string[], ClassBody: string[], ClassDeclaration: string[], ClassExpression: string[], ConditionalExpression: string[], ContinueStatement: string[], DebuggerStatement: Array, DoWhileStatement: string[], EmptyStatement: Array, ExpressionStatement: string[], ForInStatement: string[], ForOfStatement: string[], ForStatement: string[], FunctionDeclaration: string[], FunctionExpression: string[], Identifier: Array, IfStatement: string[], LabeledStatement: string[], Literal: Array, LogicalExpression: string[], MemberExpression: string[], MethodDefinition: string[], NewExpression: string[], ObjectExpression: string[], Program: string[], Property: string[], ReturnStatement: string[], SequenceExpression: string[], Super: Array, SwitchCase: string[], SwitchStatement: string[], TaggedTemplateExpression: string[], TemplateElement: Array, TemplateLiteral: string[], ThisExpression: Array, ThrowStatement: string[], TryStatement: string[], UnaryExpression: string[], UpdateExpression: string[], VariableDeclaration: string[], VariableDeclarator: string[], WhileStatement: string[], WithStatement: string[], YieldExpression: string[]}}
 * @private
 */
ESTreeWalker._walkOrder = {
    "ArrayExpression": ["elements"],
    "ArrowFunctionExpression": ["params", "body"],
    "AssignmentExpression": ["left", "right"],
    "BinaryExpression": ["left", "right"],
    "BlockStatement": ["body"],
    "BreakStatement": ["label"],
    "CallExpression": ["callee", "arguments"],
    "CatchClause": ["param", "body"],
    "ClassBody": ["body"],
    "ClassDeclaration": ["id", "superClass", "body"],
    "ClassExpression": ["id", "superClass", "body"],
    "ConditionalExpression": ["test", "consequent", "alternate"],
    "ContinueStatement": ["label"],
    "DebuggerStatement": [],
    "DoWhileStatement": ["body", "test"],
    "EmptyStatement": [],
    "ExpressionStatement": ["expression"],
    "ForInStatement": ["left", "right", "body"],
    "ForOfStatement": ["left", "right", "body"],
    "ForStatement": ["init", "test", "update", "body"],
    "FunctionDeclaration": ["id", "params", "body"],
    "FunctionExpression": ["id", "params", "body"],
    "Identifier": [],
    "IfStatement": ["test", "consequent", "alternate"],
    "LabeledStatement": ["label", "body"],
    "Literal": [],
    "LogicalExpression": ["left", "right"],
    "MemberExpression": ["object", "property"],
    "MethodDefinition": ["key", "value"],
    "NewExpression": ["callee", "arguments"],
    "ObjectExpression": ["properties"],
    "Program": ["body"],
    "Property": ["key", "value"],
    "ReturnStatement": ["argument"],
    "SequenceExpression": ["expressions"],
    "Super": [],
    "SwitchCase": ["test", "consequent"],
    "SwitchStatement": ["discriminant", "cases"],
    "TaggedTemplateExpression": ["tag", "quasi"],
    "TemplateElement": [],
    "TemplateLiteral": ["quasis", "expressions"],
    "ThisExpression": [],
    "ThrowStatement": ["argument"],
    "TryStatement": ["block", "handler", "finalizer"],
    "UnaryExpression": ["argument"],
    "UpdateExpression": ["argument"],
    "VariableDeclaration": ["declarations"],
    "VariableDeclarator": ["id", "init"],
    "WhileStatement": ["test", "body"],
    "WithStatement": ["object", "body"],
    "YieldExpression": ["argument"]
};

module.exports = ESTreeWalker;