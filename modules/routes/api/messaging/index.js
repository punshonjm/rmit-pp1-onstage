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

	Promise.resolve().then(() => {

		if (req.user.account_locked === 1 || req.user.email_verified === 0) {
			// Account is in a restricted state
			if ( ("thread_id" in req.body) ) {
				// Get other thread users details
				return models.messaging.getOtherThreadUser(req.user.user_id, req.body.thread_id);
			} else if ( ("message_to" in req.body) ) {
				// Get user being messaged
				return models.users.details(req.body.message_to);
			}
		}
		return null;

	}).then((result) => {
		if (result !== null) {
			if (result.type_id !== 1 && result.id !== 0 && result.id !== 1) {
				// Messaging a non-admin/service user
				return Promise.reject({ message: "You are not permitted to message other users at this time." });
			}
		}

		req.body.user = req.user;
		if ( ("message_to" in req.body) && ("message" in req.body) ) {
			req.body.user_id = req.user.user_id;
			return models.messaging.new(req.body);
		} else {
			return models.messaging.send(req.body);
		}
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

router.post("/delete", (req, res) => {
	Promise.resolve().then(() => {
		req.body.user = req.user;
		return models.messaging.deleteThread(req.body);
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
