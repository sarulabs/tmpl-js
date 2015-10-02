

function panic(message: string): void
{
    throw new Error(message);
}


function clone(object: any): any
{
    var c: any = {};
    var p: string;

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


function objKeys(o: any): Array<string>
{
    var keys: Array<string> = [];
    var i: string;

    for (i in o) {
        if (o.hasOwnProperty(i)) {
            keys.push(i);
        }
    }
    return keys;
}


function mapComp(a: any, b: any): boolean
{
    var p: string;

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
