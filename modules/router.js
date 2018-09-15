const fs = require("fs");
const path = require("path");

const Handlebars = require('handlebars');
const moment = require("moment");
const router = require("express").Router();
const _ = require("lodash");

const templating = require("./templating")(Handlebars);
const app = require("./app");

router.get("/", (request, response) => {
    return Promise.resolve().then(() => {
        return templating.compile("home", { pageName: "Home" });
    }).then((html) => {
        response.send(html).end();
    })
});

router.get("/login", (req, res) => {
	return Promise.resolve().then(() => {
		fs.readFile(path.join(__dirname, "../templates", "login.html"), "utf8", (error, html) => {
			if (error) {
				console.error(error);
				console.error("Error.SessionManagement.FileError.Uncaught @ ", moment().format("YYYY-MM-DD HH:mm:ss"));
				res.status(500).end();
			} else {
				res.send(html).end();
			}
		});
	}).catch((err) => app.handleError(err, request, response));
})

const api = require("./api");
router.use("/api", api);

app.pathWalk("templates/public", (filePath, rootDir, subDir, fileName) => {
	let file = fileName.split('.')[0];
	let url = "/" + file.toLowerCase();
	let template = "/public/" + file;

	if ( typeof subDir != "undefined" ) {
		url = "/" + subDir.toLowerCase() + "/" + file.toLowerCase();
		template = "/public/" + subDir + "/" + file;
	}

	if ( file == "index" ) {
		file = _.last( subDir.split("/") );
		url = "/" + subDir.replace("/" + file, "") + "/" + file.toLowerCase();
	}
	
	app.publicPaths.push(url);

	router.get(url, (request, response) => {
		return Promise.resolve().then(() => {
			return templating.compile(template, { pageName: file.replace(/_/g, " ") });
		}).then((html) => {
			response.send(html).end();
		}).catch((err) => app.handleError(err, request, response));
	});
});
app.pathWalk("templates/private", (filePath, rootDir, subDir, fileName) => {
	let file = fileName.split('.')[0];
	let url = "/" + file.toLowerCase();
	let template = "/private/" + file;

	if ( typeof subDir != "undefined" ) {
		url = "/" + subDir.toLowerCase() + "/" + file.toLowerCase();
		template = "/private/" + subDir + "/" + file;
	}

	if ( file == "index" ) {
		file = _.last( subDir.split("/") );
		url = "/" + subDir.replace("/" + file, "") + "/" + file.toLowerCase();
	}

	router.get(url, (request, response) => {
		return Promise.resolve().then(() => {
			return templating.compile(template, { pageName: file.replace(/_/g, " ") });
		}).then((html) => {
			response.send(html).end();
		}).catch((err) => app.handleError(err, request, response));
	});
});

router.get('*', function(req, res) {
    res.redirect('/');
	// Add page not found here
});

module.exports = router;
