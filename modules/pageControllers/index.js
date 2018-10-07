const fs = require("fs");
const _ = require("lodash");
const app = require("@modules/app");

var controllers = {};

app.pathWalk("modules/pageControllers", (filePath, rootDir, subDir, fileName) => {
	// Loads all files in pageControllers folder into controllers object, except this file
	if ( typeof subDir != typeof undefined || ( typeof subDir == typeof undefined && fileName != "index.js" ) ) {
		let file = fileName.split('.')[0];
		let url = "/" + file.toLowerCase();
		let template = "/" + file;

		if ( typeof subDir != typeof undefined ) {
			url = "/" + subDir.toLowerCase();
			if ( file != "index" ) {
				url += "/" + file.toLowerCase();
			}

			template = "/" + subDir + "/" + file;
		} else if ( file == "index" ) {
			file = _.last( subDir.split("/") );
			url = "/" + subDir.replace("/" + file, "") + "/" + file.toLowerCase();
		}

		controllers[url] = require("./" + template);
	}
});

module.exports = controllers;
