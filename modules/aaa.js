const fs = require("fs");
const path = require("path");
const crypto = require('crypto');

const moment = require("moment");
const _ = require("lodash");
const CryptoJS = require('crypto-js');

const templating = require("@modules/templating");
const dbc = require("@modules/dbc");
const app = require("@modules/app");

var aaa = {};

aaa.sessionManagement = function( req, res, next ) {
	// Function that checks if a session is logged in, routing to login in required
	// If logged in, also responsive for adding user details to the request packet for uses elsewhere

	let authenticationRequired = true, adminRequired = false;
	req.user = false;

	let publicPaths = _.cloneDeep(app.publicPaths);
	publicPaths.push("/login", "/public", "/user/.*/report");
	if (publicPaths.includes(req.url) || req.url == "/") {
		authenticationRequired = false;
	} else {
		publicPaths.map((path) => {
			let pathTest = new RegExp( path.replace("/", "\\/") );
			if (pathTest.test(req.url)) {
				authenticationRequired = false;
			}
		});
	}

	let adminPaths = _.cloneDeep(app.adminPaths);
	if (adminPaths.includes(req.url)) {
		adminRequired = true;
	} else {
		adminPaths.map((path) => {
			let pathTest = new RegExp( path.replace("/", "\\/") );
			if (pathTest.test(req.url)) {
				adminRequired = true;
			}
		});
	}

	let logRequest = true;
	if ( req.url.includes("/assets") ) {
		logRequest = false;
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
				"u.username", "s.user_id", "u.display_name",
				"s.session_started", "u.email_verified",
				"u.type_id", "t.type_name", "u.golden_ticket",
			]).from(
				"ebdb.session", "s"
			).left_join(
				"ebdb.user", "u",
				"s.user_id = u.id"
			).left_join(
				"ebdb.user_type", "t",
				"u.type_id = t.id"
			).where(dbc.sql.expr()
				.and("s.session_token = ?", cookie.token)
				.and("s.session_started > DATE_SUB(CURRENT_DATE, INTERVAL 14 DAY)")
			).order("s.SESSION_STARTED", false).limit(1);

			return dbc.getRow(query);
		}
	}).then((dbSession) => {
		if ( !dbSession ) {
			res.clearCookie("stagePass");
			return Promise.reject({ noCookie: true, reason: "tokenInvalid" });
		} else {
			req.user = dbSession;
			if ( adminRequired && req.user.type_id != 1) {
				return Promise.reject({ noAccess: true });
			} else {
				next();
			}
		}
	}).catch((error) => {
		if ( ("noCookie" in error) ) {
			if ( !authenticationRequired ) {
				next();
			} else {
				return Promise.resolve().then(() => {
					return templating.build(path.join(__dirname, "../templates", "login.html"));
				}).then((html) => {
					if (logRequest) aaa.createLog(req, "notAuthenticated");
					res.send(html).end();
				});
			}
		} else if ( ("noAccess" in error) ) {
			if (logRequest) aaa.createLog(req, "noAccess");
			res.redirect("/no_access");
		} else {
			return Promise.reject(error);
		}
	}).catch((error) => {
		console.error(error);
		console.error("Error.SessionManagement.Uncaught @ ", moment().format("YYYY-MM-DD HH:mm:ss"));
	});
};
aaa.checkAccess = function( req, perms = {} ) {
	return Promise.resolve().then(() => {
		if ( !("user" in req) || req.user == false ) {
			aaa.createLog(req, "accessFailure:Unauthenticated");
			return Promise.reject({ noAccess: true });
		} else {
			return Promise.resolve();
		}
	}).then(() => {
		if ( ("golden_ticket" in perms) && perms.golden_ticket == true ) {
			if ( req.user.golden_ticket == 1 ) {
				return Promise.resolve();
			} else {
				aaa.createLog(req, "accessFailure:NoGoldenTicket");
				return Promise.reject({ noAccess: true });
			}
		} else {
			return Promise.resolve();
		}
	}).then(() => {
		if ( ("admin" in perms) && perms.admin == true ) {
			if ( req.user.type_id == 1 ) {
				return Promise.resolve();
			} else {
				aaa.createLog(req, "accessFailure:NotAdmin");
				return Promise.reject({ noAccess: true });
			}
		} else {
			return Promise.resolve();
		}
	}).then(() => {
		if ( ("user" in perms) && perms.user == true ) {
			var typesAllowed = [ 2, 3 ];
			if ( typesAllowed.includes(req.user.type_id) ) {
				return Promise.resolve();
			} else {
				aaa.createLog(req, "accessFailure:NotUserGroup");
				return Promise.reject({ noAccess: true });
			}
		} else {
			return Promise.resolve();
		}
	});
};

// Authentication: Login & Logout
aaa.login = function(details) {
	// return internal._createAccount(details);

	return Promise.resolve().then(() => {
		console.log(details.username);
		let query = dbc.sql.select().fields([
			"p.user_id", "u.username", "p.password"
		]).from(
			"ebdb.user", "u"
		).left_join(
			"ebdb.password", "p",
			"u.id = p.user_id"
		).where(dbc.sql.expr()
			.and(dbc.sql.expr()
				.or("u.username = ?", details.username)
				.or("u.email = ?", details.username)
			)
			.and("p.password_valid = 1")
		).order("p.password_set", false).limit(1);

		return dbc.getRow(query);
	}).then((dbRow) => {
		if ( !dbRow ) {
			aaa.createLog(details, "authenticaionFailure:Username");
			return Promise.reject({ authenticationError: true, message: "Username/Password combination doesn't match." });
		} else {
			details.user_id = dbRow.user_id;
			return internal.password.check(details.password, dbRow.password);
		}
	}).then((pwdVerified) => {
		delete details.password;
		if ( pwdVerified ) {
			return Promise.resolve(details);
		} else {
			aaa.createLog(details, "authenticaionFailure:Password");
			return Promise.reject({ authenticationError: true, message: "Username/Password combination doesn't match." });
		}
	}).then((details) => {
		let query = dbc.sql.select().fields([
			"s.session_token",
			"s.session_started"
		]).from(
			"ebdb.session", "s"
		).where(dbc.sql.expr()
			.and("s.user_id = ?", details.user_id)
			.and("s.session_started > DATE_SUB(CURRENT_DATE, INTERVAL 14 DAY)")
		).order("s.session_started", false).limit(1);

		return dbc.getRow(query);
	}).then((session) => {
		let cookie = {};
		cookie.user_id = details.user_id;

		if ( session ) {
			cookie.token = session.session_token;
			cookie.expires = moment(session.session_started, "YYYY-MM-DD HH:mm:ss").add(2, "weeks");
		} else {
			cookie.token = CryptoJS.HmacSHA512(details.user_id, moment().format('x')).toString();
			cookie.expires = moment().add(2, "weeks");

			let query = dbc.sql.insert().into("ebdb.session").setFields({
				"user_id": details.user_id,
				"session_token": cookie.token
			});

			dbc.execute(query);
		}

		return Promise.resolve(cookie);
	});
};
aaa.logout = function(req, res) {
	return Promise.resolve().then(() => {
		if ( ("cookies" in req) && ("stagePass" in req.cookies) && !String.isNullOrEmpty(req.cookies.stagePass.token) ) {
			let expr = dbc.sql.expr().or("session_token = ?", req.cookies.stagePass.token);
			if (("user" in req) && ("user_id" in req.user)) {
				expr.or("user_id = ?", req.user.user_id);
			}

			let query = dbc.sql.delete().from("ebdb.session").where(expr);

			return dbc.execute(query);
		} else {
			return Promise.resolve();
		}
	}).then((result) => {
		res.clearCookie("stagePass");
		return Promise.resolve({ sendRefresh: true });
	});
};

aaa.createLog = function(req, logType) {
	return Promise.resolve().then(() => {
		let row = {};
		row.log_type = logType;

		if ( ("headers" in req) ) {
			row.req_ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
			row.req_url = req.url;

			if ( req.user != false ) {
				row.user_id = req.user.user_id;
			}
		}

		if ( ("username" in req) ) {
			row.req_params = req.username;
		}

		let query = dbc.sql.insert().into("ebdb.log").setFields(row);
		return dbc.execute(query);
	}).then((result) => {
		// No action need after logging
	}).catch((error) => {
		console.error(error);
		console.error("Error.LogManagement.Uncaught @ ", moment().format("YYYY-MM-DD HH:mm:ss"));
	});
};

module.exports = aaa;

var internal = {};

internal.password = {
	saltBytes: 16,
	hashBytes: 32,
	iterations: 777777,
	digest: "whirlpool"
};
internal.password.hash = function(password) {
	return Promise.resolve().then(() => {
		return new Promise(( resolve, reject ) => {
			crypto.randomBytes(internal.password.saltBytes, ( error, salt ) => {
				if (error) {
					reject(error);
				} else {
					resolve(salt);
				}
			});
		});
	}).then((salt) => {
		return new Promise(( resolve, reject ) => {
			crypto.pbkdf2(password, salt, internal.password.iterations, internal.password.hashBytes, internal.password.digest, (error, hash) => {
				if (error) {
					reject(error);
				} else {
					let dbHash = Buffer.alloc(hash.length + salt.length + 8)
                    dbHash.writeUInt32BE(salt.length, 0, true);
                    dbHash.writeUInt32BE(internal.password.iterations, 4, true);

					salt.copy(dbHash, 8);
                    hash.copy(dbHash, salt.length + 8);
                    resolve(dbHash);
				}
			});
		});
	});
};
internal.password.check = function(password, dbHash) {
	let buffer = Buffer.from(dbHash);
	let saltBytes = buffer.readUInt32BE(0);
	let hashBytes = buffer.length - saltBytes - 8;
	let iterations = buffer.readUInt32BE(4);
	let salt = buffer.slice(8, saltBytes + 8);

	return Promise.resolve().then(() => {
	    let hash = buffer.slice(8 + saltBytes, saltBytes + hashBytes + 8);
		return Promise.resolve(hash);
	}).then((hash) => {
		return new Promise((resolve, reject) => {
            crypto.pbkdf2(password, salt, iterations, hashBytes, internal.password.digest, (error, verify) => {
                if (error) {
                    reject(error);
                } else {
                    resolve(verify.equals(hash));
                }
            });
        });
	});
};

internal._createAccount = function(details) {
	// Setup for testing platform, full user creation will be through a proper process
    return false;

	let pwdValues = {};

    return Promise.resolve().then((hashed) => {
        let query = {
            text: "INSERT INTO ebdb.user SET ?",
            values: {
                username: details.username,
				account_locked: 0,
				type_id: 1,
				golden_ticket: 1
            }
        }

        return dbc.execute(query);
    }).then((res) => {
		pwdValues.user_id = res.insertId;

        return internal.password.hash(details.password);
    }).then((hashed) => {
		pwdValues.password = hashed;

        let query = {
            text: "INSERT INTO ebdb.password SET ?",
            values: pwdValues
        }

        return dbc.execute(query);
    }).then((sqlResults) => {
        console.log(sqlResults)
    }).catch((error) => {
        console.log(error);
    });
};
