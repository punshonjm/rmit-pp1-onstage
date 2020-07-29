const models = require("@modules/models");
const _ = require("lodash");

module.exports = function(req) {
	var data = {};

	return Promise.resolve().then(() => {
		data.criteria = {};
		return models.users.details(req.user.user_id);
	}).then((userDetails) => {
		data.profile = _.cloneDeep(userDetails);
		data.pageName = userDetails.display_name;

		return models.users.match(userDetails);
	}).then((matchData) => {
		// Limit to 10 matches for profile page
		data.match_count = matchData.matches.length;
		data.matches = _.slice(matchData.matches, 0, 4);

		return models.list.status.query();
	}).then((items) => {
		data.criteria.status = items;
		return models.list.instrument.query();
	}).then((items) => {
		let instruments = data.profile.instruments.map((i) => i.instrument_id);

		data.criteria.instruments = items.filter((item) => {
			return ( !instruments.includes(item.id) ) ? true : false;
		});

		return models.list.genre.query();
	}).then((items) => {
		let genres = data.profile.genres.map((g) => g.genre_id);
		data.criteria.genres = items.filter((item) => {
			return ( !genres.includes(item.id) ) ? true : false;
		});

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
