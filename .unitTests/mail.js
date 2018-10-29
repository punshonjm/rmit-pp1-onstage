const chaiAsPromised = require("chai-as-promised");
var chai = require("chai").use(chaiAsPromised);;
const should = chai.should();

const mail = require(`./../modules/mail.js`);

describe("Mail Module", function() {

	context("Mail Send Function", function() {

		it("should return a MessageId", function() {
			return Promise.resolve().then(function() {
				const to = 'luke.overton@gmail.com';
				const name = 'user';
				const subject = 'Hello';
				const content = 'world';

				return mail.send(to, name, subject, content);
			}).then(function(res) {
				res.should.have.property("MessageId");
			});
		});

		it("should fail without a email entered", function() {
			return Promise.resolve().then(function() {
				const name = 'user';
				const subject = 'Hello';
				const content = 'world';
				return mail.send(to, name, subject, content);
			}).should.eventually.be.rejected.then(function(res, err) {
			});
		});

		it("should fail without a name entered", function() {
			return Promise.resolve().then(function() {
				const to = 'luke.overton@gmail.com';
				const subject = 'Hello';
				const content = 'world';
				return mail.send(to, name, subject, content);
			}).should.eventually.be.rejected.then(function(res, err) {
			});
		});

		it("should fail without a subject entered", function() {
			return Promise.resolve().then(function() {
				const to = 'luke.overton@gmail.com';
				const name = 'user';
				const content = 'world';
				return mail.send(to, name, subject, content);
			}).should.eventually.be.rejected.then(function(res, err) {
			});
		});

		it("should fail without content entered", function() {
			return Promise.resolve().then(function() {
				const to = 'luke.overton@gmail.com';
				const name = 'user';
				const subject = 'Hello';
				return mail.send(to, name, subject, content);
			}).should.eventually.be.rejected.then(function(res, err) {
			});
		});
});

	context("Mail Send Admin Notification", function() {

		it("should return a MessageId", function() {
			return Promise.resolve().then(function() {
				const to = 'luke.overton@gmail.com';
				const name = 'user';
				const subject = 'Admin Notification';
				const text = 'world';

				return mail.send.adminNotification(to, name, subject, text);
			}).then(function(res) {
				res.should.have.property("MessageId");
			});
		});

		it("should fail without a email entered", function() {
			return Promise.resolve().then(function() {
				const name = 'user';
				const subject = 'Admin Notification';
				const text = 'world';
				return mail.send.adminNotification(to, name, subject, text);
			}).should.eventually.be.rejected.then(function(res, err) {
			});
		});

		it("should fail without a name entered", function() {
			return Promise.resolve().then(function() {
				const to = 'luke.overton@gmail.com';
				const subject = 'Admin Notification';
				const text = 'world';
				return mail.send.adminNotification(to, name, subject, text);
			}).should.eventually.be.rejected.then(function(res, err) {
			});
		});

		it("should fail without a subject entered", function() {
			return Promise.resolve().then(function() {
				const to = 'luke.overton@gmail.com';
				const name = 'user';
				const text = 'world';
				return mail.send.adminNotification(to, name, subject, text);
			}).should.eventually.be.rejected.then(function(res, err) {
			});
		});

		it("should fail without text entered", function() {
			return Promise.resolve().then(function() {
				const to = 'luke.overton@gmail.com';
				const name = 'user';
				const subject = 'Admin Notification';
				return mail.send.adminNotification(to, name, subject, text);
			}).should.eventually.be.rejected.then(function(res, err) {
			});
		});

	});


	context("Mail Send Match Notification", function() {

		it("should return a MessageId", function() {
			return Promise.resolve().then(function() {
				const to = 'luke.overton@gmail.com';
				const name = 'user';
				const matches = {
					"display_name" : "BeSharps",
					"percent" : "50",
					"picture" : "www\public\img\faces\avatar.jpg",
					"user_id" : "13"
				};

				return mail.send.newMatches(to, name, matches);
			}).then(function(res) {
				res.should.have.property("MessageId");
			});
		});

		it("should fail without email entered", function() {
			return Promise.resolve().then(function() {
				const name = 'user';
				const matches = {
					"display_name" : "BeSharps",
					"percent" : "50",
					"picture" : "www\public\img\faces\avatar.jpg",
					"user_id" : "13"
				};
				return mail.send.newMatches(to, name, matches);
			}).should.eventually.be.rejected.then(function(res, err) {
			});
		});
		it("should fail without name entered", function() {
			return Promise.resolve().then(function() {
				const to = 'luke.overton@gmail.com';
				const matches = {
					"display_name" : "BeSharps",
					"percent" : "50",
					"picture" : "www\public\img\faces\avatar.jpg",
					"user_id" : "13"
				};
				return mail.send.newMatches(to, name, matches);
			}).should.eventually.be.rejected.then(function(res, err) {
			});
		});

		it("should fail without matches being entered", function() {
			return Promise.resolve().then(function() {
				const to = 'luke.overton@gmail.com';
				const name = 'user';
				return mail.send.newMatches(to, name, matches);
			}).should.eventually.be.rejected.then(function(res, err) {
			});
		});

	});

	context("Mail Send Registration", function() {

		it("should return a MessageId", function() {
			return Promise.resolve().then(function() {
				const to = 'luke.overton@gmail.com';
				const name = 'user';
				const verificationKey = '123';

				return mail.send.registration(to, name, verificationKey);
			}).then(function(res) {
				res.should.have.property("MessageId");
			});
		});

		it("should fail without email being entered", function() {
			return Promise.resolve().then(function() {
				const name = 'user';
				const verificationKey = '123';
				return mail.send.registration(to, name, verificationKey);
			}).should.eventually.be.rejected.then(function(res, err) {
			});
		});

		it("should fail without user being entered", function() {
			return Promise.resolve().then(function() {
				const to = 'luke.overton@gmail.com';
				const verificationKey = '123';
				return mail.send.registration(to, name, verificationKey);
			}).should.eventually.be.rejected.then(function(res, err) {
			});
		});

		it("should fail without verification key being entered", function() {
			return Promise.resolve().then(function() {
				const to = 'luke.overton@gmail.com';
				const name = 'user';
				return mail.send.registration(to, name, verificationKey);
			}).should.eventually.be.rejected.then(function(res, err) {
			});
		});
	});

	context("Mail Send New Email", function() {

		it("should return a MessageId", function() {
			return Promise.resolve().then(function() {
				const to = 'luke.overton@gmail.com';
				const name = 'user';
				const verificationKey = '124';

				return mail.send.newEmail(to, name, verificationKey);
			}).then(function(res) {
				res.should.have.property("MessageId");
			});
		});

		it("should fail without email being entered", function() {
			return Promise.resolve().then(function() {
				const name = 'user';
				const verificationKey = '123';
				return mail.send.newEmail(to, name, verificationKey);
			}).should.eventually.be.rejected.then(function(res, err) {
			});
		});

		it("should fail without user being entered", function() {
			return Promise.resolve().then(function() {
				const to = 'luke.overton@gmail.com';
				const verificationKey = '123';
				return mail.send.newEmail(to, name, verificationKey);
			}).should.eventually.be.rejected.then(function(res, err) {
			});
		});

		it("should fail without verification key being entered", function() {
			return Promise.resolve().then(function() {
				const to = 'luke.overton@gmail.com';
				const name = 'user';
				return mail.send.newEmail(to, name, verificationKey);
			}).should.eventually.be.rejected.then(function(res, err) {
			});
		});
	});

	context("Mail Send Password Resset", function() {

		it("should return a MessageId", function() {
			return Promise.resolve().then(function() {
				const to = 'luke.overton@gmail.com';
				const name = 'user';
				const resetKey = '123';

				return mail.send.passwordReset(to, name, resetKey);
			}).then(function(res) {
				res.should.have.property("MessageId");
			});
		});

				it("should fail without email being entered", function() {
					return Promise.resolve().then(function() {
						const name = 'user';
						const verificationKey = '123';
						return mail.send.passwordReset(to, name, resetKey);
					}).should.eventually.be.rejected.then(function(res, err) {
					});
				});

				it("should fail without user being entered", function() {
					return Promise.resolve().then(function() {
						const to = 'luke.overton@gmail.com';
						const verificationKey = '123';
						return mail.send.passwordReset(to, name, resetKey);
					}).should.eventually.be.rejected.then(function(res, err) {
					});
				});

				it("should fail without verification key being entered", function() {
					return Promise.resolve().then(function() {
						const to = 'luke.overton@gmail.com';
						const name = 'user';
						return mail.send.passwordReset(to, name, resetKey);
					}).should.eventually.be.rejected.then(function(res, err) {
					});
				});
	});


});
