const path = require("path");
const moment = require("moment");
const router = require("express").Router();

const aaa = require("@modules/aaa");
const dbc = require("@modules/dbc");
const app = require("@modules/app");

const models = require("@modules/models");

router.use((req, res, next) => {
	if ( !req.user || req.user.type_id != 1 ) {
		res.status(402).json({ message: "You don't have access to that!" }).end();
	} else {
		next();
	}
});

router.get("/user/report", (req, res) => {

	let data = {};

	Promise.resolve().then(() => {

		return models.reports.count(req.query.search.value);
	}).then((total) => {

		let pagination_start = req.query.start;
		let pagination_length = req.query.length;
		let search = req.query.search.value;
		let search_column = req.query.columns;
		let order = req.query.order;

		data.recordsTotal = total;
		data.recordsFiltered = total;


		return models.reports.admin_report_list(pagination_start, pagination_length, search, order, search_column);
	}).then((records) => {

		data.data = records;
		res.status(200).json(data).end();
	}).catch((err) => app.handleError(err, req, res));
});

router.get("/user/list", (req, res) => {

	let data = {};

	let pagination_start = req.query.start;
	let pagination_length = req.query.length;
	let search = req.query.search.value;
	let search_column = req.query.columns;
	let order = req.query.order;

	Promise.resolve().then(() => {
		return models.users.count(search, search_column);
	}).then((total) => {

		data.recordsTotal = total;
		data.recordsFiltered = total;


		return models.users.admin_user_list(pagination_start,pagination_length, search, order, search_column);
	}).then((records) => {

		data.data = records;
		res.status(200).json(data).end();
	}).catch((err) => app.handleError(err, req, res));
});

module.exports = router;
