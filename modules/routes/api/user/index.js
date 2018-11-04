const path = require("path");
const moment = require("moment");
const router = require("express").Router();

const aaa = require("@modules/aaa");
const dbc = require("@modules/dbc");
const app = require("@modules/app");

const models = require("@modules/models");
const multr = require("multer");

var uploader = multr({ dest: path.join(app.rootDir, "www/uploads") });

router.post("/golden_ticket/:type", (req, res) => {
	aaa.checkAccess(req, { golden_ticket: true }).then(() => {
		if ( req.user.golden_ticket ) {
			let query = dbc.sql.update().table(
				"ebdb.user"
			).setFields({
				"type_id": req.params.type
			}).where("id = ?", req.user.user_id);

			return dbc.execute(query);
		} else {
			return Promise.reject({ noAcces: true });
		}
	}).then((sqlResults) => {
		res.status(200).end();
	}).catch((err) => app.handleError(err, req, res));
});

router.post("/register", uploader.fields([ { name: "background", maxCount: 1 }, { name: "profile", maxCount: 1 } ]), (req, res) => {
	Promise.resolve().then(() => {
		// Adds the uploaded profile & background photos to the body that is passed
		req.body.files = req.files;

		if ( typeof req.body.files == typeof undefined ) {
			delete req.body.files;
		}

		return models.users.register(req.body);
	}).then((stagePass) => {
		// if we want to check something before responding here
		res.status(200).cookie("stagePass", stagePass, {
			expires: moment(stagePass.expires, "YYYY-MM-DD HH:mm:ss").toDate()
		}).end();
	}).catch((error) => {
		// additional register specific error handling if you want to here
		if ( ("errorSet" in error)) {
			res.status(400).json(error).end();
		} else {
			return Promise.reject(error)
		};
	}).catch((error) => app.handleError(error, req, res));
});

router.post("/update", uploader.fields([ { name: "background", maxCount: 1 }, { name: "profile", maxCount: 1 } ]), (req, res) => {
	Promise.resolve().then(() => {
		req.body.files = req.files;
		req.body.user = req.user;

		if ( typeof req.body.files == typeof undefined ) {
			delete req.body.files;
		}

		return models.users.update(req.body);
	}).then((msg) => {
		// if we want to check something before responding here
		res.status(200).json(msg).end();
	}).catch((error) => {
		// additional register specific error handling if you want to here
		if ( ("errorSet" in error)) {
			res.status(400).json(error).end();
		} else {
			return Promise.reject(error)
		};
	}).catch((error) => app.handleError(error, req, res));
})

router.get("/new_verification", (req, res) => {
	Promise.resolve().then(() => {
		return models.users.new_verification(req.user);
	}).then(() => {
		res.status(200).json({ message: "Successfully resent!" }).end();
	}).catch((error) => app.handleError(error, req, res));
});

router.post("/change_password", (req, res) => {
	Promise.resolve().then(() => {
		req.body.user = req.user;
		return models.users.change_password(req.body);
	}).then(() => {
		res.status(200).json({ message: "Successfully changed!" }).end();
	}).catch((error) => {
		// additional register specific error handling if you want to here
		if ( ("errorSet" in error)) {
			res.status(400).json(error).end();
		} else {
			return Promise.reject(error)
		};
	}).catch((error) => app.handleError(error, req, res));
});
router.post("/set_password", (req, res) => {
	Promise.resolve().then(() => {
		req.body.user = req.user;
		return models.users.set_password(req.body);
	}).then(() => {
		res.status(200).json({ message: "Successfully changed!" }).end();
	}).catch((error) => {
		// additional register specific error handling if you want to here
		if ( ("errorSet" in error)) {
			res.status(400).json(error).end();
		} else {
			return Promise.reject(error)
		};
	}).catch((error) => app.handleError(error, req, res));
});

router.post("/password_reset", (req, res) => {
	Promise.resolve().then(() => {
		return aaa.resetPassword(req.body, req);
	}).then(() => {
		res.status(200).json({ message: "Processed!" }).end();
	}).catch((error) => app.handleError(error, req, res));
});

router.post("/search", (req, res) => {
	Promise.resolve().then(() => {
		return models.users.search(req.body);
	}).then((data) => {
		res.status(200).json({ results: data }).end();
	}).catch((err) => app.handleError(err, req, res));
});

router.param("id", (req, res, next, id) => {
	Promise.resolve().then(() => {
		return models.users.details(id);
	}).then((profile) => {
		req.profile = profile;
		next();
	}).catch((error) => app.handleError(error, req, res));
});

router.post("/:id/report", (req, res) => {
	Promise.resolve().then(() => {
		let row = {};
		row.user_id = req.profile.user_id;
		row.req_ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
		//row.tag_report = req.body.tag_report;
		row.reason = req.body.tag_report + ': ' + req.body.reportReason;

		if ( req.user ) {
			row.report_by = req.user.user_id;
		}

		let query = dbc.sql.insert().into(
			"ebdb.user_report"
		).setFields(row);

		return dbc.execute(query);
	}).then((qres) => {
		res.status(200).json({ results: qres }).end();
	}).catch((err) => app.handleError(err, req, res));
});

module.exports = router;
