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

		if (search > 0) {
			query.where("user_id = ?", search);
		}

		let mapping = ["r.report_by", "r.reason", "r.report_date"];

		search_column.forEach(function (item) {
			if (item.search.value !== '') {
				query.where(item.data + " = ?", item.search.value);
			}

		});

		order.forEach(function (item) {
			query.order(mapping[item.column], (item.dir === "asc") ? true : false);
		});
		console.log(query.toString());
		return dbc.execute(query);
	}).then((data) => {
		return Promise.resolve(data);
	});
};

reports.count = function (search) {

	return Promise.resolve().then(() => {

		let query = internal.query.count();
		if (search > 0) {
			query.where("r.user_id = ?", search);
		}
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
		"by.sql_date_added": "report_date",
		"by.username": "report_by_username",
		"by.email": "report_by_email",
		"by.display_name": "report_by_display_name",
		"user.username": "username",
		"user.email": "email",
		"user.display_name": "display_name"
	}).from(
		"ebdb.user_report", "r"
	).left_join(
		"ebdb.user", "by",
		"r.report_by = by.id"
	).left_join(
		"ebdb.user", "user",
		"r.user_id = user.id"
	);
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
