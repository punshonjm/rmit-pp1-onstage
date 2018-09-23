const router = require("express").Router();
const aaa = global.aaa;
const dbc = global.dbc;
const app = global.app;

router.post("/golden_ticket/:type", (req, res) => {
	return aaa.checkAccess(req, { golden_ticket: true }).then(() => {
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

module.exports = router;
