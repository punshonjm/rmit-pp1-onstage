var appPage = {};

$(document).ready(function() {
	appPage.initialise();
});

appPage.initialise = function() {
		var table = $('#user_table').DataTable( {
			ajax: '/api/admin/user/list',
			"serverSide": true,
			"columns": [
				{ "data": "id" },
				{ "data": "username" },
				{ "data": "email" },
				{ "data": "display_name" },
				{ "data": "type_id" },
				{ "data": "account_locked" },
				{ "data": "reports" },
				{ "data": "options" }
			],
			"columnDefs": [
				{
					"render": function ( data, type, row ) {
						if (data === 1) {
							return '<i class="material-icons">lock</i>';
						} else {
							return '<i class="material-icons">lock_open</i>';
						}
					},
					"targets": 5
				},
				{
					"render": function ( data, type, row ) {
						if (data > 0) {
							return '<b>' + data + '</b>';
						} else {
							return data;
						}
					},
					"targets": 6
				},
				{
					"render": function ( data, type, row ) {
						if (data === 1) {
							return 'Admin';
						} else if (data === 2) {
							return 'Band';
						} else if (data === 3) {
							return 'Musician';
						}
					},
					"targets": 4
				},
				{
					"targets": -1,
					"data": null,
					"defaultContent": "<button type=\"button\" class=\"btn btn-primary btn-sm\"><i class=\"material-icons\">settings</i></button>"
				}
			]
		});

	$('#user_table tbody').on( 'click', 'button', function () {
		var data = table.row( $(this).parents('tr') ).data();
		alert( 'All users except for ID ' + data.id + ' have been removed from the system. Database update complete.' );
	} );
};
