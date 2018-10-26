var appPage = {};

$(document).ready(function () {
	appPage.initialise();
});

appPage.initialise = function () {

	var table = $('#user_table').DataTable({
		ajax: '/api/admin/user/list',
		serverSide: true,
		"columns": [
			{"data": "id"},
			{"data": "username"},
			{"data": "email"},
			{"data": "display_name"},
			{"data": "user_type"},
			{"data": "account_locked"},
			{"data": "active_reports"},
			{"data": "reports"},
			{"data": "options"}
		],
		"columnDefs": [
			{
				"render": function (data, type, row) {
					if (data === 1) {
						return '<i class="material-icons text-danger">lock</i>';
					} else {
						return '<i class="material-icons">lock_open</i>';
					}
				},
				"targets": 5
			},
			{
				"render": function (data, type, row) {
					if (data > 0) {
						return '<i class="material-icons text-danger">flag</i>';
					} else {
						return '<i class="material-icons">outlined_flag</i>';
					}
				},
				"targets": 6
			},
			{
				"render": function (data, type, row) {
					if (data > 0) {
						return '<b>' + data + '</b>';
					} else {
						return data;
					}
				},
				"targets": 7
			},
			{
				"targets": -1,
				"data": null,
				"defaultContent": "<button type=\"button\" class=\"btn btn-primary btn-sm\"><i class=\"material-icons\">settings</i></button>",
				"orderable": false
			}//,
			//{ "visible": false,  "targets": [ 7 ] }
		]
	});

	function filterColumn(column, search) {
		table.column(column
		).search(search
		).draw();
	}

	$('input.table_filter').on('keyup click', function () {

		filterColumn($(this).attr('data-column'), (($(this).is(':checked')) ? $(this).attr('data-search') : ""));
	});

	$('#user_table tbody').on('click', 'button', function () {
		var data = table.row($(this).parents('tr')).data();
		alert('All users except for ID ' + data.id + ' have been removed from the system. Database update complete.');
	});

};

