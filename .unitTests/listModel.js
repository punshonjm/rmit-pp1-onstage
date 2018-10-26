
const chaiAsPromised = require("chai-as-promised");
var chai = require("chai").use(chaiAsPromised);;
const should = chai.should();

const listModel = require("./../modules/models.js").list;

describe('list.gig_frequency.query', function(){
	context('Test gig_frequency querying', function() {
		it('when getting all, should have a length of 4', function() {
			return listModel.gig_frequency.query().should.eventually.have.lengthOf(4);
		});

		it('when searching for tou, should return 1 result with a name of "touring"', function() {
			return listModel.gig_frequency.query("tou").then(function(res) {
				res.should.have.lengthOf(1);
				res[0].should.have.property("name").equal("touring")
			});
		});

		it('when searching "ewxfasdf", should return empty array', function() {
			return listModel.gig_frequency.query("ewxfasdf").should.eventually.have.lengthOf(0);
		});
	});
});
