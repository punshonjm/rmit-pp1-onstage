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

module.exports = reports;

let internal = {};
internal.query = {};
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
