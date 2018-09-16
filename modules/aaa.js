const fs = require("fs");
const path = require("path");

const moment = require("moment");
const _ = require("lodash");

const dbc = global.dbc;
const app = global.app;

var aaa = {};

aaa.sessionManagement = function( req, res, next ) {
	// Function that checks if a session is logged in, routing to login in required
	// If logged in, also responsive for adding user details to the request packet for uses elsewhere

	let authenticationRequired = true;
	let publicPaths = _.cloneDeep(app.publicPaths);
	publicPaths.push("/login", "/public");
	req.user = false;

	if (publicPaths.includes(req.url) || req.url == "/") {
		authenticationRequired = false;
	} else {
		publicPaths.map((path) => {
			let test = new RegExp( path.replace("/", "\\/") );
			if (test.test(req.url)) {
				authenticationRequired = false;
			}
		});
	}

	return Promise.resolve().then(() => {
		if ( ("cookies" in req) && ("stagePass" in req.cookies) ) {
			return Promise.resolve(req.cookies.stagePass);
		} else {
			return Promise.reject({ noCookie: true, reason: "notFound" });
		}
	}).then((cookie) => {
		if ( moment().isAfter( moment(cookie.expires, "YYYY-MM-DD HH:mm:ss") ) ) {
			res.clearCookie("stagePass");
			return Promise.reject({ noCookie: true, reason: "timeExpired" });
		} else {
			let query = dbc.sql.select().fields([
				"u.username", "s.user_id", "s.session_started"
			]).from(
				"ebdb.session", "s"
			).left_join(
				"ebdb.user", "u",
				"s.user_id = u.id"
			).where(dbc.sql.expr()
				.and("s.session_token = ?", cookie.token)
				.and("s.session_started > DATE_SUB(CURRENT_DATE, INTERVAL 14 DAYS)")
			).order("s.SESSION_STARTED", false).limit(1);

			return dbc.getRow(query);
		}
	}).then((dbSession) => {
		if ( !dbSession ) {
			res.clearCookie("stagePass");
			return Promise.reject({ noCookie: true, reason: "tokenInvalid" });
		} else {
			req.user = dbSession;
			next();
		}
	}).catch((error) => {
		if ( ("noCookie" in error) ) {
			if ( !authenticationRequired ) {
				next();
			} else {
				fs.readFile(path.join(__dirname, "../templates", "login.html"), "utf8", (error, html) => {
					if (error) {
						console.error(error);
						console.error("Error.SessionManagement.FileError.Uncaught @ ", moment().format("YYYY-MM-DD HH:mm:ss"));
						res.status(500).end();
					} else {
						res.send(html).end();
					}
				});
			}
		} else {
			return Promise.reject(error);
		}
	}).catch((error) => {
		console.error(error);
		console.error("Error.SessionManagement.Uncaught @ ", moment().format("YYYY-MM-DD HH:mm:ss"));
	});
};

// Authentication: Login & Logout
aaa.login = function(details) {

};
aaa.logout = function(req, res) {
	return Promise.resolve().then(() => {
		if ( ("cookies" in req) && ("stagePass" in req.cookies) && !String.isNullOrEmpty(req.cookies.stagePass.token) ) {
			let expr = dbc.sql.expr().or("session_token = ?", req.cookies.stagePass.token);
			if (("user" in req) && ("user_id" in req.user)) {
				expr.or("user_id = ?", req.user);
			}

			let query = dbc.sql.delete().from("ebdb.session").where(expr);

			return db.execute(query);
		} else {
			return Promise.resolve();
		}
	}).then((result) => {
		res.clearCookie("stagePass");
		return Promise.resolve({ sendRefresh: true });
	});
};

module.exports = aaa;

var internal = {};
