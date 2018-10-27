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

const model_list = require("@modules/dataModels/list");

var users = {};

users.details = function (user_id) {
	// Get Details for specific user
	var user = {};

	return Promise.resolve().then(() => {
		if (user_id != null) {
			let query = internal.query.user();
			query.where(dbc.sql.expr()
				.or("u.id = ?", user_id)
				.or("u.username = ?", user_id)
				.or("p.id = ?", user_id)
			);

			return dbc.getRow(query);
		} else {
			return Promise.reject({message: "Provided an invalid ID or username."});
		}
	}).then((row) => {
		if (row) {
			user = _.cloneDeep(row);

			if (user.profile_id != null) {
				let query = internal.query.userGenres();
				query.where("m.profile_id = ?", user.profile_id);
				return dbc.execute(query);
			} else {
				return Promise.resolve(false);
			}
		} else {
			return Promise.reject({message: "Failed to find user."});
		}
	}).then((rows) => {
		if (rows) {
			user.genres = rows;
		}

		if (user.profile_id != null) {
			let query = internal.query.userInstruments();
			query.where("m.profile_id = ?", user.profile_id);
			return dbc.execute(query);
		} else {
			return Promise.resolve(false);
		}
	}).then((rows) => {
		if (rows) {
			user.instruments = rows;
		}

		user.__class = "userObject";
		return Promise.resolve(user);
	});
};

users.register = function (params) {
	let row = {}, profile = {}, pwd = {}, verify = {}, errors = [], files = [];
	let allowedTypes = ["image/png", "image/jpeg"];

	return Promise.resolve().then(() => {
		if (("files" in params) && ("profile" in params.files)) {
			files.push(params.files.profile[0].path);
		}
		if (("files" in params) && ("background" in params.files)) {
			files.push(params.files.background[0].path);
		}

		// Begin server side validation
		if (!("username" in params)) errors.push({key: 'username', error: 'Username must not be empty.'});
		if (!("password" in params)) errors.push({key: 'password', error: 'Password must not be empty.'});
		if (!("passwordConfirm" in params)) errors.push({
			key: 'passwordConfirm',
			error: 'Password confirm must not be empty.'
		});
		if (!("email" in params)) errors.push({key: 'email', error: 'Email must not be empty.'});
		if (!("agree" in params)) errors.push({key: 'agree', error: 'You must agree to the terms and conditions.'});

		if (!/^[a-zA-Z0-9]+[a-zA-Z0-9_.-]*$/.test(params.username)) {
			errors.push({key: 'username', error: 'Username contains invalid characters.'});
		}

		// Don't continue if there are already errors
		if (errors.length > 0) return Promise.reject({errorSet: errors});

		if (params.password !== params.passwordConfirm) errors.push({
			key: 'passwordConfirm',
			error: 'Passwords do not match.'
		});

		// Check if username is taken
		if (params.username !== '') {
			let query = internal.query.getUserUsername();
			query.where("u.username = ?", params.username);
			return dbc.execute(query);
		} else {
			errors.push({key: 'username', error: 'Username cannot be empty.'});
			return Promise.reject({errorSet: errors});
		}
	}).then((result) => {
		// If records returned then username already taken
		if (result.length > 0) errors.push({
			key: 'username',
			error: 'Username has already been taken. Please enter another.'
		});

		// Check if email is taken
		if (params.email !== '') {
			let query = internal.query.getUserEmail();
			query.where("u.email = ?", params.email);
			return dbc.execute(query);
		} else {
			errors.push({key: 'email', error: 'Email cannot be empty.'});
			return Promise.reject({errorSet: errors});
		}
	}).then((result) => {
		// If records returned then email already taken
		if (result.length > 0) errors.push({key: 'email', error: 'Email has already been used.'});

		// Reject if any errors exist
		if (errors.length > 0) {
			return Promise.reject({errorSet: errors});
		} else {
			return Promise.resolve();
		}
	}).then(() => {
		if (("files" in params) && ("profile" in params.files)) {
			let img = params.files.profile[0];

			if (allowedTypes.includes(img.mimetype)) {
				return new Promise(function (resolve, reject) {
					fs.readFile(img.path, (error, file) => {
						if (error) {
							reject(error);
						}

						let imgName = CryptoJS.MD5(params.username + "_pp").toString();
						imgName += (img.mimetype == "image/png") ? ".png" : ".jpg";
						resolve(internal.images.upload(imgName, file));
					});
				});
			} else {
				return Promise.reject({errorSet: [{key: "profile", message: "Profile image must be a JPEG or PNG."}]});
			}
		} else {
			return Promise.resolve(null);
		}

	}).then((profileLoc) => {
		if (profileLoc != null) {
			profile.picture = profileLoc;
		}

		if (("files" in params) && ("background" in params.files)) {
			let img = params.files.background[0];

			if (allowedTypes.includes(img.mimetype)) {
				return new Promise(function (resolve, reject) {
					fs.readFile(img.path, (error, file) => {
						if (error) {
							reject(error);
						}

						let imgName = CryptoJS.MD5(params.username + "_bg").toString();
						imgName += (img.mimetype == "image/png") ? ".png" : ".jpg";
						resolve(internal.images.upload(imgName, file));
					});
				});
			} else {
				return Promise.reject({
					errorSet: [{
						key: "background",
						message: "Background image must be a JPEG or PNG."
					}]
				});
			}
		} else {
			return Promise.resolve(null);
		}

		return Promise.resolve();
	}).then((bgLoc) => {
		if (bgLoc != null) {
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
		profile.postcode_id = params.postcode;
		profile.gender_id = params.gender;
		profile.about = params.aboutMe;
		profile.age_bracket_id = params.age_bracket;

		profile.past_gig_id = params.past_gigs;
		profile.music_experience_id = params.music_experience;
		profile.commitment_level_id = params.commitment_level;
		profile.gig_frequency_id = params.gig_frequency;
		profile.status_id = params.status;
		profile.sql_updated_by = res.insertId;

		if (params.type == "band") {
			profile.band_size = params.band_size;
			profile.members_needed = params.members_needed;
			profile.preference_age_bracket_id = params.preferred_age_bracket;
			profile.required_music_experience_id = params.required_music_experience;
			profile.required_past_gig_id = params.required_past_gigs;
			profile.required_commitment_level_id = params.required_commitment_level;
			profile.required_gig_frequency_id = params.required_gig_frequency;
		}

		let query = dbc.sql.insert().into("ebdb.profile").setFields(profile);
		return dbc.execute(query);
	}).then((res) => {
		profile.id = res.insertId;
		pwd.user_id = profile.user_id;

		// Need to self-param query due to password field being stored blob
		let query = {text: "INSERT INTO ebdb.password SET ?", values: pwd};
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
		return internal.verificationEmail(profile.user_id, row.email, row.display_name);
	}).then((res) => {
		let details = {
			username: params.username,
			password: params.password
		};

		return aaa.login(details);
	}).then((user) => {
		if (files.length > 0) files.map((file) => fs.unlinkSync(file));
		files = [];

		let stagePass = {
			token: user.token,
			expires: user.expires.clone().format("YYYY-MM-DD HH:mm:ss")
		};

		return Promise.resolve(stagePass);
	}).catch((error) => {
		if (files.length > 0) {
			files.map((file) => fs.unlinkSync(file));
		}

		if (("user_id" in profile)) {
			let query = dbc.sql.delete().from("ebdb.user").where("id = ?", profile.user_id);
			dbc.execute(query);
		}

		return Promise.reject(error);
	});
};

users.update = function (params) {
	let user = {}, profile = {}, errors = [], files = [];
	let allowedTypes = ["image/png", "image/jpeg"];

	return Promise.resolve().then(() => {
		if (("files" in params) && ("profile" in params.files)) {
			files.push(params.files.profile[0].path);
			profile.picture = "/";
		}
		if (("files" in params) && ("background" in params.files)) {
			files.push(params.files.background[0].path);
			profile.background = "/";
		}

		if ("username" in params) {
			if (params.user.username != params.username) {
				user.username = params.username;
			} else {
				delete params.username;
			}
		}

		if ("email" in params) {
			if (params.user.email != params.email) {
				user.email = params.email;
			} else {
				delete params.email;
			}
		}

		if ("display_name" in params) {
			user.display_name = params.display_name;
		}

		if ("gender" in params) {
			profile.gender_id = params.gender;
		}

		if ("status" in params) {
			profile.status_id = params.status;
		}

		if ("postcode_id" in params) {
			profile.postcode_id = params.postcode_id;
		}
		if ("about" in params) {
			profile.about = params.about;
		}
		if ("age_bracket_id" in params) {
			profile.age_bracket_id = params.age_bracket_id;
		}

		if ("past_gig_id" in params) {
			profile.past_gig_id = params.past_gig_id;
		}
		if ("music_experience_id" in params) {
			profile.music_experience_id = params.music_experience_id;
		}
		if ("commitment_level_id" in params) {
			profile.commitment_level_id = params.commitment_level_id;
		}
		if ("gig_frequency_id" in params) {
			profile.gig_frequency_id = params.gig_frequency_id;
		}

		if ("instagram_user" in params) {
			profile.instagram_user = params.instagram_user;
		}
		if ("facebook_user" in params) {
			profile.facebook_user = params.facebook_user;
		}
		if ("twitter_user" in params) {
			profile.twitter_user = params.twitter_user;
		}
		if ("youtube_user" in params) {
			profile.youtube_user = params.youtube_user;
		}
		if ("band_size" in params) {
			profile.band_size = params.band_size;
		}
		if ("members_needed" in params) {
			profile.members_needed = params.members_needed;
		}
		if ("preference_age_bracket_id" in params) {
			profile.preference_age_bracket_id = (params.preference_age_bracket_id == '') ? null : params.preference_age_bracket_id;
		}
		if ("required_music_experience_id" in params) {
			profile.required_music_experience_id = (params.required_music_experience_id == '') ? null : params.required_music_experience_id;
		}
		if ("required_past_gig_id" in params) {
			profile.required_past_gig_id = (params.required_past_gig_id == '') ? null : params.required_past_gig_id;
		}
		if ("required_commitment_level_id" in params) {
			profile.required_commitment_level_id = (params.required_commitment_level_id == '') ? null : params.required_commitment_level_id;
		}
		if ("required_gig_frequency_id" in params) {
			profile.required_gig_frequency_id = (params.required_gig_frequency_id == '') ? null : params.required_gig_frequency_id;
		}

		if ("remove_picture" in params) {
			profile.picture = null;
		}

		if ("remove_background" in params) {
			profile.background = null;
		}

		if (errors.length > 0) {
			return Promise.reject({errorSet: errors});
		} else if (Object.keys(user).length == 0 && Object.keys(profile).length == 0 && Object.keys(params.instruments).length == 0 && Object.keys(params.genres).length == 0) {
			return Promise.reject({message: "Nothing to update!"});
		} else {
			return Promise.resolve();
		}
	}).then(() => {
		// Check if username is taken
		if ("username" in params) {

			// Only validate if attempting to update
			if (params.username == "") {
				errors.push({key: 'username', error: 'Username cannot be empty.'});
				return Promise.reject({errorSet: errors});
			}

			let query = internal.query.getUserUsername();
			query.where("u.username = ?", params.username);
			return dbc.execute(query);
		} else {
			return Promise.resolve();
		}
	}).then((result) => {
		// Check for result (attempting to update)
		if (result != null) {
			// If records returned then username already taken
			if (result.length > 0) errors.push({
				key: 'username',
				error: 'Username has already been taken. Please enter another.'
			});
		}

		// Check if email is taken
		if ("email" in params) {

			// Only validate if attempting to update
			if (params.email == "") {
				errors.push({key: 'email', error: 'Email cannot be empty.'});
				return Promise.reject({errorSet: errors});
			}

			let query = internal.query.getUserEmail();
			query.where("u.email = ?", params.email);
			return dbc.execute(query);
		} else {
			return Promise.resolve();
		}
	}).then((result) => {
		// Check for result (attempting to update)
		if (result != null) {
			// If records returned then email already taken
			if (result.length > 0) errors.push({key: 'email', error: 'Email has already been used.'});
		}

		// Reject if any errors exist
		if (errors.length > 0) {
			return Promise.reject({errorSet: errors});
		} else {
			return Promise.resolve();
		}
	}).then(() => {
		if ("genres" in params) {
			return Promise.resolve().then(() => {
				let query = dbc.sql.delete().from("ebdb.profile_genre_map").where("profile_id = ?", params.user.profile_id);
				return dbc.execute(query);
			}).then(() => {
				let genres = [];

				params.genres.map((gnr) => {
					let genre = {}
					genre.profile_id = params.user.profile_id;
					genre.genre_id = gnr;
					genres.push(genre);
				});

				params.genres = genres;

				let query = dbc.sql.insert().into("ebdb.profile_genre_map").setFieldsRows(genres);
				return dbc.execute(query);
			});
		} else {
			return Promise.resolve();
		}
	}).then((res) => {
		if ("instruments" in params) {
			return Promise.resolve().then(() => {
				let query = dbc.sql.delete().from("ebdb.profile_instrument_map").where("profile_id = ?", params.user.profile_id);
				return dbc.execute(query);
			}).then(() => {
				let instruments = [];
				params.instruments.map((instr) => {
					let instrument = {};
					instrument.profile_id = params.user.profile_id;
					instrument.instrument_id = instr;
					instruments.push(instrument);
				});

				params.instruments = instruments;

				let query = dbc.sql.insert().into("ebdb.profile_instrument_map").setFieldsRows(instruments);
				return dbc.execute(query);
			});
		} else {
			return Promise.resolve();
		}
	}).then(() => {
		return users.details(params.user.profile_id);
	}).then((userDetails) => {
		if (!("username" in params)) {
			params.username = userDetails.username;
		}

		return Promise.resolve();
	}).then(() => {
		if (("files" in params) && ("profile" in params.files)) {
			let img = params.files.profile[0];

			if (allowedTypes.includes(img.mimetype)) {
				return new Promise(function (resolve, reject) {
					fs.readFile(img.path, (error, file) => {
						if (error) {
							reject(error);
						}

						let imgName = CryptoJS.MD5(params.username + "_pp").toString();
						imgName += (img.mimetype == "image/png") ? ".png" : ".jpg";
						resolve(internal.images.upload(imgName, file));
					});
				});
			} else {
				return Promise.reject({message: "Profile image must be a JPEG or PNG."});
			}
		} else {
			return Promise.resolve(null);
		}

	}).then((profileLoc) => {
		if (profileLoc != null) {
			profile.picture = profileLoc;
		}

		if (("files" in params) && ("background" in params.files)) {
			let img = params.files.background[0];

			if (allowedTypes.includes(img.mimetype)) {
				return new Promise(function (resolve, reject) {
					fs.readFile(img.path, (error, file) => {
						if (error) {
							reject(error);
						}

						let imgName = CryptoJS.MD5(params.username + "_bg").toString();
						imgName += (img.mimetype == "image/png") ? ".png" : ".jpg";
						resolve(internal.images.upload(imgName, file));
					});
				});
			} else {
				return Promise.reject({message: "Background image must be a JPEG or PNG."});
			}
		} else {
			return Promise.resolve(null);
		}

		return Promise.resolve();
	}).then((bgLoc) => {
		if (bgLoc != null) {
			profile.background = bgLoc;
		}

		if (Object.keys(user).length > 0) {
			let query = dbc.sql.update().table("ebdb.user").setFields(user).where("id = ?", params.user.user_id);
			return dbc.execute(query);
		} else {
			return Promise.resolve();
		}
	}).then(() => {
		if (Object.keys(profile).length > 0) {
			let query = dbc.sql.update().table("ebdb.profile").setFields(profile).where("user_id = ?", params.user.user_id);
			return dbc.execute(query);
		} else {
			return Promise.resolve();
		}
	}).then(() => {
		if (("email" in params) && params.user.email != params.email) {
			return internal.verificationEmail(params.user.user_id, params.email, params.user.display_name, "newEmail");
		} else {
			return Promise.resolve();
		}
	}).then((res) => {
		if (files.length > 0) files.map((file) => fs.unlinkSync(file));
		files = [];

		if ("instruments" in params) {
			profile.instruments = params.instruments;
		}
		if ("genres" in params) {
			profile.genres = params.genres;
		}

		return Promise.resolve({message: "Successfully updated your profile!", user: user, profile: profile});
	}).catch((error) => {
		if (files.length > 0) {
			files.map((file) => fs.unlinkSync(file));
		}

		return Promise.reject(error);
	})
}

users.new_verification = function (user) {
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

users.change_password = function (params) {
	return Promise.resolve().then(() => {
		var errors = [];

		if (params.current == "") errors.push({key: 'current_password', error: 'Current password must not be empty.'});
		if (params.password == "") errors.push({key: 'password_new', error: 'New password must not be empty.'});
		if (params.passwordConfirm == "") errors.push({
			key: 'password_confirm_new',
			error: 'New password confirm retyped must not be empty.'
		});

		if (params.password !== params.passwordConfirm) errors.push({
			key: 'password_confirm_new',
			error: 'Passwords do not match.'
		});
		if (params.password == params.current) errors.push({
			key: 'password_new',
			error: "You can't use the same password."
		});

		if (errors.length > 0) {
			return Promise.reject({errorSet: errors});
		} else {
			return Promise.resolve();
		}
	}).then(() => {
		return aaa.login({username: params.user.username, password: params.current});
	}).then(() => {
		return aaa.hashPassword(params.password);
	}).then((pwdHash) => {
		let pwd = {};
		pwd.password = pwdHash;
		pwd.user_id = params.user.user_id;

		// Need to self-param query due to password field being stored blob
		let query = {text: "INSERT INTO ebdb.password SET ?", values: pwd};
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
		return Promise.resolve({message: "Successfully update password!"});
	}).catch((error) => {
		if ("authenticationError" in error) {
			error.errorSet = [{key: "current_password", message: "Please enter your current password correctly"}];
		}

		return Promise.reject(error);
	});
};

users.set_password = function (params) {
	let row = {};

	return Promise.resolve().then(() => {
		var errors = [];

		if (params.current == "") errors.push({key: 'current_password', error: 'Current password must not be empty.'});
		if (params.password == "") errors.push({key: 'password_new', error: 'New password must not be empty.'});
		if (params.passwordConfirm == "") errors.push({
			key: 'password_confirm_new',
			error: 'New password confirm retyped must not be empty.'
		});

		if (params.password !== params.passwordConfirm) errors.push({
			key: 'password_confirm_new',
			error: 'Passwords do not match.'
		});
		if (params.password == params.current) errors.push({
			key: 'password_new',
			error: "You can't use the same password."
		});

		if (errors.length > 0) {
			return Promise.reject({errorSet: errors});
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
			.and("reset_expires > ?", moment().subtract(10, "minutes").format("YYYY-MM-DD HH:mm:ss"))
		);

		return dbc.getRow(query);
	}).then((user) => {
		if (!user) {
			return Promise.reject({failed: true, message: "Invalid request"});
		} else {
			row.reset_id = user.id;
			return aaa.checkPassword(params.current, user.reset_token);
		}
	}).then((pwdVerified) => {
		if (pwdVerified) {
			return aaa.hashPassword(params.password);
		} else {
			return Promise.reject({failed: true, message: "Invalid token"});
		}
	}).then((pwdHash) => {
		let pwd = {};
		pwd.password = pwdHash;
		pwd.user_id = params.user.user_id;

		// Need to self-param query due to password field being stored blob
		let query = {text: "INSERT INTO ebdb.password SET ?", values: pwd};
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
		return Promise.resolve({message: "Successfully set password!"});
	}).catch((error) => {
		if ("authenticationError" in error) {
			error.errorSet = [{key: "current_password", message: "Please enter your current password correctly"}];
		}

		return Promise.reject(error);
	});
};

users.verifyEmail = function (key) {
	let verifyRow = {};
	return Promise.resolve().then(() => {
		if (key != null && key != "") {
			let query = dbc.sql.select().from(
				"ebdb.email_verification",
				"e"
			).where("e.verification_key = ?", key);

			return dbc.getRow(query);
		} else {
			return Promise.reject({message: "That doesn't seem to be for anything. Are you sure you copied the link correctly?"});
		}
	}).then((row) => {
		if (row) {
			if (moment(row.expires, "YYYY-MM-DD HH:mm:ss").isAfter(moment())) {
				verifyRow = _.cloneDeep(row);
				return Promise.resolve();
			} else {
				return Promise.reject({message: "Sorry that link has expired! You can send a new one from your profile page."});
			}
		} else {
			return Promise.reject({message: "That doesn't seem to be for anything. Are you sure you copied the link correctly?"});
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
		return Promise.resolve({message: "Successfully verified your email. Enjoy On Stage!"});
	});
};

users.search = function (params) {
	let ids = {};
	let total = 0;

	// Pagination settings
	if (!("user" in params)) {
		if (!("page" in params) || (params["page"] > 200 || params["per_page"] < 1)) params.page = 1;
		if (!("per_page" in params) || (params["per_page"] > 100 || params["per_page"] < 1)) params.per_page = 8;
	}

	return Promise.resolve().then(() => {
		// Get list of postcodes within search radius
		if (("postcode_id" in params) && ("postcode_radius" in params)) {
			return model_list.postcode.match(params.postcode_id, params.postcode_radius);
		} else {
			return Promise.resolve([]);
		}
	}).then((postcode_list) => {
		if (postcode_list.length > 0) params.postcode_list = postcode_list;

		if (("instruments" in params) && (typeof params.instruments == typeof "String")) params.instruments = params.instruments.split(",");
		if (("genres" in params) && (typeof params.genres == typeof "String")) params.genres = params.genres.split(",");

		if (("instruments" in params) && (typeof params.instruments[0] == typeof {})) params.instruments = params.instruments.map(i => i.instrument_id);
		if (("genres" in params) && (typeof params.genres[0] == typeof {})) params.genres = params.genres.map(g => g.genre_id);

		ids.st = (("searchType" in params)) ? params.searchType : "and";

		if (("genres" in params) && params.genres.length > 0) {
			let query = internal.query.userGenres();
			query.where("genre_id IN ?", params.genres);

			// Limit based on postcode list if exists
			if (("postcode_list" in params)) {
				query.where("p.postcode_id IN ?", params.postcode_list);
			}

			return dbc.execute(query);
		} else {
			return Promise.resolve([]);
		}
	}).then((genreUsers) => {
		if (genreUsers.length > 0) {
			ids.genre = genreUsers.map(g => g.user_id);
		}

		if (("instruments" in params) && params.instruments.length > 0) {
			let query = internal.query.userInstruments();
			query.where("instrument_id IN ?", params.instruments);

			// Limit based on postcode list if exists
			if (("postcode_list" in params)) {
				query.where("p.postcode_id IN ?", params.postcode_list);
			}

			return dbc.execute(query);
		} else {
			return Promise.resolve([]);
		}
	}).then((instrumentUsers) => {
		if (instrumentUsers.length > 0) {
			ids.instrument = instrumentUsers.map(i => i.user_id);
		}

		let query = internal.query.user();
		let expr = dbc.sql.expr();
		if (("instrument" in ids)) {
			expr[ids.st]("u.id IN ?", ids.instrument);
		}
		if (("genre" in ids)) {
			expr[ids.st]("u.id IN ?", ids.genre);
		}

		if (("user" in params)) {
			// For matches ignore same user type
			query.where("u.type_id <> ?", params.user.type_id);
			query.where("u.id <> ?", params.user.user_id);
		} else if (("type_id" in params)) {
			// Normal search criteria
			if (params.type_id == 2 || params.type_id == 3) {
				query.where("u.type_id = ?", params.type_id);
			}
		}

		if (("age_bracket_id" in params)) {
			expr[ids.st]("p.age_bracket_id = ?", params.age_bracket_id);
		}
		if (("preference_age_bracket_id" in params)) {
			expr[ids.st]("p.preference_age_bracket_id = ?", params.preference_age_bracket_id);
		}
		if (("commitment_level_id" in params)) {
			expr[ids.st]("p.commitment_level_id = ?", params.commitment_level_id);
		}
		if (("required_commitment_level_id" in params)) {
			expr[ids.st]("p.required_commitment_level_id = ?", params.required_commitment_level_id);
		}
		if (("gender_id" in params)) {
			expr[ids.st]("p.gender_id = ?", params.gender_id);
		}
		if (("gig_frequency_id" in params)) {
			expr[ids.st]("p.gig_frequency_id = ?", params.gig_frequency_id);
		}
		if (("required_gig_frequency_id" in params)) {
			expr[ids.st]("p.required_gig_frequency_id = ?", params.required_gig_frequency_id);
		}
		if (("past_gig_id" in params)) {
			expr[ids.st]("p.past_gig_id = ?", params.past_gig_id);
		}
		if (("required_past_gig_id" in params)) {
			expr[ids.st]("p.required_past_gig_id = ?", params.required_past_gig_id);
		}
		if (("music_experience_id" in params)) {
			expr[ids.st]("p.music_experience_id = ?", params.music_experience_id);
		}
		if (("required_music_experience_id" in params)) {
			expr[ids.st]("p.required_music_experience_id = ?", params.required_music_experience_id);
		}

		// Limit based on postcode list if exists
		if (("postcode_list" in params)) {
			query.where("p.postcode_id IN ?", params.postcode_list);
		}

		// Only find users who are searching
		query.where(dbc.sql.expr()
			.and("p.status_id = ?", 1)
			.and("u.email_verified = ?", 1)
			.and("u.account_locked = ?", 0)
		);

		// Add searched parameters
		query.where(expr);

		if (("limit" in params)) {
			query.limit(params.limit);
		}

		return dbc.execute(query);
	}).then((rows) => {

		// ***** Pagination *****
		if (("page" in params) && ("per_page" in params)) {
			// Total number of records
			total = rows.length;
			if (rows.length > 0) {
				// Get record offset
				let offset = params.per_page * (params.page - 1);
				// Get subset of rows based on pagination
				rows = rows.slice(offset, (offset + params.per_page));
			}
		}

		return Promise.all(rows.map((row) => users.details(row.user_id)));
	}).then((rows) => {
		return Promise.resolve({"users": rows, "page": params.page, "per_page": params.per_page, "total": total});
	});
};

users.match = function (params) {
	let user = {};
	let minimum_percentage = 20;
	let max_results = 15;

	return Promise.resolve().then(() => {
		if (("__class" in params) && params.__class == "userObject") {
			return Promise.resolve(params);
		} else {
			let searchId = (("user_id" in params)) ? params.user_id : params.user.user_id;
			return users.details(searchId);
		}
	}).then((userDetails) => {

		// Based on users location, search within 100km
		userDetails.postcode_radius = 100;

		userDetails.instrument = userDetails.instruments.map(i => i.instrument_id);
		userDetails.genre = userDetails.genres.map(g => g.genre_id);
		userDetails.searchType = "or";

		if (("limit" in params)) {
			userDetails.limit = params.limit;
		}

		user = _.cloneDeep(userDetails);
		userDetails.user = _.cloneDeep(user);

		return users.search(userDetails);
	}).then((partMatches) => {
		partMatches = partMatches.users.map((match) => {

			// Total matching points between 2 users
			match.total = 0;
			// The amount of available points for the match depending on the band's requirement/preference
			match.points = 0;

			internal.criteriaKeys.map((key) => {
				// type_id - Band: 2, Musician: 3
				// Check to see if band has set a preference
				let band_preference, musician_preference;
				if ((match.user_type === 'Band' && match[key] != null) || (user.user_type === 'Band' && user[key] != null)) {
					// preference has been set by the band
					match.points += 1;

					// Define band preference vs musician info
					band_preference = (match.user_type === 'Band') ? match[key] : user[key];
					musician_preference = (match.user_type === 'Musician') ? match[key.replace('required_', '').replace('preference_', '')] : user[key.replace('required_', '').replace('preference_', '')];

					// Check to see if the preference matches
					if (key === 'gender_id') {
						// Need to handle gender differently as 'Prefer Not Say' set for band is no preference
						if ((match.user_type === 'Band' && match.gender !== 'Prefer Not Say') ||
							(user.user_type === 'Band' && user.gender !== 'Prefer Not Say')) {

							if (band_preference === musician_preference) {
								match.total += 1;
							}
						} else {
							// Not a valid preference
							match.points += -1;
						}
					}
					// Standard match criteria
					else if (band_preference === musician_preference) {
						match.total += 1;
					}
				}
			});

			// Instruments are required
			let instrumentPoints = 0;
			match.instruments.map((item) => {
				if (user.instrument.includes(item.instrument_id)) {
					instrumentPoints = 4;
				}
			});
			match.points += 4;
			match.total += instrumentPoints;

			// Genre is required
			let genrePoints = 0;
			match.genres.map((item) => {
				if (user.genre.includes(item.genre_id)) {
					genrePoints = 2;
				}
			});
			match.points += 2;
			match.total += genrePoints;

			// Calculate totals
			match.percent = (match.total / match.points) * 100;
			match.percent = Math.round(match.percent);

			return match;

		});

		// Sort and apply minimum percentage and limit results
		partMatches = _.orderBy(partMatches, "percent", "desc").filter(match => match.percent > minimum_percentage).slice(0, max_results);

		return Promise.resolve({"matches": partMatches});
	});
};

users.admin_user_list = function (pagination_start, pagination_length, search, order, search_column) {

	return Promise.resolve().then(() => {

		let query = internal.query.admin_user_list();
		query.offset(pagination_start);
		query.limit(pagination_length);

		// Add in search query if required
		if (search !== '') {
			search = '%' + search + '%';
			query.where("u.username like ? OR u.display_name like ? or u.email like ?", search, search, search);
		}

		let mapping = ["u.id", "u.username", "u.email", "u.display_name", "user_type", "u.account_locked", "reports", "active_reports"];

		search_column.forEach(function (item) {
			if (item.search.value !== '') {
				query.where(item.data + " = ?", item.search.value);
			}

		});

		order.forEach(function (item) {
			query.order(mapping[item.column], (item.dir === "asc") ? true : false);
		});

		return dbc.execute(query);
	}).then((data) => {
		return Promise.resolve(data);
	});
};

users.count = function (search, search_column) {

	return Promise.resolve().then(() => {

		let query = internal.query.count();

		// Add in search query if required
		if (search !== '') {
			search = '%' + search + '%';
			query.where("u.username like ? OR u.display_name like ? or u.email like ?", search, search, search);
		}

		search_column.forEach(function (item) {
			if (item.search.value !== '') {
				query.where(item.data + " = ?", item.search.value);
			}

		});
		return dbc.execute(query);

	}).then((data) => {

		return Promise.resolve(data[0].total);
	});
};


module.exports = users;

let internal = {};

internal.criteriaKeys = [
	"required_commitment_level_id",
	"required_music_experience_id",
	"required_past_gig_id",
	"required_gig_frequency_id",
	"preference_age_bracket_id",
	"gender_id"
];

internal.query = {};

internal.query.count = function () {
	let query = dbc.sql.select().fields({
		"count(*)": "total"
	}).from(
		"ebdb.user", "u"
	).left_join(dbc.sql.select(

		).field("r.user_id"
		).field("IF(count(r.user_id)>0,1,0)", "active_reports"
		).from("ebdb.user_report", "r"
		).where("r.is_active = ?", 1
		).group("r.user_id"), "ar", "u.id = ar.user_id"
	);
	return query;
};

internal.query.admin_user_list = function () {
	let query = dbc.sql.select().fields([
		"u.id",
		"u.username",
		"u.display_name",
		"u.email",
		"u.type_id",
		"u.account_locked",
	]).fields({
		"count(r.user_id)": "reports",
		"t.type_name": "user_type",
		"IFNULL(ar.active_reports,0)": "active_reports"
	}).from(
		"ebdb.user", "u"
	).left_join(
		"ebdb.user_report", "r",
		"u.id = r.user_id"
	).left_join(
		"ebdb.user_type", "t",
		"u.type_id = t.id"
	).left_join(dbc.sql.select(

		).field("r2.user_id"
		).field("IF(count(r2.user_id)>0,1,0)", "active_reports"
		).from("ebdb.user_report", "r2"
		).where("r2.is_active = ?", 1
		).group("r2.user_id"), "ar", "u.id = ar.user_id"
	).group(
		"u.id"
	);

	return query;
};

// internal.query.admin_user_list = function () {
// 	let query = dbc.sql.select().fields([
// 		"u.id",
// 		"u.username",
// 		"u.display_name",
// 		"u.email",
// 		"u.type_id",
// 		"u.account_locked",
// 	]).fields({
// 		"count(r.user_id)": "reports",
// 		"t.type_name": "user_type"
// 	}).field(dbc.sql.select().field("IF(count(r2.user_id)>0,1,0)").from("ebdb.user_report", "r2").where("u.id = r2.user_id").where("r2.is_active = ?", 1), "active_reports"
// 	).from(
// 		"ebdb.user", "u"
// 	).left_join(
// 		"ebdb.user_report", "r",
// 		"u.id = r.user_id"
// 	).left_join(
// 		"ebdb.user_type", "t",
// 		"u.type_id = t.id"
// 	).group(
// 		"u.id"
// 	);
//
// 	return query;
// };

internal.query.user = function () {
	let query = dbc.sql.select().fields([
		"u.username",
		"u.email",
		"u.display_name",
		"p.picture",
		"p.background",
		"p.about",
		"p.band_size",
		"p.members_needed",
		"p.instagram_user",
		"p.twitter_user",
		"p.facebook_user",
		"p.youtube_user"
	]).fields({
		"a.name": "age_bracket",
		"CONCAT(pc.suburb,\' \', pc.postcode, \', \', st.state_short)": "postcode",
		"abp.name": "preferred_age_bracket",
		"c.name": "commitment_level",
		"rc.name": "required_commitment_level",
		"g.name": "gender",
		"f.name": "gig_frequency",
		"rf.name": "required_gig_frequency",
		"s.name": "status",
		"t.type_name": "user_type",
		"me.name": "music_experience",
		"pg.name": "past_gig",
		"rme.name": "required_music_experience",
		"rpg.name": "required_past_gig",
		"p.id": "profile_id",
		"u.id": "user_id",
	}).fields([
		"u.type_id",
		"p.status_id",
		"p.postcode_id",
		"p.age_bracket_id",
		"p.preference_age_bracket_id",
		"p.commitment_level_id",
		"p.required_commitment_level_id",
		"p.gender_id",
		"p.gig_frequency_id",
		"p.required_gig_frequency_id",
		"p.past_gig_id",
		"p.required_past_gig_id",
		"p.music_experience_id",
		"p.required_music_experience_id",

		"u.account_locked",
		"u.email_verified",
	]).from(
		"ebdb.user", "u"
	).left_join(
		"ebdb.profile", "p",
		"u.id = p.user_id"
	).left_join(
		"ebdb.postcode", "pc",
		"p.postcode_id = pc.id"
	).left_join(
		"ebdb.aus_state", "st",
		"pc.aus_state_id = st.id"
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
		"ebdb.music_experience", "me",
		"p.music_experience_id = me.id"
	).left_join(
		"ebdb.music_experience", "rme",
		"p.required_music_experience_id = rme.id"
	).left_join(
		"ebdb.past_gig", "pg",
		"p.past_gig_id = pg.id"
	).left_join(
		"ebdb.past_gig", "rpg",
		"p.required_past_gig_id = rpg.id"
	).left_join(
		"ebdb.status", "s",
		"p.status_id = s.id"
	).left_join(
		"ebdb.user_type", "t",
		"u.type_id = t.id"
	).where("u.type_id <> 1");

	return query;
};

internal.query.getUserUsername = function () {
	let query = dbc.sql.select().fields([
		"u.username"
	]).from(
		"ebdb.user", "u"
	);

	return query;
};
internal.query.getUserEmail = function () {
	let query = dbc.sql.select().fields([
		"u.email"
	]).from(
		"ebdb.user", "u"
	);

	return query;
};
internal.query.userGenres = function () {
	let query = dbc.sql.select().fields([
		"m.profile_id",
		"m.genre_id",
		"g.name",
		"p.user_id"
	]).from(
		"ebdb.profile_genre_map", "m"
	).left_join(
		"ebdb.genre", "g",
		"m.genre_id = g.id"
	).left_join(
		"ebdb.profile", "p",
		"m.profile_id = p.id"
	);

	return query;
};
internal.query.userInstruments = function () {
	let query = dbc.sql.select().fields([
		"m.profile_id",
		"m.instrument_id",
		"i.name",
		"p.user_id"
	]).from(
		"ebdb.profile_instrument_map", "m"
	).left_join(
		"ebdb.instrument", "i",
		"m.instrument_id = i.id"
	).left_join(
		"ebdb.profile", "p",
		"m.profile_id = p.id"
	);

	return query;
};

AWS.config.update({region: "ap-southeast-2"});
internal.s3 = new AWS.S3({params: {Bucket: 'onstage-storage'}});

internal.images = {};
internal.images.upload = function (user, image) {
	return Promise.resolve().then(() => {
		var params = {'Key': user, 'Body': image};
		return Promise.resolve(params);
	}).then((params) => {
		return new Promise(function (resolve, reject) {
			internal.s3.upload(params, (s3Err, data) => {
				if (s3Err) {
					reject(s3Err);
				} else {
					resolve(data.Location);
				}
			});
		});
	});
};

internal.verificationEmail = function (user_id, email, display_name, type = "registration") {
	let verify = {};

	return Promise.resolve().then(() => {
		verify.user_id = user_id;
		verify.verification_key = crypto.randomBytes(Math.ceil(24 / 2)).toString('hex').slice(0, 24);
		verify.expires = moment().add(1, "day").format("YYYY-MM-DD HH:mm:ss");

		return mail.send[type](email, display_name, verify.verification_key);
	}).then((eml) => {
		let query = dbc.sql.insert().into("ebdb.email_verification").setFields(verify);
		return dbc.execute(query);
	}).then((res) => {
		let query = dbc.sql.update().table("ebdb.user").set("email_verified = 0").where("id = ?", user_id);
		return dbc.execute(query);
	});
}
