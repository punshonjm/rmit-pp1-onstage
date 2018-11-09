$(document).ready(function() {
	$(".current-year").text(moment().format("YYYY"));
}).on("click", "#login", function() {
	app.login();
}).on("keyup", "#username", function(event) {
	if (event.keyCode == 13) $('#password').focus();
}).on("keyup", "#password", function(event) {
	if (event.keyCode == 13) app.login();
}).on("click", ".send-reset", function() {
	app.forgotPassword();
});

var app = {};
app.login = function() {
	$(".loginStatus").empty();
	$("#loginStatus").show();
	$("#loginForm").hide();
	$(".has-danger").removeClass("has-danger");

	var data = {
		username: $("#username").val(),
		password: $("#password").val(),
		_csrf: $('[name="_csrf"]').val(),
	};

	if ( String.isNullOrEmpty(data.username) || String.isNullOrEmpty(data.password) ) {
		if ( String.isNullOrEmpty(data.username) ) {
			$("#username").closest(".form-group").addClass("has-danger");
			$(".loginStatus").append("<p class='text-danger'>Username can't be blank!</p>");
		}
		if ( String.isNullOrEmpty(data.password) ) {
			$("#password").closest(".form-group").addClass("has-danger");
			$(".loginStatus").append("<p class='text-danger'>Password can't be blank!</p>");
		}
		setTimeout(function() {
			$("#loginStatus").hide();
			$("#loginForm").show();
		}, 500);
	} else {
		$.post("/login", data, function(res) {
			window.setTimeout(function() {
				window.location.reload();
			}, 250);
		}).fail(function(error) {
			setTimeout(function() {
				$("#loginStatus").hide();
				$("#loginForm").show();
			}, 500);
			if ( error.status == 401 && ("responseJSON" in error) ) {
				$(".loginStatus").append("<p class='text-danger'>" + error.responseJSON.message + "</p>");
			} else {
				console.log("Login Error", error);
			}
		});
	}
};
app.forgotPassword = function() {
	$(".send-reset").prop("disabled", true);
	$("#email").clearError();

	var data = {};
	data.reset = $("#email").val();

	if ( data.reset == "" || data.reset == null ) {
		$("#email").addError("has-danger", "Enter email/username to send reset.");
		$(".send-reset").prop("disabled", false);
		$(".send-reset").html("Send Reset");
	} else {
		$(".send-reset").html("Sending <i class='fa fa-spinner fa-spin'></i>");
		data._csrf = $('[name="__csrf"]').val();

		$.post("/api/user/password_reset", data, function(resp) {
			$(".send-reset").closest(".col-md-12").html("<p>Check your inbox/junk! If we found a user with the details you provided, we've sent the password reset link to their reigstered email address! This link will remain valid for 30 minutes only.");
		}).fail(function(error) {
			if ( ("responseJSON" in error) && ("message" in error.responseJSON) ) {
				$("#email").addError("has-danger", error.responseJSON.message);
			}

			$(".send-reset").prop("disabled", false);
			$(".send-reset").html("Send Reset");
		});
	}
};
