const app = require("@modules/app");
const dbc = require("@modules/dbc");

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

module.exports = messaging;
