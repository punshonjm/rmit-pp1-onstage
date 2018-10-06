var resetPassword = {};

resetPassword.changePassword = function() {
	$(".change_password").prop("disabled", true);
	$("#password_confirm_new, #password_new, #current_password").clearError();
	$(".change_password_status").empty();

	$(".change_password_buttons").hide();
	$(".change_password_pending").show();

	var data = {};
	data.current = $("#current_password").val();
	data.password = $("#password_new").val();
	data.passwordConfirm = $("#password_confirm_new").val();

	if ( !pageApp.changePassword.confirm() ) {
		$(".change_password").prop("disabled", false);
		$("#password_confirm_new").addError("has-danger", "Passwords must match!");
	} else if ( !pageApp.changePassword.strength() ) {
		$(".change_password").prop("disabled", false);
		$("#password_new").addError("has-danger", "Make sure your new password is strong enough!");
	} else if ( data.current == "" || data.current == null ) {
		$(".change_password").prop("disabled", false);
		$("#current_password").addError("has-danger", "You must provide your current password!");
	} else {
		$.post("/api/user/set_password", data, function(res) {
			$("#current_password").val("");
			$("#password_new").val("");
			$("#password_confirm_new").val("");

			$(".change_password_status").append("<span class='d-block text-success'>" + res.message + "</span>");

			setTimeout(function() {
				window.location = "/my_profile";
			}, 500);
		}).fail(function(error) {
			$(".change_password").prop("disabled", false);
			$(".change_password_buttons").show();
			$(".change_password_pending").hide();

			if ( ("errorSet" in error.responseJSON) ) {
				error.responseJSON.errorSet.map(function(err) {
					if ( $("#" + err.key).length > 0 ) $("#" + err.key).addError("has-warning", err.error);
				});
			} else {
				$(".change_password_status").append("<span class='d-block text-danger'>" + error.responseJSON.message + "</span>");
			}
		});
	}
};
resetPassword.changePassword.confirm = function() {
	$("#password_confirm_new").clearError();

	if ( $("#password_confirm_new").val().length > 0 ) {
		if ( $("#password_new").val() != $("#password_confirm_new").val() ) {
			$("#password_new").addError();
			$("#password_confirm_new").addError("has-danger");
			$("#password_confirm_new .form-text").append("<span class='d-block text-danger'>Passwords do not match!</span>");
			return false;
		} else {
			$("#password_confirm_new .form-text").append("<span class='d-block text-success'>Passwords .</span>");
			return true;
		}
	} else {
		return false;
	}
};
resetPassword.changePassword.strength = function() {
	$("#password_new").clearError();
	var strength = zxcvbn($("#password_new").val());

	// show password strength: strength.score
	$(".password-meter").empty();
	$(".password-meter").append("<span></span>");
	$(".password-meter span").addClass("strength-" + strength.score);

	if ( strength.score < 3 ) {
		$("#password_new").addError();
		$("#password_new .form-text").append("<span class='d-block text-danger'>Please choose a stronger password.</span>");

		if ( strength.feedback.warning != null ) {
			$("#password_new .form-text").append("<span class='d-block text-danger'>"+strength.feedback.warning+"</span>");
		}

		if ( strength.feedback.suggestions.length > 0 ) {
			strength.feedback.suggestions.map(function(suggestion) {
				$("#password_new .form-text").append("<span class='d-block text-warning'>"+suggestion+"</span>");
			});
		}

		return false;
	} else {
		$("#password_new .form-text").append("<span class='d-block text-success'>Good choice!</span>");
		return true;
	}
};

$(document).ready(function() {

}).on("click", ".set_new_password", function() {
	resetPassword.changePassword();
}).on("keyup focusout", "#password_new", function() {
	resetPassword.changePassword.strength();
}).on("keyup focusout", "#password_new, #password_confirm_new", function() {
	resetPassword.changePassword.confirm();
});
