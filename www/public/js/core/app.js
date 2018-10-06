var pageApp = {};
window.app = {};
window.app.data = {};

pageApp.logout = function() {
	$.get("/logout", function(res) {

	}).always(function() {
		window.location.reload();
	});
};

pageApp.resendVerification = function() {
	$("#resendVerification").prop("disabled", true);
	$(".verify_link").html("<span>Sending <i class='fa fa-spinner fa-spin'></i></span>");

	$.get("/api/user/new_verification", function(res) {
		$(".verify_link").html("<span class='alert-link'>New link sent!</span>");
	}).fail(function() {
		$(".verify_link").html('<span id="resendVerification" class="alert-link" style="cursor: pointer;">Resend</span>');
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
});

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
