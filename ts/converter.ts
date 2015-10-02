///<reference path='tokens.ts'/>
///<reference path='functions.ts'/>

class Converter
{
    to(token: Token, conversion: Type): Token
    {
        switch (conversion) {
            case Type.TOKEN:
                return this.token(token);
            case Type.ARG:
                return { type: Type.ARG, value: this.arg(token) };
            case Type.BOOLEAN:
                return { type: Type.BOOLEAN, value: this.bool(token) };
            case Type.NUMBER:
                return { type: Type.NUMBER, value: this.num(token) };
            case Type.STRING:
                return { type: Type.STRING, value: this.str(token) };
        }

        panic("Unknown conversion");
    }


    token(token: Token): Token
    {
        if (token.type !== Type.FUNC) {
            return token;
        }
        while (typeof token.value === "function") {
            token.value = token.value();
        }
        switch (typeof token.value) {
            case "number":
                return { type: Type.NUMBER, value: token.value };
            case "string":
                return { type: Type.STRING, value: token.value };
            case "boolean":
                return { type: Type.BOOLEAN, value: token.value };
        }
        return { type: Type.NIL };
    }


    arg(token: Token): any
    {
        if (token.type === Type.ARG) {
            return token.value;
        }
        if (token.type === Type.FUNC) {
            return [token.value()];
        }
        if ([Type.NUMBER, Type.STRING, Type.BOOLEAN, Type.MAP, Type.NIL].indexOf(token.type) >= 0) {
            return [token.value];
        }
        panic("Is not an argument");
    }


    bool(token: Token): boolean
    {
        var val: any;

        switch (token.type) {
            case Type.BOOLEAN:
                return token.value;
            case Type.NUMBER:
                return token.value !== 0;
            case Type.STRING:
                return token.value !== "";
            case Type.FUNC:
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
            case Type.MAP:
                return objKeys(token.value).length > 0;
        }
        return false;
    }


    num(token: Token): number
    {
        var val: any;

        switch (token.type) {
            case Type.FUNC:
                val = token.value;
                while (typeof val === "function") {
                    val = val();
                }
                break;
            case Type.NUMBER:
            case Type.STRING:
                val = token.value;
                break;
        }
        if (val !== null && !isNaN(+val)) {
            return +val;
        }
        panic("Is not a number");
    }


    str(token: Token): string
    {
        var val: any;

        switch (token.type) {
            case Type.FUNC:
                val = token.value;
                while (typeof val === "function") {
                    val = val();
                }
                return ["string", "number"].indexOf(typeof val) >= 0 ? String(val) : "";
            case Type.NUMBER:
                return String(token.value);
            case Type.STRING:
                return token.value;
        }
        return "";
    }
}
