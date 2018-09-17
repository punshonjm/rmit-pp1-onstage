const fs = require("fs");
const path = require("path");

var app = {};

app.publicPaths = [];

app.handleError = function( error, req, res ) {
    if ( "authenticationError" in error ) {
		res.status(401).json({ message: error.message }).end();
	} else {
		console.log(error);

		if ('message' in error) {
            res.status(500).json({ message: error.message }).end();
        } else {
            res.status(500).end();
        }
	}
}

app.pathWalk = function(rootDir, callBack, subDir) {
    function unixifyPath(filePath) {
        return (process.platform === 'win32') ? filePath.replace(/\\/g, '/') : filePath;
    }

    var absolutePath = subDir ? path.join(rootDir, subDir) : rootDir;
    fs.readdirSync(absolutePath).forEach((fileName) => {
        var filePath = path.join(absolutePath, fileName);
        if (fs.statSync(filePath).isDirectory()) {
            app.pathWalk(rootDir, callBack, unixifyPath(path.join(subDir || '', fileName || '')));
        } else {
            callBack(unixifyPath(filePath), rootDir, subDir, fileName);
        }
    })
};

module.exports = app;
