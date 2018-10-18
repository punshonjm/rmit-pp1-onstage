var appPage = {};

appPage.initialise = function() {

	$('.select2-postcode').select2({
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
};

appPage.register = function($this) {
	$this.prop("disabled", true);
	$(".has-danger").removeClass("has-danger");
	$("label.text-danger, select.text-danger").removeClass("text-danger");
	$(".form-status").removeClass("text-danger text-success").empty();
	$(".form-text").text("");

	var data = {}, errors = [];
	var required = [
		"display_name", "postcode", "music_experience",
		"username", "email", "password", "passwordConfirm",
		"past_gigs", "commitment_level", "gig_frequency", "agree"
	];

	data.type = window.app.data.formType;
	if ( data.type == "band" ) {
		required.push( "bandSize", "preferred_age_bracket", "required_music_experience", "members_needed" );
	} else {
		required.push( "age_bracket");
	}

	data.display_name = $('#display_name').val();
	data.age_bracket = $('#age_bracket').val();
	data.username = $('#username').val();
	data.email = $('#email').val();
	data.password = $('#password').val();
	data.passwordConfirm = $('#passwordConfirm').val();
	data.postcode = $('#postcode').val();

	data.aboutMe = $('#aboutMe').val();
	data.music_experience = $('#music_experience').val();
	data.instruments = $('#instruments').val();
	data.genre = $('#genre').val();
	data.past_gigs = $('#past_gigs').val();
	data.commitment_level = $('#commitment_level').val();
	data.gig_frequency = $('#gig_frequency').val();
	data.agree = $('#agree:checked').val();

	// Band specific options
	if ( data.type == "band" ) {
		data.band_size = $("#bandSize").val();
		data.preferred_age_bracket = $("#preferred_age_bracket").val();
		data.required_music_experience = $("#required_music_experience").val();
		data.members_needed = $("#members_needed").val();
		data.required_past_gigs = $('#required_past_gigs').val();
		data.required_commitment_level = $('#required_commitment_level').val();
		data.required_gig_frequency = $('#required_gig_frequency').val();
	}

	// Process into form data to support adding
	var formData = new FormData( $(".register-form")[0] );
	Object.keys(data).map(function(key) {
		if ( (data[key] != null) && (data[key] != "") && (typeof data[key] != typeof undefined) ) {
			formData.append(key, data[key]);
		} else {
			if ( required.includes(key) ) {
				errors.push(key);
			}
		}
	});

	// add name check
	if ( ("display_name" in data) && data.display_name.length < 3 ) {
		$('#display_name').addError("has-danger", "Please enter at least 3 characters");
		errors.push("display_name");
	}

	// add username check
	if ( ("username" in data) && data.username.length < 5 ) {
		$('#username').addError("has-danger", "Please enter at least 5 characters");
		errors.push("username");
	}

	// Username character check
	if ( !/^[a-zA-Z0-9]+[a-zA-Z0-9_.-]*$/.test(data.username) ) {
		$('#username').addError("has-danger", "Please enter letters, numbers, '_', '.' or '-' only. Do not start with any of the special characters.");
		errors.push("username");
	}

	// email check
	if ( !/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}/.test(data.email) ) {
		$("#email").addError("has-danger", "Please enter a valid email address.");
		errors.push("email");
	}

	// add post code check
	if ( ("postcode" in data) && !/^[0-9]+$/.test(data.postcode) ) {
		$('#postcode').addError("has-danger", "A postcode consists of 4 numbers.");
		errors.push("postcode");
	}

	// add gender check
	if ( typeof $("[name='gender']:checked").val() == typeof undefined ) {
		$("[name='gender']").closest("label").addClass("text-danger");
		$("[name='gender']").closest(".form-group").find("label").addClass("text-danger");
		errors.push("gender");
	}

	// add status check
	if ( typeof $("[name='status']:checked").val() == typeof undefined ) {
		$("[name='status']").closest("label").addClass("text-danger");
		$("[name='status']").closest(".form-group").find("label").addClass("text-danger");
		errors.push("status");
	}

	// add agree check
	if ( typeof $("[name='agree']:checked").val() == typeof undefined ) {
		 $("[name='agree']").closest("label").addClass("text-danger");
		 errors.push("agree");
		 $(".form-status").addClass("text-danger").append("<span class='d-block'>You must agree to continue using On Stage.</span>");
	}

	if ( data.instruments.length == 0 ) {
		errors.push("instruments");
		$("#instruments").closest(".form-group").find("label").addClass("text-danger");
		$("#instruments").closest(".form-group").find("input").addClass("text-danger");
	}

	if ( data.genre.length == 0 ) {
		errors.push("genre");
		$("#genre").closest(".form-group").find("label").addClass("text-danger");
		$("#genre").closest(".form-group").find("input").addClass("text-danger");
	}

	if ( data.age_bracket == "" ) {
		errors.push("age_bracket");
		$("#age_bracket").closest(".form-group").find("label").addClass("text-danger");
		$("#age_bracket").closest(".form-group").find("select").addClass("text-danger");
	}
	if ( data.music_experience == "" ) {
		errors.push("music_experience");
		$("#music_experience").closest(".form-group").find("label").addClass("text-danger");
		$("#music_experience").closest(".form-group").find("select").addClass("text-danger");
	}
	if ( data.past_gigs == "" ) {
		errors.push("past_gigs");
		$("#past_gigs").closest(".form-group").find("label").addClass("text-danger");
		$("#past_gigs").closest(".form-group").find("select").addClass("text-danger");
	}
	if ( data.commitment_level == "" ) {
		errors.push("commitment_level");
		$("#commitment_level").closest(".form-group").find("label").addClass("text-danger");
		$("#commitment_level").closest(".form-group").find("select").addClass("text-danger");
	}
	if ( data.gig_frequency == "" ) {
		errors.push("gig_frequency");
		$("#gig_frequency").closest(".form-group").find("label").addClass("text-danger");
		$("#gig_frequency").closest(".form-group").find("select").addClass("text-danger");
	}

	// Check password is strong & confirmed before allowing submission
	if ( !appPage.password.confirm() || !appPage.password.strength() ) {
		errors.push("passwordConfirm", "password");
	}

	if (errors.length > 0) {
		errors.map(function(key) {
			$("#" + key).addError();
		});

		$this.prop("disabled", false);
		$(".form-status").addClass("text-danger").append("<span class='d-block'>There was an error/s with your submission,<br> please check the highlighted fields and try again.</span>");
	} else {
		// add response error handling & loading indicators
		$(".loading-indicator").find(".loading-status").text("Warming up...");
		$(".loading-indicator").show();

		$.ajax({
			type: "POST",
			url: "/api/user/register",
	        enctype: 'multipart/form-data',
			cache: false,
	        contentType: false,
	        processData: false,
			data: formData
		}).done(function() {
			$(".loading-indicator").find(".loading-status").text("All set. Let's go!");
			setTimeout(function() {
				window.location.href = "/my_profile?newRegister=yes";
			}, 500);
		}).fail(function(error) {
			$this.prop("disabled", false);
			$(".loading-indicator").find(".loading-status").text("");
			$(".loading-indicator").hide();

			if ( error.status == 413 ) {
				$(".form-status").addClass("text-danger").append("<span class='d-block'>The images you are trying to upload are too large, please upload smaller images.</span>");
			}
			else if ( error.status == 400 && ("errorSet" in error.responseJSON) ) {
				$(".form-status").addClass("text-danger");

				error.responseJSON.errorSet.map(function(err) {
					if ( $("#" + err.key).length > 0 ) {
						$("#" + err.key).addError("has-warning", err.error);
						$("#" + err.key).get(0).scrollIntoView();;
					} else {
						$(".form-status").append("<span class='d-block'>" + err.error + "</span>");
					}
				});
			} else {
				$(".form-status").addClass("text-danger").text(error.responseJSON.message);
			}
		});
	}
}

appPage.password = {};
appPage.password.confirm = function() {
	$(".password").closest(".form-group.has-danger").removeClass("has-danger");
	$(".password-status").removeClass("text-danger text-success").text("");

	if ( $("#passwordConfirm").val().length > 0 ) {
		if ( $("#password").val() != $("#passwordConfirm").val() ) {
			$("#password").addError();
			$("#passwordConfirm").addError();
			$(".password-status").addClass("text-danger").text("Passwords do not match!");
			return false;
		} else {
			$(".password-status").addClass("text-success").text("Passwords match.");
			return true;
		}
	} else {
		return false;
	}
};
appPage.password.strength = function() {
	$(".password-strength").text("");
	var strength = zxcvbn($("#password").val());

	// show pwd strength strength.score
	$(".password-meter").empty();
	$(".password-meter").append("<span></span>");
	$(".password-meter span").addClass("strength-" + strength.score);

	if ( strength.score < 3 ) {
		$("#password").addError();
		$(".password-strength").append("<span class='d-block text-danger'>Please choose a stronger password.</span>");

		if ( strength.feedback.warning != null ) {
			$(".password-strength").append("<span class='d-block text-danger'>"+strength.feedback.warning+"</span>");
		}

		if ( strength.feedback.suggestions.length > 0 ) {
			strength.feedback.suggestions.map(function(suggestion) {
				$(".password-strength").append("<span class='d-block text-warning'>"+suggestion+"</span>");
			});
		}

		return false;
	} else {
		$(".password-strength").text("Good choice!");
		return true;
	}
};
appPage.email = function($this) {
	$this.mailcheck({
		suggested: function(element, suggestion) {
			$("#email").addError("has-warning", "<span class='suggestion' data-suggestion='" + suggestion.full + "'>Did you mean " + suggestion.full + "?");
		},
		empty: function(element) {
			$("#email").clearError();
		}
	});
};

$(document).ready(function() {
	appPage.initialise();
}).on("submit", ".register-form", function(e) {
	e.preventDefault;
	$("#submit").click();
	return false;
}).on("click", "#submit", function() {
	appPage.register( $(this) );
}).on("keyup focusout", "#password", function() {
	appPage.password.strength();
}).on("keyup focusout", "#passwordConfirm, #password", function() {
	appPage.password.confirm();
}).on('blur', '#email', function() {
	appPage.email($(this));
}).on("click", "[data-suggestion]", function() {
	$("#email").val($(this).data().suggestion).blur();
});
