const fs = require("fs");
const path = require("path");

const moment = require("moment");
const router = require("express").Router();
const _ = require("lodash");

const templating = require("@modules/templating");
const controllers = require("@modules/pageControllers");
const app = require("@modules/app");
const aaa = require("@modules/aaa");

router.get("/", (req, res) => {
	// Present home page
    Promise.resolve().then(() => {
		var data = { pageName: "Home" };
		data.user = req.user;

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
			return templating.build(path.join(__dirname, "../templates", "login.html"));
		}
	}).then((html) => {
		res.send(html).end();
	}).catch((err) => app.handleError(err, req, res));
});
router.post("/login", app.slowDown, (req, res) => {
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
			expires: moment(user.expires).toDate()
		}).end();
	}).catch((err) => app.handleError(err, req, res));
});
router.get("/logout", (req, res) => {
	// Handle logout request
	Promise.resolve().then(() => {
		return aaa.logout(req, res);
	}).then((sr) => {
		let code = (sr) ? 200 : 500;
		res.status(code).end();
	}).catch((err) => app.handleError(err, req, res));
});

let folders = [ "public", "private", "admin" ];
folders.map((folder) => {
	app.pathWalk("templates/" + folder, (filePath, rootDir, subDir, fileName) => {
		let file = fileName.split('.')[0];
		let url = "/" + file.toLowerCase();
		let template = filePath.replace("templates/", "").split(".")[0];

		if ( typeof subDir != typeof undefined ) {
			url = "/" + subDir.toLowerCase() + "/" + file.toLowerCase();
		}

		if ( file == "index" ) {
			url = url.replace("/index", "");
		}

		if ( folder == "public" ) {
			app.publicPaths.push(url);
		} else if ( folder == "admin" ) {
			app.adminPaths.push(url);
		}

		router.get(url, (req, res) => {
			Promise.resolve().then((html) => {
				if ( (url in controllers) ) {
					return controllers[url](req);
				} else {
					var data = {};
					return Promise.resolve(data);
				}
			}).then((data) => {
				data.user = req.user;
				data.pageName = file.replace(/_/g, " ");

				return templating.compile(template, data);
			}).then((html) => {
				res.send(html).end();
			}).catch((err) => app.handleError(err, req, res));
		});
	});
});

const api = require("./routes/api");
router.use("/api", app.rateLimit, api);

// Handles routing of unfound routes
router.get('*', function(req, res) {
    res.redirect('/');
	// Add page not found here
});

module.exports = router;
