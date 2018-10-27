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
					if (row.type_id === 1) {
					return '<a class="btn btn-disabled btn-sm btn-fab btn-round view-profile" role="button">' +
						'	<i class="material-icons">perm_identity</i>' +
						'</a> ' + data;
					} else {
					return '<a class="btn btn-primary btn-sm btn-fab btn-round view-profile" target="_blank" href="/user/' + data + '" role="button">' +
						'	<i class="material-icons">perm_identity</i>' +
						'</a> ' + data;
					}
				},
				"targets": 0
			},
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
						return '<button class="btn btn-rose btn-sm btn-fab btn-round view-report" data-target="#messageUser" rel="tooltip" title="" data-original-title="View Reports">\n' +
							'	<i class="material-icons">flag</i>' +
							'</button>';
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
				"defaultContent": "<button type=\"button\" class=\"btn btn-primary btn-sm settings\"><i class=\"material-icons\">settings</i></button>",
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

		if ($(this).hasClass('view-report')) {
			appPage.report(data);
		} else if ($(this).hasClass('settings')) {
			appPage.confirm('Menu','ID ' + data.id + ' has alllll the menu.');
		}


	});

	$('#report_table').DataTable({
		ajax: '/api/admin/user/report',
		serverSide: true,
		"deferLoading": 0,
		"columns": [
			{"data": "report_by"},
			{"data": "reason"},
			{"data": "report_date"},
			{"data": "actions"}
		],
		"columnDefs": [
			{
				"render": function (data, type, row) {
					return '<span href="#" class="d-inline-block" tabindex="0" data-toggle="tooltip" title="ID: ' + data + '\nEmail: ' + row.report_by_email + '">' + row.report_by_username + '</span>';
				},
				"targets": 0
			},
			{
				"targets": -1,
				"data": null,
				"defaultContent": "<button type=\"button\" class=\"btn btn-primary btn-sm settings\"><i class=\"material-icons\">settings</i></button>",
				"orderable": false
			}
		]
	});
	$('#report_table_filter').addClass("d-none");

};


appPage.report = function (data) {

	$('#report_table').DataTable().search(data.id).draw();
	$('#reportModal').modal('show');
}

appPage.confirm = function (title,message) {
	$('#confirmModalTitle').text(title);
	$('#confirmModalText').text(message);
	$('#confirmModal').modal('show');
}