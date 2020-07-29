const models = require("@modules/models");
const _ = require("lodash");

module.exports = function(req) {
	var data = {};

	return Promise.resolve().then(() => {
		return models.messaging.listThreads(req.user);
	}).then((items) => {
		data.threads = items;

		return Promise.resolve(data);
	});
};
