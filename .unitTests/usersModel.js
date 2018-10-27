const chaiAsPromised = require("chai-as-promised");
var chai = require("chai").use(chaiAsPromised);;
const should = chai.should();

const users = require("./../modules/models.js").users;

describe('Users Model Tests', function() {
	context('users.details', function() {
		it('when passing no id or username, should reject', function() {
			return users.details().should.eventually.be.rejectedWith("Provided an invalid ID or username.");
		});

		it('when looking for username of "TotallyFakeUsername", should reject', function() {
			return users.details("TotallyFakeUsername").should.eventually.be.rejectedWith("Failed to find user.");
		});

		it('when looking for user_id "13", should have a name of "Sally"', function() {
			return users.details(13).then(function(res) {
				res.should.have.property("__class").equal("userObject");
				res.should.have.property("display_name").equal("Sally");
				res.should.have.property("username");
				res.should.have.property("email");
				res.should.have.property("user_id");
				res.should.have.property("profile_id");
			});
		});
	});

	context("user.update", function() {
		it("Should reject when no values are passed", function() {
			return users.update().should.eventually.be.rejectedWith("Nothing to update!");
		});

		it("Should reject when empty username is passed", function() {
			return users.details("Mark888").then(function(user) {
				let params = {
					user: user,
					username: ""
				};

				return users.update(params).should.eventually.be.rejected.then(function(error) {
					error.should.have.property("errorSet");
					error.errorSet.should.have.lengthOf(1);
					error.errorSet[0].error.should.equal("Username cannot be empty.");
				});
			});
		});
		it("Should reject when empty email is passed", function() {
			return users.details("Mark888").then(function(user) {
				let params = {
					user: user,
					email: ""
				};

				return users.update(params).should.eventually.be.rejected.then(function(error) {
					error.should.have.property("errorSet");
					error.errorSet.should.have.lengthOf(1);
					error.errorSet[0].error.should.equal("Email cannot be empty.");
				});
			});
		});

		it("Should reject when username is taken", function() {
			return users.details("Mark888").then(function(user) {
				let params = {
					user: user,
					username: "sally"
				};

				return users.update(params).should.eventually.be.rejected.then(function(error) {
					error.should.have.property("errorSet");
					error.errorSet.should.have.lengthOf(1);
					error.errorSet[0].error.should.equal("Username has already been taken. Please enter another.");
				});
			});
		});

		it("Should reject when email is taken", function() {
			return users.details("Mark888").then(function(user) {
				let params = {
					user: user,
					email: "punshon.jm@live.com.au"
				};

				return users.update(params).should.eventually.be.rejected.then(function(error) {
					error.should.have.property("errorSet");
					error.errorSet.should.have.lengthOf(1);
					error.errorSet[0].error.should.equal("Email has already been used.");
				});
			});
		});

		it("Should update the details successfully", function() {
			let params = {
				about: "Testing about text" + new Date().getTime()
			};

			return users.details("Mark888").then(function(user) {
				params.user = user;

				return users.update(params).should.eventually.be.fulfilled
			}).then(function() {
				return users.details("Mark888")
			}).then(function(user) {
				user.about.should.equal(params.about);
			})
		});
	});
});
