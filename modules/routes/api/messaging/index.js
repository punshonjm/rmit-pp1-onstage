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

module.exports = router;
