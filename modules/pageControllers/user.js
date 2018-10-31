const models = require("@modules/models");

module.exports = function(req) {
	var data = {};

	return Promise.resolve().then(() => {
		return models.users.details(req.params.id);
	}).then((userDetails) => {
		data.profile = userDetails;
		data.pageName = userDetails.display_name;
		data.user_id = req.user.user_id;
		return Promise.resolve(data);
	});
};
