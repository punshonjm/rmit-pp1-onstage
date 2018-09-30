const dbc = require("@modules/dbc");


let list = {};
list.instrument = {};

list.instrument.query = function(search_query) {

    return Promise.resolve().then(() => {

		let query = internal.query.instruments();
		if ( search_query != null ) {
			query.where("i.name like ?", "%"+search_query+"%");
		}
		return dbc.execute(query);

    }).then((rows) => {
        if ( rows ) {
            return Promise.resolve(rows);
        } else {
            return Promise.resolve(false);
		}

    });
};

module.exports = list;

let internal = {};
internal.query = {};
internal.query.genres = function() {
    return dbc.sql.select().fields([
        "g.id",
        "g.name"
    ]).from(
        "ebdb.genre", "g"
    );
};
internal.query.instruments = function() {
    return dbc.sql.select().fields([
        "i.id",
        "i.name"
    ]).from(
        "ebdb.instrument", "i"
    );
};
