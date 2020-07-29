const path = require("path");
const moment = require("moment");
const router = require("express").Router();

const aaa = require("@modules/aaa");
const dbc = require("@modules/dbc");
const app = require("@modules/app");

const models = require("@modules/models");

router.use((req, res, next) => {
	if (!req.user || req.user.type_id != 1 || req.user.account_locked == 1) {
		res.status(402).json({message: "You don't have access to that!"}).end();
	} else {
		next();
	}
});

router.post("/user/unlock", (req, res) => {

	let user_id = req.body.user_id;
	let note = req.body.actionReason;
	let admin_user_id = req.user.user_id;
	let admin_action_id = 2;

	Promise.resolve().then(() => {
		return models.users.details(user_id);
	}).then((user) => {
		if (user != null) {
			if (user.account_locked !== 0) {
				return Promise.reject({message: "User is already unlocked!", userMessage: true});
			}
		} else {
			return Promise.reject({message: "Unable to retrieve user!", userMessage: true});
		}

		return models.users.unlock(user_id);
	}).then(() => {
		return models.log.admin(admin_user_id, user_id, admin_action_id, note);
	}).then(() => {

		res.status(200).json({message: "OK"}).end();
	}).catch((err) => app.handleError(err, req, res));
});


router.post("/report/close", (req, res) => {

	let id = req.body.id;
	let user_id = 0;
	let note = req.body.actionReason;
	let admin_user_id = req.user.user_id;
	let admin_action_id = 3;

	Promise.resolve().then(() => {
		return models.reports.details(id);
	}).then((report) => {
		if (report != null) {
			if (report.is_active !== 1) {
				return Promise.reject({message: "Report is already closed!", userMessage: true});
			}
		} else {
			return Promise.reject({message: "Unable to retrieve report!", userMessage: true});
		}

		user_id = report.user_id;

		return models.reports.close(id);
	}).then(() => {
		return models.log.admin(admin_user_id, user_id, admin_action_id, note, id);
	}).then(() => {
		res.status(200).json({message: "OK"}).end();
	}).catch((err) => app.handleError(err, req, res));
});

router.post("/user/lock", (req, res) => {

	let user_id = req.body.user_id;
	let note = req.body.actionReason;
	let admin_user_id = req.user.user_id;
	let admin_action_id = 1;

	Promise.resolve().then(() => {
		return models.users.details(user_id);
	}).then((user) => {
		if (user != null) {
			if (user.account_locked !== 0) {
				return Promise.reject({message: "User is already locked!", userMessage: true});
			}
		} else {
			return Promise.reject({message: "Unable to retrieve user!", userMessage: true});
		}

		return models.users.lock(user_id);
	}).then(() => {
		return models.log.admin(admin_user_id, user_id, admin_action_id, note);
	}).then(() => {

		res.status(200).json({message: "OK"}).end();
	}).catch((err) => app.handleError(err, req, res));
});


router.get("/user/report", (req, res) => {

	let data = {};

	let pagination_start = req.query.start;
	let pagination_length = req.query.length;
	let search = req.query.search.value;
	let search_column = req.query.columns;
	let order = req.query.order;

	Promise.resolve().then(() => {

		return models.reports.count(search, search_column);
	}).then((total) => {

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
	let requestor = req.user.user_id;

	Promise.resolve().then(() => {
		return models.users.admin_user_count(search, search_column, requestor);
	}).then((total) => {

		data.recordsTotal = total;
		data.recordsFiltered = total;


		return models.users.admin_user_list(pagination_start, pagination_length, search, order, search_column, requestor);
	}).then((records) => {

		data.data = records;
		res.status(200).json(data).end();
	}).catch((err) => app.handleError(err, req, res));
});

module.exports = router;
