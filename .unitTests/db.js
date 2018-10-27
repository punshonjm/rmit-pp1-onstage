
const chaiAsPromised = require("chai-as-promised");
var chai = require("chai").use(chaiAsPromised);;
const should = chai.should();

describe('dbc module testing', function(){
	context('Test dbc module', function() {
		it('SELECT 1 should return 1 row with a value of 1 as the ', function() {
			return dbc.execute({ text: "SELECT 1;", values: [] }).then(function(rows) {
				rows.should.have.lengthOf(1);
				rows[0].should.be.an("object");
				rows[0]["1"].should.equal(1);
			});
		});
	});
});
