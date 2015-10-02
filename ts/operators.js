///<reference path='tokens.ts'/>
///<reference path='functions.ts'/>
///<reference path='converter.ts'/>

var OpManager = (function () {
    function OpManager(converter) {
        this.converter = converter;
        this.reset();
    }
    OpManager.prototype.get = function (symbol) {
        if (this.opsObj[symbol]) {
            return this.opsObj[symbol];
        }
        panic("Missing operator " + symbol);
    };

    OpManager.prototype.add = function (getter) {
        var op = getter(this);

        op.symbol = op.symbol.toLowerCase();

        this.ops.push(op);
        this.opsObj[op.symbol] = op;

        this.ops = this.ops.sort(function (a, b) {
            if (a.symbol === b.symbol) {
                return 0;
            }
            return a.symbol > b.symbol ? 1 : -1;
        });
    };

    OpManager.prototype.reset = function () {
        this.ops = [];
        this.opsObj = [];

        // MAPS
        this.add(function (opManager) {
            return {
                symbol: "[]",
                order: 900,
                noLex: true,
                left: 8 /* NAME */,
                right: 5 /* STRING */,
                fn: function (left, right) {
                    return {
                        type: 8 /* NAME */,
                        value: left.value.concat([right.value])
                    };
                },
                parse: function (expr, token) {
                    var last = expr[expr.length - 1];

                    if (token.type === 14 /* OPEN_BRACKET */ && last && (last.type === 8 /* NAME */ || last.type === 15 /* CLOSE_BRACKET */)) {
                        expr.push({ type: 3 /* OPERATOR */, value: "[]" });
                        expr.push({ type: 14 /* OPEN_BRACKET */ });
                    }
                }
            };
        });

        // ACCESSOR
        this.add(function (opManager) {
            return {
                symbol: ".",
                order: 900,
                left: 8 /* NAME */,
                right: 8 /* NAME */,
                fn: function (left, right) {
                    return {
                        type: 8 /* NAME */,
                        value: left.value.concat([right.value])
                    };
                }
            };
        });

        // FILTER
        this.add(function (opManager) {
            return {
                symbol: "|",
                order: 800,
                left: 5 /* STRING */,
                right: 10 /* FUNC */,
                fn: function (left, right) {
                    return {
                        type: 10 /* FUNC */,
                        value: function () {
                            var args = [left.value].concat([].slice.call(arguments, 0));
                            return right.value.apply(this, args);
                        }
                    };
                }
            };
        });

        // FUNCTION
        this.add(function (opManager) {
            return {
                symbol: "()",
                order: 800,
                noLex: true,
                left: 10 /* FUNC */,
                right: 12 /* ARG */,
                fn: function (left, right) {
                    return {
                        type: 10 /* FUNC */,
                        value: function () {
                            return left.value(right.value);
                        }
                    };
                },
                parse: function (expr, token) {
                    var last = expr[expr.length - 1];
                    var penultimate = expr[expr.length - 2];

                    if (token.type === 16 /* OPEN_PARENTHESIS */ && last && (last.type === 8 /* NAME */ || last.type === 15 /* CLOSE_BRACKET */)) {
                        expr.push({ type: 3 /* OPERATOR */, value: "()" });
                        expr.push({ type: 16 /* OPEN_PARENTHESIS */ });
                    }

                    // create a fake argument for function without any
                    if (token.type === 17 /* CLOSE_PARENTHESIS */ && last && last.type === 16 /* OPEN_PARENTHESIS */ && penultimate && penultimate.type === 3 /* OPERATOR */ && penultimate.value === "()") {
                        expr.push({ type: 7 /* NIL */ });
                        expr.push({ type: 17 /* CLOSE_PARENTHESIS */ });
                    }
                }
            };
        });

        // UNARY +
        this.add(function (opManager) {
            return {
                symbol: "u+",
                order: 750,
                noLex: true,
                left: null,
                right: 4 /* NUMBER */,
                fn: function (left, right) {
                    return {
                        type: 4 /* NUMBER */,
                        value: right.value
                    };
                }
            };
        });

        // UNARY -
        this.add(function (opManager) {
            return {
                symbol: "u-",
                order: 750,
                noLex: true,
                left: null,
                right: 4 /* NUMBER */,
                fn: function (left, right) {
                    return {
                        type: 4 /* NUMBER */,
                        value: -right.value
                    };
                }
            };
        });

        this.add(function (opManager) {
            return {
                symbol: "**",
                order: 700,
                left: 4 /* NUMBER */,
                right: 4 /* NUMBER */,
                fn: function (left, right) {
                    return {
                        type: 4 /* NUMBER */,
                        value: Math.pow(left.value, right.value)
                    };
                }
            };
        });

        this.add(function (opManager) {
            return {
                symbol: "~",
                order: 600,
                left: 5 /* STRING */,
                right: 5 /* STRING */,
                fn: function (left, right) {
                    return {
                        type: 5 /* STRING */,
                        value: left.value + right.value
                    };
                }
            };
        });

        this.add(function (opManager) {
            return {
                symbol: "*",
                order: 500,
                left: 4 /* NUMBER */,
                right: 4 /* NUMBER */,
                fn: function (left, right) {
                    return {
                        type: 4 /* NUMBER */,
                        value: left.value * right.value
                    };
                }
            };
        });

        this.add(function (opManager) {
            return {
                symbol: "/",
                order: 500,
                left: 4 /* NUMBER */,
                right: 4 /* NUMBER */,
                fn: function (left, right) {
                    return {
                        type: 4 /* NUMBER */,
                        value: right.value ? left.value / right.value : panic("/0")
                    };
                }
            };
        });

        this.add(function (opManager) {
            return {
                symbol: "%",
                order: 500,
                left: 4 /* NUMBER */,
                right: 4 /* NUMBER */,
                fn: function (left, right) {
                    return {
                        type: 4 /* NUMBER */,
                        value: right.value ? left.value % right.value : panic("%0")
                    };
                }
            };
        });

        this.add(function (opManager) {
            return {
                symbol: "+",
                order: 400,
                left: 4 /* NUMBER */,
                right: 4 /* NUMBER */,
                fn: function (left, right) {
                    return {
                        type: 4 /* NUMBER */,
                        value: left.value + right.value
                    };
                },
                parse: function (expr) {
                    opManager.get("+").helper(expr, "+");
                },
                helper: function (expr, op) {
                    var last = expr[expr.length - 1];

                    if (!last || [16 /* OPEN_PARENTHESIS */, 3 /* OPERATOR */].indexOf(last.type) >= 0) {
                        op = "u" + op;
                    }
                    expr.push({ type: 3 /* OPERATOR */, value: op });
                }
            };
        });

        this.add(function (opManager) {
            return {
                symbol: "-",
                order: 400,
                left: 4 /* NUMBER */,
                right: 4 /* NUMBER */,
                fn: function (left, right) {
                    return {
                        type: 4 /* NUMBER */,
                        value: left.value - right.value
                    };
                },
                parse: function (expr) {
                    opManager.get("+").helper(expr, "-");
                }
            };
        });

        this.add(function (opManager) {
            return {
                symbol: "or",
                order: 300,
                left: 6 /* BOOLEAN */,
                right: 6 /* BOOLEAN */,
                fn: function (left, right) {
                    return {
                        type: 6 /* BOOLEAN */,
                        value: left.value || right.value
                    };
                }
            };
        });

        this.add(function (opManager) {
            return {
                symbol: "and",
                order: 300,
                left: 6 /* BOOLEAN */,
                right: 6 /* BOOLEAN */,
                fn: function (left, right) {
                    return {
                        type: 6 /* BOOLEAN */,
                        value: left.value && right.value
                    };
                }
            };
        });

        this.add(function (opManager) {
            return {
                symbol: ">=",
                order: 200,
                left: 4 /* NUMBER */,
                right: 4 /* NUMBER */,
                fn: function (left, right) {
                    return {
                        type: 6 /* BOOLEAN */,
                        value: left.value >= right.value
                    };
                }
            };
        });

        this.add(function (opManager) {
            return {
                symbol: "<=",
                order: 200,
                left: 4 /* NUMBER */,
                right: 4 /* NUMBER */,
                fn: function (left, right) {
                    return {
                        type: 6 /* BOOLEAN */,
                        value: left.value <= right.value
                    };
                }
            };
        });

        this.add(function (opManager) {
            return {
                symbol: ">",
                order: 200,
                left: 4 /* NUMBER */,
                right: 4 /* NUMBER */,
                fn: function (left, right) {
                    return {
                        type: 6 /* BOOLEAN */,
                        value: left.value > right.value
                    };
                }
            };
        });

        this.add(function (opManager) {
            return {
                symbol: "<",
                order: 200,
                left: 4 /* NUMBER */,
                right: 4 /* NUMBER */,
                fn: function (left, right) {
                    return {
                        type: 6 /* BOOLEAN */,
                        value: left.value < right.value
                    };
                }
            };
        });

        this.add(function (opManager) {
            return {
                symbol: "===",
                order: 200,
                left: 13 /* TOKEN */,
                right: 13 /* TOKEN */,
                fn: function (left, right) {
                    return {
                        type: 6 /* BOOLEAN */,
                        value: left.type !== right.type ? false : opManager.get("==").fn(left, right)
                    };
                }
            };
        });

        this.add(function (opManager) {
            return {
                symbol: "==",
                order: 200,
                left: 13 /* TOKEN */,
                right: 13 /* TOKEN */,
                fn: function (left, right) {
                    var val;
                    var converter = opManager.converter;

                    if (left.type === 7 /* NIL */ || right.type === 7 /* NIL */) {
                        val = left.type === 7 /* NIL */ && right.type === 7 /* NIL */;
                    } else if (left.type === 6 /* BOOLEAN */ || right.type === 6 /* BOOLEAN */) {
                        val = converter.bool(left) === converter.bool(right);
                    } else if (left.type === 11 /* MAP */ || right.type === 11 /* MAP */) {
                        val = mapComp(left.value, right.value);
                    } else if (left.type === right.type) {
                        val = left.value === right.value;
                    } else {
                        try  {
                            val = converter.num(left) === converter.num(right);
                        } catch (e) {
                            val = false;
                        }
                    }
                    return { type: 6 /* BOOLEAN */, value: val };
                }
            };
        });

        this.add(function (opManager) {
            return {
                symbol: "!==",
                order: 200,
                left: 13 /* TOKEN */,
                right: 13 /* TOKEN */,
                fn: function (left, right) {
                    return {
                        type: 6 /* BOOLEAN */,
                        value: !opManager.get("===").fn(left, right)
                    };
                }
            };
        });

        this.add(function (opManager) {
            return {
                symbol: "!=",
                order: 200,
                left: 13 /* TOKEN */,
                right: 13 /* TOKEN */,
                fn: function (left, right) {
                    return {
                        type: 6 /* BOOLEAN */,
                        value: !opManager.get("==").fn(left, right)
                    };
                }
            };
        });

        this.add(function (opManager) {
            return {
                symbol: "?",
                order: 100,
                left: 6 /* BOOLEAN */,
                right: 13 /* TOKEN */,
                fn: function (left, right) {
                    return {
                        type: right.type,
                        value: { val: right, test: left.value }
                    };
                },
                postParse: function (expr) {
                    expr.push({ type: 16 /* OPEN_PARENTHESIS */ });
                }
            };
        });

        this.add(function (opManager) {
            return {
                symbol: ":",
                order: 100,
                left: 13 /* TOKEN */,
                right: 13 /* TOKEN */,
                fn: function (left, right) {
                    return {
                        type: right.type,
                        value: left.value.test ? left.value.val : right
                    };
                },
                postParse: function (expr) {
                    expr.push({ type: 17 /* CLOSE_PARENTHESIS */ });
                }
            };
        });

        // FUNCTION ARGUMENTS
        this.add(function (opManager) {
            return {
                symbol: ",",
                order: 50,
                left: 12 /* ARG */,
                right: 12 /* ARG */,
                fn: function (left, right) {
                    return {
                        type: 12 /* ARG */,
                        value: left.value.concat(right.value)
                    };
                }
            };
        });
    };
    return OpManager;
})();
