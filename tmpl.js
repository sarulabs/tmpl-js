(function (root, factory) {

    "use strict";

    var Tmpl = {};

    // CommonJS
    if (typeof exports === "object" && exports) {
        factory(exports);
        return;
    }

    factory(Tmpl);

    // AMD
    if (typeof define === "function" && define.amd) {
        define(tmpl);
    }

    root.Tmpl = Tmpl;

}(this, function (Tmpl) {

    "use strict";

    var TEXT              = "T",
        OPEN_TAG_START    = "OTS",
        OPEN_TAG_END      = "OTE",
        CLOSE_TAG         = "CT",
        ATTR_NAME         = "AN",
        ATTR_START        = "AS",
        ATTR_END          = "AE",
        EXPR_START        = "ES",
        EXPR_END          = "EE",
        EXPR              = "E",
        SAFE_EXPR         = "SE",
        OPEN_BRACKET      = "OB",
        CLOSE_BRACKET     = "CB",
        OPEN_PARENTHESIS  = "OP",
        CLOSE_PARENTHESIS = "CP",

        TOKEN             = "TK",
        OPERATOR          = "O",
        NAME              = "N",
        ARG               = "A",
        TMPL              = "TL",

        FUNC              = "F",
        NUMBER            = "NB",
        STRING            = "S",
        BOOLEAN           = "B",
        MAP               = "M",
        NIL               = "NL",

        TAGS,
        OPERATORS,

        Converter,
        Lexer,
        Parser,
        ExprReader,
        ExprParser,
        Interpreter;


    //
    //
    //
    // HELPER FUNCTIONS
    //
    //
    //
    function panic(message) {
        throw new Error(message);
    }


    function clone(object) {
        var c = {}, p;

        if (typeof object !== "object") {
            return object;
        }
        for (p in object) {
            if (object.hasOwnProperty(p)) {
                c[p] = clone(object[p]);
            }
        }
        return c;
    }

    function objKeys(o) {
        var i, keys = [];

        for (i in o) {
            if (o.hasOwnProperty(i)) {
                keys.push(i);
            }
        }
        return keys;
    }

    function mapComp(a, b) {
        var p;
        if (a === b) {
            return true;
        }
        if (typeof a !== "object" || typeof b !== "object") {
            return false;
        }
        for (p in a) {
            if (a.hasOwnProperty(p)) {
                if (!b.hasOwnProperty(p)) {
                    return false;
                }
                if (a[p] !== b[p]) {
                    if (typeof a[p] !== "object") {
                        return false;
                    }
                    if (!mapComp(a[p], b[p])) {
                        return false;
                    }
                }
            }
        }
        for (p in b) {
            if (b.hasOwnProperty(p)) {
                if (!a.hasOwnProperty(p)) {
                    return false;
                }
            }
        }
        return true;
    }


    Converter = {
        token: function(token) {
            if (token.type !== FUNC) {
                return token;
            }
            while (typeof token.value === "function") {
                token.value = token.value();
            }
            switch (typeof token.value) {
            case "number":
                return { type: NUMBER, value: token.value };
            case "string":
                return { type: STRING, value: token.value };
            case "boolean":
                return { type: BOOLEAN, value: token.value };
            }
            return { type: NIL };
        },

        arg: function(token) {
            if (token.type === ARG) {
                return token.value;
            }
            if (token.type === FUNC) {
                return [token.value()];
            }
            if ([NUMBER, STRING, BOOLEAN, MAP, NIL].indexOf(token.type) >= 0) {
                return [token.value];
            }
            panic("Is not an argument");
        },

        bool: function(token) {
            var ret;
            switch (token.type) {
            case BOOLEAN:
                return token.value;
            case NUMBER:
                return token.value !== 0;
            case STRING:
                return token.value !== "";
            case FUNC:
                ret = token.value;
                while (typeof ret === "function") {
                    ret = ret();
                }
                switch (typeof ret) {
                case "number":
                    return ret !== 0;
                case "string":
                    return ret !== "";
                case "boolean":
                    return ret;
                }
                return false;
            case MAP:
                return objKeys(token.value).length > 0;
            }
            return false;
        },

        num: function(token) {
            var ret;
            switch (token.type) {
            case FUNC:
                ret = token.value;
                while (typeof ret === "function") {
                    ret = ret();
                }
                break;
            case NUMBER:
            case STRING:
                ret = token.value;
                break;
            }
            if (ret !== null && !isNaN(+ret)) {
                return +ret;
            }
            panic("Is not a number");
        },

        str: function(token) {
            var ret;
            switch (token.type) {
            case FUNC:
                ret = token.value;
                while (typeof ret === "function") {
                    ret = ret();
                }
                return ["string", "number"].indexOf(typeof ret) >= 0 ? String(ret) : "";
            case NUMBER:
                return String(token.value);
            case STRING:
                return token.value;
            }
            return "";
        }
    };


    /*
    ///////////////////////////////////////////////////////////////////////////////////////////////////////
    ///////////////////////////////////////////////////////////////////////////////////////////////////////

            ,o888888o.     8 888888888o     d888888o.   
         . 8888     `88.   8 8888    `88. .`8888:' `88. 
        ,8 8888       `8b  8 8888     `88 8.`8888.   Y8 
        88 8888        `8b 8 8888     ,88 `8.`8888.     
        88 8888         88 8 8888.   ,88'  `8.`8888.    
        88 8888         88 8 888888888P'    `8.`8888.   
        88 8888        ,8P 8 8888            `8.`8888.  
        `8 8888       ,8P  8 8888        8b   `8.`8888. 
         ` 8888     ,88'   8 8888        `8b.  ;8.`8888 
            `8888888P'     8 8888         `Y8888P ,88P' 

    ///////////////////////////////////////////////////////////////////////////////////////////////////////
    ///////////////////////////////////////////////////////////////////////////////////////////////////////
    */
    OPERATORS = {
        "[]": {
            // maps
            hidden: true,
            order: 900,
            left: NAME,
            right: STRING,
            to: NAME,
            fn: function(l, r) {
                return l.concat([r]);
            },
            parse: function(expr, token) {
                var last = expr[expr.length - 1];

                if (token.type === OPEN_BRACKET
                        && last
                        && (last.type === NAME || last.type === CLOSE_BRACKET)
                        ) {
                    expr.push({ type: OPERATOR, value: "[]" });
                    return expr.push({ type: OPEN_BRACKET });
                }
            }
        },
        ".": {
            order: 900,
            left: NAME,
            right: NAME,
            to: NAME,
            fn: function(l, r) {
                return l.concat(r);
            }
        },
        "|": {
            order: 800,
            left: STRING,
            right: FUNC,
            to: FUNC,
            fn: function(l, r) {
                return function() {
                    var args = [l].concat([].slice.call(arguments, 0));
                    return r.apply(this, args);
                };
            }
        },
        "()": {
            // functions
            hidden: true,
            order: 800,
            left: FUNC,
            right: ARG,
            to: FUNC,
            fn: function(l, r) {
                return function() {
                    return l.apply(Tmpl, r);
                };
            },
            parse: function(expr, token) {
                var last = expr[expr.length - 1],
                    penultimate = expr[expr.length - 2];

                if (token.type === OPEN_PARENTHESIS
                        && last
                        && (last.type === NAME || last.type === CLOSE_BRACKET)
                        ) {
                    expr.push({ type: OPERATOR, value: "()" });
                    return expr.push({ type: OPEN_PARENTHESIS });
                }

                // create a fake argument for function without any
                if (token.type === CLOSE_PARENTHESIS
                        && last
                        && last.type === OPEN_PARENTHESIS
                        && penultimate
                        && penultimate.type === OPERATOR
                        && penultimate.value === "()"
                        ) {
                    expr.push({ type: NIL });
                    return expr.push({ type: CLOSE_PARENTHESIS });
                }
            }
        },
        "u+": {
            hidden: true,
            order: 750,
            right: NUMBER,
            to: NUMBER,
            fn: function(l, r) {
                return r;
            }
        },
        "u-": {
            hidden: true,
            order: 750,
            right: NUMBER,
            to: NUMBER,
            fn: function(l, r) {
                return -r;
            }
        },
        "**": {
            order: 700,
            left: NUMBER,
            right: NUMBER,
            to: NUMBER,
            fn: Math.pow
        },
        "~": {
            order: 600,
            left: STRING,
            right: STRING,
            to: STRING,
            fn: function(l, r) {
                return l + r;
            }
        },
        "*": {
            order: 500,
            left: NUMBER,
            right: NUMBER,
            to: NUMBER,
            fn: function(l, r) {
                return l * r;
            }
        },
        "/": {
            order: 500,
            left: NUMBER,
            right: NUMBER,
            to: NUMBER,
            fn: function(l, r) {
                return r ? l / r : panic("/0");
            }
        },
        "%": {
            order: 500,
            left: NUMBER,
            right: NUMBER,
            to: NUMBER,
            fn: function(l, r) {
                return r ? l % r : panic("%0");
            }
        },
        "+": {
            order: 400,
            left: NUMBER,
            right: NUMBER,
            to: NUMBER,
            fn: function(l, r) {
                return l + r;
            },
            parseHelper: function(buffer, op) {
                var last = buffer[buffer.length - 1];

                if (!last || [OPEN_PARENTHESIS, OPERATOR].indexOf(last.type) >= 0) {
                    op = "u" + op;
                }
                return buffer.push({ type: OPERATOR, value: op });
            },
            parse: function(buffer) {
                return OPERATORS["+"].parseHelper(buffer, "+");
            }
        },
        "-": {
            order: 400,
            left: NUMBER,
            right: NUMBER,
            to: NUMBER,
            fn: function(l, r) {
                return l - r;
            },
            parse: function(buffer) {
                return OPERATORS["+"].parseHelper(buffer, "-");
            }
        },
        "or": {
            order: 300,
            left: BOOLEAN,
            right: BOOLEAN,
            to: BOOLEAN,
            fn: function(l, r) {
                return l || r;
            }
        },
        "and": {
            order: 300,
            left: BOOLEAN,
            right: BOOLEAN,
            to: BOOLEAN,
            fn: function(l, r) {
                return l && r;
            }
        },
        ">=": {
            order: 200,
            left: NUMBER,
            right: NUMBER,
            to: BOOLEAN,
            fn: function(l, r) {
                return l >= r;
            }
        },
        "<=": {
            order: 200,
            left: NUMBER,
            right: NUMBER,
            to: BOOLEAN,
            fn: function(l, r) {
                return l <= r;
            }
        },
        ">": {
            order: 200,
            left: NUMBER,
            right: NUMBER,
            to: BOOLEAN,
            fn: function(l, r) {
                return l > r;
            }
        },
        "<": {
            order: 200,
            left: NUMBER,
            right: NUMBER,
            to: BOOLEAN,
            fn: function(l, r) {
                return l < r;
            }
        },
        "===": {
            order: 200,
            left: TOKEN,
            right: TOKEN,
            to: BOOLEAN,
            fn: function(l, r) {
                return l.type !== r.type ? false : OPERATORS["=="].fn(l, r);
            }
        },
        "==": {
            order: 200,
            left: TOKEN,
            right: TOKEN,
            to: BOOLEAN,
            fn: function(l, r) {
                if (l.type === NIL || r.type === NIL) {
                    return l.type === NIL && r.type === NIL;
                }
                if (l.type === BOOLEAN || r.type === BOOLEAN) {
                    return Converter.bool(l) === Converter.bool(r);
                }
                if (l.type === MAP || r.type === MAP) {
                    return mapComp(l.value, r.value);
                }
                if (l.type === r.type) {
                    return l.value === r.value;
                }
                try {
                    return Converter.num(l) === Converter.num(r);
                } catch (e) {
                    return false;
                }
            }
        },
        "!==": {
            order: 200,
            left: TOKEN,
            right: TOKEN,
            to: BOOLEAN,
            fn: function(l, r) {
                return !OPERATORS["==="].fn(l, r);
            }
        },
        "!=": {
            order: 200,
            left: TOKEN,
            right: TOKEN,
            to: BOOLEAN,
            fn: function(l, r) {
                return !OPERATORS["=="].fn(l, r);
            }
        },
        "?": {
            order: 100,
            left: BOOLEAN,
            right: TOKEN,
            to: TOKEN,
            fn: function(l, r) {
                return { type: r.type, test: l, value: r };
            },
            postParse: function(expr) {
                expr.push({ type: OPEN_PARENTHESIS });
            }
        },
        ":": {
            order: 100,
            left: TOKEN,
            right: TOKEN,
            to: TOKEN,
            fn: function(l, r) {
                return l.test ? l.value : r;
            },
            preParse: function(expr) {
                expr.push({ type: CLOSE_PARENTHESIS });
            }
        },
        ",": {
            // function arguments
            order: 50,
            left: ARG,
            right: ARG,
            to: ARG,
            fn: function(l, r) {
                return l.concat(r);
            }
        }
    };




    /*
    ///////////////////////////////////////////////////////////////////////////////////////////////////////
    ///////////////////////////////////////////////////////////////////////////////////////////////////////

        8888888 8888888888   .8.           ,o888888o.      d888888o.   
              8 8888        .888.         8888     `88.  .`8888:' `88. 
              8 8888       :88888.     ,8 8888       `8. 8.`8888.   Y8 
              8 8888      . `88888.    88 8888           `8.`8888.     
              8 8888     .8. `88888.   88 8888            `8.`8888.    
              8 8888    .8`8. `88888.  88 8888             `8.`8888.   
              8 8888   .8' `8. `88888. 88 8888   8888888    `8.`8888.  
              8 8888  .8'   `8. `88888.`8 8888       .8'8b   `8.`8888. 
              8 8888 .888888888. `88888.  8888     ,88' `8b.  ;8.`8888 
              8 8888.8'       `8. `88888.  `8888888P'    `Y8888P ,88P' 

    ///////////////////////////////////////////////////////////////////////////////////////////////////////
    ///////////////////////////////////////////////////////////////////////////////////////////////////////
    */
    TAGS = [
        {
            symbol: "if",
            required: ["test"],
            parse: function(node) {
                node.conds = [{
                    test: node.meta.attr.test,
                    list: []
                }];
                node.meta.out = {
                    obj: node.conds[0],
                    prop: "list"
                };
                return node;
            },
            render: function(node, context) {
                var i;
                for (i = 0; i < node.conds.length; i += 1) {
                    if (this.listToBool(node.conds[i].test, context)) {
                        return this.renderList(node.conds[i].list, context);
                    }
                }
                return "";
            }
        },
        {
            parent: "if",
            symbol: "elif",
            required: ["test"],
            parse: function(node) {
                var tmp = {
                        test: node.meta.attr.test,
                        list: []
                    };
                node.conds.push(tmp);
                node.meta.out = {
                    obj: tmp,
                    prop: "list"
                };
                return node;
            }
        },
        {
            parent: "if",
            symbol: "else",
            parse: function(node) {
                var tmp = {
                        test: [{ type: EXPR, value: [{ type: BOOLEAN, value: true }] }],
                        list: []
                    };
                node.conds.push(tmp);
                node.meta.out = {
                    obj: tmp,
                    prop: "list"
                };
                return node;
            }
        },
        {
            symbol: "for",
            required: ["in"],
            parse: function(node) {
                node.key = node.meta.attr.key || null;
                node.value = node.meta.attr.value || null;
                node["in"] = node.meta.attr["in"];
                node.loop = [];
                node.empty = [];
                node.meta.out = {
                    obj: node,
                    prop: "loop"
                };
                return node;
            },
            render: function(node, context) {
                var iterable = context[this.renderList(node["in"])],
                    key = node.key ? this.renderList(node.key) : null,
                    value = node.value ? this.renderList(node.value) : null,
                    output = "",
                    self = this,
                    notEmpty,
                    i;

                function helper() {
                    if (key !== null) {
                        context[key] = i;
                    }
                    if (value !== null) {
                        context[value] = iterable[i];
                    }
                    return output + self.renderList(node.loop, context);
                }

                if (iterable && typeof iterable === "object") {
                    if (Array.isArray(iterable) && iterable.length > 0) {
                        for (i = 0; i < iterable.length; i += 1) {
                            output = helper();
                        }
                        return output;
                    }
                    for (i in iterable) {
                        if (iterable.hasOwnProperty(i)) {
                            notEmpty = 1;
                            output = helper();
                        }
                    }
                }

                return notEmpty ? output : this.renderList(node.empty, context);
            }
        },
        {
            parent: "for",
            symbol: "else",
            parse: function(node) {
                node.meta.out.prop = "empty";
                return node;
            }
        },
        {
            symbol: "include",
            required: ["template"],
            parse: function(node) {
                var parent = node.meta.parent;
                node.template = node.meta.attr.template;
                delete node.meta;
                return parent;
            },
            render: function(node, context) {
                return this.renderTmplFromList(node.template, context);
            }
        },
        // {
        //     symbol: "with",
        //     parent: "include",
        //     required: ["value", "as"],
        //     parse: function(node) {
        //         // TO DO
        //     }
        // },
        {
            symbol: "extends",
            required: ["template"],
            parse: function(node) {
                var parent = node.meta.parent;
                parent.value.parentTmpl = node.meta.attr.template;
                delete node.meta;
                return parent;
            },
            render: function() {
                return "";
            }
        },
        {
            symbol: "block",
            required: ["name"],
            parse: function(node) {
                node.list = [];
                node.name = node.meta.attr.name[0];
                node.meta.out = {
                    obj: node,
                    prop: "list"
                };
                return node;
            },
            render: function(node, context, blocks) {
                var name = this.renderExpr(node.name);
                return blocks[name]
                    ? this.renderList(blocks[name], context, blocks)
                    : this.renderList(node.list, context, blocks);
            }
        }
    ];




    /*
    ///////////////////////////////////////////////////////////////////////////////////////////////////////
    ///////////////////////////////////////////////////////////////////////////////////////////////////////

        8 8888         8 8888888888   `8.`8888.      ,8' 8 8888888888   8 888888888o.   
        8 8888         8 8888          `8.`8888.    ,8'  8 8888         8 8888    `88.  
        8 8888         8 8888           `8.`8888.  ,8'   8 8888         8 8888     `88  
        8 8888         8 8888            `8.`8888.,8'    8 8888         8 8888     ,88  
        8 8888         8 888888888888     `8.`88888'     8 888888888888 8 8888.   ,88'  
        8 8888         8 8888             .88.`8888.     8 8888         8 888888888P'   
        8 8888         8 8888            .8'`8.`8888.    8 8888         8 8888`8b       
        8 8888         8 8888           .8'  `8.`8888.   8 8888         8 8888 `8b.     
        8 8888         8 8888          .8'    `8.`8888.  8 8888         8 8888   `8b.   
        8 888888888888 8 888888888888 .8'      `8.`8888. 8 888888888888 8 8888     `88. 

    ///////////////////////////////////////////////////////////////////////////////////////////////////////
    ///////////////////////////////////////////////////////////////////////////////////////////////////////
    */
    Lexer = function(receiver) {
        this.receiver = receiver;
    };

    Lexer.prototype = {

        lxTxt: function() {
            while (!this.eof()) {
                if (this.readOpenTagStart()) {
                    return this.lxTag;
                }
                if (this.readCloseTag()) {
                    return this.lxTxt;
                }
                if (this.readExprStart()) {
                    return this.lxExprTxt;
                }
                this.pos += 1;
            }
            this.emitTxt();
        },

        lxTag: function() {
            if (this.readAttrName()) {
                return this.lxAttr;
            }
            if (this.readOpenTagEnd()) {
                return this.lxTxt;
            }
            this.panic();
        },

        lxAttr: function() {
            return this.readAttrStart() ? this.lxTxtAttr : this.lxTag;
        },

        lxTxtAttr: function() {
            while (!this.eof()) {
                if (this.readAttrEnd()) {
                    return this.lxTag;
                }
                if (this.readExprStart()) {
                    return this.lxExprTag;
                }
                this.pos += 1;
            }
            this.panic();
        },

        lxExprTxt: function() {
            return this.lxExpr(this.lxExprTxt, this.lxTxt);
        },

        lxExprTag: function() {
            return this.lxExpr(this.lxExprTag, this.lxTxtAttr);
        },

        lxExpr: function(caller, exitState) {
            this.readSpace();

            if (this.readExprEnd()) {
                return exitState;
            }
            if (this.readBracket()
                    || this.readOperator()
                    || this.readString()
                    || this.readVar()
                    || this.readNumber()
                        ) {
                return caller;
            }
            this.panic();
        },



        /**
         * Create regex for some given tags
         * @param  array tags
         */
        setTags: function(tags) {
            var i;
            this.tags = [];
            for (i = 0; i < tags.length; i += 1) {
                this.tags[i] = clone(tags[i]);
                this.tags[i].openRegex = new RegExp("^<" + tags[i].symbol + "\\s*(\\s[a-z]|>|\\/>)", "i");
                this.tags[i].closeRegex = new RegExp("^</" + tags[i].symbol + "\\s*>", "i");
            }
        },

        /**
         * Create tokens for a given input
         * @param  string input
         * @param  array tags
         */
        run: function(input, tags) {
            var state = this.lxTxt;

            this.setTags(tags);
            this.input = input.replace(/<!--!([\s\S]*?)-->/g, "");
            this.start = 0;
            this.pos = 0;
            this.quotes = 0;

            while (state) {
                state = state.call(this);
            }
        },

        /**
         * Handle errors
         */
        panic: function() {
            panic("Lexing error at char " + this.pos + ":\n>>>>\n" + this.input.substr(this.pos, 20) + "\n<<<<");
        },

        /**
         * Test end of file
         * @return boolean
         */
        eof: function() {
            return this.pos >= this.input.length;
        },

        /**
         * Check if the input from the current position starts with a given string
         * @param  string  s
         * @return boolean
         */
        is: function(s) {
            return this.input.substr(this.pos, s.length).toLowerCase() === s.toLowerCase();
        },

        /**
         * Check if the input from the current position match the regular expression given in parameter
         * @param  object regex
         * @return array
         */
        match: function(regex) {
            return regex.exec(this.input.substr(this.pos));
        },

        /**
         * Increment current position and move starting point to this position
         * @param  Number k
         */
        go: function(k) {
            this.pos = this.pos + k;
            this.start = this.pos;
        },

        /**
         * Jump as long as reading a space character
         */
        readSpace: function() {
            var match = this.match(/^\s*/);
            this.go(match ? match[0].length : 0);
        },

        /**
         * Emit a token
         * @param  mixed tokenType
         * @param  mixed tokenValue
         */
        emit: function(distance, tokenType, tokenValue) {
            this.receiver.get(tokenType, tokenValue);
            this.go(distance);
            return true;
        },

        /**
         * Read and emit a text token if necessary
         */
        emitTxt: function() {
            var txt = this.input.substr(this.start, this.pos - this.start);
            if (txt) {
                this.emit(0, TEXT, txt);
            }
            return true;
        },


        readOpenTagStart: function() {
            var match, i;
            if (this.is("<")) {
                for (i = 0; i < this.tags.length; i += 1) {
                    match = this.match(this.tags[i].openRegex);
                    if (match) {
                        return this.emitTxt()
                            && this.emit(match[0].length - match[1].trim().length, OPEN_TAG_START, this.tags[i].symbol);
                    }
                }
            }
        },

        readOpenTagEnd: function() {
            return (this.is("/>") && this.emit(2, OPEN_TAG_END))
                || (this.is(">") && this.emit(1, OPEN_TAG_END));
        },

        readCloseTag: function() {
            var match, i;
            if (this.is("</")) {
                for (i = 0; i < this.tags.length; i += 1) {
                    match = this.match(this.tags[i].closeRegex);
                    if (match) {
                        return this.emitTxt()
                            && this.emit(match[0].length, CLOSE_TAG, this.tags[i].symbol);
                    }
                }
            }
        },


        readAttrName: function() {
            var match = this.match(/^([a-zA-Z][0-9a-zA-Z_$]*)\s*/);

            return match && this.emit(match[0].length, ATTR_NAME, match[1]);
        },

        readAttrStart: function() {
            var match1 = this.match(/^=\s*'/),
                match2 = this.match(/^=\s*"/);

            if (match1) {
                this.quotes = 1;
                return this.emit(match1[0].length, ATTR_START);
            }
            if (match2) {
                this.quotes = 2;
                return this.emit(match2[0].length, ATTR_START);
            }
        },

        readAttrEnd: function() {
            var match1 = this.match(/^'\s*/),
                match2 = this.match(/^"\s*/),
                ret;

            ret = (this.quotes === 1 && match1 && this.emitTxt() && this.emit(match1[0].length, ATTR_END))
                || (this.quotes === 2 && match2 && this.emitTxt() && this.emit(match2[0].length, ATTR_END));

            if (ret) {
                this.quotes = 0;
                return true;
            }
        },


        readExprStart: function() {
            return (this.is("{{{") && this.emitTxt() && this.emit(3, EXPR_START, EXPR))
                || (this.is("{{") && this.emitTxt() && this.emit(2, EXPR_START, SAFE_EXPR));
        },

        readExprEnd: function() {
            return (this.is("}}}") && this.emit(3, EXPR_END, EXPR))
                || (this.is("}}") && this.emit(2, EXPR_END, SAFE_EXPR));
        },

        readBracket: function() {
            return (this.is("[") && this.emit(1, OPEN_BRACKET))
                || (this.is("]") && this.emit(1, CLOSE_BRACKET))
                || (this.is("(") && this.emit(1, OPEN_PARENTHESIS))
                || (this.is(")") && this.emit(1, CLOSE_PARENTHESIS));
        },

        readVar: function() {
            var match = this.match(/^[$a-zA-Z_][0-9a-zA-Z_$]*/),
                length;

            if (match !== null) {
                length = match[0].length;

                switch (match[0].toLowerCase()) {
                case "true":
                    return this.emit(length, BOOLEAN, true);
                case "false":
                    return this.emit(length, BOOLEAN, false);
                case "nil":
                    return this.emit(length, NIL);
                default:
                    return this.emit(length, NAME, [match[0]]);
                }
            }
        },

        readNumber: function() {
            var match = this.match(/^\d+(?:\.\d+)?/);

            return match && this.emit(match[0].length, NUMBER, +match[0]);
        },

        readString: function() {
            var match1 = this.match(/^'([^']*)/),
                match2 = this.match(/^"([^"]*)/);

            return (match1 && this.emit(2 + match1[1].length, STRING, this.formatStr(match1[1])))
                || (match2 && this.emit(2 + match2[1].length, STRING, this.formatStr(match2[1])));
        },

        formatStr: function(s) {
            return s.replace(/\[`\]/g, "'").replace(/\[``\]/g, "\"");
        },

        readOperator: function() {
            var symbol;
            for (symbol in OPERATORS) {
                if (OPERATORS.hasOwnProperty(symbol) && !OPERATORS[symbol].hidden && this.is(symbol)) {
                    return this.emit(symbol.length, OPERATOR, symbol);
                }
            }
        }
    };




    /*
    ///////////////////////////////////////////////////////////////////////////////////////////////////////
    ///////////////////////////////////////////////////////////////////////////////////////////////////////

        8 8888888888   `8.`8888.      ,8' 8 888888888o   8 888888888o.   
        8 8888          `8.`8888.    ,8'  8 8888    `88. 8 8888    `88.  
        8 8888           `8.`8888.  ,8'   8 8888     `88 8 8888     `88  
        8 8888            `8.`8888.,8'    8 8888     ,88 8 8888     ,88  
        8 888888888888     `8.`88888'     8 8888.   ,88' 8 8888.   ,88'  
        8 8888             .88.`8888.     8 888888888P'  8 888888888P'   
        8 8888            .8'`8.`8888.    8 8888         8 8888`8b       
        8 8888           .8'  `8.`8888.   8 8888         8 8888 `8b.     
        8 8888          .8'    `8.`8888.  8 8888         8 8888   `8b.   
        8 888888888888 .8'      `8.`8888. 8 8888         8 8888     `88. 

    ///////////////////////////////////////////////////////////////////////////////////////////////////////
    ///////////////////////////////////////////////////////////////////////////////////////////////////////
    */
    ExprParser = function() { return; };

    ExprParser.prototype = {

        top: function(stack) {
            var t = stack[stack.length - 1];

            return t && OPERATORS[t.value] !== undefined
                ? OPERATORS[t.value].order
                : null;
        },

        bracketEnd: function(expected, stack, queue) {
            while (stack.length > 0 && expected !== stack[stack.length - 1].type) {
                queue.push(stack.pop());
            }

            if (stack.length === 0) {
                panic("Mismatched brackets");
            }

            stack.pop();
        },

        parse: function(tokens) {
            var queue = [],
                stack = [],
                token,
                i;

            for (i = 0; i < tokens.length; i += 1) {
                token = tokens[i];

                switch (token.type) {
                case NUMBER:
                case STRING:
                case BOOLEAN:
                case NAME:
                case NIL:
                    queue.push(token);
                    break;

                case OPERATOR:
                    while (this.top(stack) !== null && OPERATORS[token.value].order <= this.top(stack)) {
                        queue.push(stack.pop());
                    }
                    stack.push(token);
                    break;

                case OPEN_PARENTHESIS:
                case OPEN_BRACKET:
                    stack.push(token);
                    break;

                case CLOSE_PARENTHESIS:
                    this.bracketEnd(OPEN_PARENTHESIS, stack, queue);
                    break;

                case CLOSE_BRACKET:
                    this.bracketEnd(OPEN_BRACKET, stack, queue);
                    break;

                default:
                    panic("Unknown token");
                }
            }

            while (this.top(stack) !== null) {
                queue.push(stack.pop());
            }

            if (stack.length > 0) {
                panic("Invalid expression");
            }

            return queue;
        }
    };



    ExprReader = function(converter) {
        this.convert = {
            TK : converter.token,
            A  : converter.arg,
            B  : converter.bool,
            NB : converter.num,
            S  : converter.str
        };
    };

    ExprReader.prototype = {

        checkType: function(token, expected) {
            if (expected === TOKEN) {
                return token;
            }
            return token.type === expected ? token.value : panic("Conversion error");
        },

        getVar: function(token, context, isTmpl) {
            var i, type;

            for (i = 0; i < token.value.length && context !== undefined; i += 1) {
                context = context[token.value[i]];
            }

            switch (typeof context) {
            case "object":
                if (isTmpl && context.type === TMPL) {
                    return context;
                }
                type = MAP;
                break;
            case "function":
                type = FUNC;
                break;
            case "number":
                type = NUMBER;
                break;
            case "string":
                type = STRING;
                break;
            case "boolean":
                type = BOOLEAN;
                break;
            default:
                return { type: NIL };
            }

            return { type: type, value: context };
        },

        pop: function(stack, conversion, context) {
            var token = stack.pop();

            if (token.type === NAME && conversion !== NAME) {
                token = this.getVar(token, context, conversion === TMPL);
            }

            return this.convert[conversion]
                ? this.convert[conversion](token)
                : this.checkType(token, conversion);
        },

        read: function(tokens, context, type) {
            var stack = [], token, op, v1, v2, i;

            try {
                for (i = 0; i < tokens.length; i += 1) {
                    token = tokens[i];

                    if ([NUMBER, STRING, BOOLEAN, NAME, NIL].indexOf(token.type) >= 0) {
                        stack.push(token);

                    } else {
                        op = OPERATORS[token.value];
                        v1 = OPERATORS[token.value].right ? this.pop(stack, op.right, context) : null;
                        v2 = OPERATORS[token.value].left ? this.pop(stack, op.left, context) : null;

                        if (op.to === TOKEN) {
                            stack.push(op.fn(v2, v1));
                        } else {
                            stack.push({
                                type: op.to,
                                value: op.fn(v2, v1)
                            });
                        }
                    }
                }

                return this.pop(stack, type, context);
            } catch (e) {
                token = { type: NIL };
                return this.convert[type]
                    ? this.convert[type](token)
                    : this.checkType(token, type);
            }
        }
    };



    /*
    ///////////////////////////////////////////////////////////////////////////////////////////////////////
    ///////////////////////////////////////////////////////////////////////////////////////////////////////

        8 888888888o      .8.          8 888888888o.     d888888o.   8 8888888888   8 888888888o.   
        8 8888    `88.   .888.         8 8888    `88.  .`8888:' `88. 8 8888         8 8888    `88.  
        8 8888     `88  :88888.        8 8888     `88  8.`8888.   Y8 8 8888         8 8888     `88  
        8 8888     ,88 . `88888.       8 8888     ,88  `8.`8888.     8 8888         8 8888     ,88  
        8 8888.   ,88'.8. `88888.      8 8888.   ,88'   `8.`8888.    8 888888888888 8 8888.   ,88'  
        8 888888888P'.8`8. `88888.     8 888888888P'     `8.`8888.   8 8888         8 888888888P'   
        8 8888      .8' `8. `88888.    8 8888`8b          `8.`8888.  8 8888         8 8888`8b       
        8 8888     .8'   `8. `88888.   8 8888 `8b.    8b   `8.`8888. 8 8888         8 8888 `8b.     
        8 8888    .888888888. `88888.  8 8888   `8b.  `8b.  ;8.`8888 8 8888         8 8888   `8b.   
        8 8888   .8'       `8. `88888. 8 8888     `88. `Y8888P ,88P' 8 888888888888 8 8888     `88. 

    ///////////////////////////////////////////////////////////////////////////////////////////////////////
    ///////////////////////////////////////////////////////////////////////////////////////////////////////
    */
    Parser = function(exprParser) {
        this.exprParser = exprParser;

        this.node = {
            type: TMPL,
            value: { list: [] },
            meta: { out: { prop: "list" } }
        };
        this.node.meta.out.obj = this.node.value;
    };

    Parser.prototype = {

        fns: {
            T   : "txt",
            OTS : "openTagStart",
            OTE : "openTagEnd",
            CT  : "closeTag",
            AN  : "attrName",
            AS  : "attrStart",
            AE  : "attrEnd",
            ES  : "exprStart",
            EE  : "exprEnd"
        },

        get: function(type, value) {
            var cbName = this.fns[type] || "expr";
            this.node = this[cbName].call(this, this.node, value, type);
        },

        getTmpl: function() {
            var tmpl = this.node,
                list = [],
                node,
                i;

            if (tmpl.type !== TMPL) {
                panic("Parsing error");
            }
            if (tmpl.meta.hasExtends) {
                if (tmpl.meta.nestedBlock) {
                    panic("Nested blocks");
                }
                for (i = 0; i < tmpl.value.list.length; i += 1) {
                    node = tmpl.value.list[i];

                    if (node.type === TEXT) {
                        if (!(/^\s*$/g).test(node.value)) {
                            panic("Text outside block");
                        }
                    } else if (["block", "extends"].indexOf(node.type) < 0) {
                        panic("Code outside block");
                    } else {
                        list.push(node);
                    }
                }
                tmpl.value.list = list;
            }

            delete tmpl.meta;
            return tmpl;
        },

        add: function(node, child) {
            node.meta.out.obj[node.meta.out.prop].push(child);
        },


        //
        // ATTRIBUTES
        //
        attrName: function(node, tokenValue) {
            node.meta.attr[tokenValue] = 1;
            node.meta.attrName = tokenValue;
            return node;
        },

        attrStart: function(node) {
            var meta = node.meta;
            meta.attr[meta.attrName] = [];
            meta.outTmp = meta.out;
            meta.out = {
                obj: meta.attr,
                prop: meta.attrName
            };
            return node;
        },

        attrEnd: function(node) {
            node.meta.out = node.meta.outTmp;
            return node;
        },


        //
        //  TAGS
        //
        openTagStart: function(node, tokenValue) {
            var child, i;

            if (tokenValue === "extends") {
                if (node.type !== TMPL || node.meta.hasExtends) {
                    panic("Extends misused");
                }
                node.meta.hasExtends = 1;
            }

            if (tokenValue === "block" && node.meta.inBlock) {
                node.meta.nestedBlock = 1;
            }

            for (i = 0; i < TAGS.length; i += 1) {
                if (!TAGS[i].parent) {
                    // Main tags
                    if (TAGS[i].symbol === tokenValue) {
                        child = {
                            type: TAGS[i].symbol,
                            meta: {
                                attr: {},
                                parent: node,
                                tag: TAGS[i].symbol,
                                inBlock: node.meta.inBlock || (tokenValue === "block")
                            }
                        };
                        this.add(node, child);
                        return child;
                    }
                } else {
                    // Sub tags
                    if (TAGS[i].symbol === tokenValue && TAGS[i].parent === node.type) {
                        node.meta.tag = TAGS[i].symbol;
                        node.meta.attr = {};
                        return node;
                    }
                }
            }

            panic("Unknown tag");
        },

        openTagEnd: function(node) {
            var i;

            for (i = 0; i < TAGS.length; i += 1) {
                if (node.meta.tag === TAGS[i].symbol && (node.type === TAGS[i].symbol || node.type === TAGS[i].parent)) {
                    return TAGS[i].parse(node);
                }
            }

            panic("Tag definition");
        },

        closeTag: function(node, tokenValue) {
            var parentNode = node.meta.parent,
                i;

            if (tokenValue !== node.type) {
                panic("Close tag does not match");
            }

            for (i = 0; i < TAGS.length; i += 1) {
                if (tokenValue === TAGS[i].symbol && !TAGS[i].parent) {
                    parentNode.meta.nestedBlock = parentNode.meta.nestedBlock || node.meta.nestedBlock;
                    delete node.meta;
                    node = parentNode;
                    return node;
                }
            }

            panic("Unknown tag");
        },


        //
        //  EXPRESSIONS
        //
        exprStart: function(node, tokenValue) {
            node.meta.eBuff = [];
            node.meta.eType = tokenValue;
            return node;
        },

        expr: function(node, tokenValue, tokenType) {
            var expr = node.meta.eBuff,
                token = { type: tokenType, value: tokenValue };

            if (tokenType === OPERATOR && OPERATORS[tokenValue].preParse) {
                OPERATORS[tokenValue].preParse(expr, token);
            }

            if (!(tokenType === OPERATOR && OPERATORS[tokenValue].parse && OPERATORS[tokenValue].parse(expr))
                    && !OPERATORS["[]"].parse(expr, token)
                    && !OPERATORS["()"].parse(expr, token)
                    ) {
                expr.push(token);
            }

            if (tokenType === OPERATOR && OPERATORS[tokenValue].postParse) {
                OPERATORS[tokenValue].postParse(expr, token);
            }

            return node;
        },

        exprEnd: function(node, tokenValue) {
            if (tokenValue !== node.meta.eType) {
                panic("Expression delimiters");
            }

            this.add(node, {
                type: tokenValue,
                value: this.exprParser.parse(node.meta.eBuff)
            });

            return node;
        },


        //
        //  TEXT
        //
        txt: function(node, tokenValue) {
            this.add(node, { type: TEXT, value: tokenValue });
            return node;
        }
    };





    /*
    ///////////////////////////////////////////////////////////////////////////////////////////////////////
    ///////////////////////////////////////////////////////////////////////////////////////////////////////

        8 888888888o.   8 8888888888   b.             8 8 888888888o.      8 8888888888   8 888888888o.   
        8 8888    `88.  8 8888         888o.          8 8 8888    `^888.   8 8888         8 8888    `88.  
        8 8888     `88  8 8888         Y88888o.       8 8 8888        `88. 8 8888         8 8888     `88  
        8 8888     ,88  8 8888         .`Y888888o.    8 8 8888         `88 8 8888         8 8888     ,88  
        8 8888.   ,88'  8 888888888888 8o. `Y888888o. 8 8 8888          88 8 888888888888 8 8888.   ,88'  
        8 888888888P'   8 8888         8`Y8o. `Y88888o8 8 8888          88 8 8888         8 888888888P'   
        8 8888`8b       8 8888         8   `Y8o. `Y8888 8 8888         ,88 8 8888         8 8888`8b       
        8 8888 `8b.     8 8888         8      `Y8o. `Y8 8 8888        ,88' 8 8888         8 8888 `8b.     
        8 8888   `8b.   8 8888         8         `Y8o.` 8 8888    ,o88P'   8 8888         8 8888   `8b.   
        8 8888     `88. 8 888888888888 8            `Yo 8 888888888P'      8 888888888888 8 8888     `88.  

    ///////////////////////////////////////////////////////////////////////////////////////////////////////
    ///////////////////////////////////////////////////////////////////////////////////////////////////////
    */
    Interpreter = function(exprReader, tags) {
        this.exprReader = exprReader;
        this.setFns(tags);
    };

    Interpreter.prototype = {

        setFns: function(tags) {
            var i;

            this.fns = {
                T  : this.renderTxt,
                E  : this.renderExpr,
                SE : this.renderSafeExpr
            };

            for (i = 0; i < tags.length; i += 1) {
                if (!tags[i].parent && tags[i].render) {
                    this.fns[tags[i].symbol] = tags[i].render;
                }
            }
        },

        render: function(tmpl, context, blocks) {
            blocks = blocks || {};

            if (tmpl.value.parentTmpl) {
                this.setBlocks(tmpl.value.list, blocks);
                return this.renderTmplFromList(tmpl.value.parentTmpl, context, blocks);
            }

            return this.renderList(tmpl.value.list, context, blocks);
        },

        setBlocks: function(list, blocks) {
            var i, name;

            for (i = 0; i < list.length; i += 1) {
                if (list[i].type === "block") {
                    name = this.renderExpr(list[i].name);
                    if (!blocks[name]) {
                        blocks[name] = list[i].list;
                    }
                }
            }
        },

        renderTmplFromList: function(list, context, blocks) {
            var tmpl = this.exprReader.read(list[0].value, context, TMPL);
            return tmpl ? this.render({ type: TMPL, value: tmpl }, context, blocks) : panic("Template not found");
        },

        renderList: function(list, context, blocks) {
            var output = "", i;

            for (i = 0; i < list.length; i += 1) {
                output += this.fns[list[i].type].call(this, list[i], context, blocks);
            }

            return output;
        },

        listToBool: function(list, context) {
            return list.length === 1 && (list[0].type === EXPR || list[0].type === SAFE_EXPR)
                ? this.exprReader.read(list[0].value, context, BOOLEAN)
                : this.renderList(list, context) !== "";
        },

        renderTxt: function(node) {
            return node.value;
        },

        renderExpr: function(node, context) {
            return this.exprReader.read(node.value, context, STRING);
        },

        renderSafeExpr: function(node, context) {
            var str = this.renderExpr(node, context);
            return this.escape(str);
        },

        escape: function(string) {
            return string.replace(/[&<>"'\/]/g, function(s) {
                switch (s) {
                case "&":
                    return "&amp;";
                case "<":
                    return "&lt;";
                case ">":
                    return "&gt;";
                case '"':
                    return "&quot;";
                case "'":
                    return "&#39;";
                case "/":
                    return "&#x2F;";
                }
            });
        }
    };



    /*
    ///////////////////////////////////////////////////////////////////////////////////////////////////////
    ///////////////////////////////////////////////////////////////////////////////////////////////////////

                 .8.          8 888888888o    8 8888 
                .888.         8 8888    `88.  8 8888 
               :88888.        8 8888     `88  8 8888 
              . `88888.       8 8888     ,88  8 8888 
             .8. `88888.      8 8888.   ,88'  8 8888 
            .8`8. `88888.     8 888888888P'   8 8888 
           .8' `8. `88888.    8 8888          8 8888 
          .8'   `8. `88888.   8 8888          8 8888 
         .888888888. `88888.  8 8888          8 8888 
        .8'       `8. `88888. 8 8888          8 8888  

    ///////////////////////////////////////////////////////////////////////////////////////////////////////
    ///////////////////////////////////////////////////////////////////////////////////////////////////////
    */
    Tmpl.compile = function(template) {
        var exprParser = new ExprParser(),
            parser = new Parser(exprParser),
            lexer = new Lexer(parser);

        lexer.run(template, TAGS);

        return parser.getTmpl();
    };

    Tmpl.render = function(template, context) {
        var exprReader = new ExprReader(Converter),
            interpreter = new Interpreter(exprReader, TAGS);

        try {
            template = typeof template === "object"
                ? template
                : this.compile(template);
            return interpreter.render(template, context);
        } catch (e) {
            return "";
        }
    };

    Tmpl.clone = function() {
        return clone(Tmpl);
    };

}));
