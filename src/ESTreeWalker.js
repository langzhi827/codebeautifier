/**
 * Created by harrylang on 16/11/9.
 */

export default class ESTreeWalker {
    /**
     *
     * @param beforeVisit   访问前
     * @param afterVisit    访问后
     */
    constructor(beforeVisit, afterVisit) {
        this._beforeVisit = beforeVisit;
        this._afterVisit = afterVisit || new Function();
        this._walkNulls = false;
    }

    setWalkNulls(value) {
        this._walkNulls = value;
    }

    walk(ast) {
        this._innerWalk(ast, null);
    }

    _innerWalk(node, parent) {
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
    }

    _walkArray(nodeArray, parentNode) {
        for (var i = 0; i < nodeArray.length; ++i) {
            this._innerWalk(nodeArray[i], parentNode);
        }
    }
}

ESTreeWalker.SkipSubtree = {};

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


