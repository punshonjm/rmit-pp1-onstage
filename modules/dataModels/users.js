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
		profile.about = params.aboutMe;
		profile.age_bracket_id = params.age_bracket;

		profile.past_gigs = params.past_gigs;
		profile.music_experience = params.music_experience;
		profile.commitment_level_id = params.commitment_level;
		profile.gig_frequency_id = params.gig_frequency;
		profile.status_id = params.status;
		profile.sql_updated_by = res.insertId;

		if ( params.type == "band" ) {
			profile.band_size = params.band_size;
			profile.members_needed = params.members_needed;
			profile.preference_age_bracket_id = params.preferred_age_bracket;

			profile.required_music_experience = params.required_music_experience;
			profile.required_past_gigs = params.required_past_gigs;
			profile.required_commitment_level_id = params.required_commitment_level;
			profile.required_gig_frequency_id = params.required_gig_frequency;
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
		verify.verification_key = crypto.randomBytes(Math.ceil(24 / 2)).toString('hex').slice(0, 24);
		verify.user_id = profile.user_id;
		verify.expires = moment().add(1, "day").format("YYYY-MM-DD HH:mm:ss");

		return mail.send.registration(row.email, row.display_name, verify.verification_key);
	}).then((eml) => {
		let query = dbc.sql.insert().into("ebdb.email_verification").setFields(verify);
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
		if ( files.length > 0 ) {
			files.map((file)  => fs.unlinkSync(file) );
		}

		if ( ("user_id" in profile) ) {
			let query = dbc.sql.delete().from("ebdb.user").where("id = ?", profile.user_id);
			dbc.execute(query);
		}

		return Promise.reject(error);
	});
};

users.update = function(params) {
	let user = {}, profile = {}, errors = [];

	return Promise.resolve().then(() => {
		if ( "username" in params ) {
			user.username = params.username;
		}

		if ( "email" in params ) {
			// send new verificaiton email
			user.email = params.email;
		}

		// if ( "display_name" in params ) {
		// 	user.display_name = params.display_name;
		// }
		// if ( "gender_id" in params ) {
		// 	profile.gender_id = params.gender;
		// }
		// if ( "status_id" in params ) {
		// 	profile.status_id = params.status;
		// }

		if ( "postcode" in params ) {
			profile.postcode = params.postcode;
		}
		if ( "about" in params ) {
			profile.about = params.about;
		}
		if ( "age_bracket_id" in params ) {
			profile.age_bracket_id = params.age_bracket_id;
		}

		if ( "past_gigs" in params ) {
			profile.past_gigs = params.past_gigs;
		}
		if ( "music_experience" in params ) {
			profile.music_experience = params.music_experience;
		}
		if ( "commitment_level_id" in params ) {
			profile.commitment_level_id = params.commitment_level_id;
		}
		if ( "gig_frequency_id" in params ) {
			profile.gig_frequency_id = params.gig_frequency_id;
		}

		if ( "instagram_user" in params ) {
			profile.instagram_user = params.instagram_user;
		}
		if ( "facebook_user" in params ) {
			profile.facebook_user = params.facebook_user;
		}
		if ( "twitter_user" in params ) {
			profile.twitter_user = params.twitter_user;
		}
		if ( "youtube_user" in params ) {
			profile.youtube_user = params.youtube_user;
		}

		if ( "band_size" in params ) {
			profile.band_size = params.band_size;
		}
		if ( "members_needed" in params ) {
			profile.members_needed = params.members_needed;
		}
		if ( "preference_age_bracket_id" in params ) {
			profile.preference_age_bracket_id = params.preferred_age_bracket_id;
		}

		if ( "required_music_experience" in params ) {
			profile.required_music_experience = params.required_music_experience;
		}
		if ( "required_past_gigs" in params ) {
			profile.required_past_gigs = params.required_past_gigs;
		}
		if ( "required_commitment_level_id" in params ) {
			profile.required_commitment_level_id = params.required_commitment_level_id;
		}
		if ( "required_gig_frequency_id" in params ) {
			profile.required_gig_frequency_id = params.required_gig_frequency_id;
		}

		if ( errors.length > 0 ) {
			return Promise.reject({ errorSet: errors });
		} else {
			return Promise.resolve();
		}
	}).then(() => {
		// Check if username is taken
		if ( "username" in params ) {
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
		if ( "email" in params ) {
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
		if ( "genres" in params ) {
			return Promise.resolve().then(() => {
				let query = dbc.sql.delete().from("ebdb.profile_genre_map").where("profile_id = ?", params.user.profile_id);
				return dbc.execute(query);
			}).then(() => {
				let genres = [];
				params.genre.split(",").map((gnr) => {
					let genre = {}
					genre.profile_id = params.user.profile_id;
					genre.genre_id = gnr;
					genres.push(genre);
				});

				profile.genres = genres;

				let query = dbc.sql.insert().into("ebdb.profile_genre_map").setFieldsRows(genres);
				return dbc.execute(query);
			});
		} else {
			return Promise.resolve();
		}
	}).then((res) => {
		if ( "instruments" in params ) {
			return Promise.resolve().then(() => {
				let query = dbc.sql.delete().from("ebdb.profile_instrument_map").where("profile_id = ?", params.user.profile_id);
				return dbc.execute(query);
			}).then(() => {
				let instruments = [];
				params.instruments.split(",").map((instr) => {
					let instrument = {};
					instrument.profile_id = params.user.profile_id;
					instrument.instrument_id = instr;
					instruments.push(instrument);
				});

				profile.instruments = instruments;

				let query = dbc.sql.insert().into("ebdb.profile_instrument_map").setFieldsRows(instruments);
				return dbc.execute(query);
			});
		} else {
			return Promise.resolve();
		}
	}).then(() => {
		if ( Object.keys(user).length > 0) {
			let query = dbc.sql.update().table("ebdb.user").setFields(user).where("id = ?", params.user.user_id);
			return dbc.execute(query);
		} else {
			return Promise.resolve();
		}
	}).then(() => {
		if ( Object.keys(profile).length > 0) {
			let query = dbc.sql.update().table("ebdb.profile").setFields(profile).where("user_id = ?", params.user.user_id);
			return dbc.execute(query);
		} else {
			return Promise.resolve();
		}
	}).then((res) => {
		return Promise.resolve({ message: "Successfully updated your profile!", user: user, profile: profile });
	});
}

users.new_verification = function(user) {
	let verify = {};

	return Promise.resolve().then(() => {
		return users.details(user.user_id);
	}).then((row) => {
		verify.verification_key = crypto.randomBytes(Math.ceil(24 / 2)).toString('hex').slice(0, 24);
		verify.user_id = user.user_id;
		verify.expires = moment().add(1, "day").format("YYYY-MM-DD HH:mm:ss");

		return mail.send.registration(row.email, row.display_name, verify.verification_key);
	}).then((res) => {
		let query = dbc.sql.delete().from("ebdb.email_verification").where("user_id = ?", user.user_id);
		return dbc.execute(query);
	}).then((eml) => {
		let query = dbc.sql.insert().into("ebdb.email_verification").setFields(verify);
		return dbc.execute(query);
	}).then((res) => {
		return Promise.resolve();
	});
};

users.change_password = function(params) {
	return Promise.resolve().then(() => {
		var errors = [];

		if ( params.current == "" ) errors.push({ key: 'current_password', error: 'Current password must not be empty.'});
        if ( params.password == "" ) errors.push({ key: 'password_new', error: 'New password must not be empty.'});
        if ( params.passwordConfirm == "" ) errors.push({ key: 'password_confirm_new', error: 'New password confirm retyped must not be empty.'});

		if ( params.password !== params.passwordConfirm ) errors.push({ key: 'password_confirm_new', error: 'Passwords do not match.'});
		if ( params.password == params.current ) errors.push({ key: 'password_new', error: "You can't use the same password." });

		if ( errors.length > 0 ) {
			return Promise.reject({ errorSet: errors });
		} else {
			return Promise.resolve();
		}
	}).then(() => {
		return aaa.login({ username: params.user.username, password: params.current });
	}).then(() => {
		return aaa.hashPassword(params.password);
	}).then((pwdHash) => {
		let pwd = {};
		pwd.password = pwdHash;
		pwd.user_id = params.user.user_id;

		// Need to self-param query due to password field being stored blob
		let query = { text: "INSERT INTO ebdb.password SET ?", values: pwd };
		return dbc.execute(query);
	}).then((res) => {
		let query = dbc.sql.update().table("ebdb.password").setFields({
			password_valid: 0
		}).where(dbc.sql.expr()
			.and("id <> ?", res.insertId)
			.and("user_id = ?", params.user.user_id)
		);

		return dbc.execute(query);
	}).then((res) => {
		return Promise.resolve({ message: "Successfully update password!" });
	}).catch((error) => {
		if ( "authenticationError" in error ) {
			error.errorSet = [ { key: "current_password", message: "Please enter your current password correctly" } ];
		}

		return Promise.reject(error);
	});
};

users.set_password = function(params) {
	let row = {};

	return Promise.resolve().then(() => {
		var errors = [];

		if ( params.current == "" ) errors.push({ key: 'current_password', error: 'Current password must not be empty.'});
        if ( params.password == "" ) errors.push({ key: 'password_new', error: 'New password must not be empty.'});
        if ( params.passwordConfirm == "" ) errors.push({ key: 'password_confirm_new', error: 'New password confirm retyped must not be empty.'});

		if ( params.password !== params.passwordConfirm ) errors.push({ key: 'password_confirm_new', error: 'Passwords do not match.'});
		if ( params.password == params.current ) errors.push({ key: 'password_new', error: "You can't use the same password." });

		if ( errors.length > 0 ) {
			return Promise.reject({ errorSet: errors });
		} else {
			return Promise.resolve();
		}
	}).then(() => {
		let query = dbc.sql.select().fields([
			"reset_token", "user_id", "id"
		]).from(
			"ebdb.password_reset"
		).where(dbc.sql.expr()
			.and("user_id = ?", params.user.user_id)
			.and("reset_used = 1")
			.and("reset_expires > ?", moment().subtract(10, "minutes").format("YYYY-MM-DD HH:mm:ss") )
		);

		return dbc.getRow(query);
	}).then((user) => {
		if ( !user ) {
			return Promise.reject({ failed: true, message: "Invalid request" });
		} else {
			row.reset_id = user.id;
			return aaa.checkPassword(params.current, user.reset_token);
		}
	}).then((pwdVerified) => {
		if ( pwdVerified ) {
			return aaa.hashPassword(params.password);
		} else {
			return Promise.reject({ failed: true, message: "Invalid token" });
		}
	}).then((pwdHash) => {
		let pwd = {};
		pwd.password = pwdHash;
		pwd.user_id = params.user.user_id;

		// Need to self-param query due to password field being stored blob
		let query = { text: "INSERT INTO ebdb.password SET ?", values: pwd };
		return dbc.execute(query);
	}).then((res) => {
		let query = dbc.sql.update().table("ebdb.password").setFields({
			password_valid: 0
		}).where(dbc.sql.expr()
			.and("id <> ?", res.insertId)
			.and("user_id = ?", params.user.user_id)
		);

		return dbc.execute(query);
	}).then((res) => {
		let query = dbc.sql.update().table("ebdb.password_reset").set("reset_used = 2").where("id = ?", row.reset_id);
		return dbc.execute(query);
	}).then((res) => {
		return Promise.resolve({ message: "Successfully set password!" });
	}).catch((error) => {
		if ( "authenticationError" in error ) {
			error.errorSet = [ { key: "current_password", message: "Please enter your current password correctly" } ];
		}

		return Promise.reject(error);
	});
};

users.verifyEmail = function(key) {
	let verifyRow = {};
	return Promise.resolve().then(() => {
		if ( key != null && key != "" ) {
			let query = dbc.sql.select().from(
				"ebdb.email_verification",
				"e"
			).where("e.verification_key = ?", key);

			return dbc.getRow(query);
		} else {
			return Promise.reject({ message: "That doesn't seem to be for anything. Are you sure you copied the link correctly?" });
		}
	}).then((row) => {
		if ( row ) {
			if ( moment(row.expires, "YYYY-MM-DD HH:mm:ss").isAfter( moment() ) ) {
				verifyRow = _.cloneDeep(row);
				return Promise.resolve();
			} else {
				return Promise.reject({ message: "Sorry that link has expired! You can send a new one from your profile page." });
			}
		} else {
			return Promise.reject({ message: "That doesn't seem to be for anything. Are you sure you copied the link correctly?" });
		}
	}).then(() => {
		let query = dbc.sql.update().table(
			"ebdb.user"
		).setFields({
			email_verified: 1
		}).where("id = ?", verifyRow.user_id);

		return dbc.execute(query);
	}).then((res) => {
		let query = dbc.sql.delete().from(
			"ebdb.email_verification"
		).where("id = ?", verifyRow.id);

		return dbc.execute(query);
	}).then((res) => {
		return Promise.resolve({ message: "Successfully verified your email. Enjoy On Stage!" });
	});
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
		"p.required_music_experience",
		"p.required_past_gigs",
		"p.members_needed",
		"p.instagram_user",
		"p.twitter_user",
		"p.facebook_user",
		"p.youtube_user"
	]).fields({
		"a.name": "age_bracket",
		"abp.name": "preferred_age_bracket",
		"c.name": "commitment_level",
		"rc.name": "required_commitment_level",
		"g.name": "gender",
		"f.name": "gig_frequency",
		"rf.name": "required_gig_frequency",
		"s.name": "status",
		"t.type_name": "user_type",
		"p.id": "profile_id",
		"u.id": "user_id",
	}).fields([
		"u.type_id",
		"p.age_bracket_id",
		"p.preference_age_bracket_id",
		"p.commitment_level_id",
		"p.required_commitment_level_id",
		"p.gender_id",
		"p.gig_frequency_id",
		"p.required_gig_frequency_id",
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
		"ebdb.commitment_level", "rc",
		"p.required_commitment_level_id = rc.id"
	).left_join(
		"ebdb.gender", "g",
		"p.gender_id = g.id"
	).left_join(
		"ebdb.gig_frequency", "f",
		"p.gig_frequency_id = f.id"
	).left_join(
		"ebdb.gig_frequency", "rf",
		"p.required_gig_frequency_id = rf.id"
	).left_join(
		"ebdb.status", "s",
		"p.status_id = s.id"
	).left_join(
		"ebdb.user_type", "t",
		"u.type_id = t.id"
	).where("u.type_id <> 1");

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
				} else {
					resolve(data.Location);
				}
			});
		});
	});
};
