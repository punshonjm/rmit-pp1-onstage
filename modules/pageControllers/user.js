const models = require("@modules/models");

module.exports = function(req) {
	var data = {};

	return Promise.resolve().then(() => {
		return models.users.details(req.params.id);
	}).then((userDetails) => {
		data.profile = userDetails;
		data.pageName = userDetails.display_name;

		return Promise.resolve(data);
	});
};
