///<reference path='tokens.ts'/>
///<reference path='functions.ts'/>
///<reference path='converter.ts'/>

interface Operator
{
    symbol: string;
    order: number;
    noLex?: boolean;

    left: Type;
    right: Type;

    fn: (left: Token, right: Token) => Token;

    preParse?: (expression: Array<Token>, token: Token) => void;
    parse?: (expression: Array<Token>, token: Token) => void;
    postParse?: (expression: Array<Token>, token: Token) => void;
    helper?: (expression: Array<Token>, param: any) => void;
}



class OpManager
{
    ops: Array<Operator>;
    opsObj: Array<Operator>;

    converter: Converter;

    constructor(converter: Converter)
    {
        this.converter = converter;
        this.reset();
    }


    get(symbol: string): Operator
    {
        if (this.opsObj[symbol]) {
            return this.opsObj[symbol];
        }
        panic("Missing operator " + symbol);
    }


    add(getter: (opManager: OpManager) => Operator): void
    {
        var op: Operator = getter(this);

        op.symbol = op.symbol.toLowerCase();

        this.ops.push(op);
        this.opsObj[op.symbol] = op;

        this.ops = this.ops.sort(function(a: Operator, b: Operator) {
            if (a.symbol === b.symbol) {
                return 0;
            }
            return a.symbol > b.symbol ? 1 : -1;
        });
    }


    reset(): void
    {
        this.ops = [];
        this.opsObj = [];

        // MAPS
        this.add(function(opManager: OpManager) {
            return {
                symbol: "[]",
                order: 900,
                noLex: true,

                left: Type.NAME,
                right: Type.STRING,

                fn: function(left: Token, right: Token): Token {
                    return {
                        type: Type.NAME,
                        value: left.value.concat([right.value])
                    };
                },

                parse: function(expr: Array<Token>, token: Token): void {
                    var last: Token = expr[expr.length - 1];

                    if (token.type === Type.OPEN_BRACKET
                            && last
                            && (last.type === Type.NAME || last.type === Type.CLOSE_BRACKET)
                            ) {
                        expr.push({ type: Type.OPERATOR, value: "[]" });
                        expr.push({ type: Type.OPEN_BRACKET });
                    }
                }
            };
        });

        // ACCESSOR
        this.add(function(opManager) {
            return {
                symbol: ".",
                order: 900,

                left: Type.NAME,
                right: Type.NAME,

                fn: function(left: Token, right: Token): Token {
                    return {
                        type: Type.NAME,
                        value: left.value.concat([right.value])
                    };
                }
            };
        });

        // FILTER
        this.add(function(opManager) {
            return {
                symbol: "|",
                order: 800,

                left: Type.STRING,
                right: Type.FUNC,

                fn: function(left: Token, right: Token): Token {
                    return {
                        type: Type.FUNC,
                        value: function() {
                            var args = [left.value].concat([].slice.call(arguments, 0));
                            return right.value.apply(this, args);
                        }
                    };
                }
            };
        });

        // FUNCTION
        this.add(function(opManager) {
            return {
                symbol: "()",
                order: 800,
                noLex: true,

                left: Type.FUNC,
                right: Type.ARG,

                fn: function(left: Token, right: Token): Token {
                    return {
                        type: Type.FUNC,
                        value: function() {
                            return left.value(right.value);
                        }
                    };
                },

                parse: function(expr: Array<Token>, token: Token): void {
                    var last: Token = expr[expr.length - 1];
                    var penultimate: Token = expr[expr.length - 2];

                    if (token.type === Type.OPEN_PARENTHESIS
                            && last
                            && (last.type === Type.NAME || last.type === Type.CLOSE_BRACKET)
                            ) {
                        expr.push({ type: Type.OPERATOR, value: "()" });
                        expr.push({ type: Type.OPEN_PARENTHESIS });
                    }

                    // create a fake argument for function without any
                    if (token.type === Type.CLOSE_PARENTHESIS
                            && last
                            && last.type === Type.OPEN_PARENTHESIS
                            && penultimate
                            && penultimate.type === Type.OPERATOR
                            && penultimate.value === "()"
                            ) {
                        expr.push({ type: Type.NIL });
                        expr.push({ type: Type.CLOSE_PARENTHESIS });
                    }
                }
            };
        });

        // UNARY +
        this.add(function(opManager) {
            return {
                symbol: "u+",
                order: 750,
                noLex: true,

                left: null,
                right: Type.NUMBER,

                fn: function(left: Token, right: Token): Token {
                    return {
                        type: Type.NUMBER,
                        value: right.value
                    };
                }
            };
        });

        // UNARY -
        this.add(function(opManager) {
            return {
                symbol: "u-",
                order: 750,
                noLex: true,

                left: null,
                right: Type.NUMBER,

                fn: function(left: Token, right: Token): Token {
                    return {
                        type: Type.NUMBER,
                        value: -right.value
                    };
                }
            };
        });

        this.add(function(opManager) {
            return {
                symbol: "**",
                order: 700,

                left: Type.NUMBER,
                right: Type.NUMBER,

                fn: function(left: Token, right: Token): Token {
                    return {
                        type: Type.NUMBER,
                        value: Math.pow(left.value, right.value)
                    };
                }
            };
        });

        this.add(function(opManager) {
            return {
                symbol: "~",
                order: 600,

                left: Type.STRING,
                right: Type.STRING,

                fn: function(left: Token, right: Token): Token {
                    return {
                        type: Type.STRING,
                        value: left.value + right.value
                    };
                }
            };
        });

        this.add(function(opManager) {
            return {
                symbol: "*",
                order: 500,

                left: Type.NUMBER,
                right: Type.NUMBER,

                fn: function(left: Token, right: Token): Token {
                    return {
                        type: Type.NUMBER,
                        value: left.value * right.value
                    };
                }
            };
        });

        this.add(function(opManager) {
            return {
                symbol: "/",
                order: 500,

                left: Type.NUMBER,
                right: Type.NUMBER,

                fn: function(left: Token, right: Token): Token {
                    return {
                        type: Type.NUMBER,
                        value: right.value ? left.value / right.value : panic("/0")
                    };
                }
            };
        });

        this.add(function(opManager) {
            return {
                symbol: "%",
                order: 500,

                left: Type.NUMBER,
                right: Type.NUMBER,

                fn: function(left: Token, right: Token): Token {
                    return {
                        type: Type.NUMBER,
                        value: right.value ? left.value % right.value : panic("%0")
                    };
                }
            };
        });

        this.add(function(opManager) {
            return {
                symbol: "+",
                order: 400,

                left: Type.NUMBER,
                right: Type.NUMBER,

                fn: function(left: Token, right: Token): Token {
                    return {
                        type: Type.NUMBER,
                        value: left.value + right.value
                    };
                },

                parse: function(expr: Array<Token>): void {
                    opManager.get("+").helper(expr, "+");
                },
                helper: function(expr: Array<Token>, op: string): void {
                    var last: Token = expr[expr.length - 1];

                    if (!last || [Type.OPEN_PARENTHESIS, Type.OPERATOR].indexOf(last.type) >= 0) {
                        op = "u" + op;
                    }
                    expr.push({ type: Type.OPERATOR, value: op });
                }
            };
        });

        this.add(function(opManager) {
            return {
                symbol: "-",
                order: 400,

                left: Type.NUMBER,
                right: Type.NUMBER,

                fn: function(left: Token, right: Token): Token {
                    return {
                        type: Type.NUMBER,
                        value: left.value - right.value
                    };
                },

                parse: function(expr: Array<Token>): void {
                    opManager.get("+").helper(expr, "-");
                }
            };
        });

        this.add(function(opManager) {
            return {
                symbol: "or",
                order: 300,

                left: Type.BOOLEAN,
                right: Type.BOOLEAN,

                fn: function(left: Token, right: Token): Token {
                    return {
                        type: Type.BOOLEAN,
                        value: left.value || right.value
                    };
                }
            };
        });

        this.add(function(opManager) {
            return {
                symbol: "and",
                order: 300,

                left: Type.BOOLEAN,
                right: Type.BOOLEAN,

                fn: function(left: Token, right: Token): Token {
                    return {
                        type: Type.BOOLEAN,
                        value: left.value && right.value
                    };
                }
            };
        });

        this.add(function(opManager) {
            return {
                symbol: ">=",
                order: 200,

                left: Type.NUMBER,
                right: Type.NUMBER,

                fn: function(left: Token, right: Token): Token {
                    return {
                        type: Type.BOOLEAN,
                        value: left.value >= right.value
                    };
                }
            };
        });

        this.add(function(opManager) {
            return {
                symbol: "<=",
                order: 200,

                left: Type.NUMBER,
                right: Type.NUMBER,

                fn: function(left: Token, right: Token): Token {
                    return {
                        type: Type.BOOLEAN,
                        value: left.value <= right.value
                    };
                }
            };
        });

        this.add(function(opManager) {
            return {
                symbol: ">",
                order: 200,

                left: Type.NUMBER,
                right: Type.NUMBER,

                fn: function(left: Token, right: Token): Token {
                    return {
                        type: Type.BOOLEAN,
                        value: left.value > right.value
                    };
                }
            };
        });

        this.add(function(opManager) {
            return {
                symbol: "<",
                order: 200,

                left: Type.NUMBER,
                right: Type.NUMBER,

                fn: function(left: Token, right: Token): Token {
                    return {
                        type: Type.BOOLEAN,
                        value: left.value < right.value
                    };
                }
            };
        });

        this.add(function(opManager) {
            return {
                symbol: "===",
                order: 200,

                left: Type.TOKEN,
                right: Type.TOKEN,

                fn: function(left: Token, right: Token): Token {
                    return {
                        type: Type.BOOLEAN,
                        value: left.type !== right.type ? false : opManager.get("==").fn(left, right)
                    };
                }
            };
        });

        this.add(function(opManager) {
            return {
                symbol: "==",
                order: 200,

                left: Type.TOKEN,
                right: Type.TOKEN,

                fn: function(left: Token, right: Token): Token {
                    var val: boolean;
                    var converter: Converter = opManager.converter;

                    if (left.type === Type.NIL || right.type === Type.NIL) {
                        val = left.type === Type.NIL && right.type === Type.NIL;

                    } else if (left.type === Type.BOOLEAN || right.type === Type.BOOLEAN) {
                        val = converter.bool(left) === converter.bool(right);

                    } else if (left.type === Type.MAP || right.type === Type.MAP) {
                        val = mapComp(left.value, right.value);

                    } else if (left.type === right.type) {
                        val = left.value === right.value;

                    } else {
                        try {
                            val = converter.num(left) === converter.num(right);
                        } catch (e) {
                            val = false;
                        }
                    }
                    return { type: Type.BOOLEAN, value: val };
                }
            };
        });

        this.add(function(opManager) {
            return {
                symbol: "!==",
                order: 200,

                left: Type.TOKEN,
                right: Type.TOKEN,

                fn: function(left: Token, right: Token): Token {
                    return {
                        type: Type.BOOLEAN,
                        value: !opManager.get("===").fn(left, right)
                    };
                }
            };
        });

        this.add(function(opManager) {
            return {
                symbol: "!=",
                order: 200,

                left: Type.TOKEN,
                right: Type.TOKEN,

                fn: function(left: Token, right: Token): Token {
                    return {
                        type: Type.BOOLEAN,
                        value: !opManager.get("==").fn(left, right)
                    };
                }
            };
        });

        this.add(function(opManager) {
            return {
                symbol: "?",
                order: 100,

                left: Type.BOOLEAN,
                right: Type.TOKEN,

                fn: function(left: Token, right: Token): Token {
                    return {
                        type: right.type,
                        value: { val: right, test: left.value }
                    };
                },

                postParse: function(expr: Array<Token>): void {
                    expr.push({ type: Type.OPEN_PARENTHESIS });
                }
            };
        });

        this.add(function(opManager) {
            return {
                symbol: ":",
                order: 100,

                left: Type.TOKEN,
                right: Type.TOKEN,

                fn: function(left: Token, right: Token): Token {
                    return {
                        type: right.type,
                        value: left.value.test ? left.value.val : right
                    };
                },

                postParse: function(expr: Array<Token>): void {
                    expr.push({ type: Type.CLOSE_PARENTHESIS });
                }
            };
        });

        // FUNCTION ARGUMENTS
        this.add(function(opManager) {
            return {
                symbol: ",",
                order: 50,

                left: Type.ARG,
                right: Type.ARG,

                fn: function(left: Token, right: Token): Token {
                    return {
                        type: Type.ARG,
                        value: left.value.concat(right.value)
                    };
                }
            };
        });
    }
}
