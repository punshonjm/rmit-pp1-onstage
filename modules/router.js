const fs = require("fs");
const path = require("path");

const moment = require("moment");
const router = require("express").Router();
const _ = require("lodash");

const Handlebars = require('handlebars');
const templating = require("./templating")(Handlebars);
const app = require("./app");
const aaa = require("./aaa");

router.get("/", (req, res) => {
	// Present home page
    Promise.resolve().then(() => {
		var data = { pageName: "Home" };
		data.user = req.user;

		data.headerTitle = "Live Auditions";
		data.headerSubtitle = "Whether you want to get up On Stage or need someone to <br /> " +
			"join you On Stage, this is where this can happen. <br /> " +
			"Bringing bands and musicians together, this is On Stage.";
		data.headerCTA = {
			link: "/register_now",
			text: "Join Now",
			icon: null
		};

        return templating.compile("home", data);
    }).then((html) => {
        res.send(html).end();
    }).catch((err) => app.handleError(err, req, res));
});

router.get("/about_us", (req, res) => {
    // Present about_us page
    Promise.resolve().then(() => {
        var data = { pageName: "About" };
        data.user = req.user;

        data.headerTitle = "About Us";
        data.headerSubtitle = "On Stage was created to support the live music industry in Australia <br />" +
            "by making it easier for bands and musicians to connect. <br /> " +
            "Not being affiliated with any management agencies or labels means <br /> " +
            "that all of our services are unbiased and fair for all performers.";

        return templating.compile("../templates/public/about_us", data);
    }).then((html) => {
        res.send(html).end();
    }).catch((err) => app.handleError(err, req, res));
});

router.get("/login", (req, res) => {
	// Present login page
	Promise.resolve().then(() => {
		if ( ("user" in req) && req.user != false ) {
			// If user is already logged in, redirect to homepage
			res.redirect('/');
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
	}).catch((err) => app.handleError(err, req, res));
});
router.post("/login", (req, res) => {
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
		let template = "/" + folder + "/" + file;

		if ( typeof subDir != "undefined" ) {
			url = "/" + subDir.toLowerCase() + "/" + file.toLowerCase();
			template = "/" + folder + "/" + subDir + "/" + file;
		}

		if ( file == "index" ) {
			file = _.last( subDir.split("/") );
			url = "/" + subDir.replace("/" + file, "") + "/" + file.toLowerCase();
		}

		if ( folder == "public" ) {
			app.publicPaths.push(url);
		} else if ( folder == "admin" ) {
			app.adminPaths.push(url);
		}

		router.get(url, (req, res) => {
			Promise.resolve().then(() => {
				var data = {
					user: req.user,
					pageName: file.replace(/_/g, " ")
				};

				return templating.compile(template, data);
			}).then((html) => {
				res.send(html).end();
			}).catch((err) => app.handleError(err, req, res));
		});
	});
});

const api = require("./api");
router.use("/api", api);

// Handles routing of unfound routes
router.get('*', function(req, res) {
    res.redirect('/');
	// Add page not found here
});

module.exports = router;
