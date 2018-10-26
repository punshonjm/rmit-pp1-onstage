const path = require("path");
const moment = require("moment");
const router = require("express").Router();

const aaa = require("@modules/aaa");
const dbc = require("@modules/dbc");
const app = require("@modules/app");

const models = require("@modules/models");


router.get("/user/list", (req, res) => {

	let data = {};

	Promise.resolve().then(() => {
		return models.users.count();
	}).then((total) => {

		let pagination_start = req.query.start;
		let pagination_length = req.query.length;
		let search = req.query.search.value;
		let search_column = req.query.columns;
		let order = req.query.order;

		data.recordsTotal = total;
		data.recordsFiltered = total;


		return models.users.admin_user_list(pagination_start,pagination_length, search, order, search_column);
	}).then((records) => {

		data.data = records;
		res.status(200).json(data).end();
	}).catch((err) => app.handleError(err, req, res));
});

module.exports = router;
