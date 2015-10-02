(function() {
    "use strict";

    function testRender(template, renderedExpected, data) {
        var rendered = Tmpl.render(template, data || {});

        equal(
            rendered,
            renderedExpected,
            template +
                " __________ " + renderedExpected
                + " __________ " + JSON.stringify(data || {})
        );
    }

    function testArray(name, array) {
        test(name, function() {
            var i;
            for (i = 0; i < array.length; i += 1) {
                testRender(array[i][0], array[i][1], array[i][2]);
            }
        });
    }


//-----------------------
    testArray("SIMPLE EXPRESSIONS", [

        ["{{ 3 }}", "3"],
        ["{{ 88.52 }}", "88.52"],
        ["{{ 'singleQuotes' }}", "singleQuotes"],
        ["{{ \"doubleQuotes\" }}", "doubleQuotes"],
        ["{{{ 'escape[`]single' }}}", "escape'single"],
        ["{{{ 'escape[``]double' }}}", "escape\"double"],
        ["{{ Nil }}", ""],
        ["{{ True }}", ""],
        ["{{ False }}", "", { False: "value" }],
        ["{{ variable }}", "value", { variable: "value" }],
        ["{{ variable }}", "", { Variable: "value" }],
        ["{{ variable }}", "32.1", { variable: 32.1 }],
        ["{{ variable }}", ""],
        ["{{ variable }}", "", { variable: null }],
        ["{{ variable }}", "", { variable: [1, 2, 3] }],
        ["{{ variable }}", "", { variable: { key: "value" } }],
        ["{{ object.nested.variable }}", "value", { object: { nested: { variable: "value"} } }],
        ["{{ object['nested'][\"variable\"] }}", "value", { object: { nested: { variable: "value"} } }],
        ["{{ object['nested'].variable }}", "value", { object: { nested: { variable: "value"} } }],
        ["{{ object.nested['variable'] }}", "value", { object: { nested: { variable: "value"} } }],
        ["{{ array['2'] }}", "3", { array: [1, 2, 3] }],
        ["{{ array[2] }}", "3", { array: [1, 2, 3] }],
        ["{{ array[1]['2'].object }}", "6", { array: [1, [4, 5, { object: 6 }], 3] }],

    ]);
//-----------------------
//-----------------------
    testArray("BASIC OPERATORS", [

        ["{{ 1 + 3 }}", "4"],
        ["{{ 11 + 0 }}", "11"],
        ["{{ 10+5.5 }}", "15.5"],
        ["{{ + 3 }}", "3"],
        ["{{ + '4' }}", "4"],
        ["{{ '7' + '3' }}", "10"],
        ["{{ '7.9' + '3.1' }}", "11"],
        ["{{ + 'notok' }}", ""],
        ["{{ + nil }}", ""],
        ["{{ false + true }}", ""],
        ["{{ + variable }}", ""],

        ["{{ 4 - 3 }}", "1"],
        ["{{ 10 -5.5 }}", "4.5"],
        ["{{ 0 -5.5 }}", "-5.5"],
        ["{{ - 3 }}", "-3"],
        ["{{ - 0 }}", "0"],
        ["{{ '7' - '3' }}", "4"],
        ["{{ '10.5' - '3' }}", "7.5"],
        ["{{ - 'notok' }}", ""],

        ["{{ 3* 2 }}", "6"],
        ["{{ 10* 1.5 }}", "15"],
        ["{{ 0 * 10 }}", "0"],
        ["{{ '2' * 10 }}", "20"],

        ["{{ 8 /2 }}", "4"],
        ["{{ 9 / 2 }}", "4.5"],
        ["{{ 8 / 0 }}", ""],

        ["{{ 7 % 3 }}", "1"],
        ["{{ 9 % 3 }}", "0"],
        ["{{ 9 % 0 }}", ""],

        ["{{ 2**3 }}", "8"],
        ["{{ 0**3 }}", "0"],
        ["{{ 0**0 }}", "1"],
        ["{{ 10 ** 0 }}", "1"],
        ["{{ 10 ** 2 }}", "100"],

        ["{{ 'o' ~ 'k' }}", "ok"],
        ["{{ 1 ~ '2' }}", "12"],
        ["{{ 1~2 }}", "12"],
        ["{{ true ~ 'ok' }}", "ok"],
        ["{{ 'ok' ~ false }}", "ok"],
        ["{{ 'ok' ~ nil }}", "ok"],
        ["{{ 'ok' ~ variable }}", "ok"],

    ]);
//-----------------------
//-----------------------
    testArray("COMPARISON OPERATORS", [

        ["{{ true ? 'ok' : 'e' }}", "ok"],
        ["{{ false ? 'e' : 'ok' }}", "ok"],
        ["{{ nil ? 'e' : 'ok' }}", "ok"],
        ["{{ 1 ? 'ok' : 'e' }}", "ok"],
        ["{{ 2 ? 'ok' : 'e' }}", "ok"],
        ["{{ -2 ? 'ok' : 'e' }}", "ok"],
        ["{{ 0 ? 'e' : 'ok' }}", "ok"],
        ["{{ 'string' ? 'ok' : 'e' }}", "ok"],
        ["{{ '0' ? 'ok' : 'e' }}", "ok"],
        ["{{ '' ? 'e' : 'ok' }}", "ok"],
        ["{{ array ? 'e' : 'ok' }}", "ok", { array: [] }],
        ["{{ array ? 'ok' : 'e' }}", "ok", { array: [0] }],
        ["{{ object ? 'e' : 'ok' }}", "ok", { object: {} }],
        ["{{ object ? 'ok' : 'e' }}", "ok", { object: { item: "value" } }],

        ["{{ 4 <= 5 ? 'ok' : 'e' }}", "ok"],
        ["{{ -6 <= 1 ? 'ok' : 'e' }}", "ok"],
        ["{{ -0 <= 1 ? 'ok' : 'e' }}", "ok"],
        ["{{ 10 <= 10 ? 'ok' : 'e' }}", "ok"],
        ["{{ 10 <= -5 ? 'e' : 'ok' }}", "ok"],
        ["{{ nil >= true ? 'e' : 'e' }}", ""],

        ["{{ 1 < 2 ? 'ok' : 'e' }}", "ok"],
        ["{{ -1 < 2 ? 'ok' : 'e' }}", "ok"],
        ["{{ -1 < 0 ? 'ok' : 'e' }}", "ok"],
        ["{{ 1 < 1 ? 'e' : 'ok' }}", "ok"],
        ["{{ 2 < 1 ? 'e' : 'ok' }}", "ok"],
        ["{{ 2 < 'string' ? 'e' : 'e' }}", ""],

        ["{{ 2 >= 1 ? 'ok' : 'e' }}", "ok"],
        ["{{ 1 >= 1 ? 'ok' : 'e' }}", "ok"],
        ["{{ 1 >= 2 ? 'e' : 'ok' }}", "ok"],
        ["{{ true >= 'string' ? 'e' : 'e' }}", ""],

        ["{{ 4 > 3 ? 'ok' : 'e' }}", "ok"],
        ["{{ 4 > 0 ? 'ok' : 'e' }}", "ok"],
        ["{{ -4 > 0 ? 'e' : 'ok' }}", "ok"],
        ["{{ 4 > 5 ? 'e' : 'ok' }}", "ok"],
        ["{{ 4 > 4 ? 'e' : 'ok' }}", "ok"],
        ["{{ 'z' > 'a' ? 'e' : 'e' }}", ""],

        ["{{ 4 == 4 ? 'ok' : 'e' }}", "ok"],
        ["{{ 4 == 5 ? 'e' : 'ok' }}", "ok"],
        ["{{ 4 == '4' ? 'ok' : 'e' }}", "ok"],
        ["{{ 4 == '4.0' ? 'ok' : 'e' }}", "ok"],
        ["{{ '4.0' == 4 ? 'ok' : 'e' }}", "ok"],
        ["{{ 4 == '5' ? 'e' : 'ok' }}", "ok"],
        ["{{ 4 == nil ? 'e' : 'ok' }}", "ok"],
        ["{{ 0 == nil ? 'e' : 'ok' }}", "ok"],
        ["{{ 0 == notset ? 'e' : 'ok' }}", "ok"],
        ["{{ 0 == true ? 'e' : 'ok' }}", "ok"],
        ["{{ 0 == false ? 'ok' : 'e' }}", "ok"],
        ["{{ 0 == map ? 'e' : 'ok' }}", "ok", { "map": [] }],
        ["{{ '' == '' ? 'ok' : 'e' }}", "ok"],
        ["{{ 'a' == 'a' ? 'ok' : 'e' }}", "ok"],
        ["{{ 'text' == 'text' ? 'ok' : 'e' }}", "ok"],
        ["{{ 'z' == 'a' ? 'e' : 'ok' }}", "ok"],
        ["{{ 'z' == false ? 'e' : 'ok' }}", "ok"],
        ["{{ 'z' == true ? 'ok' : 'e' }}", "ok"],
        ["{{ '' == nil ? 'e' : 'ok' }}", "ok"],
        ["{{ '' == notset ? 'e' : 'ok' }}", "ok"],
        ["{{ '' == map ? 'e' : 'ok' }}", "ok", { "map": [] }],
        ["{{ true == true ? 'ok' : 'e' }}", "ok"],
        ["{{ false == true ? 'e' : 'ok' }}", "ok"],
        ["{{ true == 1 ? 'ok' : 'e' }}", "ok"],
        ["{{ true == 0 ? 'e' : 'ok' }}", "ok"],
        ["{{ true == 'a' ? 'ok' : 'e' }}", "ok"],
        ["{{ true == '0' ? 'ok' : 'e' }}", "ok"],
        ["{{ true == '' ? 'e' : 'ok' }}", "ok"],
        ["{{ false == '' ? 'ok' : 'e' }}", "ok"],
        ["{{ nil == false ? 'e' : 'ok' }}", "ok"],
        ["{{ nil == notset ? 'ok' : 'e' }}", "ok"],

        ["{{ 4 != 3 ? 'ok' : 'e' }}", "ok"],
        ["{{ 4 != false ? 'ok' : 'e' }}", "ok"],
        ["{{ 4 != nil ? 'ok' : 'e' }}", "ok"],
        ["{{ true != nil ? 'ok' : 'e' }}", "ok"],
        ["{{ 'str' != 2 ? 'ok' : 'e' }}", "ok"],
        ["{{ 'str' != var ? 'ok' : 'e' }}", "ok", { "var": [] }],
        ["{{ 'str' != var ? 'ok' : 'e' }}", "ok", { "var": [1] }],
        ["{{ 4 != 4 ? 'e' : 'ok' }}", "ok"],
        ["{{ 0 != false ? 'e' : 'ok' }}", "ok"],
        ["{{ 0 != nil ? 'ok' : 'e' }}", "ok"],
        ["{{ false != nil ? 'ok' : 'e' }}", "ok"],
        ["{{ 'str' != 'str' ? 'e' : 'ok' }}", "ok"],

        ["{{ 4 === 4 ? 'ok' : 'e' }}", "ok"],
        ["{{ 4 === 5 ? 'e' : 'ok' }}", "ok"],
        ["{{ 4 === '4' ? 'e' : 'ok' }}", "ok"],
        ["{{ '4.0' === 4 ? 'e' : 'ok' }}", "ok"],
        ["{{ 4 === '5' ? 'e' : 'ok' }}", "ok"],
        ["{{ 4 === nil ? 'e' : 'ok' }}", "ok"],
        ["{{ 0 === nil ? 'e' : 'ok' }}", "ok"],
        ["{{ 0 === notset ? 'e' : 'ok' }}", "ok"],
        ["{{ 0 === true ? 'e' : 'ok' }}", "ok"],
        ["{{ 0 === false ? 'e' : 'ok' }}", "ok"],
        ["{{ 0 === map ? 'e' : 'ok' }}", "ok", { "map": [] }],
        ["{{ '' === '' ? 'ok' : 'e' }}", "ok"],
        ["{{ 'a' === 'a' ? 'ok' : 'e' }}", "ok"],
        ["{{ 'text' === 'text' ? 'ok' : 'e' }}", "ok"],
        ["{{ 'z' === 'a' ? 'e' : 'ok' }}", "ok"],
        ["{{ 'z' === false ? 'e' : 'ok' }}", "ok"],
        ["{{ 'z' === true ? 'e' : 'ok' }}", "ok"],
        ["{{ '' === nil ? 'e' : 'ok' }}", "ok"],
        ["{{ '' === notset ? 'e' : 'ok' }}", "ok"],
        ["{{ '' === map ? 'e' : 'ok' }}", "ok", { "map": [] }],
        ["{{ true === true ? 'ok' : 'e' }}", "ok"],
        ["{{ false === true ? 'e' : 'ok' }}", "ok"],
        ["{{ true === 1 ? 'e' : 'ok' }}", "ok"],
        ["{{ true === 0 ? 'e' : 'ok' }}", "ok"],
        ["{{ true === 'a' ? 'e' : 'ok' }}", "ok"],
        ["{{ true === '0' ? 'e' : 'ok' }}", "ok"],
        ["{{ true === '' ? 'e' : 'ok' }}", "ok"],
        ["{{ false === '' ? 'e' : 'ok' }}", "ok"],
        ["{{ nil === false ? 'e' : 'ok' }}", "ok"],
        ["{{ nil === notset ? 'ok' : 'e' }}", "ok"],

        ["{{ 4 !== 3 ? 'ok' : 'e' }}", "ok"],
        ["{{ 4 !== false ? 'ok' : 'e' }}", "ok"],
        ["{{ 4 !== nil ? 'ok' : 'e' }}", "ok"],
        ["{{ true !== nil ? 'ok' : 'e' }}", "ok"],
        ["{{ 'str' !== 2 ? 'ok' : 'e' }}", "ok"],
        ["{{ 'str' !== var ? 'ok' : 'e' }}", "ok", { "var": [] }],
        ["{{ 'str' !== var ? 'ok' : 'e' }}", "ok", { "var": [1] }],
        ["{{ 4 !== 4 ? 'e' : 'ok' }}", "ok"],
        ["{{ 0 !== false ? 'ok' : 'e' }}", "ok"],
        ["{{ 0 !== nil ? 'ok' : 'e' }}", "ok"],
        ["{{ false !== nil ? 'ok' : 'e' }}", "ok"],
        ["{{ 'str' !== 'str' ? 'e' : 'ok' }}", "ok"],

        // Compare objects
        ["{{ left == 0 ? 'e' : 'ok' }}", "ok", { left: [] }],
        ["{{ left == 0 ? 'e' : 'ok' }}", "ok", { left: [1] }],
        ["{{ left == right ? 'ok' : 'e' }}", "ok", { left: [], right: [] }],
        ["{{ left == right ? 'ok' : 'e' }}", "ok", { left: {}, right: [] }],
        ["{{ left == right ? 'e' : 'ok' }}", "ok", { left: [1], right: [] }],
        ["{{ left == right ? 'ok' : 'e' }}", "ok", { left: [1, 2, 3], right: [1, 2, 3] }],
        ["{{ left == right ? 'e' : 'ok' }}", "ok", { left: [3, 2, 1], right: [1, 2, 3] }],
        ["{{ left == right ? 'ok' : 'e' }}", "ok", { left: [1], right: { "0": 1 } }],
        ["{{ left == right ? 'ok' : 'e' }}", "ok", { left: { p: 10, k: "val" }, right: { p: 10, k: "val" } }],
        ["{{ left == right ? 'e' : 'ok' }}", "ok", { left: { p: 10, k: "val" }, right: { p: 10, k: 20 } }],

    ]);
//-----------------------
//-----------------------
    testArray("AND/OR OPERATORS", [

        ["{{ true and true ? 'ok' : 'e' }}", "ok"],
        ["{{ true and false ? 'e' : 'ok' }}", "ok"],
        ["{{ false and false ? 'e' : 'ok' }}", "ok"],
        ["{{ nil and 1 ? 'e' : 'ok' }}", "ok"],
        ["{{ 'string' and 1 ? 'ok' : 'e' }}", "ok"],

        ["{{ true or true ? 'ok' : 'e' }}", "ok"],
        ["{{ true or false ? 'ok' : 'e' }}", "ok"],
        ["{{ false or false ? 'e' : 'ok' }}", "ok"],
        ["{{ nil or 0 ? 'e' : 'ok' }}", "ok"],
        ["{{ nil or 1 ? 'ok' : 'e' }}", "ok"],
        ["{{ 'string' or false ? 'ok' : 'e' }}", "ok"],

    ]);
//-----------------------
//-----------------------
    testArray("FUNCTION OPERATORS", [

        // Functions
        ["{{ fn }}", "ok", { fn: function() { return "ok"; } }],
        ["{{ fn() }}", "ok", { fn: function() { return "ok"; } }],
        ["{{ fn(1, 2, 3) }}", "ok", { fn: function() { return "ok"; } }],
        ["{{ fn(1, 2, 3) }}", "2", { fn: function(arg1, arg2) { return arg2; } }],

        // Filters
        ["{{ 's'|fn }}", "ok", { fn: function() { return "ok"; } }],
        ["{{ '1'|fn(2, 3) }}", "ok", { fn: function() { return "ok"; } }],
        ["{{ '1'|fn(2, 3) }}", "2", { fn: function(arg1, arg2) { return arg2; } }],
        ["{{ '1'|fn(1 + 1, 3) }}", "2", { fn: function(arg1, arg2) { return arg2; } }],
        ["{{ '1'|fn(item * 2, 3) }}", "2", { item: 1, fn: function(arg1, arg2) { return arg2; } }],

        // Nested function
        ["{{ fn }}", "ok", { fn: function() { return function() { return "ok"; }; } }],
        ["{{ fn }}", "3", { fn: function() { return function() { return 3; }; } }],

        // Test return types
        ["{{ 1 + fn() + 1 }}", "5", { fn: function() { return 3; } }],
        ["{{ fn() ~ 'k' }}", "0k", { fn: function() { return 0; } }],
        ["{{ fn() ~ 'k' }}", "ok", { fn: function() { return 'o'; } }],
        ["{{ fn() == 'ok' ? 'ok' : 'e' }}", "ok", { fn: function() { return 'ok'; } }],
        ["{{ fn() == 3 ? 'ok' : 'e' }}", "ok", { fn: function() { return 3; } }],
        ["{{ fn() ? 'ok' : 'e' }}", "ok", { fn: function() { return true; } }],
        ["{{ fn() ? 'ok' : 'e' }}", "ok", { fn: function() { return 1; } }],
        ["{{ fn() ? 'e' : 'ok' }}", "ok", { fn: function() { return ""; } }],

        // Composition
        ["{{ 'string'|fn }}", "STRING", { fn: function(s) { return s.toUpperCase(); } }],
        ["{{ 'string'|fn() }}", "STRING", { fn: function(s) { return s.toUpperCase(); } }],
        ["{{ 'str'|fn('ing') }}", "STRING", { fn: function(s1, s2) { return (s1 + s2).toUpperCase(); } }],
        ["{{ 'str'|fn('i', 'ng') }}", "STRING", { fn: function(s1, s2, s3) { return (s1 + s2 + s3).toUpperCase(); } }],
        ["{{ 'str'|fn1('i')|fn2('ng') }}", "STRING", { fn1: function(s1, s2) { return s1 + s2; }, fn2: function(s1, s2) { return (s1 + s2).toUpperCase(); } }],
        ["{{ fn1('i')|fn2('ng') }}", "STRING", { fn1: function(s) { return "str" + s; }, fn2: function(s1, s2) { return (s1 + s2).toUpperCase(); } }],
        ["{{ fn2(fn1('str', 'ing')) }}", "STRING", { fn1: function(s1, s2) { return s1 + s2; }, fn2: function(s) { return s.toUpperCase(); } }],
        ["{{ fn2('str'|fn1('ing')) }}", "STRING", { fn1: function(s1, s2) { return s1 + s2; }, fn2: function(s) { return s.toUpperCase(); } }],

    ]);
//-----------------------
//-----------------------
    testArray("EXPRESSIONS", [

        ["{{ 1 + (8 * 5.5) / 2 % 4 }}", "3"],
        ["{{ 8 / 3 < (-45 % 2) + offset ? 22 * 3 + 1 + fn(4, 6) : -10 + 2 }}", "77", { offset: 10, fn: function(a, b) { return a + b; } }],
        ["{{ 8 / 3 > (-45 % 2) + offset ? 22 * 3 + 1 + fn(4, 6) : -10 + 2 * -1 }}", "-12", { offset: 10, fn: function(a, b) { return a + b; } }],
        ["{{ a.b.c * a.b.d - 10 * a.e }}", "-22", { a: { b: { c: 2, d: 4}, e: 3 }}],
        ["{{ pow(a, b)|pow(c)|pow(pow(c, b) / (14%5)) }}", "1000000000000", { a: 10, b: 3, c: 2, pow: Math.pow }],
        ["{{ (1+2==9/3) != ('44.2'+0.8 == 45 ? false : true) ? 'ok' : 'e' }}", "ok"],
        ["{{ a }} is {{ comp }} than {{ b }}", "4 is greater than 3", { a: 4, comp: "greater", b: "3" }],
        ["* {{ a }} is empty string", "*  is empty string", { a: null }],
        ["* {{ a }} is empty string", "*  is empty string", { a: undefined }],
        ["* {{ a }} is empty string", "*  is empty string", { a: true }],
        ["* {{ a }} is empty string", "*  is empty string", { a: false }],
        ["* {{ a }} is empty string", "*  is empty string", { a: [1, 2, 3] }],
        ["* {{ a }} is empty string", "*  is empty string", { a: { p: 32 } }],

    ]);
//-----------------------
//-----------------------
    testArray("IF TAG", [

        // Basic if
        ["<if test=\"{{ 1 }}\">ok</if>", "ok"],
        ["<if test=\"{{ 0 }}\">e</if>", ""],
        ["<if test=\"{{ '0' }}\">ok</if>", "ok"],
        ["<if test=\"{{ '' }}\">e</if>", ""],
        ["<if test=\"{{ true }}\">ok</if>", "ok"],
        ["<if test=\"{{ false }}\">e</if>", ""],
        ["<if test=\"{{ nil }}\">e</if>", ""],
        ["<if test=\"{{ map }}\">ok</if>", "ok", { map: [0] }],
        ["<if test=\"{{ map }}\">e</if>", "", { map: [] }],
        ["<if test=\"{{ map }}\">ok</if>", "ok", { map: { p: 0 } }],
        ["<if test=\"{{ map }}\">e</if>", "", { map: {} }],
        ["<if test=\"{{ 1/0 }}\">e</if>", ""],

        // if elif else
        ["<if test=\"{{ true }}\">A<else>B</if>", "A"],
        ["<if test=\"{{ false }}\">A<else>B</if>", "B"],
        ["<if test=\"{{ true }}\">A<elif test=\"{{ true }}\">B<elif test=\"{{ true }}\">C<else>D</if>", "A"],
        ["<if test=\"{{ true }}\">A<elif test=\"{{ false }}\">B<elif test=\"{{ false }}\">C<else>D</if>", "A"],
        ["<if test=\"{{ false }}\">A<elif test=\"{{ true }}\">B<elif test=\"{{ true }}\">C<else>D</if>", "B"],
        ["<if test=\"{{ false }}\">A<elif test=\"{{ true }}\">B<elif test=\"{{ false }}\">C<else>D</if>", "B"],
        ["<if test=\"{{ false }}\">A<elif test=\"{{ false }}\">B<elif test=\"{{ true }}\">C<else>D</if>", "C"],
        ["<if test=\"{{ false }}\">A<elif test=\"{{ false }}\">B<elif test=\"{{ false }}\">C<else>D</if>", "D"],

        // Nested if
        [
            "<if test='{{ true }}'>" +
                "<if test='{{ true }}'>ok<elif test='{{ true }}'>e<else>e</if>" +
                "<elif test='{{ true }}'>" +
                "<if test='{{ true }}'>e<elif test='{{ true }}'>e<else>e</if>" +
                "</if>",
            "ok",
        ],
        [
            "<if test='{{ true }}'>" +
                "<if test='{{ false }}'>e<elif test='{{ false }}'>e<else>ok</if>" +
                "<elif test='{{ true }}'>" +
                "<if test='{{ true }}'>e<elif test='{{ true }}'>e<else>e</if>" +
                "</if>",
            "ok",
        ],
        [
            "<if test='{{ false }}'>" +
                "<if test='{{ true }}'>e<elif test='{{ true }}'>e<else>e</if>" +
                "<elif test='{{ true }}'>" +
                "<if test='{{ false }}'>e<elif test='{{ true }}'>ok<else>e</if>" +
                "</if>",
            "ok",
        ],
        [
            "<if test='{{ true }}'>" +
                "<if test='{{ false }}'>e<elif test='{{ true }}'>" +
                "<if test='{{ false }}'>e<elif test='{{ true }}'>ok<else>e</if>" +
                "<else>e</if>" +
                "<else>" +
                "e" +
                "</if>",
            "ok",
        ],

    ]);
//-----------------------
//-----------------------
    testArray("FOR TAG", [

        // Basic for with arrays
        ["<for in=\"map\">*</for>", "***", { map: [1, 2, 3]}],
        ["<for in=\"map\">*<else>empty</for>", "empty", { map: []}],
        ["<for in=\"map\">*</for>", "", { map: []}],
        ["<for in=\"map\">*</for>", ""],
        ["<for key=\"k\" in=\"map\">{{ k }}</for>", "012", { map: [1, 2, 3]}],
        ["<for value=\"v\" in=\"map\">{{ v }}<else>nok</for>", "123", { map: [1, 2, 3]}],
        ["<for key=\"k\" value=\"v\" in=\"map\">{{ k ~ v }}</for>", "011223", { map: [1, 2, 3]}],

        // Basic for with objects
        ["<for in=\"map\">*</for>", "***", { map: {a: 1, b: 2, c: 3} }],
        ["<for in=\"map\">*<else>empty</for>", "empty", { map: {} }],
        ["<for in=\"map\">*</for>", "", { map: {} }],
        ["<for in=\"map\">*</for>", ""],
        ["<for key=\"k\" in=\"map\">{{ k }}</for>", "abc", { map: {a: 1, b: 2, c: 3} }],
        ["<for value=\"v\" in=\"map\">{{ v }}<else>nok</for>", "123", { map: {a: 1, b: 2, c: 3} }],
        ["<for key=\"k\" value=\"v\" in=\"map\">{{ k ~ v }}</for>", "a1b2c3", { map: {a: 1, b: 2, c: 3} }],

        // Nested for
        [
            "<for key='k1' value='v1' in='map1'>" +
                "*" +
                "<for key='k2' value='v2' in='map2'>" +
                "-{{ k1 ~ v1 ~ k2 ~ v2 }}" +
                "</for>" +
                "</for>",
            "*-a1c3-a1d4*-b2c3-b2d4",
            { map1: { a: 1, b: 2 }, map2: { c: 3, d: 4 } }
        ],

    ]);
//-----------------------
//-----------------------
    testArray("EXTENDS", [

        [
            "<extends template='{{ parentTmpl }}'><block name='{{ \"a\" }}'>extended</block>",
            "extended",
            { parentTmpl: Tmpl.compile("<block name='{{ \"a\" }}'>default</block>") }
        ],
        [
            "<extends template='{{ aTmpl }}'><block name='{{ \"a\" }}'>extended</block>",
            "extended",
            {
                aTmpl: Tmpl.compile("<extends template='{{ bTmpl }}'><block name='{{ \"a\" }}'>defaultA</block>"),
                bTmpl: Tmpl.compile("<block name='{{ \"a\" }}'>defaultB</block>")
            }
        ],
        [
            "<if test='{{ 1 }}'><extends template='{{ parentTmpl }}'><block name='{{ \"a\" }}'>extended</block></if>",
            "",
            { parentTmpl: Tmpl.compile("<block name='{{ \"a\" }}'>default</block>") }
        ],

    ]);
//-----------------------



}());