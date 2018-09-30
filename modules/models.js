const path = require("path");
const fs = require("fs");
const app = require("@modules/app");

var models = {};
var internal = {};
internal.registerModule = function(obj, modulePath, value) {
	let index = modulePath.length - 1;
	for ( let i = 0; i < index; i++ ) {
		let key = modulePath[i];
		if ( !(key in obj) ) {
			obj[key] = {}
		}

		obj = obj[key];
	}

	if ( modulePath[index] != 'index' ) {
		if ( obj[modulePath[index]] != null ) {
			obj[modulePath[index]] = Object.assign(obj[modulePath[index]], value)
		} else {
			obj[modulePath[index]] = value;
		}
	}
};

app.pathWalk("modules/dataModels", (filePath, rootDir, subDir, fileName) => {
	let file = fileName.split(".");
	let i = file.length - 1;

	if (file[i] == 'js') {
		file.pop();

		if ( !String.isNullOrEmpty(subDir) ) {
			file = subDir.split("/").concat(file);
		}

		internal.registerModule(models, file, require(path.resolve(filePath)));
	}
});

module.exports = models;
