var appPage = {};

$(document).ready(function() {
	appPage.initialise();
});

appPage.initialise = function() {
	let newRegister = (new URLSearchParams( document.location.search.substring(1) ).get("newRegister") == "yes") ? true : false;
	if ( newRegister ) $("#newRegister").modal("show");


	$('.select2-instrument').select2({
		theme: "material",
		disabled: true
	});
	$('.select2-genre').select2({
		theme: "material",
		disabled: true
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
		var instagram_user = $("#instagram_user-text").text();
		var twitter_user = $("#twitter_user-text").text();
		var facebook_user = $("#facebook_user-text").text();
		var youtube_user = $("#youtube_user-text").text();


		$("#instagram_user").val((instagram_user === "Not set") ? "" : instagram_user);
		$("#twitter_user").val((twitter_user === "Not set") ? "" : twitter_user);
		$("#facebook_user").val((facebook_user === "Not set") ? "" : facebook_user);
		$("#youtube_user").val((youtube_user === "Not set") ? "" : youtube_user);


	};

	$(".profile-view").toggle();
	$(".profile-edit").toggle();
});

$(".social-media-toggle").click(function () {

	if($(".social-media-edit").is(":hidden")) {
		var instagram_user = $("#instagram_user-text").text();
		var twitter_user = $("#twitter_user-text").text();
		var facebook_user = $("#facebook_user-text").text();
		var youtube_user = $("#youtube_user-text").text();


		$("#instagram_user").val((instagram_user === "Not set") ? "" : instagram_user);
		$("#twitter_user").val((twitter_user === "Not set") ? "" : twitter_user);
		$("#facebook_user").val((facebook_user === "Not set") ? "" : facebook_user);
		$("#youtube_user").val((youtube_user === "Not set") ? "" : youtube_user);


	};

	$(".social-media-view").toggle();
	$(".social-media-edit").toggle();
});

