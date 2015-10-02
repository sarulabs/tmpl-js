///<reference path='tokens.ts'/>
///<reference path='functions.ts'/>
///<reference path='operators.ts'/>

class ExprParser
{
    operators: Array<Operator>;


    constructor(operators: Array<Operator>)
    {
        this.operators = operators;
    }


    peek(stack: Array<Token>): number
    {
        var token: Token = stack[stack.length - 1];

        return token && this.operators[token.value] !== undefined
            ? this.operators[token.value].order
            : null;
    }


    bracketEnd(stack: Array<Token>, queue: Array<Token>, expected: Type): void
    {
        while (stack.length > 0 && expected !== stack[stack.length - 1].type) {
            queue.push(stack.pop());
        }

        if (stack.length === 0) {
            panic("Mismatched brackets");
        }

        stack.pop();
    }


    parse(tokens: Array<Token>): Array<Token>
    {
        var queue: Array<Token> = [];
        var stack: Array<Token> = [];
        var token: Token;
        var i: number;

        for (i = 0; i < tokens.length; i++) {
            token = tokens[i];

            switch (token.type) {
                case Type.NUMBER:
                case Type.STRING:
                case Type.BOOLEAN:
                case Type.NAME:
                case Type.NIL:
                    queue.push(token);
                    break;

                case Type.OPERATOR:
                    while (this.peek(stack) !== null && this.operators[token.value].order <= this.peek(stack)) {
                        queue.push(stack.pop());
                    }
                    stack.push(token);
                    break;

                case Type.OPEN_PARENTHESIS:
                case Type.OPEN_BRACKET:
                    stack.push(token);
                    break;

                case Type.CLOSE_PARENTHESIS:
                    this.bracketEnd(stack, queue, Type.OPEN_PARENTHESIS);
                    break;

                case Type.CLOSE_BRACKET:
                    this.bracketEnd(stack, queue, Type.OPEN_BRACKET);
                    break;

                default:
                    panic("Unknown token");
            }
        }

        while (this.peek(stack) !== null) {
            queue.push(stack.pop());
        }

        if (stack.length > 0) {
            panic("Invalid expression");
        }

        return queue;
    }
}
