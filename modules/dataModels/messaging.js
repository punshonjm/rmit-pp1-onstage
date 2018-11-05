const app = require("@modules/app");
const dbc = require("@modules/dbc");
const mail = require("@modules/mail");

const _ = require("lodash");
const moment = require("moment");

const model_users = require("@modules/dataModels/users");

var messaging = {};

messaging.new = function (params) {
	let userRow_a = {}, userRow_b = {}, message = {}, is_existing_thread = false;

	return Promise.resolve().then(() => {
		// Check for existing user to user thread
		if (!("contact_id" in params) && ("user_id" in params) && ("message_to" in params)) {
			// Is user to user message, lookup thread
			return messaging.getLatestThreadId(params.user_id, params.message_to);
		} else {
			// Contact form, no existing thread exists
			return null;
		}
	}).then((thread_id) => {
		// Use existing thread if exists otherwise create new thread
		if (thread_id != null) {
			// User had existing thread, return id
			is_existing_thread = true;
			return {"insertId": thread_id};
		} else {
			// Thread does not exist, create
			let query = dbc.sql.insert().into("ebdb.thread").setFields({sql_last_update: dbc.sql.rstr("NOW()")});
			return dbc.execute(query);
		}
	}).then((res) => {
		// Process message with thread
		userRow_a.thread_id = res.insertId;
		userRow_a.user_id = params.user_id;

		if (("contact_id" in params)) {
			userRow_a.contact_id = params.contact_id;
			userRow_b.contact_id = null;
		}

		userRow_b.thread_id = res.insertId;
		userRow_b.user_id = params.message_to;

		message.thread_id = res.insertId;
		message.user_id = params.user_id;
		message.content = params.message;

		if (("subject" in params)) message.content = params.subject + "\n" + message.content;

		if (!is_existing_thread) {
			let query = dbc.sql.insert().into("ebdb.thread_user").setFieldsRows([userRow_a, userRow_b]);
			return dbc.execute(query);
		} else {
			return null;
		}
	}).then((res) => {
		let query = dbc.sql.insert().into("ebdb.message").setFields(message);
		return dbc.execute(query);
	}).then((res) => {
		return Promise.resolve({message: "Successfully sent message!"});
	});
};

messaging.send = function (params) {
	let message = {};

	return Promise.resolve().then(() => {
		let query = dbc.sql.update().table("ebdb.thread").set("sql_last_update", dbc.sql.rstr("NOW()")).where("id = ?", params.thread_id);
		return dbc.execute(query);
	}).then(() => {
		let query = dbc.sql.select().field("id").from("ebdb.thread_user").where(dbc.sql.expr().and("thread_id = ?", params.thread_id).and("user_id = 1"));
		return dbc.getRow(query);
	}).then((row) => {
		if (row) {
			let query = dbc.sql.update().table("ebdb.thread_user").set("user_id", params.user.user_id).where("id = ?", row.id);
			return dbc.execute(query);
		} else {
			return Promise.resolve();
		}
	}).then(() => {
		message.thread_id = params.thread_id;
		message.user_id = params.user.user_id;
		message.content = params.content;

		let query = dbc.sql.insert().into("ebdb.message").setFields(message);
		return dbc.execute(query);
	}).then((res) => {
		let query = dbc.sql.update().table("ebdb.thread_user").setFields({
			sql_last_updated: dbc.sql.rstr("NOW()"),
			read_message_id: res.insertId
		}).where(dbc.sql.expr()
			.and("user_id = ?", params.user.user_id)
			.and("thread_id = ?", params.thread_id)
		);

		return dbc.execute(query);
	}).then(() => {
		let query = dbc.sql.select().fields([
			"email",
			"name",
			"subject"
		]).from(
			"ebdb.thread_user", "u"
		).left_join(
			"ebdb.contact_form",
			"f", "u.contact_id = f.id"
		).where(dbc.sql.expr()
			.and("thread_id = ?", params.thread_id)
			.and("user_id = 0")
		).limit(1);

		return dbc.getRow(query);
	}).then((row) => {
		if (row) {
			return mail.send.adminNotification(row.email, row.name, row.subject, message.content);
		} else {
			return Promise.resolve();
		}
	}).then(() => {
		return Promise.resolve({message: "Successfully sent message"});
	});
};

messaging.isInThread = function (user_id, thread_id) {

	return Promise.resolve().then(() => {
		let query = dbc.sql.select().fields([
			"u.id"
		]).from(
			"ebdb.user",
			"u"
		).where("u.id = ?", dbc.sql.select().fields(["user_id"]).from("ebdb.thread_user").where("thread_id = ?", thread_id).where("user_id = ?", user_id)
		);
		return dbc.getRow(query);
	}).then((row) => {
		if (row) {
			return Promise.resolve(true);
		} else {
			return Promise.resolve(false);
		}
	});
};

messaging.getOtherThreadUser = function (user_id, thread_id) {

	return Promise.resolve().then(() => {
		let query = dbc.sql.select().fields([
			"u.id", "u.type_id", "u.account_locked", "u.email_verified"
		]).from(
			"ebdb.user",
			"u"
		).where("u.id = ?", dbc.sql.select().fields(["user_id"]).from("ebdb.thread_user").where("thread_id = ?", thread_id).where("user_id <> ?", user_id).order("u.id").limit(1)
		);

		return dbc.getRow(query);
	}).then((row) => {
		if (row) {
			return Promise.resolve(row);
		} else {
			return Promise.resolve(null);
		}
	});
};

messaging.getLatestThreadId = function (user_a, user_b) {
	// Find the latest thread id between 2 parties that are still active. Return id or null.
	let thread = {};

	return Promise.resolve().then(() => {
		let query = dbc.sql.select().fields([
			"t.id",
		]).from(
			"ebdb.thread",
			"t"
		).left_join(
			"ebdb.thread_user",
			"u1", "t.id = u1.thread_id"
		).left_join(
			"ebdb.thread_user",
			"u2", "t.id = u2.thread_id"
		).where(dbc.sql.expr()
			.and("(u1.user_id = ? AND u2.user_id = ?) OR (u1.user_id = ? AND u2.user_id = ?)", user_a, user_b, user_b, user_a)
			.and("u1.is_active = 1 and u2.is_active = 1")
		).order("t.sql_date_added", false).distinct("t.id").limit(1);

		return dbc.getRow(query);
	}).then((row) => {
		if (row) {
			return Promise.resolve(row.id);
		} else {
			return Promise.resolve(null);
		}
	});
};

messaging.listThreads = function (user) {
	var data = [];
	var timezone = "";

	return Promise.resolve().then(() => {
		return model_users.getTimezone(user.user_id)
	}).then((data) => {

		timezone = data;

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
		if (user.type_id == 1) expr.or("t1.user_id = 1");
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

		let maxQuery = dbc.sql.select(
		).field("MAX(m2.id)"
		).from("ebdb.message", "m2"
		).where("m1.thread_id = m2.thread_id"
		).where("m2.user_id <> ?", user.user_id
		).group("m2.thread_id");

		let query = dbc.sql.select().fields([
			"m1.id", "m1.thread_id", "m1.user_id", "m1.content", "m1.sql_date_added"
		]).field(maxQuery, "max_message_id"
		).from(
			"ebdb.message", "m1"
		).where("m1.id IN ?", idQuery);

		if (threadIds.length > 0) {
			return dbc.execute(query);
		} else {
			return Promise.reject({noMessages: true});
		}
	}).then((messages) => {

		messages.map((message) => {
			data[message.thread_id].message = message;
		});

		data = Object.values(data).map((thread) => {
			thread.user = {};
			thread.unread = false;

			if (("message" in thread)) {
				thread.date = moment(thread.message.sql_date_added).tz(timezone).format("YYYY/MM/DD, h:mm a");

				if (thread.message.max_message_id !== null) {
					thread.unread = (thread.read_message_id !== thread.message.max_message_id);
				}
			}

			thread.unassigned = (thread.message_with == 1) ? true : false;

			if (thread.messager_name != null) {
				thread.user.display_name = thread.messager_name;
				thread.user.picture = null;
			} else if (thread.message_with == 1) {
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
		if (("noMessages" in error)) {
			return Promise.resolve([]);
		} else {
			return Promise.reject(error);
		}
	});
};

messaging.deleteThread = function (params) {
	return Promise.resolve().then(() => {
		let query = dbc.sql.update().table("ebdb.thread_user").setFields({
			'is_active': 0
		}).where(dbc.sql.expr()
			.and("thread_id = ?", params.thread_id)
			.and("user_id = ?", params.user.user_id)
		);

		return dbc.getRow(query);
	}).then(() => {
		return Promise.resolve({message: "Successfully deleted thread."});
	});
};

messaging.getThread = function (params) {
	let thread = {};
	let timezone = "";

	return Promise.resolve().then(() => {
		return model_users.getTimezone(params.user.user_id)
	}).then((data) => {

		timezone = data;

		let query = dbc.sql.select().from("ebdb.thread_user");
		let expr = dbc.sql.expr().and("thread_id = ?", params.thread_id);

		if (params.user.type_id == 1) {
			expr.and(dbc.sql.expr().or("user_id = ?", params.user.user_id).or("user_id = ?", 1))
		} else {
			expr.and("user_id = ?", params.user.user_id);
		}

		query.where(expr);
		return dbc.getRow(query);
	}).then((row) => {
		if (row) {
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
			return Promise.reject({message: "You don't have access to this message thread."});
		}
	}).then((users) => {
		thread.users = _.keyBy(users.map((user) => {
			if (user.message_with == 1) user.display_name = "Unassigned";
			if (user.messager_name != null) user.display_name = user.messager_name;
			user.user_id = user.message_with;

			// Set other user as thread_with
			if (user.user_id !== params.user.user_id) thread.thread_with = user;

			return user;
		}), "user_id");

		let query = dbc.sql.select().from("ebdb.message").where("thread_id = ?", params.thread_id);
		return dbc.execute(query);
	}).then((messages) => {

		let last_read = null;

		thread.messages = messages.map((message) => {
			message.user = thread.users[message.user_id];
			message.own = (message.user.user_id == params.user.user_id) ? true : false;
			if (!message.own) {
				// Set last message id from other user as read message id
				last_read = message.id;
			}

			message.date = moment(message.sql_date_added).tz(timezone).format("YYYY/MM/DD h:mm a");
			return message;
		});

		// If last_read exists then update the read_message_id from database
		if (last_read != null) {
			let query = dbc.sql.update().table("ebdb.thread_user").set("read_message_id", last_read).where(dbc.sql.expr().and("thread_id = ?", params.thread_id).and("user_id = ?", params.user.user_id));
			return dbc.execute(query);
		} else {
			return null;
		}
	}).then((result) => {
		thread.thread_id = params.thread_id;
		return Promise.resolve({thread: thread});
	});
};

module.exports = messaging;
