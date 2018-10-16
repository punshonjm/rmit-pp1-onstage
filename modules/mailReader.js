const AWS = require("aws-sdk");
const dbc = require("@modules/dbc");

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
	});
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
	});
};

mailReader.importEmail = function(file) {
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
		var row = {};
		row.etag = file.ETag;
		row.subject = data.subject;
		row.from = data.from;
		row.messageId = data.messageId;

		if ( ("text" in data) && (typeof data.text != typeof undefined) ) {
			row.content = data.text;
		} else {
			row.content = htmlToText.fromString(data.html);
		}




   })

   .catch((err) => console.log(err) );
};

module.exports = mailReader;

mailReader.process();
