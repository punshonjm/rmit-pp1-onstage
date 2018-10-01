const dbc = require("@modules/dbc");
const aaa = require("@modules/aaa");
const mail = require("@modules/mail");
const AWS = require('aws-sdk');
const _ = require("lodash");
const crypto = require("crypto");

var users = {};

users.details = function(user_id) {
	// Get Details for specific user
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

users.register = function(params) {
	let row = {}, profile = {}, pwd = {}, verify = {};

	console.log(params);

	return Promise.resolve().then(() => {
		return aaa.hashPassword(params.password);
	}).then((pwdHash) => {
		pwd.password = pwdHash;

		row.username = params.username;
		row.type_id = (params.type == "band") ? 2 : 3;
		row.email = params.email;
		row.display_name = params.display_name;

		let query = dbc.insert().into("ebdb.user").setFields(row);
		return dbc.execute(query);
	}).then((res) => {
		profile.user_id = res.insertId;
		profile.postcode = params.postcode;
		profile.gender_id = params.gender;
		profile.picture = "";
		profile.background = "";
		profile.about = params.about;
		profile.age_bracket_id = params.age_bracket;
		profile.preference_age_bracket_id = params.preferred_age_bracket;
		profile.past_gigs = params.past_gigs;
		profile.music_experience = params.music_experience;
		profile.commitment_level_id = params.commitment_level;
		profile.gig_frequency_id = params.gig_frequency;
		profile.status_id = params.status;

		if ( ("band_size" in params) ) {
			profile.band_size = params.band_size;
		}

		let query = dbc.insert().into("ebdb.profile").setFields(profile);
		return dbc.execute(query);
	}).then((res) => {
		profile.id = res.insertId;
		pwd.user_id = profile.user_id;

		let query = dbc.insert().into("ebdb.password").setFields(pwd);
		return dbc.execute(query);
	}).then((res) => {
		let rows = [];

		params.genres.map((gnr) => {
			let genre = {}
			genre.profile_id = profile.id;
			genre.genre_id = id_genre_multiple;
			rows.push(genres);
		});

		let query = dbc.insert().into("ebdb.profile_genre_map").setFieldsRows(pwd);
		return dbc.execute(query);
	}).then((res) => {
		let rows = [];

		params.instruments.map((instr) => {
			let instrument = {};
			instrument.profile_id = profile.id;
			instrument.instrument_id = instr;
			rows.push(instrument);
		});

		let query = dbc.insert().into("ebdb.profile_instrument_map").setFieldsRows(pwd);
		return dbc.execute(query);
	}).then((res) => {
		verify.key = crypto.randomBytes(Math.ceil(24 / 2)).toString('hex').slice(0, 24);
		return mail.send.verification(row.email, row.display_name, verify.key);
	}).then((eml) => {
		return aaa.hashPassword(verfiy.key);
	}).then((key) => {
		verify.user_id = profile.user_id;
		verify.key = key;
		verify.expires = moment().add(1, "day").format("YYYY-MM-DD HH:mm:ss");

		let query = dbc.insert().into("ebdb.email_verification").setFieldsRows(pwd);
		return dbc.execute(query);
	}).then((res) => {

		return Promise.resolve();
	})
};

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

AWS.config.update({ region: "ap-southeast-2" });
internal.s3 = new AWS.S3({
	params: { Bucket: 'onstage-storage' }
});

internal.images = {};
internal.images.upload = function(user, image) {
	return Promise.resolve().then(() => {
		var params = {
			 'Key': user,
			 'Body': image
		};

		return Promise.resolve(params);
	}).then((params) => {
		return new Promise(function(resolve, reject) {
			internal.s3.upload(params, function(s3Err, data) {
				if (s3Err) {
					reject(s3Err);
				}

				resolve(data.Location);
			});
		});
	});
};
