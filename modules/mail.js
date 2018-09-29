const AWS = require("aws-sdk");
const app = global.app;

AWS.config.loadFromPath('sesconfig.json');


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
	}).then(() => {
	});
};

//function to send registration email
mail.send.registration = function(to, verificationKey) {
	return Promise.resolve().then(() => {
		//loads and fills in template
		var template = $('templates\emails\registerEmail.html').html();
		var html = mustache.render(template, {verificationLink: `${verificationKey}`});
		return Promise.resolve(html);
	}).then((content) => {
		let details = {
			"to": to,
			"subject": "On Stage - Email Verification",
			"message": `${html}`
		};
		return internal.sendMail(details);
	}).then(() => {
	});
};

//function sends a password reset email
mail.send.passwordReset = function(to, resetKey) {
	return Promise.resolve().then(() => {
		//loads and fills in template
		var template = $('templates\emails\passwordReset.html').html();
		var html = mustache.render(template, {password: `${resetKey}`});
		return Promise.resolve(html);
	}).then((content) => {
		let details = {
			"to": to,
			"subject": "On Stage - Password Reset",
			"message": `${html}`
		};
		return internal.sendMail(details);
	}).then(() => {
	});
};

module.export = mail;

//function sends mail
internal.sendMail = function(emailDetails) {
	return Promise.resolve().then(() => {
		let mailOptions = {
			Destination: {
    ToAddresses: [
      `${emailDetials.to}`,
    ]
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
