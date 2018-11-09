var pageApp = {};
window.app = {};
window.app.data = {};

window.app.templates = {};
window.app.templates.load = function(template) {
	$.get("/public/templates/" + template.path + ".mustache?_="+moment().format("x"), function(templateSrc) {
		var compile = Handlebars.compile(templateSrc);
		window.app.templates[template.name] = function(data = {}) {
			var html = compile(data);
			return html;
		};
	});
}
window.app.templates.loadArray = function(templateArray) {
	templateArray.map(function(template) {
		window.app.templates.load(template);
	});
}

pageApp.resendVerification = function() {
	$("#resendVerification").prop("disabled", true);
	$(".verify_link").html("<span>Sending <i class='fa fa-spinner fa-spin'></i></span>");

	$.get("/api/user/new_verification", function(res) {
		$(".verify_link").html("<span class='alert-link'>New link sent!</span>");
	}).fail(function() {
		$(".verify_link").html('<span id="resendVerification" class="alert-link" style="cursor: pointer;">Resend</span>');
	});
};

pageApp.changePassword = function() {
	$(".change_password").prop("disabled", true);
	$("#password_confirm_new, #password_new, #current_password").clearError();
	$(".change_password_status").empty();

	$(".change_password_buttons").hide();
	$(".change_password_pending").show();

	var data = {};
	data.current = $("#current_password").val();
	data.password = $("#password_new").val();
	data.passwordConfirm = $("#password_confirm_new").val();
	data._csrf = $('[name="_csrf"]').val();

	if ( data.current == "" || data.current == null ) {
		$(".change_password").prop("disabled", false);
		$("#current_password").addError("has-danger", "You must provide your current password!");

		$(".change_password").prop("disabled", false);
		$(".change_password_buttons").show();
		$(".change_password_pending").hide();
	} else if ( !pageApp.changePassword.confirm() ) {
		$(".change_password").prop("disabled", false);
		$("#password_confirm_new").addError("has-danger", "Passwords must match!");

		$(".change_password").prop("disabled", false);
		$(".change_password_buttons").show();
		$(".change_password_pending").hide();
	} else if ( !pageApp.changePassword.strength() ) {
		$(".change_password").prop("disabled", false);
		$("#password_new").addError("has-danger", "Make sure your new password is strong enough!");

		$(".change_password").prop("disabled", false);
		$(".change_password_buttons").show();
		$(".change_password_pending").hide();
	} else {
		$.post("/api/user/change_password", data, function(res) {
			$("#current_password, #password_new, #password_confirm_new").val("");
			$("#change_password_modal .modal-body .container").hide();

			$("#change_password_modal .modal-body").append("<p class='post-save-text'><span class='d-block text-success'>" + res.message + "</span></p>");
		}).fail(function(error) {
			$(".change_password").prop("disabled", false);
			$(".change_password_buttons").show();

			if ( ("errorSet" in error.responseJSON) ) {
				error.responseJSON.errorSet.map(function(err) {
					if ( $("#" + err.key).length > 0 ) $("#" + err.key).addError("has-warning", err.error);
				});
			} else {
				$(".change_password_status").append("<span class='d-block text-danger'>" + error.responseJSON.message + "</span>");
			}
		}).always(function() {
			$(".change_password_pending").hide();
		});
	}
};
pageApp.changePassword.confirm = function() {
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
pageApp.changePassword.strength = function() {
	$("#password_new").clearError();
	var strength = zxcvbn($("#password_new").val());
	var $pwdNew = $("#password_new").closest(".form-group").find(".form-text");

	// show password strength: strength.score
	$(".password-meter").empty();
	$(".password-meter").append("<span></span>");
	$(".password-meter span").addClass("strength-" + strength.score);

	if ( strength.score < 2 ) {
		$("#password_new").addError();
		$pwdNew.append("<span class='d-block text-danger'>Please choose a stronger password.</span>");

		if ( strength.feedback.warning != null ) {
			$pwdNew.append("<span class='d-block text-danger'>"+strength.feedback.warning+"</span>");
		}

		if ( strength.feedback.suggestions.length > 0 ) {
			strength.feedback.suggestions.map(function(suggestion) {
				$pwdNew.append("<span class='d-block text-warning'>"+suggestion+"</span>");
			});
		}

		return false;
	} else {
		$pwdNew.append("<span class='d-block text-success'>Good choice!</span>");
		return true;
	}
};
pageApp.changePassword.resetModal = function() {
	console.log('reset');
	$("#change_password_modal .post-save-text").remove();
	$("#current_password, #password_new, #password_confirm_new").val("");
	$("#current_password, #password_new, #password_confirm_new").clearError();
	$(".password-meter").empty();

	$("#change_password_modal .modal-body .container").show();

	$("#change_password_modal .change_password_buttons").show();
	$("#change_password_modal .change_password_pending").hide();
}

pageApp.logout = function() {
	$.get("/logout").always(function() {
		window.location.reload();
	});
};

pageApp.setup = function() {
	$(".modal").appendTo("body");
};

$(document).ready(function() {
	pageApp.setup();
}).on("click", "#logout", function() {
	pageApp.logout();
}).on("click", "#resendVerification", function() {
	pageApp.resendVerification();
}).on("click", ".change_password", function() {
	pageApp.changePassword();
}).on("keyup focusout", "#password_new", function() {
	pageApp.changePassword.strength();
}).on("keyup focusout", "#password_new, #password_confirm_new", function() {
	pageApp.changePassword.confirm();
}).on("hidden.bs.modal", "#change_password_modal", function() {
	pageApp.changePassword.resetModal();
})

// Add additional global functions
if (!String.isNullOrEmpty) {
    Object.defineProperty(String, "isNullOrEmpty", {
        value: function(value) {
            return !(typeof value === 'string' && value.length > 0);
        },
        enumerable: false,
    });
}

(function ( $ ) {
    $.fn.addError = function(error = "has-danger", text = null) {
        this.closest(".form-group").addClass(error);

		if ( text != null ) {
			this.closest(".form-group").find(".form-text").html(text);
		}

        return this;
    };
    $.fn.clearError = function() {
        this.closest(".form-group").removeClass("has-danger has-warning");
		this.closest(".form-group").find(".form-text").empty();
        return this;
    };
}( jQuery ));
