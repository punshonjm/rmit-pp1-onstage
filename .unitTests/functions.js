const chaiAsPromised = require("chai-as-promised");
var chai = require("chai")
// .use(chaiAsPromised);;
const should = chai.should();

// Object.values is a non-standard function that is added in app.js
// Used in applicaiton and is important to test
describe('Miscelaneous Function Tests', function(){
	context('Test Object.values function', function() {
		it('when passing an empty object, should have length of 0', function() {
			Object.values({}).should.have.lengthOf(0);
		});

		it("When passing an object, should return array of its values", function() {
			Object.values({ key: "value", key2: "value2" }).should.have.lengthOf(2);
			Object.values({ key: "value", key2: "value2" }).should.be.an("Array");
			Object.values({ key: "value", key2: "value2" })[1].should.equal("value2");
		});
	});
});
