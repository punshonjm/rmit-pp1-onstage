const dbc = require("@modules/dbc");

let list = {};

list.instrument = {};
list.instrument.query = function(search_query = null) {
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

list.status = {};
list.status.query = function(search_query = null) {
	return Promise.resolve().then(() => {

		let query = internal.query.status();
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

list.gig_frequency = {};
list.gig_frequency.query = function(search_query = null) {
	return Promise.resolve().then(() => {

		let query = internal.query.gig_frequency();
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

list.gender = {};
list.gender.query = function(search_query = null) {
	return Promise.resolve().then(() => {

		let query = internal.query.gender();
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
}

list.past_gig = {};
list.past_gig.query = function(search_query = null) {
	return Promise.resolve().then(() => {

		let query = internal.query.past_gig();
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

list.music_experience = {};
list.music_experience.query = function(search_query = null) {
	return Promise.resolve().then(() => {

		let query = internal.query.music_experience();
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

list.commitment_level = {};
list.commitment_level.query = function(search_query = null) {
	return Promise.resolve().then(() => {
		let query = internal.query.commitment_level();
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

list.age_bracket = {};
list.age_bracket.query = function(search_query = null) {
	return Promise.resolve().then(() => {
		let query = internal.query.age_bracket();
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

list.genre = {};
list.genre.query = function(search_query) {
    return Promise.resolve().then(() => {

        let query = internal.query.genres();
        if ( search_query != null ) {
            query.where("g.name like ?", "%"+search_query+"%");
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
internal.query.status = function() {
    return dbc.sql.select().fields([
        "i.id",
        "i.name"
    ]).from(
        "ebdb.status", "i"
    );
};
internal.query.gig_frequency = function() {
    return dbc.sql.select().fields([
        "i.id",
        "i.name"
    ]).from(
        "ebdb.gig_frequency", "i"
    );
};
internal.query.gender = function() {
    return dbc.sql.select().fields([
        "i.id",
        "i.name"
    ]).from(
        "ebdb.gender", "i"
    );
};
internal.query.commitment_level = function() {
    return dbc.sql.select().fields([
        "i.id",
        "i.name"
    ]).from(
        "ebdb.commitment_level", "i"
    );
};
internal.query.age_bracket = function() {
    return dbc.sql.select().fields([
        "i.id",
        "i.name"
    ]).from(
        "ebdb.age_bracket", "i"
    );
};
internal.query.past_gig = function() {
	return dbc.sql.select().fields([
		"i.id",
		"i.name"
	]).from(
		"ebdb.past_gig", "i"
	);
};
internal.query.music_experience = function() {
	return dbc.sql.select().fields([
		"i.id",
		"i.name"
	]).from(
		"ebdb.music_experience", "i"
	);
};
