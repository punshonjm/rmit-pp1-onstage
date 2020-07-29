const chaiAsPromised = require("chai-as-promised");
var chai = require("chai").use(chaiAsPromised);;
const should = chai.should();

const users = require("./../modules/models.js").users;

describe('Users Model Tests', function() {
	before(function() {
		return Promise.resolve().then(() => {
			 let query = dbc.sql.delete().from("ebdb.user").where("username = ?", "MochaChaiTestUser");
			 return dbc.execute(query);
		}).catch((err) => console.log(err));
	});

	after(function() {
		return Promise.resolve().then(() => {
			 let query = dbc.sql.delete().from("ebdb.user").where("username = ?", "MochaChaiTestUser");
			 return dbc.execute(query);
		}).catch((err) => console.log(err));
	});

	context("users.register", function() {

		it("should fail to add a user without params", function() {
			return users.register().should.eventually.be.rejectedWith("No registration values provided.");
		});

		it("should fail to add a user without an email", function() {
			return users.register({
				username: "test",
				password: "pass",
				passwordConfirm: "pass",
				agree: "yes"
			}).should.eventually.be.rejected.then(function(error) {
				error.should.have.property("errorSet");
				error.errorSet.should.have.lengthOf(1);
				error.errorSet[0].error.should.equal('Email must not be empty.');
			});
		});

		it("should fail to add a user with an in-use email", function() {
			return users.register({
				email: "punshon.jm@live.com.au",
				username: "test",
				password: "pass",
				passwordConfirm: "pass",
				agree: "yes"
			}).should.eventually.be.rejected.then(function(error) {
				error.should.have.property("errorSet");
				error.errorSet.should.have.lengthOf(1);
				error.errorSet[0].error.should.equal('Email has already been used.');
			});
		});

		it("should fail to add a user without a password", function() {
			return users.register({
				username: "test",
				email: "test",
				passwordConfirm: "pass",
				agree: "yes"
			}).should.eventually.be.rejected.then(function(error) {
				error.should.have.property("errorSet");
				error.errorSet.should.have.lengthOf(1);
				error.errorSet[0].error.should.equal('Password must not be empty.');
			});
		});

		it("should fail to add a user without a password confirm", function() {
			return users.register({
				username: "test",
				email: "test",
				password: "pass",
				agree: "yes"
			}).should.eventually.be.rejected.then(function(error) {
				error.should.have.property("errorSet");
				error.errorSet.should.have.lengthOf(1);
				error.errorSet[0].error.should.equal('Password confirm must not be empty.');
			});
		});

		it("should fail to add a user without a username", function() {
			return users.register({
				email: "test",
				password: "pass",
				passwordConfirm: "pass",
				agree: "yes"
			}).should.eventually.be.rejected.then(function(error) {
				error.should.have.property("errorSet");
				error.errorSet.should.have.lengthOf(1);
				error.errorSet[0].error.should.equal('Username must not be empty.');
			});
		});

		it("should fail to add a user with a username with invalid characters", function() {
			return users.register({
				username: "_test@",
				email: "test",
				password: "pass",
				passwordConfirm: "pass",
				agree: "yes"
			}).should.eventually.be.rejected.then(function(error) {
				error.should.have.property("errorSet");
				error.errorSet.should.have.lengthOf(1);
				error.errorSet[0].error.should.equal('Username contains invalid characters.');
			});
		});

		it("should fail to add a user with an in-use username", function() {
			return users.register({
				username: "sally",
				email: "test",
				password: "pass",
				passwordConfirm: "pass",
				agree: "yes"
			}).should.eventually.be.rejected.then(function(error) {
				error.should.have.property("errorSet");
				error.errorSet.should.have.lengthOf(1);
				error.errorSet[0].error.should.equal('Username has already been taken. Please enter another.');
			});
		});

		it("should fail to add with passwords not matching", function() {
			return users.register({
				username: "MochaChaiTestUser",
				email: "test",
				password: "pass",
				passwordConfirm: "passt",
				agree: "yes"
			}).should.eventually.be.rejected.then(function(error) {
				error.should.have.property("errorSet");
				error.errorSet.should.have.lengthOf(1);
				error.errorSet[0].error.should.equal('Passwords do not match.');
			});
		});

		it("should fail to add if TOS agreement missing", function() {
			return users.register({
				username: "MochaChaiTestUser",
				email: "test",
				password: "pass",
				passwordConfirm: "pass",
			}).should.eventually.be.rejected.then(function(error) {
				error.should.have.property("errorSet");
				error.errorSet.should.have.lengthOf(1);
				error.errorSet[0].error.should.equal('You must agree to the terms and conditions.');
			});
		});

		it("should add a user successfully when required params provided", function() {
			let params = {
				username: "MochaChaiTestUser",
				email: "joshua.punshon@outlook.com",
				password: "pass",
				passwordConfirm: "pass",
				agree: "yes",
				type: "musician",
			};

			params.display_name = "Mocha & Chai Please";
			params.past_gigs = 1;
			params.music_experience = 1;
			params.commitment_level = 1;
			params.gig_frequency = 1;
			params.status = 1;
			params.postcode = 1;
			params.gender = 1;
			params.aboutMe = "Test";
			params.age_bracket = 1;
			params.genre = "1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20";
			params.instruments = "31,32,33,34,35,36,37,38,39,40";

			return users.register(params).should.eventually.be.fulfilled.then(() => {

			}).catch((err) => console.log(err));
		});
	});

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
			return users.details("MochaChaiTestUser").then(function(user) {
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
			return users.details("MochaChaiTestUser").then(function(user) {
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
			return users.details("MochaChaiTestUser").then(function(user) {
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
			return users.details("MochaChaiTestUser").then(function(user) {
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

			return users.details("MochaChaiTestUser").then(function(user) {
				params.user = user;

				return users.update(params).should.eventually.be.fulfilled
			}).then(function() {
				return users.details("MochaChaiTestUser")
			}).then(function(user) {
				user.about.should.equal(params.about);
			})
		});
	});

});
