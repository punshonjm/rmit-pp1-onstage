const fs = require('fs');
const path = require('path');
const app = global.app;

module.exports = function(Handlebars) {
    app.pathWalk("templates/base", (filePath, rootDir, subDir, fileName) => {
        let file = fileName.split('.');
        fs.readFile(filePath, 'utf8', (error, partial) => Handlebars.registerPartial(file[0], partial));
    });

    var templating = {};

    templating.compile = function( template, data ) {
        let templatePath = `templates/${template}`, fileExtension = false;

        return Promise.resolve().then(() => {
			internal.fileExtensions.map((extension) => {
				if (fileExtension === false && fs.existsSync(`${templatePath}.${extension}`)) { fileExtension = extension };
			});

			if ( !fileExtension ) {
				return Promise.reject({ message: "Template not found." });
			} else {
				return Promise.resolve();
			}
		}).then(() => {
            return new Promise((resolve, reject) => {
                fs.readFile(`${templatePath}.${fileExtension}`, 'utf8', (error, source) => {
                    if (error) {
                        reject(error);
                    } else {
                        resolve(source);
                    }
                });
            });
        }).then((templateLoaded) => {
			let source = "{{> head}}";
			if ( fileExtension == "mst-b") {
				source += "{{> nav_standard}}";
			} else if ( fileExtension == "mst-h" ) {
				source += "{{> nav_header}}";

				if ( !("headerImage" in data) ) {
					data.headerImage = "/public/img/bg-new.jpg";
				}
			}

			source += templateLoaded + "{{> footer}}";

            let groomMustache = Handlebars.compile(source);
            source = groomMustache(data);
            return Promise.resolve(source);
        });
    };

    return templating;
};

var internal = {};
internal.fileExtensions = [
	"mustache",
	// "mst-p", "mst-f",
	"mst-b", "mst-h"
];
