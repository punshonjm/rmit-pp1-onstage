var appPage = {};
appPage.data = {};
appPage.action = {};

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
				// ID Profile Column
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
				// Account Status Column
				"render": function (data, type, row) {
					if (data === 1) {
						return '<button class="btn btn-danger btn-sm btn-fab btn-round action" data-action="unlock">\n' +
							'	<i class="material-icons">lock</i>' +
							'</button>';
					} else {
						return '<button class="btn btn-success btn-sm btn-fab btn-round action" data-action="lock">\n' +
							'	<i class="material-icons">lock_open</i>' +
							'</button>';
					}
				},
				"targets": 5
			},
			{
				// View Report Column
				"render": function (data, type, row) {
					if (data > 0) {
						return '<button class="btn btn-danger btn-sm btn-fab btn-round view-report" data-target="#messageUser" rel="tooltip" title="" data-original-title="View Reports">\n' +
							'	<i class="material-icons">flag</i>' +
							'</button>';
					} else {
						return '<i class="material-icons">outlined_flag</i>';
					}
				},
				"targets": 6
			},
			{
				// Total Reports Column
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
				"render": function (data, type, row) {

					return '';
				},
				"orderable": false
			},
			{ "visible": false,  "targets": [ 8 ] }
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
		var action = $(this).data().action;
		if ($(this).hasClass('view-report')) {
			appPage.report(data);
		} else if ($(this).hasClass('action')) {
			appPage.actionModal(data,action);
		} else if ($(this).hasClass('settings')) {
			appPage.confirm('Menu','ID ' + data.id + ' has alllll the menu.');
		}


	});

	$('#report_table').DataTable({
		ajax: '/api/admin/user/report',
		serverSide: true,
		"deferLoading": 0,
		"pageLength": 5,
		"columns": [
			{"data": "id"},
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
				"targets": 1
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
	$('#report_table_length').addClass("d-none");
	$( "#actionSubmit").click(function() {appPage.submit()} );

};


appPage.report = function (data) {

	$('#report_table').DataTable().search(data.id).draw();
	$('#reportUserInfo').text(data.username + ' (ID: ' + data.id + ')');
	$('#reportModal').modal('show');
}

appPage.actionModal = function (data,action) {

	appPage.data = data;
	appPage.action = action;

	$(".actionStatus").closest(".row").hide();
	$("#actionReason").val('');

	if (action === 'unlock') {
		$('#actionModalTitle').text('Enable User - ' + data.username + ' (ID: ' + data.id + ')');
		$('#actionModalText').text('You are about to enable the user account.');
	} else if (action === 'lock') {
		$('#actionModalTitle').text('Suspend User - ' + data.username + ' (ID: ' + data.id + ')');
		$('#actionModalText').text('You are about to suspend the user account.');
	}

	$('#actionModal').modal('show');
}

appPage.submit = function($this) {
	var data = {};
	data.user_id = appPage.data.id;
	data.actionReason = ($("#actionModal").find("#actionReason").val().trim());
	data.action = appPage.action;

	$(".actionStatus").closest(".row").show();
	$("#actionSubmit").prop("disabled", true);

	if ( String.isNullOrEmpty(data.actionReason) ) {
		$("#actionReason").closest(".row").show();
		$( "#actionSubmit").prop("disabled", false);
		$(".actionStatus").append("<p class='text-danger'>Please provide a description or a reason.</p>");
	} else {
		$(".actionStatus").text('');
		$.post("/api/admin/user/" + data.action, data, function(res) {
			$('#user_table').DataTable().draw();
			$('#actionModal').modal('hide');
			$("#actionSubmit").prop("disabled", false);
		}).fail(function(error) {
			$("#actionReason").closest(".row").show();
			$("#actionSubmit").prop("disabled", false);
			if ( error.status == 401 && ("responseJSON" in error) ) {
				$(".actionStatus").append("<p class='text-danger'>" + error.responseJSON.message + "</p>");
			} else {
				$(".actionStatus").append("<p class='text-danger'>Something went wrong! Please try again.</p>");
			}
		});
	}
};


appPage.confirm = function (title,message) {
	$('#confirmModalTitle').text(title);
	$('#confirmModalText').text(message);
	$('#confirmModal').modal('show');
}