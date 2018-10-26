var assert = require("assert");
var chaiAsPromised = require("chai-as-promised");
var chai = require("chai").use(chaiAsPromised);;
chai.should();

var listModel = require("./../modules/dataModels/list");

describe("list.gig_frequency.query", function() {
	it("should return 4 options", function(done) {
		return listModel.gig_frequency.query().should.eventually.equal(4)
	})
});
