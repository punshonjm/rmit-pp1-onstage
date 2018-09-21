const fs = require("fs");
const path = require("path");

var app = {};
app.publicPaths = [];
app.adminPaths = [];

app.handleError = function( error, req, res ) {
    if ( "authenticationError" in error ) {
		res.status(401).json({ message: error.message }).end();
	} else {
		console.log(error);

		var statusCode = 500;
		if ( "status" in error ) {
			statusCode = Number(error.status) || 500;
		}

		if ( "message" in error ) {
            res.status(statusCode).json({ message: error.message }).end();
        } else {
            res.status(statusCode).end();
        }
	}
}

app.pathWalk = function(rootDir, callBack, subDir) {
    function unixifyPath(filePath) {
        return ( process.platform === "win32" ) ? filePath.replace(/\\/g, '/') : filePath;
    }

    var absolutePath = subDir ? path.join(rootDir, subDir) : rootDir;
    fs.readdirSync(absolutePath).forEach((fileName) => {
        var filePath = path.join(absolutePath, fileName);
        if (fs.statSync(filePath).isDirectory()) {
            app.pathWalk(rootDir, callBack, unixifyPath(path.join(subDir || '', fileName || '')));
        } else {
            callBack(unixifyPath(filePath), rootDir, subDir, fileName);
        }
    });
};

module.exports = app;
