///<reference path='tokens.ts'/>
///<reference path='functions.ts'/>
var Converter = (function () {
    function Converter() {
    }
    Converter.prototype.to = function (token, conversion) {
        switch (conversion) {
            case 13 /* TOKEN */:
                return this.token(token);
            case 12 /* ARG */:
                return { type: 12 /* ARG */, value: this.arg(token) };
            case 6 /* BOOLEAN */:
                return { type: 6 /* BOOLEAN */, value: this.bool(token) };
            case 4 /* NUMBER */:
                return { type: 4 /* NUMBER */, value: this.num(token) };
            case 5 /* STRING */:
                return { type: 5 /* STRING */, value: this.str(token) };
        }

        panic("Unknown conversion");
    };

    Converter.prototype.token = function (token) {
        if (token.type !== 10 /* FUNC */) {
            return token;
        }
        while (typeof token.value === "function") {
            token.value = token.value();
        }
        switch (typeof token.value) {
            case "number":
                return { type: 4 /* NUMBER */, value: token.value };
            case "string":
                return { type: 5 /* STRING */, value: token.value };
            case "boolean":
                return { type: 6 /* BOOLEAN */, value: token.value };
        }
        return { type: 7 /* NIL */ };
    };

    Converter.prototype.arg = function (token) {
        if (token.type === 12 /* ARG */) {
            return token.value;
        }
        if (token.type === 10 /* FUNC */) {
            return [token.value()];
        }
        if ([4 /* NUMBER */, 5 /* STRING */, 6 /* BOOLEAN */, 11 /* MAP */, 7 /* NIL */].indexOf(token.type) >= 0) {
            return [token.value];
        }
        panic("Is not an argument");
    };

    Converter.prototype.bool = function (token) {
        var val;

        switch (token.type) {
            case 6 /* BOOLEAN */:
                return token.value;
            case 4 /* NUMBER */:
                return token.value !== 0;
            case 5 /* STRING */:
                return token.value !== "";
            case 10 /* FUNC */:
                val = token.value;
                while (typeof val === "function") {
                    val = val();
                }
                switch (typeof val) {
                    case "number":
                        return val !== 0;
                    case "string":
                        return val !== "";
                    case "boolean":
                        return val;
                }
                return false;
            case 11 /* MAP */:
                return objKeys(token.value).length > 0;
        }
        return false;
    };

    Converter.prototype.num = function (token) {
        var val;

        switch (token.type) {
            case 10 /* FUNC */:
                val = token.value;
                while (typeof val === "function") {
                    val = val();
                }
                break;
            case 4 /* NUMBER */:
            case 5 /* STRING */:
                val = token.value;
                break;
        }
        if (val !== null && !isNaN(+val)) {
            return +val;
        }
        panic("Is not a number");
    };

    Converter.prototype.str = function (token) {
        var val;

        switch (token.type) {
            case 10 /* FUNC */:
                val = token.value;
                while (typeof val === "function") {
                    val = val();
                }
                return ["string", "number"].indexOf(typeof val) >= 0 ? String(val) : "";
            case 4 /* NUMBER */:
                return String(token.value);
            case 5 /* STRING */:
                return token.value;
        }
        return "";
    };
    return Converter;
})();
