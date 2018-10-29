const chaiAsPromised = require("chai-as-promised");
var chai = require("chai").use(chaiAsPromised);;
const should = chai.should();

const mail = require(`./../modules/mail.js`);

describe("Mail Module", function() {
	context("Mail Send Function", function() {

		it("should return a MessageId", function() {
			return Promise.resolve().then(function() {
				const to = 'punshon.jm@live.com.au';
				const name = 'user';
				const subject = 'Hello';
				const content = 'world';

				return mail.send(to, name, subject, content);
			}).then(function(res) {
				res.should.have.property("MessageId");
			});
		});
	});
});
