var appPage = {};

$(document).ready(function() {
	appPage.initialise();
});

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


$(".account-toggle").click(function () {

	if($(".account-edit").is(":hidden")) {
		var username = $("#username-text").text();
		var email = $("#email-text").text();

		$("#username").val(username);
		$("#email").val(email);

	};

	$(".account-view").toggle();
	$(".account-edit").toggle();
});



$(".profile-toggle").click(function () {

	if($(".profile-edit").is(":hidden")) {

		"commitment_level"

		var commitment_level_id = $("#commitment_level_id-view").data("id");
		$("#commitment_level_id").val(commitment_level_id);

		var gig_frequency_id = $("#gig_frequency_id-view").data("id");
		$("#gig_frequency_id").val(gig_frequency_id);

		var age_bracket_id = $("#age_bracket_id-view").data("id");
		$("#age_bracket_id").val(age_bracket_id);



	};

	$(".profile-view").toggle();
	$(".profile-edit").toggle();
});

$(".social-media-toggle").click(function () {

	if($(".social-media-edit").is(":hidden")) {
		var instagram_user = $("#instagram_user-data").data("id");
		var twitter_user = $("#twitter_user-data").data("id");
		var facebook_user = $("#facebook_user-data").data("id");
		var youtube_user = $("#youtube_user-data").data("id");


		$("#instagram_user").val(instagram_user);
		$("#twitter_user").val(twitter_user);
		$("#facebook_user").val(facebook_user);
		$("#youtube_user").val(youtube_user);


	};

	$(".social-media-view").toggle();
	$(".social-media-edit").toggle();
});

