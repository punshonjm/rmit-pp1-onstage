const CronJob = require('cron').CronJob;
const dbc = require("@modules/dbc");
const mail = require("@modules/mail");
const _ = require("lodash");
const users = require("@modules/dataModels/users");

var notifications = {};

notifications.process = function() {
	// Gets users and checks for new matches
	return Promise.resolve().then(() => {
		let query = dbc.sql.select().fields([
			"p.user_id"
		]).from(
			"ebdb.profile", "p"
		).left_join(
			"ebdb.user",
			"u", "p.user_id = u.id"
		).where(
			"u.id IS NOT NULL"
		).where(
			"p.user_id NOT IN ?",
			dbc.sql.select().field("user_id").from("ebdb.profile_match_cache_lookup").where("date = CURDATE()")
		).limit(1000);

		return dbc.execute(query);
	}).then((rows) => {
		if ( rows.length > 0 ) {
			return Promise.all(rows.map(row => {
				return notifications.process.matches(row);
			}));
		} else {
			return Promise.reject({ allProcessed: true });
		}
	}).then((res) => {
		return Promise.resolve("Process Chunk Complete");
	}).catch((error) => {
		if ( ("allProcessed" in error) ) {
			return Promise.resolve("Process Complete");
		} else {
			return Promise.reject(error);
		}
	});
};
notifications.process.matches = function(user) {
	let data = {};

	return Promise.resolve().then(() => {
		return users.match(user);
	}).then((matches) => {
		data.matches = matches.matches;

		let inserts = [];
		matches.matches.map((match) => {
			let row = {
				user_id: user.user_id,
				match_id: match.user_id,
				date: dbc.sql.rstr("CURDATE()")
			};

			let query = dbc.sql.insert().into("ebdb.profile_match_cache").setFields(row);
			inserts.push(dbc.execute(query));
		});

		if ( inserts.length > 0 ) {
			return Promise.all(inserts);
		} else {
			return Promise.reject({ noMatches: true });
		}
	}).then(() => {
		let query = dbc.sql.select().fields([
			"match_id"
		]).from(
			"ebdb.profile_match_cache",
			"pmc"
		).where(dbc.sql.expr()
			.and("user_id = ?", user.user_id)
			.and("date = CURDATE() - INTERVAL 1 DAY")
		);

		return dbc.execute(query);
	}).then((rows) => {
		let keys = rows.map(r => r.match_id);

		data.newMatches = data.matches.filter((row) => {
			return ( keys.includes(row.user_id) ) ? false : true;
		}).map((row) => {
			let match = {};
			match.display_name = row.display_name;
			match.percent = row.percent;
			match.picture = row.picture;
			match.user_id = row.user_id;
			return match;
		});

		if ( data.newMatches.length > 0 ) {
			let lookup = {};
			lookup.user_id = user.user_id;
			lookup.date = dbc.sql.rstr("CURDATE()")
			lookup.matches = JSON.stringify(data.newMatches);

			let query = dbc.sql.insert().into("ebdb.profile_match_cache_lookup").setFields(lookup);
			return dbc.execute(query);
		} else {
			return Promise.resolve();
		}
	}).catch((error) => {
		if ( ("noMatches" in error) ) {
			return Promise.resolve();
		} else {
			return Promise.reject(error);
		}
	});
};

notifications.send = function() {
	// Gets new matches & sends to users with verified emails
	return Promise.resolve().then(() => {
		let query = dbc.sql.select().fields([
			"l.id",
			"l.user_id",
			"l.matches",
			"u.email",
			"u.display_name"
		]).from(
			"ebdb.profile_match_cache_lookup",
			"l"
		).left_join(
			"ebdb.user",
			"u", "l.user_id = u.id"
		).where(dbc.sql.expr()
			.and("l.date = CURDATE()")
			.and("l.user_notified = ?", 0)
			.and("u.email_verified = ?", 1)
		).limit(500);

		return dbc.execute(query);
	}).then((users) => {
		if ( users.length > 0 ) {
			return Promise.all(users.map(row => {
				row.matches = JSON.parse(row.matches);
				return notifications.send.matches(row);
			}));
		} else {
			return Promise.reject({ allProcessed: true });
		}
	}).then((res) => {
		return Promise.resolve("Send Chunk Complete");
	}).catch((error) => {
		if ( ("allProcessed" in error) ) {
			return Promise.resolve("Send Complete");
		} else {
			return Promise.reject(error);
		}
	});
};
notifications.send.matches = function(user) {
	return Promise.resolve().then(() => {
		return mail.send.newMatches(user.email, user.display_name, user.matches);
	}).then((res) => {
		let query = dbc.sql.update().table("ebdb.profile_match_cache_lookup").set("user_notified = ?", 1);
		return dbc.execute(query);
	});
};

notifications.job = {};
notifications.job.process = new CronJob('0 1 0,6,12,18 * * *', () => {
	// Job runs at midnight, 6am, midday, 6pm
	Promise.resolve().then(() => {
		return notifications.process();
	}).catch((error) => {
		console.error("Notifications.Job.Error", error);
	});
});
notifications.job.notification = new CronJob('0 30 9-18 * * * ', () => {
	// Job runs at hourly on the half hour mark between 9am and 6pm
	Promise.resolve().then(() => {
		return notifications.send();
	}).catch((error) => {
		console.error("Notifications.Job.Error", error);
	});
});

notifications.initialise = function() {
	notifications.job.process.start();
	notifications.job.notification.start();
};

module.exports = notifications;
