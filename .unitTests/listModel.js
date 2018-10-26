// var assert = require("assert");
var chaiAsPromised = require("chai-as-promised");
var chai = require("chai").use(chaiAsPromised);;

// const chai = require(`chai`);
const should = chai.should();

const listModel = require("./../modules/models.js").list;

describe('list.gig_frequency.query', function(){
	context('Test function', function() {
		it('should have a length of 4', function() {
			return listModel.gig_frequency.query();
		});

		it('should return results like what is searched', function() {
			return listModel.gig_frequency.query("tou").then(function(res) {
				res.should.have.lengthOf(1);
				res[0].should.have.property("name").equal("touring")
			})
			// return listModel.gig_frequency.query("tou").should.eventually.have.property("name").equal("touring")
		});

		it('should return false lif nothing is found', function() {
			return listModel.gig_frequency.query("ewxfasdf").should.eventually.have.lengthOf(0);
		});
	});
});
