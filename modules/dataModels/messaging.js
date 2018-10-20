const app = require("@modules/app");
const dbc = require("@modules/dbc");

const _ = require("lodash");
const moment = require("moment");

var messaging = {};

messaging.new = function(params) {
	let userRow_a = {}, userRow_b = {}, message = {};

	return Promise.resolve().then(() => {
		let query = dbc.sql.insert().into("ebdb.thread").setFields({ sql_last_update: dbc.sql.rstr("NOW()") });
		return dbc.execute(query);
	}).then((res) => {
		userRow_a.thread_id = res.insertId;
		userRow_a.user_id = params.user_id;
		userRow_a.read_message_id

		userRow_b.thread_id = res.insertId;
		userRow_b.user_id = params.message_to;

		message.thread_id = res.insertId;
		message.user_id = params.user_id;
		message.content = params.message;

		if ( ("subject" in params) ) message.content = params.subject + "\n" + message.content;

		let query = dbc.sql.insert().into("ebdb.thread_user").setFieldsRows([ userRow_a, userRow_b ]);
		return dbc.execute(query);
	}).then((res) => {
		let query = dbc.sql.insert().into("ebdb.message").setFields(message);
		return dbc.execute(query);
	}).then((res) => {
		return Promise.resolve({ message: "Successfully sent message!" });
	});
};

messaging.listThreads = function(user) {
	var data = [];

	return Promise.resolve().then(() => {
		let query = dbc.sql.select().fields([
			"t1.thread_id",
			"t1.read_message_id",
			"t2.user_id AS message_with",
			"cf.name AS messager_name",
			"u.display_name",
			"p.picture"
		]).from(
			"ebdb.thread_user",
			"t1"
		).left_join(
			"ebdb.thread_user",
			"t2", "t1.thread_id = t2.thread_id AND t1.id != t2.id"
		).left_join(
			"ebdb.contact_form",
			"cf", "t2.contact_id = cf.id"
		).left_join(
			"ebdb.user",
			"u", "t2.user_id = u.id"
		).left_join(
			"ebdb.profile",
			"p", "p.user_id = u.id"
		);

		let expr = dbc.sql.expr().or("t1.user_id = ?", user.user_id);

		// If user is admin, get unassigned messages to admins
		if ( user.type_id == 1) expr.or("t1.user_id = 1");
		query.where(expr).where("t1.is_active = ?", 1);

		return dbc.execute(query);
	}).then((threads) => {
		data = _.keyBy(threads, "thread_id");

		let threadIds = threads.map((t) => t.thread_id);

		let idQuery = dbc.sql.select().field("MAX(id)").from(
			"ebdb.message"
		).where(dbc.sql.expr()
			.and("thread_id IN ?", threadIds)
		).group("thread_id");

		let query = dbc.sql.select().fields([
			"id", "thread_id", "user_id", "content", "sql_date_added"
		]).from(
			"ebdb.message"
		).where("id IN ?", idQuery);

		if ( threadIds.length > 0) {
			return dbc.execute(query);
		} else {
			return Promise.reject({ noMessages: true });
		}
	}).then((messages) => {
		messages.map((message) => {
			data[message.thread_id].message = message;
		});

		data = Object.values(data).map((thread) => {
			thread.user = {};
			thread.date = moment(thread.message.sql_date_added).format("YYYY/MM/DD, h:mm a");
			thread.unread = ( thread.read_message_id == thread.message.id ) ? false : true;
			thread.unassigned = ( thread.message_with == 1 ) ? true : false;

			if ( thread.messager_name != null ) {
				thread.user.display_name = thread.messager_name;
				thread.user.picture = null;
			} else if ( thread.message_with == 1 ) {
				thread.user.display_name = "Unassigned";
				thread.user.picture = null;
			} else {
				thread.user.display_name = thread.display_name;
				thread.user.picture = thread.picture;

				delete thread.display_name;
				delete thread.picture;
			}

			return thread;
		});

		return Promise.resolve(data);
	}).catch((error) => {
		if ( ("noMessages" in error) ) {
			return Promise.resolve([]);
		} else {
			return Promise.reject(error);
		}
	});
};

messaging.getThread = function(params) {
	let thread = {};
	return Promise.resolve().then(() => {
		let query = dbc.sql.select().from("ebdb.thread_user");
		let expr = dbc.sql.expr().and("thread_id = ?", params.thread_id);

		if ( params.user.type_id == 1 ) {
			expr.and(dbc.sql.expr().or("user_id = ?", params.user.user_id).or("user_id = ?", 1))
		} else {
			expr.and("user_id = ?", params.user.user_id);
		}

		return dbc.getRow(query);
	}).then((row) => {
		if ( row ) {
			let query = dbc.sql.select().fields([
				"t.user_id AS message_with",
				"cf.name AS messager_name",
				"u.display_name",
				"p.picture"
			]).from(
				"ebdb.thread_user",
				"t"
			).left_join(
				"ebdb.contact_form",
				"cf", "t.contact_id = cf.id"
			).left_join(
				"ebdb.user",
				"u", "t.user_id = u.id"
			).left_join(
				"ebdb.profile",
				"p", "p.user_id = u.id"
			).where("thread_id = ?", params.thread_id);

			return dbc.execute(query);
		} else {
			return Promise.reject({ message: "You don't have access to this message thread." });
		}
	}).then((users) => {
		thread.users = _.keyBy(users.map((user) => {
			if ( user.message_with == 1 ) user.display_name = "Unassigned";
			if ( user.messager_name != null ) user.display_name = user.messager_name;
			user.user_id = user.message_with;
			return user;
		}), "user_id");

		let query = dbc.sql.select().from("ebdb.message").where("thread_id = ?", params.thread_id);
		return dbc.execute(query);
	}).then((messages) => {
		thread.messages = messages.map((message) => {
			message.user = thread.users[message.user_id];
			message.own = ( message.user.user_id == params.user.user_id ) ? true : false;

			if ( (!message.own || message.user.message_with == 1) && !("thread_with" in thread) ) thread.thread_with = thread.users[message.user_id];

			message.date = moment(message.sql_date_added).format("YYYY/MM/DD h:mm a");
			return message;
		});

		console.log(thread);
		return Promise.resolve({ thread: thread });
	});
};

module.exports = messaging;
