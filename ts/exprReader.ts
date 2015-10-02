///<reference path='tokens.ts'/>
///<reference path='functions.ts'/>
///<reference path='operators.ts'/>
///<reference path='context.ts'/>

class ExprReader
{
    converter: Converter;
    operators: Array<Operator>;


    constructor(converter: Converter, operators: Array<Operator>)
    {
        this.converter = converter;
        this.operators = operators;
    }


    pop(stack: Array<Token>, context: Context, conversion: Type): Token
    {
        var token: Token = stack.pop();

        if (token.type === Type.NAME && conversion !== Type.NAME) {
            token = context.get(token.value, conversion === Type.TMPL);
        }

        return this.converter.to(token, conversion);
    }


    read(tokens: Array<Token>, context: Context, conversion: Type): Token
    {
        var stack: Array<Token> = [];
        var token: Token;
        var op: Operator;
        var argRight: Token;
        var argLeft: Token;
        var i: number;

        try {
            for (i = 0; i < tokens.length; i += 1) {
                token = tokens[i];

                if ([Type.NUMBER, Type.STRING, Type.BOOLEAN, Type.NAME, Type.NIL].indexOf(token.type) >= 0) {
                    stack.push(token);

                } else {
                    op = this.operators[token.value];
                    argRight = this.operators[token.value].right ? this.pop(stack, context, op.right) : null;
                    argLeft = this.operators[token.value].left ? this.pop(stack, context, op.left) : null;

                    if (op.to === Type.TOKEN) {
                        stack.push(op.fn(argLeft, argRight));
                    } else {
                        stack.push({
                            type: op.to,
                            value: op.fn(argLeft, argRight)
                        });
                    }
                }
            }

            return this.pop(stack, context, conversion);

        } catch (e) {
            return this.converter.to({ type: Type.NIL }, conversion);
        }
    }
}
