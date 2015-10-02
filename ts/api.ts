///<reference path='exprParser.ts'/>
///<reference path='exprReader.ts'/>
///<reference path='lexer.ts'/>
///<reference path='parser.ts'/>
///<reference path='interpreter.ts'/>
///<reference path='tags.ts'/>
///<reference path='operators.ts'/>
declare var Tmpl: any

Tmpl.debug = false;
Tmpl.tagManager = new TagManager();
Tmpl.opManager = new OpManager();
Tmpl.converter = new Converter();
Tmpl.exprReader = new ExprReader();
Tmpl.exprParser = new ExprParser(Tmpl.OpManager);


Tmpl.compile = function(template) {
    var exprParser = new ExprParser(Tmpl.OpManager);
    var parser = new Parser(exprParser);
    
    new Lexer(template, parser, Tmpl.OpManager, Tmpl.TagManager);

    return parser.getTmpl();
};

Tmpl.render = function(template, context) {
    var exprReader = new ExprReader(Tmpl.converter);
    var interpreter = new Interpreter(exprReader, TAGS);

    try {
        template = typeof template === "object"
            ? template
            : this.compile(template);
        return interpreter.render(template, context);
    } catch (e) {
    	if (Tmpl.debug) {
    		throw e;
    	}	
        return "";
    }
};

Tmpl.clone = function() {
    return clone(Tmpl);
};
