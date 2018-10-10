var appPage = {};

$(document).ready(function() {
	appPage.initialise();
}).on("click", ".editable-toggle", function() {
	appPage.editToggle($(this));
}).on("click", ".edit-save", function() {
	appPage.editSave($(this));
}).on("submit", "form", function(e) {
	e.preventDefault;
	return false;
}).on("hidden.bs.modal", ".image-edit", function() {
	$(this).find(".fileinput").fileinput("reset");
}).on("click", ".save-image", function() {
	appPage.updateImage($(this));
}).on("click", ".remove-image", function() {
	appPage.removeImage($(this));
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
	$(".editable." + target + ".edit").find("input, select, textarea").not(".js-states, .select2-search__field").each(function() {
		var isEmpty = ( $(this).val() == "" || $(this).val() == null) ? true : false;
		var notSame = ( $(this).val() != $("#" + $(this).prop("id") + "-data").data().id ) ? true : false;

		if ( !$(this).hasClass("select2-search__field") ) {
			if ( !isEmpty && notSame ) {
				data[ $(this).prop("id") ] = $(this).val();
			} else if ( $(this).hasClass("allowEmpty") && notSame ) {
				data[ $(this).prop("id") ] = "";
			} else if ( !notSame ) {
				// No action
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

	if ( Object.keys(data).length == 0 ) {
		$header.append("<span class='has-danger'>You haven't made any changes.</span>");
		$this.prop("disabled", false);
	} else if ( errors.length > 0 ) {
		console.log(errors);
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
						$("#" + key + "-data").val([]);
						$("#" + key + "-data").val( data[key] );
						$("#" + key + "-data").change();
					} else {
						$("#" + key + "-data").text(res.profile[key]);
						$("#" + key + "-data").data().id = res.profile[key];
					}
				});
			}

			$this.closest(".editable").find("[data-controls='view']").click();
		}).fail(function(error) {
			$this.prop("disabled", false);

			if ( ("errorSet" in error.responseJSON) ) {
				$header.append("<p class='has-danger'>Please address the errors before saving again.</p>");

				error.responseJSON.errorSet.map(function(err) {
					if ( $("#" + err.key).length > 0 ) $("#" + err.key).addError("has-warning", err.error);
				});
			} else {
				$header.append("<p class='d-block text-danger'>" + error.responseJSON.message + "</p>");
			}
		});
	}
};

appPage.updateImage = function($this) {
	var type = $this.data().id;
};
appPage.removeImage = function($this) {
	$this.closest(".modal").find("button").prop("disabled", true);
	var type = $this.data().id;

	var data = {};
	data["remove_" + type] = "remove";

	$.post("/api/user/update", data, function(res) {
		$this.closest(".modal").find("button").prop("disabled", false);
		$this.closest(".modal").modal("hide");

		$this.closest(".modal").find(".fileinput .fileinput-new img").prop("src", $this.data().remove);
		if ( type == "picture" ) {
			$(".image-" + type).prop("src", $this.data().remove);
		}
		if ( type == "background" ) {
			$(".image-" + type).css("background-image", "url('" + $this.data().remove + "')");
		}

		$this.closest(".modal").find(".fileinput").fileinput("reset");
	}).fail(function(error) {
		$this.closest(".modal").find("button").prop("disabled", false);
		$this.closest(".modal").find(".response").append("<p class='d-block text-danger'>" + error.responseJSON.message + "</p>");
	});
};
