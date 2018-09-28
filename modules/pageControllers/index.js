const fs = require("fs");
const _ = require("lodash");
const app = require("@modules/app");

var controllers = {};

app.pathWalk("modules/pageControllers", (filePath, rootDir, subDir, fileName) => {
	if ( typeof subDir != typeof undefined || ( typeof subDir == typeof undefined && fileName != "index.js" ) ) {
		let file = fileName.split('.')[0];
		let url = "/" + file.toLowerCase();
		let template = "/" + file;

		if ( typeof subDir != typeof undefined ) {
			url = "/" + subDir.toLowerCase();
			template = "/" + subDir + "/" + file;
		} else if ( file == "index" ) {
			file = _.last( subDir.split("/") );
			url = "/" + subDir.replace("/" + file, "") + "/" + file.toLowerCase();
		}

		controllers[url] = require("./" + template);
	}
});

module.exports = controllers;
