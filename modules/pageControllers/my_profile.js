const models = require("@modules/models");

module.exports = function(req) {
	var data = {};

	return Promise.resolve().then(() => {
		return models.users.details();
	}).then((s) => {
		data.state = s;
		return Promise.resolve(data);
	})
};
