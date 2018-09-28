const models = require("@modules/models");

module.exports = function(req) {
	var data = {};

	return Promise.resolve().then(() => {
		return models.users.details(req.user.user_id);
	}).then((userDetails) => {
		data.profile = userDetails;
		return Promise.resolve(data);
	});
};
