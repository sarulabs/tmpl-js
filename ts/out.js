(function (root, factory) {
    var Tmpl = {};

    // CommonJS
    if (typeof exports === "object" && exports) {
        factory(exports);
        return;
    }

    factory(Tmpl);

    // AMD
    if (typeof define === "function" && define.amd) {
        define(Tmpl);
    }

    root.Tmpl = Tmpl;
}(this, function (Tmpl) {
    "use strict";
    ///<reference path='api.ts'/>
    // Tmpl.compile = function(template) {
    //     var exprParser = new ExprParser(),
    //         parser = new Parser(exprParser),
    //         lexer = new Lexer(parser);
    //     lexer.run(template, TAGS);
    //     return parser.getTmpl();
    // };
    // Tmpl.render = function(template, context) {
    //     var exprReader = new ExprReader(Converter),
    //         interpreter = new Interpreter(exprReader, TAGS);
    //     try {
    //         template = typeof template === "object"
    //             ? template
    //             : this.compile(template);
    //         return interpreter.render(template, context);
    //     } catch (e) {
    //         return "";
    //     }
    // };
    // Tmpl.clone = function() {
    //     return clone(Tmpl);
    // };
}));
