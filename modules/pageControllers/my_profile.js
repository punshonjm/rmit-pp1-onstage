const models = require("@modules/models");

module.exports = function(req) {
	var data = {};


	return Promise.resolve().then(() => {
		data.criteria = {};
		return models.users.details(req.user.user_id);
	}).then((userDetails) => {
		data.profile = userDetails;
		data.pageName = userDetails.display_name;
		return models.list.status.query();
	}).then((items) => {
		data.criteria.status = items;
		return models.list.gig_frequency.query();
	}).then((items) => {
		data.criteria.gig_frequency = items;
		return models.list.gender.query();
	}).then((items) => {
		data.criteria.gender = items;
		return models.list.commitment_level.query();
	}).then((items) => {
		data.criteria.commitment_level = items;
		return models.list.age_bracket.query();
	}).then((items) => {
		data.criteria.age_bracket = items;

		return Promise.resolve(data);
	});
};
