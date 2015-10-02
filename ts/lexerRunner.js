///<reference path='lexer.ts'/>

var LexerRunner = (function () {
    function LexerRunner(lexer) {
        var state = this.txt;

        while (state) {
            state = state(lexer);
        }
    }
    LexerRunner.prototype.txt = function (lexer) {
        while (!lexer.eof()) {
            if (lexer.readOpenTagStart()) {
                return this.tag;
            }
            if (lexer.readCloseTag()) {
                return this.txt;
            }
            if (lexer.readExprStart()) {
                return this.exprTxt;
            }
            lexer.pos += 1;
        }
        lexer.emitTxt();
    };

    LexerRunner.prototype.tag = function (lexer) {
        if (lexer.readAttrName()) {
            return this.attr;
        }
        if (lexer.readOpenTagEnd()) {
            return this.txt;
        }
        lexer.panic();
    };

    LexerRunner.prototype.attr = function (lexer) {
        return lexer.readAttrStart() ? this.txtAttr : this.tag;
    };

    LexerRunner.prototype.txtAttr = function (lexer) {
        while (!lexer.eof()) {
            if (lexer.readAttrEnd()) {
                return this.tag;
            }
            if (lexer.readExprStart()) {
                return this.exprTag;
            }
            lexer.pos += 1;
        }
        lexer.panic();
    };

    LexerRunner.prototype.exprTxt = function (lexer) {
        return this.expr(lexer, this.exprTxt, this.txt);
    };

    LexerRunner.prototype.exprTag = function (lexer) {
        return this.expr(lexer, this.exprTag, this.txtAttr);
    };

    LexerRunner.prototype.expr = function (lexer, caller, exitState) {
        lexer.readSpace();

        if (lexer.readExprEnd()) {
            return exitState;
        }
        if (lexer.readBracket() || lexer.readOperator() || lexer.readString() || lexer.readVar() || lexer.readNumber()) {
            return caller;
        }
        lexer.panic();
    };
    return LexerRunner;
})();
