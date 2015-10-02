///<reference path='tokens.ts'/>
var Context = (function () {
    function Context(data) {
        this.data = data;
    }
    Context.prototype.set = function (key, value) {
        this.data[key] = value;
    };

    Context.prototype.get = function (key, expectTmpl) {
        var i;
        var type;
        var subContext = this.data;

        for (i = 0; i < key.length && subContext !== undefined; i++) {
            subContext = subContext[key[i]];
        }

        switch (typeof subContext) {
            case "object":
                if (expectTmpl && subContext.type === 9 /* TMPL */) {
                    return subContext;
                }
                type = 11 /* MAP */;
                break;
            case "function":
                type = 10 /* FUNC */;
                break;
            case "number":
                type = 4 /* NUMBER */;
                break;
            case "string":
                type = 5 /* STRING */;
                break;
            case "boolean":
                type = 6 /* BOOLEAN */;
                break;
            default:
                return { type: 7 /* NIL */ };
        }

        return { type: type, value: subContext };
    };
    return Context;
})();
