///<reference path='tokens.ts'/>

class Context
{
    data: any;

    constructor(data: any)
    {
        this.data = data;
    }


    set(key: string, value: any)
    {
        this.data[key] = value;
    }


    get(key: Array<string>, expectTmpl?: boolean): Token
    {
        var i: number;
        var type: Type;
        var subContext: any = this.data;

        for (i = 0; i < key.length && subContext !== undefined; i++) {
            subContext = subContext[key[i]];
        }

        switch (typeof subContext) {
            case "object":
                if (expectTmpl && subContext.type === Type.TMPL) {
                    return subContext;
                }
                type = Type.MAP;
                break;
            case "function":
                type = Type.FUNC;
                break;
            case "number":
                type = Type.NUMBER;
                break;
            case "string":
                type = Type.STRING;
                break;
            case "boolean":
                type = Type.BOOLEAN;
                break;
            default:
                return { type: Type.NIL };
        }

        return { type: type, value: subContext };
    }
}
