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
	var $header = $this.closest(".row").find(".my-profile-header");
	$header.find("span").remove();

	$(".editable." + target).hide();
	$(".editable." + target + "." + controls).show();

	if ( controls == "edit" ) {
		$(".editable." + target + ".view").find("[data-id]").each(function() {
			var id = $(this).prop("id").split("-data")[0];

			if ( $(this).hasClass("js-states") ) {
				$("#" + id).val($(this).val());
				$("#" + id).change();
			} else {
				$("#" + id).val($(this).data().id);
			}
		});
	}
};

appPage.editSave = function($this) {
	var target = $this.data().target;
	$this.prop("disabled", true);

	var $header = $this.closest(".row").find(".my-profile-header");
	$header.find("span").remove();

	var data = {}, errors = [];
	$(".editable." + target + ".edit").find("input, select").not(".js-states, .select2-search__field").each(function() {
		var isEmpty = ( $(this).val() == "" || $(this).val() == null) ? true : false;
		var notSame = ( $(this).val() != $("#" + $(this).prop("id") + "-data").data().id ) ? true : false;

		if ( !$(this).hasClass("select2-search__field") ) {
			if ( !isEmpty && notSame ) {
				data[ $(this).prop("id") ] = $(this).val();
			} else if ( $(this).hasClass("allowEmpty") && notSame ) {
				data[ $(this).prop("id") ] = "";
			} else {
				errors.push($(this).prop("id"));
				$(this).addError();
			}
		}
	});

	if ( $("#genres").is(":visible") ) {
		var currentGenres = $("#genres-data").val();
		if ( JSON.stringify(currentGenres) != JSON.stringify( $("#genres").val() ) ) {
			data.genres = $("#genres").val();
		}
	}
	if ( $("#instruments").is(":visible") ) {
		var currentinstruments = $("#instruments-data").val();
		if ( JSON.stringify(currentinstruments) != JSON.stringify( $("#instruments").val() ) ) {
			data.instruments = $("#instruments").val();
		}
	}

	if ( errors.length > 0 ) {
		$header.append("<span class='has-danger'>Please address the errors before saving again.</span>");
		$this.prop("disabled", false);
	} else {
		$.post("/api/user/update", data, function(res) {
			$this.prop("disabled", false);
			$header.append("<span class='d-block text-success'>" + res.message + "</span>");

			// res.user
			if ( Object.keys(res.user).length > 0 ) {
				Object.keys(res.user).map(function(key) {
					$("#" + key + "-data").text(res.user[key]);
					$("#" + key + "-data").data().id = res.user[key];
				});
			}

			// res.profile
			if ( Object.keys(res.profile).length > 0 ) {
				Object.keys(res.profile).map(function(key) {
					if ( key == "genres" || key == "instruments" ) {
						$("#" + id + "-data").val($("#" + key).val());
						$("#" + id + "-data").change();
					} else {
						$("#" + key + "-data").text(res.profile[key]);
						$("#" + key + "-data").data().id = res.profile[key];
					}
				});
			}
		}).fail(function(error) {
			$this.prop("disabled", false);

			if ( ("errorSet" in error.responseJSON) ) {
				$header.append("<span class='has-danger'>Please address the errors before saving again.</span>");

				error.responseJSON.errorSet.map(function(err) {
					if ( $("#" + err.key).length > 0 ) $("#" + err.key).addError("has-warning", err.error);
				});
			} else {
				$header.append("<span class='d-block text-danger'>" + error.responseJSON.message + "</span>");
			}
		});
	}
};
