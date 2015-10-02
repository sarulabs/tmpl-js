///<reference path='lexer.ts'/>


interface LexerFn
{
    (lexer: Lexer): LexerFn
}


class LexerRunner
{

	constructor(lexer: Lexer) {
		var state = this.txt;

		while (state) {
			state = state(lexer);
		}
	}

	txt(lexer: Lexer): LexerFn {
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
    }

	tag(lexer: Lexer): LexerFn {
        if (lexer.readAttrName()) {
            return this.attr;
        }
        if (lexer.readOpenTagEnd()) {
            return this.txt;
        }
        lexer.panic();
    }

	attr(lexer: Lexer): LexerFn {
        return lexer.readAttrStart() ? this.txtAttr : this.tag;
    }

	txtAttr(lexer: Lexer): LexerFn {
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
    }

	exprTxt(lexer: Lexer): LexerFn {
        return this.expr(lexer, this.exprTxt, this.txt);
    }

	exprTag(lexer: Lexer): LexerFn {
        return this.expr(lexer, this.exprTag, this.txtAttr);
    }

	expr(lexer: Lexer, caller: LexerFn, exitState: LexerFn) {
        lexer.readSpace();

        if (lexer.readExprEnd()) {
            return exitState;
        }
        if (lexer.readBracket()
                || lexer.readOperator()
                || lexer.readString()
                || lexer.readVar()
                || lexer.readNumber()
                    ) {
            return caller;
        }
        lexer.panic();
    }
}
