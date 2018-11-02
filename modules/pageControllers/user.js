const models = require("@modules/models");

module.exports = function (req) {
	var data = {};

	return Promise.resolve().then(() => {
		return models.users.details(req.params.id);
	}).then((userDetails) => {

		// Should we be displaying the profile?
		data.user_visible = 1;
		if (userDetails.account_locked === 1 || userDetails.email_verified === 0) {
			data.user_visible = 0;
		}

		// Show if profile is visible or requesting user is an admin
		if ((data.user_visible === 1) || (req.user.type_id === 1 && req.user.account_locked === 0)) {
			data.profile = userDetails;
			data.pageName = userDetails.display_name;
			data.user_id = req.user.user_id;
		} else {
			data.profile = null;
			data.pageName = "Unknown";
			data.user_id = req.user.user_id;
		}
		return Promise.resolve(data);
	});
};
