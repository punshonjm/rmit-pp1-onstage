const router = require("express").Router();

const app = require("@modules/app");
const dbc = require("@modules/dbc");
const models = require("@modules/models");

router.post("/", (req, res) => {
	let row = {};

	Promise.resolve().then(() => {
		let errors = [];

		if ( String.isNullOrEmpty(req.body.subject) ) errors.push({ key: "subject", reason: "Ensure you have provided a subject for your contact submission." });
		if ( String.isNullOrEmpty(req.body.message) ) errors.push({ key: "message", reason: "Ensure you have provided message content for your contact submission." });

		if ( !req.user ) {
			if ( String.isNullOrEmpty(req.body.name) ) errors.push({ key: "name", reason: "Ensure you have provided your name for the contact submission." });
			if ( String.isNullOrEmpty(req.body.email) ) errors.push({ key: "email", reason: "Ensure you have provided your email for the contact submission." });
		}

		if ( errors.length > 0 ) {
			return Promise.reject({ errorSet: errors });
		} else {
			return Promise.resolve();
		}
	}).then(() => {
		row.subject = req.body.subject;
		row.message = req.body.message;

		if ( !req.user ) {
			row.name = req.body.name;
			row.email = req.body.email;

			let query = dbc.sql.insert().into("ebdb.contact_form").setFields(row);
			return dbc.execute(query);
		} else {
			return Promise.resolve(null);
		}
	}).then((output) => {
		if ( output != null ) {
			row.user_id = 0;
			row.contact_id = output.insertId;
		} else {
			row.user_id = req.user.user_id;
		}

		row.message_to = 1;

		return models.messaging.new(row);
	}).then(() => {
		res.status(200).json({ message: "Successfully sent!" }).end();
	}).catch((error) => {
		// additional register specific error handling if you want to here
		if ( ("errorSet" in error) ) {
			res.status(400).json(error).end();
		} else {
			return Promise.reject(error)
		};
	}).catch((error) => app.handleError(error, req, res));
});

module.exports = router;
