///<reference path='functions.ts'/>
///<reference path='context.ts'/>

var TagManager = (function () {
    function TagManager() {
        this.reset();
    }
    TagManager.prototype.get = function (symbol) {
        if (this.tagsObj[symbol]) {
            return this.tagsObj[symbol];
        }
        panic("Missing tag " + symbol);
    };

    TagManager.prototype.add = function (tag) {
        tag.symbol = tag.symbol.toLowerCase();

        this.tags.push(tag);
        this.tagsObj[tag.symbol] = tag;

        this.tags = this.tags.sort(function (a, b) {
            if (a.symbol === b.symbol) {
                return 0;
            }
            return a.symbol > b.symbol ? 1 : -1;
        });
    };

    TagManager.prototype.reset = function () {
        this.tags = [];
        this.tagsObj = [];

        //
        //  IF
        //
        this.add({
            symbol: "if",
            required: ["test"],
            parse: function (node) {
                node.conds = [{
                        test: node.meta.attr.test,
                        list: []
                    }];
                node.meta.out = {
                    obj: node.conds[0],
                    prop: "list"
                };
                return node;
            },
            render: function (node, context) {
                var i;

                for (i = 0; i < node.conds.length; i += 1) {
                    if (this.listToBool(node.conds[i].test, context)) {
                        return this.renderList(node.conds[i].list, context);
                    }
                }
                return "";
            }
        });

        this.add({
            parent: "if",
            symbol: "elif",
            required: ["test"],
            parse: function (node) {
                var newNodeP = {
                    test: node.meta.attr.test,
                    list: []
                };

                node.conds.push(newNodeP);
                node.meta.out = {
                    obj: newNodeP,
                    prop: "list"
                };
                return node;
            }
        });

        this.add({
            parent: "if",
            symbol: "else",
            parse: function (node) {
                var newNodeP = {
                    test: [{ type: 1 /* EXPR */, value: [{ type: 6 /* BOOLEAN */, value: true }] }],
                    list: []
                };

                node.conds.push(newNodeP);
                node.meta.out = {
                    obj: newNodeP,
                    prop: "list"
                };
                return node;
            }
        });

        //
        //  FOR
        //
        this.add({
            symbol: "for",
            required: ["in"],
            parse: function (node) {
                node.key = node.meta.attr.key || null;
                node.value = node.meta.attr.value || null;
                node["in"] = node.meta.attr["in"];
                node.loop = [];
                node.empty = [];
                node.meta.out = {
                    obj: node,
                    prop: "loop"
                };
                return node;
            },
            render: function (node, context) {
                var iterable = context.get(this.renderList(node["in"]));
                var key = node.key ? this.renderList(node.key) : null;
                var value = node.value ? this.renderList(node.value) : null;
                var output = "";
                var notEmpty;
                var i;
                var self = this;

                function helper() {
                    if (key !== null) {
                        context.set(key, i);
                    }
                    if (value !== null) {
                        context.set(value, iterable[i]);
                    }
                    return output + self.renderList(node.loop, context);
                }

                if (iterable && typeof iterable === "object") {
                    if (Array.isArray(iterable) && iterable.length > 0) {
                        for (i = 0; i < iterable.length; i += 1) {
                            output = helper();
                        }
                        return output;
                    }
                    for (i in iterable) {
                        if (iterable.hasOwnProperty(i)) {
                            notEmpty = 1;
                            output = helper();
                        }
                    }
                }

                return notEmpty ? output : this.renderList(node.empty, context);
            }
        });

        this.add({
            parent: "for",
            symbol: "else",
            parse: function (node) {
                node.meta.out.prop = "empty";
                return node;
            }
        });

        //
        //  INCLUDE
        //
        this.add({
            symbol: "include",
            required: ["template"],
            parse: function (node) {
                var parent = node.meta.parent;
                node.template = node.meta.attr.template;
                delete node.meta;
                return parent;
            },
            render: function (node, context) {
                return this.renderTmplFromList(node.template, context);
            }
        });

        // this.add({
        //     symbol: "with",
        //     parent: "include",
        //     required: ["value", "as"],
        //     parse: function(node: NodeP): NodeP {
        //         // TO DO
        //     }
        // });
        //
        //  EXTENDS
        //
        this.add({
            symbol: "extends",
            required: ["template"],
            parse: function (node) {
                var parent = node.meta.parent;
                parent.value.parentTmpl = node.meta.attr.template;
                delete node.meta;
                return parent;
            },
            render: function () {
                return "";
            }
        });

        this.add({
            symbol: "block",
            required: ["name"],
            parse: function (node) {
                node.list = [];
                node.name = node.meta.attr.name[0];
                node.meta.out = {
                    obj: node,
                    prop: "list"
                };
                return node;
            },
            render: function (node, context, blocks) {
                var name = this.renderExpr(node.name);
                return blocks[name] ? this.renderList(blocks[name], context, blocks) : this.renderList(node.list, context, blocks);
            }
        });
    };
    return TagManager;
})();
