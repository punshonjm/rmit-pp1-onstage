
const chaiAsPromised = require("chai-as-promised");
var chai = require("chai").use(chaiAsPromised);;
const should = chai.should();

const listModel = require("./../modules/models.js").list;

describe('list.gig_frequency.query', function(){
	context('Test gig_frequency querying', function() {
		it('when using no filter, should have a length of 4', function() {
			return listModel.gig_frequency.query().should.eventually.have.lengthOf(4);
		});

		it('when searching for "tou", should return 1 result with a name of "touring"', function() {
			return listModel.gig_frequency.query("tou").then(function(res) {
				res.should.have.lengthOf(1);
				res[0].should.have.property("name").equal("touring");
			});
		});

		it('when searching "ewxfasdf", should return empty array', function() {
			return listModel.gig_frequency.query("ewxfasdf").should.eventually.have.lengthOf(0);
		});
	});
});

describe('list.age_bracket.query', function(){
	context('Test age_bracket querying', function() {
		it('when using no filter, should have a length of 7', function() {
			return listModel.age_bracket.query().should.eventually.have.lengthOf(7);
		});

		it('when searching for "25", should return 1 result with a name of "25-34"', function() {
			return listModel.age_bracket.query("25").then(function(res) {
				res.should.have.lengthOf(1);
				res[0].should.have.property("name").equal("25-34");
			});
		});

		it('when searching "80", should return empty array', function() {
			return listModel.age_bracket.query("80").should.eventually.have.lengthOf(0);
		});
	});
});

describe('list.commitment_level.query', function(){
	context('Test commitment_level querying', function() {
		it('when using no filter, should have a length of 5', function() {
			return listModel.commitment_level.query().should.eventually.have.lengthOf(5);
		});

		it('when searching for "fun", should return 1 result with a name of "Just for fun"', function() {
			return listModel.commitment_level.query("fun").then(function(res) {
				res.should.have.lengthOf(1);
				res[0].should.have.property("name").equal("Just for fun");
			});
		});

		it('when searching "Doing nothing", should return empty array', function() {
			return listModel.commitment_level.query("Doing nothing").should.eventually.have.lengthOf(0);
		});
	});
});

describe('list.music_experience.query', function(){
	context('Test music_experience querying', function() {
		it('when using no filter, should have a length of 6', function() {
			return listModel.music_experience.query().should.eventually.have.lengthOf(6);
		});

		it('when searching for "expe", should return 2 results, second with a name of "Expert (15+ years)"', function() {
			return listModel.music_experience.query("expe").then(function(res) {
				res.should.have.lengthOf(2);
				res[1].should.have.property("name").equal("Expert (15+ years)");
			});
		});

		it('when searching "nothing", should return empty array', function() {
			return listModel.music_experience.query("nothing").should.eventually.have.lengthOf(0);
		});
	});
});

describe('list.past_gig.query', function(){
	context('Test past_gig querying', function() {
		it('when using no filter, should have a length of 5', function() {
			return listModel.past_gig.query().should.eventually.have.lengthOf(5);
		});

		it('when searching for "20", should return 1 results, with a name of "10-20"', function() {
			return listModel.past_gig.query("20").then(function(res) {
				res.should.have.lengthOf(1);
				res[0].should.have.property("name").equal("10-20");
			});
		});

		it('when searching "none", should return empty array', function() {
			return listModel.past_gig.query("none").should.eventually.have.lengthOf(0);
		});
	});
});

describe('list.status.query', function(){
	context('Test status querying', function() {
		it('when using no filter, should have a length of 2', function() {
			return listModel.status.query().should.eventually.have.lengthOf(2);
		});

		it('when searching for "Not", should return 1 results, with a name of "Not Searching"', function() {
			return listModel.status.query("Not").then(function(res) {
				res.should.have.lengthOf(1);
				res[0].should.have.property("name").equal("Not Searching");
			});
		});

		it('when searching "none", should return empty array', function() {
			return listModel.status.query("none").should.eventually.have.lengthOf(0);
		});
	});
});

describe('list.gender.query', function(){
	context('Test gender querying', function() {
		it('when using no filter, should have a length of 4', function() {
			return listModel.gender.query().should.eventually.have.lengthOf(4);
		});

		it('when searching for "binary", should return 1 results, with a name of "Non-Binary"', function() {
			return listModel.gender.query("binary").then(function(res) {
				res.should.have.lengthOf(1);
				res[0].should.have.property("name").equal("Non-Binary");
			});
		});

		it('when searching "fighting", should return empty array', function() {
			return listModel.gender.query("fighting").should.eventually.have.lengthOf(0);
		});
	});
});

describe('list.instrument.query', function(){
	context('Test instrument querying', function() {
		it('when using no filter, should have a length of 30', function() {
			return listModel.instrument.query().should.eventually.have.lengthOf(30);
		});

		it('when searching for "Vocalist", should return 6 results, 1st with a name of "Vocalist"', function() {
			return listModel.instrument.query("Vocalist").then(function(res) {
				res.should.have.lengthOf(6);
				res[0].should.have.property("name").equal("Vocalist");
			});
		});

		it('when searching "chainsaw", should return empty array', function() {
			return listModel.instrument.query("chainsaw").should.eventually.have.lengthOf(0);
		});
	});
});

describe('list.genre.query', function(){
	context('Test genre querying', function() {
		it('when using no filter, should have a length of 30', function() {
			return listModel.genre.query().should.eventually.have.lengthOf(30);
		});

		it('when searching for "rock", should return 3 results, 2nd with a name of "Rock"', function() {
			return listModel.genre.query("rock").then(function(res) {
				res.should.have.lengthOf(3);
				res[1].should.have.property("name").equal("Rock");
			});
		});

		it('when searching "screamo", should return empty array', function() {
			return listModel.genre.query("screamo").should.eventually.have.lengthOf(0);
		});
	});
});

describe('list.postcode.query', function(){
	context('Test postcode querying', function() {
		it('when using no filter, should have a length of 25 (limited)', function() {
			return listModel.postcode.query().should.eventually.have.lengthOf(25);
		});

		it('when searching for "2138", should return 3 results, 1st with a name of "Concord West 2138, NSW"', function() {
			return listModel.postcode.query("2138").then(function(res) {
				res.should.have.lengthOf(3);
				res[0].should.have.property("name").equal("Concord West 2138, NSW");
			});
		});

		it('when searching for "Mount Louisa", should return 1 results, 1st with a name of "Mount Louisa 4814, QLD"', function() {
			return listModel.postcode.query("Mount Louisa").then(function(res) {
				res.should.have.lengthOf(1);
				res[0].should.have.property("name").equal("Mount Louisa 4814, QLD");
			});
		});

		it('when searching "screamo", should return empty array', function() {
			return listModel.postcode.query("screamo").should.eventually.have.lengthOf(0);
		});
	});
});


// BEN TO ADD TESTS FOR list.postcode.match HERE 
