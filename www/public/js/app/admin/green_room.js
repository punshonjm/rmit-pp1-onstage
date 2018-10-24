var appPage = {};

$(document).ready(function() {
	appPage.initialise();
});

appPage.initialise = function() {
		$('#user_table').DataTable( {
			ajax: '/api/admin/user/list',
			"serverSide": true,
			"columns": [
				{ "data": "id" },
				{ "data": "username" },
				{ "data": "display_name" },
				{ "data": "type_id" },
				{ "data": "account_locked" },
				{ "data": "reports" }
			]
		});
};
