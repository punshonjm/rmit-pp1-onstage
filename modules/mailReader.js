const AWS = require("aws-sdk");
const dbc = require("@modules/dbc");

const CronJob = require('cron').CronJob;
const simpleParser = require('mailparser').simpleParser;
const htmlToText = require('html-to-text');

AWS.config.update({ region: "ap-southeast-2" });

var mailReader = {};
var internal = {};

internal.s3 = new AWS.S3({
	params: { Bucket: 'onstageemail' }
});

mailReader.process = function(continuationToken = false) {
	return Promise.resolve().then(() => {
		return new Promise(function(resolve, reject) {
			var s3params = {
				MaxKeys: 5,
				Delimiter: '/',
				Prefix: 'email_received/'
			};

			if ( continuationToken ) s3params.ContinuationToken = continuationToken;

			internal.s3.listObjectsV2 (s3params, (err, data) => {
				if (err) {
					reject (err);
				}

				resolve (data);
			});
		});
	}).then((data) => {
		mailReader.getEmails(data.Contents);

		if ( data.IsTruncated ) {
			return mailReader.process(data.NextContinuationToken);
		} else {
			return Promise.resolve();
		}
	}).then(() => {
		return Promise.resolve();
	})
};

mailReader.getEmails = function(filesArray) {
	return Promise.resolve().then(() => {
		let keys = filesArray.map(f => f.ETag.replace(/"/g, ""));

		let query = dbc.sql.select().from("ebdb.email_import").where("etag IN ?", keys);
		return dbc.execute(query);
	}).then((foundEmails) => {
		foundEmails = foundEmails.map(f => f.etag);
		let importList = filesArray.filter(f => !foundEmails.includes(f.ETag.replace(/"/g, "")));
		return Promise.all( importList.map(file => mailReader.importEmail(file)) );
	}).catch((error) => {
		console.log("Mail.Importer.GetEmail.Error", error);
	})
};

mailReader.importEmail = function(file) {
	var row = {};

	return Promise.resolve().then(() => {
		return new Promise(function(resolve, reject) {
			internal.s3.getObject({ Key: file.Key }, (err, data) => {
				if ( err ) {
					reject(err);
				} else {
					resolve(data);
				}
			});
		});
	}).then((obj) => {
		return simpleParser(obj.Body);
   }).then((data) => {
		row.etag = file.ETag.replace(/"/g, "");
		row.subject = data.subject;
		row.from_email = data.from.value[0].address;
		row.from_name = data.from.value[0].name;
		row.message_id = data.messageId;

		if ( ("text" in data) && (typeof data.text != typeof undefined) ) {
			row.content = data.text.split("________________________________")[0];
		} else {
			row.content = htmlToText.fromString(data.html).split("________________________________")[0];
		}

		let query = dbc.sql.insert().into("ebdb.email_import").setFields(row);
		return dbc.execute(query);
   	}).then((res) => {
		let query = dbc.sql.select().fields([
			"t.thread_id"
		]).from(
			"ebdb.contact_form", "f"
		).left_join(
			"ebdb.thread_user",
			"t", "f.id = t.contact_id"
		).where("email = ?", row.from_email).order("f.sql_date_added", false).limit(1);
		return dbc.getRow(query);
	}).then((threadRow) => {
		if ( threadRow && threadRow.thread_id != null ) {
			let message = {};
			message.thread_id = threadRow.thread_id;
			message.user_id = 0;
			message.content = row.content;

			let query = dbc.sql.insert().into('ebdb.message').setFields(message);
			return dbc.execute(query);
		} else {
			return Promise.resolve();
		}
	}).then((row) => {
		return Promise.resolve();
	});
};

mailReader.job = new CronJob('0 */10 * * * *', () => {
	// Job runs every 10 minutes
	Promise.resolve().then(() => {
		return mailReader.process();
	}).catch((error) => {
		console.error("Mail.Import.Error", error);
	});
});

mailReader.initialise = function() {
	mailReader.process();
	mailReader.job.start();
};

module.exports = mailReader;
