const AWS = require("aws-sdk");
const app = require("@modules/app");
const templating = require("@modules/templating");

AWS.config.update({ region: "us-east-1" });
// AWS.config.loadFromPath('sesConfig.json');

var mail = {};
var internal = {};

//Function to send custom email
mail.send = function(to, subject, content) {
	return Promise.resolve().then(() => {
		let details = {
			"to": to,
			"subject": subject,
			"message": content
		};

		return internal.sendMail(details);
	});
};

//function to send registration email
mail.send.registration = function(to, verificationKey) {
	return Promise.resolve().then(() => {
		var data = {
			verification_link: `${verificationKey}`
		};

		return templating.build(path.join(__dirname, "../templates/emails", "registerEmail.html"), data);
	}).then((content) => {
		let details = {
			"to": to,
			"subject": "On Stage - Email Verification",
			"message": html
		};

		return internal.sendMail(details);
	});
};

//function sends a password reset email
mail.send.passwordReset = function(to, resetKey) {
	return Promise.resolve().then(() => {
		var data = {
			reset_link: `${resetKey}`
		};

		return templating.build(path.join(__dirname, "../templates/emails", "passwordReset.html"), data);
	}).then((content) => {
		let details = {
			"to": to,
			"subject": "On Stage - Password Reset",
			"message": html
		};

		return internal.sendMail(details);
	});
};

module.export = mail;

//function sends mail
internal.sendMail = function(emailDetails) {
	return Promise.resolve().then(() => {
		let mailOptions = {
			Destination: {
				ToAddresses: [ `${emailDetials.to}` ]
			},
			Message: {
				Body: {
					Html: {
						Charset: "UTF-8",
						Data: `${emailDetails.messagage}`
					},
					Subject: {
						Charset: 'UTF-8',
						Data: `${emailDetails.subject}`
					}
				},
				Source: `"OnStage" <onstageprojectteam@gmail.com>`,
			}
		};

		return Promise.resolve(mailOptions)
	}).then((options) => {
		return new Promise(function(resolve, reject) {
			internal.AWS.SES.sendEmail(options, (error, info) => {
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
