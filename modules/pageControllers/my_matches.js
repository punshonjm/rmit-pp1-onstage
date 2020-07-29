const models = require("@modules/models");
const _ = require("lodash");

module.exports = function(req) {
	var data = {};

	return Promise.resolve().then(() => {
		data.criteria = {};
		return models.users.match(req);
	}).then((matchData) => {
		data.match_count = matchData.matches.length;
		data.matches = matchData.matches;

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
