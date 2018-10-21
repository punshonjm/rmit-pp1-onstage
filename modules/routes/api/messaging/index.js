const router = require("express").Router();
const models = require("@modules/models");
const app = require("@modules/app");

router.get("/thread", (req, res) => {
	Promise.resolve().then(() => {
		req.query.user = req.user;
		return models.messaging.getThread(req.query);
	}).then((thread) => {
		res.status(200).json(thread).end();
	}).catch((error) => {
		// additional register specific error handling if you want to here
		if ( ("errorSet" in error) ) {
			res.status(400).json(error).end();
		} else {
			return Promise.reject(error)
		};
	}).catch((error) => app.handleError(error, req, res));
});

router.post("/send", (req, res) => {

	let data = {};

	Promise.resolve().then(() => {
		data.user_id = req.user.user_id;
		data.message_to = req.body.message_to;
		data.message = req.body.message;


		return models.messaging.new(data);
	}).then((result) => {
		res.status(200).json(result).end();
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
