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

    //placeholder//

}));