var Tmpl = require("../tmpl.js");

var fs = require('fs');

fs.readFile('debug.tmpl.html', 'utf8', function (err, data) {
	var html, tmpl;

	if (err) {
		return console.log(err);
	}

	html = Tmpl.render(data, {
		// t1: htmlScript.parse("<extends template=\"{{ t }}\"><block name=\"{{ 'toto2' }}\">AAA</block>"),
		// t: htmlScript.parse("<a>{{{ name }}}</a><block name=\"{{ 'toto' }}\">BASE</block><block name=\"{{ 'toto2' }}\">BASE</block><block name=\"{{ 'toto3' }}\">BASE</block>"),
		lower: function(s) { return s.toLowerCase(); },
		shortArray: [1, 2, 3],
		name: "<span>toto</span>",
		toto: {
		riri: 11,
		meme: function(toto, name) { return name + (toto + 22); }
		},
		arr: {"1st": "riri", "2nd": "fifi", "3rd": "loulou"}
	});

	console.log(html);
});
