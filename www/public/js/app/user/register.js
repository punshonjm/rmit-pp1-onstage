var appPage = {};

appPage.initialise = function() {
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
	// $this.prop("disabled", true);

	var data = {}, errors = [];
	var required = [
		"name", "age_bracket",
		"username", "email", "password", "passwordConfirm",
		"postcode", "music_experience",
		"past_gigs", "id_instrument_multiple", "id_genre_multiple",
		"commitment_level", "gig_frequency", "agree"

		// "bandSize", "preferred_age_bracket", "required_music_experience", "members_needed"

		// "status", "gender"
	];

	data.name = $('#name').val();
	// data.gender = $('[name="gender"]:checked').val();
	data.age_bracket = $('#age_bracket').val();
	data.username = $('#username').val();
	data.email = $('#email').val();
	data.password = $('#password').val();
	data.passwordConfirm = $('#passwordConfirm').val();
	data.postcode = $('#postcode').val();

	data.aboutMe = $('#aboutMe').val();
	// data.status = $('[name="status"]:checked').val();
	data.music_experience = $('#music_experience').val();
	data.past_gigs = $('#past_gigs').val();
	data.id_instrument_multiple = $('#id_instrument_multiple').val();
	data.id_genre_multiple = $('#id_genre_multiple').val();
	data.commitment_level = $('#commitment_level').val();
	data.gig_frequency = $('#gig_frequency').val();
	data.agree = $('#agree:checked').val();

	data.bandSize = $("#bandSize").val();
	data.preferred_age_bracket = $("#preferred_age_bracket").val();
	data.required_music_experience = $("#required_music_experience").val();
	data.members_needed = $("#members_needed").val();

	var formData = new FormData($(".register-form")[0]);
	Object.keys(data).map(function(key) {
		if ( (data[key] != null) && (data[key] != "") && (typeof data[key] != typeof undefined) ) {
			formData.append(key, data[key]);
		} else {
			if ( required.includes(key) ) {
				errors.push(key);
			}
		}
	});

	if ( !appPage.password.confirm() ) {
		errors.push("passwordConfirm");
	}

	if (errors.length > 0) {
		errors.map(function(key) {
			$("#" + key).addError();
		});
	} else {
		$.ajax({
			type: "POST",
			url: "/api/user/register",
	        enctype: 'multipart/form-data',
			cache: false,
	        contentType: false,
	        processData: false,
			data: formData
		})

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
appPage.password.strength = function($this) {
	console.log(zxcvbn($this.val()));
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
	appPage.password.strength($(this));
}).on("keyup focusout", "#passwordConfirm", function() {
	appPage.password.confirm();
})
