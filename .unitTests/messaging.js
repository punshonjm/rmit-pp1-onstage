
const chaiAsPromised = require("chai-as-promised");
var chai = require("chai").use(chaiAsPromised);;
const should = chai.should();
const models = require("./../modules/models.js")
const messaging = models.messaging;

const _ = require("lodash");

describe('Messaging Model Tests', function() {
	var user = null;
	var threadId = null;

	before(function() {
		return Promise.resolve().then(() => {
			 return models.users.details(13);
		}).then((userDetails) => {
			user = userDetails;
		}).catch((err) => console.log(err));
	});

	// new
	context('Test messaging.new Function', function() {
		it("should succesfully send a mesasge", function() {
			var data = {};
			data.user_id = user.user_id;
			data.message_to = 5;
			data.message = "Testing messaging in unit tests";

			return messaging.new(data).should.eventually.have.property("message").equal("Successfully sent message!");
		});

		it("should not succesfully send a mesasge to an invalid user_id", function() {
			var data = {};
			data.user_id = user.user_id;
			data.message_to = 3;
			data.message = "Testing messaging in unit tests";

			return messaging.new(data).should.eventually.be.rejectedWith("Invalid user to message.");
		});

		it("should not succesfully send a mesasge without content", function() {
			var data = {};
			data.user_id = user.user_id;
			data.message_to = 5;

			return messaging.new(data).should.eventually.be.rejectedWith("No content to send.");
		});

		it("should not succesfully send a mesasge with null content", function() {
			var data = {};
			data.user_id = user.user_id;
			data.message_to = 5;
			data.message = null;

			return messaging.new(data).should.eventually.be.rejectedWith("No content to send.");
		});

		it("should not succesfully send a mesasge witho empty content", function() {
			var data = {};
			data.user_id = user.user_id;
			data.message_to = 5;
			data.message = "";

			return messaging.new(data).should.eventually.be.rejectedWith("No content to send.");
		});
	});

	// list threads
	context('Test messaging.listThreads Function', function() {
		it(" Should list threads", function() {
			return messaging.listThreads(user).then(function(threads) {
				threads.should.have.lengthOf.at.least(1);
			});
		});

		it("Should list threads and have test message", function() {
			return messaging.listThreads(user).then(function(threads) {
				threads.should.have.lengthOf.at.least(1);

				let latest = _.find(threads, { message_with: 5 });
				threadId = latest.thread_id;
				latest.message.content.should.equal("Testing messaging in unit tests");
			});
		});

		it("Should not list threads for a dodgy id", function() {
			return messaging.listThreads({ user_id: 3 }).should.eventually.have.a.lengthOf(0);
		});

		it("Should reject if an invalid id or user object passed to function", function() {
			return messaging.listThreads().should.eventually.be.rejectedWith("Invalid user provided.");
		});
	});


	// send
	context('Test messaging.send Function', function() {
		it("Should send a message to the thread", function() {
			var data = {};
			data.thread_id = threadId;
			data.user = user;
			data.content = "Test message send";

			return messaging.send(data).should.eventually.have.property("message").equal("Successfully sent message");
		});

		it("Should fail when given an invalid thread id", function() {
			var data = {};
			data.thread_id = 1;
			data.user = user;
			data.content = "Test message send";

			return messaging.send(data).should.eventually.be.rejected;
		});
	});

	//is in thread
	context('Test messaging.isInThread Function', function() {
		it("Should confirm user is in thread", function() {
			return messaging.isInThread(user.user_id, threadId).should.eventually.be.true;
		});

		it("Should confirm user is not in thread", function() {
			return messaging.isInThread(user.user_id, 1).should.eventually.be.false;
		});

		it("Should return false if no values provided", function() {
			return messaging.isInThread(null).should.eventually.be.false;
		});
	});

	// getOtherThreadUser
	context('Test messaging.getOtherThreadUser Function', function() {
		it("Should get user 5 from the thread", function() {
			return messaging.getOtherThreadUser(user.user_id, threadId).should.eventually.have.property("id").equal(5);
		});

		it("Should get null from the random thread", function() {
			return messaging.getOtherThreadUser(user.user_id, (threadId + 5)).should.eventually.be.null;
		});

		it("Should get null if no values provided", function() {
			return messaging.getOtherThreadUser().should.eventually.be.null;
		});
	});

	// getLatestThreadId
	context('Test messaging.getLatestThreadId Function', function() {
		it("Should get user threadId from user 5", function() {
			return messaging.getLatestThreadId(user.user_id, 5).should.eventually.equal(threadId);
		});

		it("Should get null from thread with no user", function() {
			return messaging.getLatestThreadId(user.user_id, 3).should.eventually.be.null;
		});

		it("Should get null if no values provided", function() {
			return messaging.getLatestThreadId().should.eventually.be.null;
		});
	});

	// get thread
	context('Test messaging.getThread Function', function() {
		it("Should get the thread", function() {
			return messaging.getThread({ user: user, thread_id: threadId }).then(function(res) {
				let thread = res.thread;
				thread.should.have.property("thread_id").equal(threadId);
				thread.thread_with.should.have.property("message_with").equal(5);
			});
		});

		it("Should not be able to access other users' threads", function() {
			return messaging.getThread({ user: user, thread_id: (threadId + 3) }).should.eventually.be.rejectedWith("You don't have access to this message thread.");
		});
	});


});
