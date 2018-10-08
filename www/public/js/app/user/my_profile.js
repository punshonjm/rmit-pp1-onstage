var appPage = {};

$(document).ready(function() {
	appPage.initialise();
}).on("click", ".editable-toggle", function() {
	appPage.editToggle($(this));
}).on("click", ".edit-save", function() {
	appPage.editSave($(this));
})

appPage.initialise = function() {
	let newRegister = (new URLSearchParams( document.location.search.substring(1) ).get("newRegister") == "yes") ? true : false;
	if ( newRegister ) $("#newRegister").modal("show");

	$('.select2-instrument-view').select2({
		theme: "material",
		disabled: true
	});

	$('.select2-genre-view').select2({
		theme: "material",
		disabled: true
	});

	$('.select2-instrument-edit').select2({
		placeholder: "Choose instruments...",
		ajax: {
			url: '/api/instrument/',
			data: function (params) {
				var query = {
					search: params.term
				};
				return query;
			}
		},
		theme: "material"
	});

	$('.select2-genre-edit').select2({
		placeholder: "Choose genres...",
		ajax: {
			url: '/api/genre/',
			data: function (params) {
				var query = {
					search: params.term
				};
				return query;
			}
		},
		theme: "material"
	});

	$(".select2-selection__arrow").addClass("material-icons").html("arrow_drop_down");
};

appPage.editToggle = function($this) {
	var target = $this.data().target;
	var controls = $this.data().controls;

	$(".editable." + target).hide();
	$(".editable." + target + "." + controls).show();

	if ( controls == "edit" ) {
		$(".editable." + target + ".view").find("[data-id]").each(function() {
			var id = $(this).prop("id").split("-data")[0];
			$("#" + id).val($(this).data().id);
		});
	}
};

appPage.editSave = function($this) {
	var target = $this.data().target;

	var data = {};
	$(".editable." + target + ".edit").find("input, select").each(function() {
		var isEmpty = ( $(this).val() == "" || $(this).val() == null) ? true : false;
		if ( !isEmpty ) {
			data[ $(this).prop("id") ] = $(this).val();
		}
	});

	$.post("/api/user/update", data, function(res) {


		// setTimeout(function() {
		// 	window.location = "/my_profile";
		// }, 500);
	}).fail(function(error) {


		if ( ("errorSet" in error.responseJSON) ) {
			error.responseJSON.errorSet.map(function(err) {
				if ( $("#" + err.key).length > 0 ) $("#" + err.key).addError("has-warning", err.error);
			});
		} else {
			$("").append("<span class='d-block text-danger'>" + error.responseJSON.message + "</span>");
		}
	});
}
