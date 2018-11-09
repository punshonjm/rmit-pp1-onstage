const fs = require("fs");
const path = require("path");

const moment = require("moment");
const router = require("express").Router();
const _ = require("lodash");

const templating = require("@modules/templating");
const controllers = require("@modules/pageControllers");
const app = require("@modules/app");
const aaa = require("@modules/aaa");
const mail = require("@modules/mail");
const models = require("@modules/models");

router.get("/", (req, res) => {
	// Present home page
    Promise.resolve().then(() => {
		var data = { pageName: "Home" };
		data.user = req.user;
		data.csrfToken = req.csrfToken();

        return templating.compile("home", data);
    }).then((html) => {
        res.send(html).end();
    }).catch((err) => app.handleError(err, req, res));
});

router.get("/login", (req, res) => {
	// Present login page
	Promise.resolve().then(() => {
		if ( ("user" in req) && req.user != false ) {
			// If user is already logged in, redirect to homepage
			res.redirect("/");
		} else {
			return templating.build(path.join(__dirname, "../templates", "login.html"), { csrfToken: req.csrfToken() });
		}
	}).then((html) => {
		res.send(html).end();
	}).catch((err) => app.handleError(err, req, res));
});

router.post("/login", app.slowDown, (req, res) => {
	req.isApi = true;
	// Handle login request
	Promise.resolve().then(() => {
		let details = {
			username: req.body.username,
			password: req.body.password
		};

		return aaa.login(details);
	}).then((user) => {
		let stagePass = {
			token: user.token,
			expires: user.expires.clone().format("YYYY-MM-DD HH:mm:ss")
		};

		res.status(200).cookie("stagePass", stagePass, {
			expires: moment(user.expires).toDate(),
			httpOnly: true,
			sameSite: true,
			secure: (global.config == "aws") ? true : false,
		}).end();
	}).catch((err) => app.handleError(err, req, res));
});

router.get("/logout", (req, res) => {
	req.isApi = true;
	// Handle logout request
	Promise.resolve().then(() => {
		return aaa.logout(req, res);
	}).then((sr) => {
		let code = (sr) ? 200 : 500;
		res.status(code).end();
	}).catch((err) => app.handleError(err, req, res));
});

router.get("/user/verify/:key", app.rateLimit, (req, res) => {
	// handle email verification links
	Promise.resolve().then(() => {
		return models.users.verifyEmail(req.params.key);
	}).then((result) => {
		var data = { pageName: "Email Verified" };
		data.user = req.user;
		data.user.email_verified = 1;
		data.message = result.message;

		data.csrfToken = req.csrfToken();

		return templating.compile("email_verified", data);
    }).then((html) => {
        res.send(html).end();
    }).catch((err) => app.handleError(err, req, res));
});

router.get("/user/password_reset/:id/:key", app.rateLimit, (req, res) => {
	// Handle password reset links
	Promise.resolve().then(() => {
		return aaa.checkReset(req, res);
	}).then((user) => {
		var data = {};
		data.pageName = "Reset Password";
		data.user = user;
		data.csrfToken = req.csrfToken();

		return templating.compile("set_new_password", data);
    }).then((html) => {
        res.send(html).end();
    }).catch((err) => app.handleError(err, req, res));
});

let folders = [ "public", "private", "admin" ];
folders.map((folder) => {
	app.pathWalk("templates/" + folder, (filePath, rootDir, subDir, fileName) => {
		let file = fileName.split('.')[0], param = false, controlUrl = null;
		if ( file.includes("@") ) {
			let split = file.split("@");
			file = split[0];
			param = split[1];
		}

		let url = "/" + file.toLowerCase();
		let template = filePath.replace("templates/", "").split(".")[0];

		if ( typeof subDir != typeof undefined ) {
			url = "/" + subDir.toLowerCase() + "/" + file.toLowerCase();
		}

		if ( file == "index" ) {
			url = url.replace("/index", "");
		}

		controlUrl = url;
		if ( param ) {
			url += "/:" + param;
		}

		app[folder + "Paths"].push(url);

		router.get(url, (req, res) => {
			Promise.resolve().then((html) => {
				if ( (controlUrl in controllers) ) {
					return controllers[controlUrl](req);
				} else {
					var data = {};
					if ( Object.keys(req.params).length > 0 ) {
						data.params = req.params;
					}

					return Promise.resolve(data);
				}
			}).then((data) => {
				data.user = req.user;
				if ( ("pageName" in data) ) {
					data.pageName = file.replace(/_/g, " ") + " | " + data.pageName;
				} else {
					data.pageName = file.replace(/_/g, " ");
				}
				data.csrfToken = req.csrfToken();

				return templating.compile(template, data);
			}).then((html) => {
				res.send(html).end();
			}).catch((err) => app.handleError(err, req, res));
		});
	});
});

router.get("/whoops", (req, res) => {
	// Present 'whoops' page
    Promise.resolve().then(() => {
		var data = { pageName: "Whoops" };
		data.user = req.user;

		if ( ("error" in req.session) ) {
			data.error = req.session.error;
			delete req.session.error;
		}
		data.csrfToken = req.csrfToken();

        return templating.compile("whoops", data);
    }).then((html) => {
        res.send(html).end();
    }).catch((err) => app.handleError(err, req, res));
});

router.get("/no_access", (req, res) => {
	// Present 'no_access' page
    Promise.resolve().then(() => {
		var data = { pageName: "No Access" };
		data.user = req.user;
        return templating.compile("no_access", data);
    }).then((html) => {
        res.send(html).end();
    }).catch((err) => app.handleError(err, req, res));
});

const api = require("./routes/api");
router.use("/api", app.rateLimit, api);

// Handles routing of unfound routes
router.get('*', function(req, res) {
    res.redirect('/');
	// Add page not found here
});

module.exports = router;
