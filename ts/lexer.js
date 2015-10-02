///<reference path='tokens.ts'/>
///<reference path='functions.ts'/>
///<reference path='tags.ts'/>
///<reference path='operators.ts'/>
///<reference path='lexerRunner.ts'/>

var Lexer = (function () {
    function Lexer(input, output, tags, operators) {
        this.input = input.replace(/<!--!([\s\S]*?)-->/g, "");
        this.output = output;
        this.start = 0;
        this.pos = 0;
        this.quotes = 0;
        this.tags = this.formatTags(tags);
        this.operators = operators;

        new LexerRunner(this);
    }
    Lexer.prototype.formatTags = function (tags) {
        var formatted = [];
        var i;

        for (i = 0; i < tags.length; i++) {
            formatted[i] = clone(tags[i]);
            formatted[i].openRegExp = new RegExp("^<" + tags[i].symbol + "\\s*(\\s[a-z]|>|\\/>)", "i");
            formatted[i].closeRegExp = new RegExp("^</" + tags[i].symbol + "\\s*>", "i");
        }

        return formatted;
    };

    /**
    * Handle errors
    */
    Lexer.prototype.panic = function () {
        panic("Lexing error at char " + this.pos + ":\n" + ">>>>\n" + this.input.substr(this.pos, 20) + "\n" + "<<<<");
    };

    /**
    * Test end of file
    * @return boolean
    */
    Lexer.prototype.eof = function () {
        return this.pos >= this.input.length;
    };

    /**
    * Check if the input from the current position starts with a given string
    * @param  string  s
    * @return boolean
    */
    Lexer.prototype.is = function (s) {
        return this.input.substr(this.pos, s.length).toLowerCase() === s.toLowerCase();
    };

    /**
    * Check if the input from the current position match the regular expression given in parameter
    * @param  object regex
    * @return array
    */
    Lexer.prototype.match = function (regex) {
        return regex.exec(this.input.substr(this.pos));
    };

    /**
    * Increment current position and move starting point to this position
    * @param  Number k
    */
    Lexer.prototype.go = function (k) {
        this.pos = this.pos + k;
        this.start = this.pos;
    };

    /**
    * Jump as long as reading a space character
    */
    Lexer.prototype.readSpace = function () {
        var match = this.match(/^\s*/);
        this.go(match ? match[0].length : 0);
    };

    /**
    * Emit a token
    * @param  mixed tokenType
    * @param  mixed tokenValue
    */
    Lexer.prototype.emit = function (distance, tokenType, tokenValue) {
        this.output.get(tokenType, tokenValue);
        this.go(distance);
        return true;
    };

    /**
    * Read and emit a text token if necessary
    */
    Lexer.prototype.emitTxt = function () {
        var txt = this.input.substr(this.start, this.pos - this.start);
        if (txt) {
            this.emit(0, 0 /* TEXT */, txt);
        }
        return true;
    };

    Lexer.prototype.readOpenTagStart = function () {
        var match, i;
        if (this.is("<")) {
            for (i = 0; i < this.tags.length; i += 1) {
                match = this.match(this.tags[i].openRegExp);
                if (match) {
                    return this.emitTxt() && this.emit(match[0].length - match[1].trim().length, 18 /* OPEN_TAG_START */, this.tags[i].symbol);
                }
            }
        }
    };

    Lexer.prototype.readOpenTagEnd = function () {
        return (this.is("/>") && this.emit(2, 19 /* OPEN_TAG_END */)) || (this.is(">") && this.emit(1, 19 /* OPEN_TAG_END */));
    };

    Lexer.prototype.readCloseTag = function () {
        var match, i;
        if (this.is("</")) {
            for (i = 0; i < this.tags.length; i += 1) {
                match = this.match(this.tags[i].closeRegExp);
                if (match) {
                    return this.emitTxt() && this.emit(match[0].length, 20 /* CLOSE_TAG */, this.tags[i].symbol);
                }
            }
        }
    };

    Lexer.prototype.readAttrName = function () {
        var match = this.match(/^([a-zA-Z][0-9a-zA-Z_$]*)\s*/);

        return match && this.emit(match[0].length, 21 /* ATTR_NAME */, match[1]);
    };

    Lexer.prototype.readAttrStart = function () {
        var match1 = this.match(/^=\s*'/), match2 = this.match(/^=\s*"/);

        if (match1) {
            this.quotes = 1;
            return this.emit(match1[0].length, 22 /* ATTR_START */);
        }
        if (match2) {
            this.quotes = 2;
            return this.emit(match2[0].length, 22 /* ATTR_START */);
        }
    };

    Lexer.prototype.readAttrEnd = function () {
        var match1 = this.match(/^'\s*/);
        var match2 = this.match(/^"\s*/);
        var ret;

        ret = (this.quotes === 1 && match1 && this.emitTxt() && this.emit(match1[0].length, 23 /* ATTR_END */)) || (this.quotes === 2 && match2 && this.emitTxt() && this.emit(match2[0].length, 23 /* ATTR_END */));

        if (ret) {
            this.quotes = 0;
            return true;
        }
    };

    Lexer.prototype.readExprStart = function () {
        return (this.is("{{{") && this.emitTxt() && this.emit(3, 24 /* EXPR_START */, 1 /* EXPR */)) || (this.is("{{") && this.emitTxt() && this.emit(2, 24 /* EXPR_START */, 2 /* SAFE_EXPR */));
    };

    Lexer.prototype.readExprEnd = function () {
        return (this.is("}}}") && this.emit(3, 25 /* EXPR_END */, 1 /* EXPR */)) || (this.is("}}") && this.emit(2, 25 /* EXPR_END */, 2 /* SAFE_EXPR */));
    };

    Lexer.prototype.readBracket = function () {
        return (this.is("[") && this.emit(1, 14 /* OPEN_BRACKET */)) || (this.is("]") && this.emit(1, 15 /* CLOSE_BRACKET */)) || (this.is("(") && this.emit(1, 16 /* OPEN_PARENTHESIS */)) || (this.is(")") && this.emit(1, 17 /* CLOSE_PARENTHESIS */));
    };

    Lexer.prototype.readVar = function () {
        var match = this.match(/^[$a-zA-Z_][0-9a-zA-Z_$]*/), length;

        if (match !== null) {
            length = match[0].length;

            switch (match[0].toLowerCase()) {
                case "true":
                    return this.emit(length, 6 /* BOOLEAN */, true);
                case "false":
                    return this.emit(length, 6 /* BOOLEAN */, false);
                case "nil":
                    return this.emit(length, 7 /* NIL */);
                default:
                    return this.emit(length, 8 /* NAME */, [match[0]]);
            }
        }
    };

    Lexer.prototype.readNumber = function () {
        var match = this.match(/^\d+(?:\.\d+)?/);

        return match && this.emit(match[0].length, 4 /* NUMBER */, +match[0]);
    };

    Lexer.prototype.readString = function () {
        var match1 = this.match(/^'([^']*)/), match2 = this.match(/^"([^"]*)/);

        return (match1 && this.emit(2 + match1[1].length, 5 /* STRING */, this.formatStr(match1[1]))) || (match2 && this.emit(2 + match2[1].length, 5 /* STRING */, this.formatStr(match2[1])));
    };

    Lexer.prototype.formatStr = function (s) {
        return s.replace(/\[`\]/g, "'").replace(/\[``\]/g, "\"");
    };

    Lexer.prototype.readOperator = function () {
        var symbol;
        for (symbol in this.operators) {
            if (this.operators.hasOwnProperty(symbol) && !this.operators[symbol].noLex && this.is(symbol)) {
                return this.emit(symbol.length, 3 /* OPERATOR */, symbol);
            }
        }
    };
    return Lexer;
})();
