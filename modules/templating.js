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
        let templatePath = `templates/${template}`;

        return Promise.resolve().then(() => {
            return new Promise((resolve, reject) => {
                fs.readFile(`${templatePath}.mustache`, 'utf8', (error, source) => {
                    if (error) {
                        reject(error);
                    } else {
                        resolve(source);
                    }
                });
            });
        }).then((source) => {
            let createHtml = Handlebars.compile(`{{> header}}${source}{{> footer}}`);
            source = createHtml(data);
            return Promise.resolve(source);
        });
    };

    return templating;
}
