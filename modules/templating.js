const fs = require('fs');
const path = require('path');

module.exports = function(Handlebars) {
    internal.walk("templates/base", (filePath, rootDir, subDir, fileName) => {
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

var internal = {};
internal.walk = function(rootDir, callBack, subDir) {
    function unixifyPath(filePath) {
        return (process.platform === 'win32') ? filePath.replace(/\\/g, '/') : filePath;
    }

    var absolutePath = subDir ? path.join(rootDir, subDir) : rootDir;
    fs.readdirSync(absolutePath).forEach((fileName) => {
        var filePath = path.join(absolutePath, fileName);
        if (fs.statSync(filePath).isDirectory()) {
            walk(rootDir, callBack, unixifyPath(path.join(subDir || '', fileName || '')));
        } else {
            callBack(unixifyPath(filePath), rootDir, subDir, fileName);
        }
    })
};
