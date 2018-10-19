const fs = require("fs");
const path = require("path");
const moment = require("moment");
const slowDown = require("express-slow-down");
const rateLimit = require("express-rate-limit");

var app = {};
app.publicPaths = [];
app.adminPaths = [];
app.privatePaths = [];
app.rootDir = path.join(__dirname, "../");

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
	console.log("app.errorHandler");

	if ( ("authenticationError" in error) ) {
		res.status(401).json({ message: error.message }).end();
	} else {
		var statusCode = 500;
		if ( ("status" in error) ) {
			statusCode = Number(error.status) || 500;
		}

		if ( ("error" in error) && ("sql" in error.error) ) {
			console.error( error.error );
			console.error("=========================================");
			console.error("SQL Error @ ", moment().format("YYYY-MM-DD HH:mm:ss"));
			console.error( error.error.sqlMessage );
			console.error("=========================================");
		} else {
			console.log(error);
		}

		if ( req.originalUrl.includes("api") || ( ("isApi" in req) && req.isApi == true) ) {
			if ( ("message" in error) && !("fileName" in error) && !("lineNumber" in error) ) {
	            res.status(statusCode).json({ message: error.message }).end();
	        } else if ( ("reason" in error) ) {
				res.status(statusCode).json({ reason: error.reason }).end();
			} else {
	            res.status(statusCode).json({ message: "Whoops! An error occured." }).end();
	        }
		} else {
			req.session.error = error;
			res.redirect('/whoops');
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

const reduce = Function.bind.call(Function.call, Array.prototype.reduce);
const isEnumerable = Function.bind.call(Function.call, Object.prototype.propertyIsEnumerable);
const concat = Function.bind.call(Function.call, Array.prototype.concat);
const keys = Reflect.ownKeys;

if (!Object.values) {
	Object.values = function values(O) {
		return reduce(keys(O), (v, k) => concat(v, typeof k === 'string' && isEnumerable(O, k) ? [O[k]] : []), []);
	};
}

module.exports = app;
