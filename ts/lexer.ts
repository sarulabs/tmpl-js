///<reference path='tokens.ts'/>
///<reference path='functions.ts'/>
///<reference path='tags.ts'/>
///<reference path='operators.ts'/>
///<reference path='lexerRunner.ts'/>

interface Receiver
{
	get(tokenType: Type, tokenValue: string): void
}


class Lexer
{
	private input: string;
	private output: Receiver;
	private start: number;
	private pos: number;
	private quotes: number;
	private tags: Array<Tag>;
	private operators: Array<Operator>;


	constructor(input: string, output: Receiver, tags: Array<Tag>, operators: Array<Operator>)
    {
		this.input = input.replace(/<!--!([\s\S]*?)-->/g, "");
        this.output = output;
        this.start = 0;
        this.pos = 0;
        this.quotes = 0;
		this.tags = this.formatTags(tags);
		this.operators = operators;

		new LexerRunner(this);
    }


    public formatTags(tags: Array<Tag>): Array<Tag>
    {
        var formatted = [];
        var i;

        for (i = 0; i < tags.length; i++) {
            formatted[i] = clone(tags[i]);
            formatted[i].openRegExp = new RegExp("^<" + tags[i].symbol + "\\s*(\\s[a-z]|>|\\/>)", "i");
            formatted[i].closeRegExp = new RegExp("^</" + tags[i].symbol + "\\s*>", "i");
        }

        return formatted;
    }


    /**
     * Handle errors
     */
    public panic(): void
    {
        panic("Lexing error at char " + this.pos + ":\n"
            + ">>>>\n"
            + this.input.substr(this.pos, 20) + "\n"
            + "<<<<"
        );
    }


    /**
     * Test end of file
     */
    public eof(): boolean
    {
        return this.pos >= this.input.length;
    }


    /**
     * Check if the input from the current position starts with a given string
     */
    public is(s: string): boolean
    {
        return this.input.substr(this.pos, s.length).toLowerCase() === s.toLowerCase();
    }


    /**
     * Check if the input from the current position match the regular expression given in parameter
     */
    public match(regex: RegExp): Array<string>
    {
        return regex.exec(this.input.substr(this.pos));
    }


    /**
     * Increment current position and move starting point to this position
     */
    public go(k: number): void
    {
        this.pos = this.pos + k;
        this.start = this.pos;
    }


    /**
     * Jump as long as reading a space character
     */
    public readSpace(): void
    {
        var match = this.match(/^\s*/);
        this.go(match ? match[0].length : 0);
    }


    /**
     * Emit a token
     */
    public emit(distance: number, tokenType: Type, tokenValue?: any): boolean
    {
        this.output.get(tokenType, tokenValue);
        this.go(distance);
        return true;
    }


    /**
     * Read and emit a text token if necessary
     */
    public emitTxt(): boolean
    {
        var txt = this.input.substr(this.start, this.pos - this.start);
        if (txt) {
            this.emit(0, Type.TEXT, txt);
        }
        return true;
    }


    public readOpenTagStart(): boolean
    {
        var match;
        var i;

        if (this.is("<")) {
            for (i = 0; i < this.tags.length; i += 1) {
                match = this.match(this.tags[i].openRegExp);
                if (match) {
                    return this.emitTxt()
                        && this.emit(match[0].length - match[1].trim().length, Type.OPEN_TAG_START, this.tags[i].symbol);
                }
            }
        }
        return false;
    }


    public readOpenTagEnd(): boolean
    {
        return (this.is("/>") && this.emit(2, Type.OPEN_TAG_END))
            || (this.is(">") && this.emit(1, Type.OPEN_TAG_END));
    }


    public readCloseTag(): boolean
    {
        var match, i;
        if (this.is("</")) {
            for (i = 0; i < this.tags.length; i += 1) {
                match = this.match(this.tags[i].closeRegExp);
                if (match) {
                    return this.emitTxt()
                        && this.emit(match[0].length, Type.CLOSE_TAG, this.tags[i].symbol);
                }
            }
        }
    }


    public readAttrName(): boolean
    {
        var match = this.match(/^([a-zA-Z][0-9a-zA-Z_$]*)\s*/);

        return match && this.emit(match[0].length, Type.ATTR_NAME, match[1]);
    }


    public readAttrStart(): boolean
    {
        var match1 = this.match(/^=\s*'/),
            match2 = this.match(/^=\s*"/);

        if (match1) {
            this.quotes = 1;
            return this.emit(match1[0].length, Type.ATTR_START);
        }
        if (match2) {
            this.quotes = 2;
            return this.emit(match2[0].length, Type.ATTR_START);
        }
    }


    public readAttrEnd(): boolean
    {
        var match1 = this.match(/^'\s*/);
        var match2 = this.match(/^"\s*/);
        var ret;

        ret = (this.quotes === 1 && match1 && this.emitTxt() && this.emit(match1[0].length, Type.ATTR_END))
            || (this.quotes === 2 && match2 && this.emitTxt() && this.emit(match2[0].length, Type.ATTR_END));

        if (ret) {
            this.quotes = 0;
            return true;
        }
    }


    public readExprStart(): boolean
    {
        return (this.is("{{{") && this.emitTxt() && this.emit(3, Type.EXPR_START, Type.EXPR))
            || (this.is("{{") && this.emitTxt() && this.emit(2, Type.EXPR_START, Type.SAFE_EXPR));
    }


    public readExprEnd(): boolean
    {
        return (this.is("}}}") && this.emit(3, Type.EXPR_END, Type.EXPR))
            || (this.is("}}") && this.emit(2, Type.EXPR_END, Type.SAFE_EXPR));
    }


    public readBracket(): boolean
    {
        return (this.is("[") && this.emit(1, Type.OPEN_BRACKET))
            || (this.is("]") && this.emit(1, Type.CLOSE_BRACKET))
            || (this.is("(") && this.emit(1, Type.OPEN_PARENTHESIS))
            || (this.is(")") && this.emit(1, Type.CLOSE_PARENTHESIS));
    }


    public readVar(): boolean
    {
        var match = this.match(/^[$a-zA-Z_][0-9a-zA-Z_$]*/),
            length;

        if (match !== null) {
            length = match[0].length;

            switch (match[0].toLowerCase()) {
            case "true":
                return this.emit(length, Type.BOOLEAN, true);
            case "false":
                return this.emit(length, Type.BOOLEAN, false);
            case "nil":
                return this.emit(length, Type.NIL);
            default:
                return this.emit(length, Type.NAME, [match[0]]);
            }
        }
        return false;
    }


    public readNumber(): boolean
    {
        var match = this.match(/^\d+(?:\.\d+)?/);

        return match && this.emit(match[0].length, Type.NUMBER, +match[0]);
    }


    public readString(): boolean
    {
        var match1 = this.match(/^'([^']*)/);
        var match2 = this.match(/^"([^"]*)/);

        return (match1 && this.emit(2 + match1[1].length, Type.STRING, this.formatStr(match1[1])))
            || (match2 && this.emit(2 + match2[1].length, Type.STRING, this.formatStr(match2[1])));
    }


    public formatStr(s: string): string
    {
        return s.replace(/\[`\]/g, "'").replace(/\[``\]/g, "\"");
    }


    public readOperator(): boolean
    {
        var symbol;

        for (symbol in this.operators) {
            if (this.operators.hasOwnProperty(symbol) && !this.operators[symbol].noLex && this.is(symbol)) {
                return this.emit(symbol.length, Type.OPERATOR, symbol);
            }
        }
        return false;
    }
}