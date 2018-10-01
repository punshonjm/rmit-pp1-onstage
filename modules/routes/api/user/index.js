const path = require("path");
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
		return models.users.register(req.body);
	}).then((status) => {
		// if we want to check something before responding here
		res.status(200).end();
	}).catch((error) => {
		// additional register specific error handling if you want to here
		if ( ("key" in error) ) {
			res.status(400).json(error).end();
		} else {
			return Promise.reject(error)
		};
	}).catch((error) => app.handleError(error, req, res));
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
		row.user_id = req.profile.user_id
		row.req_ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
		row.reason = req.body.reportReason;
		if ( req.user ) {
			row.report_by = req.user.user_id;
		}

		let query = dbc.sql.insert().into(
			"ebdb.user_report"
		).setFields(row);

		return dbc.execute(query);
	}).then((qRes) => {
		res.status(200).end();
	});
});

module.exports = router;
