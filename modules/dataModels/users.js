const dbc = require("@modules/dbc");
const _ = require("lodash");

var users = {};

users.details = function(user_id) {
	var user = {};

	return Promise.resolve().then(() => {
		if ( user_id != null ) {
			let query = internal.query.user();
			query.where(dbc.sql.expr()
				.or("u.id = ?", user_id)
				.or("u.username = ?", user_id)
			);

			return dbc.getRow(query);
		} else {
			return Promise.reject({ message: "Provided an invalid ID or username." });
		}
	}).then((row) => {
		if ( row ) {
			user = _.cloneDeep(row);

			if ( user.profile_id != null ) {
				let query = internal.query.userGenres();
				query.where("m.profile_id = ?", user.profile_id);
				return dbc.execute(query);
			} else {
				return Promise.resolve(false);
			}
		} else {
			return Promise.reject({ message: "Failed to find user." });
		}
	}).then((rows) => {
		if ( rows ) {
			user.genres = rows;
		}

		if ( user.profile_id != null ) {
			let query = internal.query.userInstruments();
			query.where("m.profile_id = ?", user.profile_id);
			return dbc.execute(query);
		} else {
			return Promise.resolve(false);
		}
	}).then((rows) => {
		if ( rows ) {
			user.instruments = rows;
		}

		return Promise.resolve(user);
	});
}

module.exports = users;

let internal = {};
internal.query = {};
internal.query.user = function() {
	let query = dbc.sql.select().fields([
		"u.username",
		"u.email",
		"u.display_name",
		"p.postcode",
		"p.picture",
		"p.background",
		"p.about",
		"p.past_gigs",
		"p.music_experience",
		"p.band_size",
	]).fields({
		"a.name": "age_bracket",
		"abp.name": "preferred_age_bracket",
		"c.name": "commitment_level",
		"g.name": "gender",
		"f.name": "gig_frequency",
		"s.name": "status",
		"t.type_name": "user_type",

		"p.id": "profile_id",
		"u.id": "user_id",
	}).fields([
		"u.type_id",
		"p.age_bracket_id",
		"p.preference_age_bracket_id",
		"p.commitment_level_id",
		"p.gender_id",
		"p.gig_frequency_id",
		"p.status_id",
		"u.type_id",

		"u.account_locked",
		"u.email_verified",
	]).from(
		"ebdb.user", "u"
	).left_join(
		"ebdb.profile", "p",
		"u.id = p.user_id"
	).left_join(
		"ebdb.age_bracket", "a",
		"p.age_bracket_id = a.id"
	).left_join(
		"ebdb.age_bracket", "abp",
		"p.preference_age_bracket_id = abp.id"
	).left_join(
		"ebdb.commitment_level", "c",
		"p.commitment_level_id = c.id"
	).left_join(
		"ebdb.gender", "g",
		"p.gender_id = g.id"
	).left_join(
		"ebdb.gig_frequency", "f",
		"p.gig_frequency_id = f.id"
	).left_join(
		"ebdb.status", "s",
		"p.status_id = s.id"
	).left_join(
		"ebdb.user_type", "t",
		"u.type_id = t.id"
	)

	return query;
};
internal.query.userGenres = function() {
	let query = dbc.sql.select().fields([
		"m.profile_id",
		"m.genre_id",
		"g.name"
	]).from(
		"ebdb.profile_genre_map", "m"
	).left_join(
		"ebdb.genre", "g",
		"m.genre_id = g.id"
	)

	return query;
};
internal.query.userInstruments = function() {
	let query = dbc.sql.select().fields([
		"m.profile_id",
		"m.instrument_id",
		"i.name"
	]).from(
		"ebdb.profile_instrument_map", "m"
	).left_join(
		"ebdb.instrument", "i",
		"m.instrument_id = i.id"
	)

	return query;
};
