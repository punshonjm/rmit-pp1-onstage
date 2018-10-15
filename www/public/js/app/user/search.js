var appPage = {};

appPage.initialise = function() {

	$('.select2-postcode_id').select2({
		minimumInputLength: 2,
		placeholder: "Enter postcode or suburb...",
		ajax: {
			url: '/api/postcode/',
			data: function (params) {
				var query = {
					search: params.term
				};
				return query;
			}
		},
		theme: "material"
	});

	$('.select2-instrument').select2({
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

	$('.select2-genre').select2({
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

	window.app.templates.load({ path: "user/searchRow", name: "row" });
};

appPage.search = function($this) {
	$this.prop("disabled", true);
	$("#search-results").empty();

	var data = {};

	data.type_id = $("#type_id").val();
	data.postcode_id = $("#postcode_id").val();
	data.postcode_radius = $("#postcode_radius").val();
	data.instruments = $("#instruments").val();
	data.genre = $("#genre").val();
	data.preferred_age_bracket_id = $("#preferred_age_bracket").val();
	data.music_experience_id = $("#music_experience").val();
	data.past_gigs_id = $("#past_gigs").val();
	data.required_gig_frequency_id = $("#required_gig_frequency").val();
	data.required_commitment_level_id = $("#required_commitment_level").val();


	Object.keys(data).map(function(key) {
		if ( (typeof data[key] == typeof undefined) || (data[key] == null) || (data[key] == "") ) delete data[key];
	});

	if ( Object.keys(data).length == 0 ) {
		$this.prop("disabled", false);
		console.log("no search terms");
		// Error about not using any terms
	} else {
		$(".loading-indicator").find(".loading-status").text("Looking around...");
		$(".loading-indicator").show();

		$.post("/api/user/search", data, function(resp) {
			$(".loading-indicator").find(".loading-status").text("Lets see who we've found!");

			resp.results.users.map(function(user) {
				let html = window.app.templates.row(user);
				$("#search-results").append(html);
			});

			appPage.toggleStyle($(".toggle-style"), false);
		}).fail(function(error) {
			console.log(error.responseJSON);
			$(".loading-indicator").find(".loading-status").text(error.responseJSON.message);

		}).always(function() {
			$this.prop("disabled", false);

			setTimeout(function() {
				$(".loading-indicator").hide();
				$(".loading-indicator").find(".loading-status").text("");
			}, 500);
		});
	}
};

appPage.toggleStyle = function($this, toggle = true) {
	// Update button
	var style = null;
	if ( toggle ) {
		style = ($this.data().style == "lines") ? "grid" : "lines";
		$this.find("i").hide();
		$this.find("i.view-" + style).show();
		$this.data("style", style);
	} else {
		style = $this.data().style;
	}

	if ( style == "grid" ) {
		$("#search-results").find(".match").each(function() {
			$(this).addClass("col-md-3").removeClass("col-md-12");
			$(this).find(".description").hide();
			$(this).find(".grid-item").show();
		});
	} else if ( style == "lines" ) {
		$("#search-results").find(".match").each(function() {
			$(this).removeClass("col-md-3").addClass("col-md-12");
			$(this).find(".description").show();
			$(this).find(".grid-item").hide();
		});
	}
};

$(document).ready(function() {
	appPage.initialise();
}).on("click", ".search-button", function() {
	appPage.search($(this));
}).on("click", ".toggle-style", function() {
	appPage.toggleStyle($(this));
})
