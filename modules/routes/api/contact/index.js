const router = require("express").Router();

const app = require("@modules/app");
const dbc = require("@modules/dbc");
const models = require("@modules/models");

router.post("/", (req, res) => {
	let row = {};

	Promise.resolve().then(() => {
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
		} else {
			row.user_id = req.user.user_id;
		}

		return models.messaging.new();
	}).then(() => {
		res.status(200).json({ message: "Successfully sent!" }).end();
	}).catch((error) => app.handleError(error, req, res));
});

module.exports = router;
