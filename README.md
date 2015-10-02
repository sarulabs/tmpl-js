# TMPL-JS

![unmaintained](https://img.shields.io/badge/status-UNMAINTAINED-red.svg)

---

TPML-JS is a template engine for javascript. It enhances html by bringing new tags.


## Example

A template is a string that looks like this:

~~~html
<for key="name" value="age" in="ages">
    <if test="{{ age < 18 }}">
		<p>{{ name }}, you need to be 18 to drive.</p>
	<else>
		<p>Ok {{ name }}, ready to go !</p>
	</if>
</for>
~~~

You can get the result by calling `Tmpl.render`:

~~~js
Tmpl.render("I am {{ name }} !", {name: "Hector"}); // I am Hector !
~~~

If you need to use the template multiple times you may want to compile it. It will improves performance.

~~~js
var template = Tmpl.compile("I am {{ name }} !");
Tmpl.render(template, {name: "Hector"}); // I am Hector !
~~~


## Expressions

Expressions are enclosed by `{{` and `}}`. You can use variables in expressions.

~~~html
{{ name }} <!-- value of the "name" variable -->
{{ 1 + 3 }} <!-- 4 -->
{{ '1 + ' ~ '3' }} <!-- 1 + 3 -->
~~~

The result of the expression is escaped. If you want to get the unescaped result you should enclose the expression by `{{{` and `}}}`.


## Types

In expressions, elements can have the following types:

### BOOLEAN
~~~html
{{ variable === true }}
~~~

###  NIL
~~~html
{{ variable === nil }} <!-- variable is not defined -->
~~~

###  NUMBER
~~~html
{{ 5 + 4 }}
~~~

###  STRING
~~~html
{{ "Hello" ~ "world !" }}
~~~

###  NAME
NAME is the type of variables.
~~~html
{{ variable }}
~~~

###  MAP
Maps can only be generated in arguments of the `Tmpl.render` function. You can iterate over its entries with the `for` tag. You can also have direct access to the map values:
~~~html
{{ mymap[10].name }}
~~~

###  TMPL
TMPL is the type for compiled templates.

###  FUNC and ARG
FUNC is the type for functions. Functions can only be generated in arguments of the `Tmpl.render` function.
~~~html
{{ lower("TEXT") }} <!-- basic function call -->
{{ "TEXT"|lower) }} <!-- call function like a filter -->
{{ fn("1", 2) }} <!-- multiple parameters -->
{{ "1"|fn(2) }} <!-- works with filters too -->
~~~
ARG is the type for function arguments. It is only used internally.

###  TOKEN
Raw value without type. Only used internally.


## Operators

Here is the list of all operators you can use in expressions. Operators may need arguments with specific types. If one of the arguments can not be converted to a number, the expression will be equal to `false`.

###  Number operators
* `+` : sum
* `-` : substraction
* `*` : multiplication
* `/` : division
* `%` : modulo
* `**` : power
* `>`
* `<`
* `>=`
* `<=`

### String concatenation
* `~` : concatenation

### Boolean operators
* `or`
* `and`

### Mixed operators
* `==`
* `!=`
* `===`
* `!==`
* `?:`


## Tags

### IF, ELIF, ELSE

The main tag is `if`. It should be closed. A "test" attribute is mandatory and should be an expression. `elif` and `else` are sub-tags that should be used inside an `if` area.

~~~html
<if test="{{ age < 18 }}">
	You are too young.
<elif test="{{ age > 60 }}">
	You are too old.
<else>
	You are in the right range.
</if>
~~~

### FOR, ELSE

`for` tag needs the "in" attribute to iterate over an array or an object. "key" and "value" are not mandatory.

~~~html
<for key="name" value="age" in="ages">
	{{ name }} is {{ age }}.
<else>
	The object is empty.
</for>
~~~

### INCLUDE

You can include a template into another.

~~~js
var main = 'I am <include template="child"> !';
var child = '{{ name }}';
Tmpl.render(main, {
	name: "Hector",
	child: child, // child is a string but is could also be a compiled template
}); // I am Hector !
~~~

### EXTENDS, BLOCKS

Template inheritance is handled with blocks:

~~~html
<!-- main template -->
He has a <block name="color">red</block> car !
~~~

~~~html
<!-- child template -->
<extends template="main">
<block name="color">{{ color }}</block>
~~~

~~~js
Tmpl.render(main); // He has a red car !
Tmpl.render(child, {color: "green"}); // He has a green car !
~~~


## Tests

Tests can be run in a browser by opening the file "tests/index.html".

Reading the "tests/tests.js" is the best way to learn more about what this library can do.


## Typescript

The code in the "ts" directory is an attempt to convert the javascript code into typescript. It is not working.
