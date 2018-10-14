const models = require("@modules/models");

module.exports = function(req) {
	var data = {};

	return Promise.resolve(data).then(() => {
		data.criteria = {};
		return models.users.details(req.user.user_id);
	}).then((userDetails) => {
		data.profile = userDetails;
		data.pageName = userDetails.display_name;
		return models.list.status.query();
	}).then((items) => {
		data.criteria.status = items;
		return models.list.instrument.query();
	}).then((items) => {
		data.criteria.instruments = items;
		return models.list.genre.query();
	}).then((items) => {
		data.criteria.genres = items;
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
		return models.list.past_gig.query();
	}).then((items) => {
		data.criteria.past_gig = items;
		return models.list.music_experience.query();
	}).then((items) => {
		data.criteria.music_experience = items;

		return Promise.resolve(data);
	});
};
