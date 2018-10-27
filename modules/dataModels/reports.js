const dbc = require("@modules/dbc");

let reports = {};

reports.user_report = {};
reports.user_report.query = function(search_query = null) {
	return Promise.resolve().then(() => {
		let query = internal.query.user_report();
		return dbc.execute(query);

    }).then((rows) => {
        if ( rows ) {
            return Promise.resolve(rows);
        } else {
            return Promise.resolve(false);
		}
    });
};

reports.admin_report_list = function (pagination_start, pagination_length, search, order, search_column) {

	return Promise.resolve().then(() => {

		let query = internal.query.admin_report_list();
		query.offset(pagination_start);
		query.limit(pagination_length);

		query.where("r.user_id = ?", search);

		let mapping = ["r.report_by", "r.reason", "r.report_date"];

		// search_column.forEach(function (item) {
		// 	if (item.search.value !== '') {
		// 		query.where(item.data + " = ?", item.search.value);
		// 	}
		//
		// });

		order.forEach(function (item) {
			query.order(mapping[item.column], (item.dir === "asc") ? true : false);
		});
		console.log(query.toString());
		return dbc.execute(query);
	}).then((data) => {
		return Promise.resolve(data);
	});
};

reports.count = function (user_id) {

	return Promise.resolve().then(() => {

		let query = internal.query.count();
		query.where("user_id = ?", user_id);
	console.log(query.toString());
		return dbc.execute(query);

	}).then((data) => {

		return Promise.resolve(data[0].total);
	});
};



module.exports = reports;

let internal = {};
internal.query = {};

internal.query.count = function () {
	let query = dbc.sql.select().fields({
		"count(*)": "total"
	}).from(
		"ebdb.user_report", "r"
	);

	return query;
};

internal.query.admin_report_list = function() {
	return dbc.sql.select().fields([
		"r.id",
		"r.user_id",
		"r.req_ip",
		"r.reason",
		"r.report_by",
		"r.is_active"
	]).fields({
		"r.sql_date_added": "report_date",
		"u1.username": "report_by_username",
		"u1.email": "report_by_email",
		"u1.display_name": "report_by_display_name",
	}).from(
		"ebdb.user_report", "r"
	).left_join(
		"ebdb.user", "u1",
		"r.user_id = u1.id"
	)
};

internal.query.user_report = function() {
    return dbc.sql.select().fields([
        "i.id",
		"i.user_id",
		"i.req_ip",
		"i.tag_report",
		"i.reason",
		"i.report_by"
    ]).from(
        "ebdb.user_report", "i"
    );
};
