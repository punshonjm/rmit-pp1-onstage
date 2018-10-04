var pageApp = {};
window.app = {};
window.app.data = {};

pageApp.logout = function() {
	$.get("/logout", function(res) {

	}).always(function() {
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
