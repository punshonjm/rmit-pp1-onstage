const fs = require('fs');
const path = require('path');

const AWS = require('aws-sdk');
const _ = require("lodash");
const crypto = require("crypto");
const CryptoJS = require("crypto-js");
const moment = require("moment");

const dbc = require("@modules/dbc");
const aaa = require("@modules/aaa");
const mail = require("@modules/mail");

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
	let row = {}, profile = {}, pwd = {}, verify = {}, errors = [], files = [];
	let allowedTypes = [ "image/png", "image/jpeg" ];

	return Promise.resolve().then(() => {
		if ( ("profile" in params.files) ) {
			files.push(params.files.profile[0].path);
		}
		if ( ("background" in params.files) ) {
			files.push(params.files.background[0].path);
		}

    	// Begin server side validation
        if (!("username" in params)) errors.push({key: 'username', error: 'Username must not be empty.'});
        if (!("password" in params)) errors.push({key: 'password', error: 'Password must not be empty.'});
        if (!("passwordConfirm" in params)) errors.push({key: 'passwordConfirm', error: 'Password confirm must not be empty.'});
        if (!("email" in params)) errors.push({key: 'email', error: 'Email must not be empty.'});
        if (!("agree" in params)) errors.push({key: 'agree', error: 'You must agree to the terms and conditions.'});

		if ( !/^[a-zA-Z0-9]+[a-zA-Z0-9_.-]*$/.test(params.username) ) {
			errors.push({key: 'username', error: 'Username contains invalid characters.'});
		}

        // Don't continue if there are already errors
        if ( errors.length > 0 ) return Promise.reject({ errorSet: errors });

		if ( params.password !== params.passwordConfirm ) errors.push({key: 'passwordConfirm', error: 'Passwords do not match.'});

		// Check if username is taken
        if ( params.username !== '' ) {
        	let query = internal.query.getUserUsername();
            query.where("u.username = ?", params.username);
            return dbc.execute(query);
        } else {
            errors.push({key: 'username', error: 'Username cannot be empty.'});
            return Promise.reject({ errorSet: errors });
		}
    }).then((result) => {
    	// If records returned then username already taken
    	if (result.length > 0) errors.push({key: 'username', error: 'Username has already been taken. Please enter another.'});

        // Check if email is taken
        if ( params.email !== '' ) {
            let query = internal.query.getUserEmail();
            query.where("u.email = ?", params.email);
            return dbc.execute(query);
        } else {
            errors.push({key: 'email', error: 'Email cannot be empty.'});
            return Promise.reject({ errorSet: errors });
        }
    }).then((result) => {
        // If records returned then email already taken
        if (result.length > 0) errors.push({key: 'email', error: 'Email has already been used.'});

        // Reject if any errors exist
    	if (errors.length > 0) {
			return Promise.reject({ errorSet: errors });
		} else {
			return Promise.resolve();
		}
	}).then(() => {
		if ( ("profile" in params.files) ) {
			let img = params.files.profile[0];

			if ( allowedTypes.includes(img.mimetype) ) {
				return new Promise(function(resolve, reject) {
					fs.readFile(img.path, (error, file) => {
						if ( error ) {
							reject(error);
						}

						let imgName = CryptoJS.MD5(params.username + "_pp").toString();
						imgName += (img.mimetype == "image/png") ? ".png" : ".jpg";
						resolve( internal.images.upload(imgName, file) );
					});
				});
			} else {
				return Promise.reject({ errorSet: [{ key: "profile", message: "Profile image must be a JPEG or PNG." }] });
			}
		} else {
			return Promise.resolve(null);
		}

	}).then((profileLoc) => {
		if ( profileLoc != null ) {
			profile.picture = profileLoc;
		}

		if ( ("background" in params.files) ) {
			let img = params.files.background[0];

			if ( allowedTypes.includes(img.mimetype) ) {
				return new Promise(function(resolve, reject) {
					fs.readFile(img.path, (error, file) => {
						if ( error ) {
							reject(error);
						}

						let imgName = CryptoJS.MD5(params.username + "_bg").toString();
						imgName += (img.mimetype == "image/png") ? ".png" : ".jpg";
						resolve( internal.images.upload(imgName, file) );
					});
				});
			} else {
				return Promise.reject({ errorSet: [{ key: "background", message: "Background image must be a JPEG or PNG." }] });
			}
		} else {
			return Promise.resolve(null);
		}

		return Promise.resolve();
	}).then((bgLoc) => {
		if ( bgLoc != null ) {
			profile.background = bgLoc;
		}

		return aaa.hashPassword(params.password);
	}).then((pwdHash) => {
		pwd.password = pwdHash;
		row.username = params.username;
		row.type_id = (params.type == "band") ? 2 : 3;
		row.email = params.email;
		row.display_name = params.display_name;

		let query = dbc.sql.insert().into("ebdb.user").setFields(row);
		return dbc.execute(query);
	}).then((res) => {
		profile.user_id = res.insertId;
		profile.postcode = params.postcode;
		profile.gender_id = params.gender;
		profile.about = params.about;
		profile.age_bracket_id = params.age_bracket;
		profile.preference_age_bracket_id = params.preferred_age_bracket;
		profile.past_gigs = params.past_gigs;
		profile.music_experience = params.music_experience;
		profile.commitment_level_id = params.commitment_level;
		profile.gig_frequency_id = params.gig_frequency;
		profile.status_id = params.status;
		profile.sql_updated_by = res.insertId;

		if ( ("band_size" in params) ) {
			profile.band_size = params.band_size;
		}

		let query = dbc.sql.insert().into("ebdb.profile").setFields(profile);
		return dbc.execute(query);
	}).then((res) => {
		profile.id = res.insertId;
		pwd.user_id = profile.user_id;

		// Need to self-param query due to password field being stored blob
		let query = { text: "INSERT INTO ebdb.password SET ?", values: pwd };
 		return dbc.execute(query);
	}).then((res) => {
		let genres = [];
		params.genre.split(",").map((gnr) => {
			let genre = {}
			genre.profile_id = profile.id;
			genre.genre_id = gnr;
			genres.push(genre);
		});

		let query = dbc.sql.insert().into("ebdb.profile_genre_map").setFieldsRows(genres);
		return dbc.execute(query);
	}).then((res) => {
		let instruments = [];
		params.instruments.split(",").map((instr) => {
			let instrument = {};
			instrument.profile_id = profile.id;
			instrument.instrument_id = instr;
			instruments.push(instrument);
		});

		let query = dbc.sql.insert().into("ebdb.profile_instrument_map").setFieldsRows(instruments);
		return dbc.execute(query);
	}).then((res) => {
		verify.key = crypto.randomBytes(Math.ceil(24 / 2)).toString('hex').slice(0, 24);
		return mail.send.registration(row.email, row.display_name, verify.key);
	}).then((eml) => {
		return aaa.hashPassword(verify.key);
	}).then((key) => {
		verify.user_id = profile.user_id;
		verify.key = key;
		verify.expires = moment().add(1, "day").format("YYYY-MM-DD HH:mm:ss");

		// Need to self-param query due to key field being stored blob
		let query = { text: "INSERT INTO ebdb.email_verification SET ?", values: verify };
		return dbc.execute(query);
	}).then((res) => {

		let details = {
			username: params.username,
			password: params.password
		};

		return aaa.login(details);
	}).then((user) => {
		if ( files.length > 0 ) files.map((file)  => fs.unlinkSync(file) );
		files = [];

		let stagePass = {
			token: user.token,
			expires: user.expires.clone().format("YYYY-MM-DD HH:mm:ss")
		};

		return Promise.resolve(stagePass);
	}).catch((error) => {
		if ( files.length > 0 ) files.map((file)  => fs.unlinkSync(file) );
		if ( ("user_id" in profile) ) {
			let query = dbc.sql.delete().from("ebdb.user").where("id = ?", profile.user_id);
			dbc.execute(query);
		}

		return Promise.reject(error);
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

internal.query.getUserUsername = function() {
    let query = dbc.sql.select().fields([
        "u.username"
    ]).from(
        "ebdb.user", "u"
    )
    return query;
};
internal.query.getUserEmail = function() {
    let query = dbc.sql.select().fields([
        "u.email"
    ]).from(
        "ebdb.user", "u"
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