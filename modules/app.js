const fs = require("fs");
const path = require("path");
const slowDown = require("express-slow-down");
const rateLimit = require("express-rate-limit");

var app = {};
app.publicPaths = [];
app.adminPaths = [];

app.slowDown = slowDown({
	windowMs: 15 * 60 * 1000,
	delayAfter: 5,
	delayMs: 100
});
app.rateLimit = rateLimit({
	windowMs: 15 * 60 * 1000,
	max: 100
});

app.handleError = function( error, req, res ) {
    if ( "authenticationError" in error ) {
		res.status(401).json({ message: error.message }).end();
	} else {
		console.log(error);

		var statusCode = 500;
		if ( "status" in error ) {
			statusCode = Number(error.status) || 500;
		}

		if ( ("message" in error) && !("fileName" in error) && !("lineNumber" in error) ) {
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
