const AWS = require("aws-sdk");
const app = require("@modules/app");
const path = require("path");
const templating = require("@modules/templating");

AWS.config.update({ region: "us-east-1" });

var mail = {};
var internal = {};

//Function to send custom email
mail.send = function(to, name, subject, content) {
	return Promise.resolve().then(() => {
		let details = {
			"to": to,
			"subject": subject,
			"message": content
		};

		return internal.sendMail(details);
	});
};

//function to send admin notification email
mail.send.adminNotification = function(to, name, subject, text) {
	return Promise.resolve().then(() => {
		var data = {
			display_name: name,
			content: text
		};

		return templating.build(path.join(__dirname, "../templates/emails", "adminNotification.html"), data);
	}).then((html) => {
		let details = {
			"to": to,
			"subject": "RE: " + subject,
			"message": html
		};

		return internal.sendMail(details);
	});
};

//function to send registration email
mail.send.registration = function(to, name, verificationKey) {
	return Promise.resolve().then(() => {
		var data = {
			display_name: name,
			verification_link: `${verificationKey}`
		};

		return templating.build(path.join(__dirname, "../templates/emails", "registerEmail.html"), data);
	}).then((html) => {
		let details = {
			"to": to,
			"subject": "On Stage - Account Verification",
			"message": html
		};

		return internal.sendMail(details);
	});
};

//function to send email update
mail.send.newEmail = function(to, name, verificationKey) {
	return Promise.resolve().then(() => {
		var data = {
			display_name: name,
			verification_link: `${verificationKey}`
		};

		return templating.build(path.join(__dirname, "../templates/emails", "newEmail.html"), data);
	}).then((html) => {
		let details = {
			"to": to,
			"subject": "On Stage - Updated Email Verification",
			"message": html
		};

		return internal.sendMail(details);
	});
};

//function sends a password reset email
mail.send.passwordReset = function(to, name, resetKey) {
	return Promise.resolve().then(() => {
		var data = {
			display_name: name,
			reset_link: `${resetKey}`
		};

		return templating.build(path.join(__dirname, "../templates/emails", "passwordReset.html"), data);
	}).then((html) => {
		let details = {
			"to": to,
			"subject": "On Stage - Password Reset",
			"message": html
		};

		return internal.sendMail(details);
	});
};

module.exports = mail;

//function sends mail
internal.sendMail = function(emailDetails) {
	return Promise.resolve().then(() => {
		let mailOptions = {
			Destination: {
				ToAddresses: [ `${emailDetails.to}` ]
			},
			Message: {
				Body: {
					Html: {
						Charset: "UTF-8",
						Data: `${emailDetails.message}`
					},
				},
				Subject: {
					Charset: 'UTF-8',
					Data: `${emailDetails.subject}`
				}
			},
			Source: `"On Stage" <admin@onstage.octbox.com>`,
		};

		return Promise.resolve(mailOptions)
	}).then((options) => {
		return new Promise(function(resolve, reject) {
			internal.ses.sendEmail(options, (error, info) => {
				if ( error ) {
					reject(error);
				} else {
					resolve(info)
				}
			});
		});
	}).catch((error) => {
		error.mailError = true;
		return Promise.reject(error);
	}).catch((error) => app.handleError(error));
};

internal.ses = new AWS.SES({apiVersion: '2010-12-01'});
