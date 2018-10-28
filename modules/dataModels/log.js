const dbc = require("@modules/dbc");

let log = {};

log.admin = function (admin_user_id,user_id,admin_action_id,note,report_id = null) {

	return Promise.resolve().then(() => {
		let query = dbc.sql.insert()
			.into("ebdb.admin_log")
			.setFields({
				admin_user_id: admin_user_id,
				user_id: user_id,
				admin_action_id: admin_action_id,
				note: note
			});
		if (report_id !== null) {
			query.setFields({report_id: report_id});
		}
		return dbc.execute(query);
	});
};

module.exports = log;