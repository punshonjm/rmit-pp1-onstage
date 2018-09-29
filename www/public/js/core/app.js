window.app = {};

window.app.logout = function() {
	$.get("/logout", function(res) {

	}).always(function() {
		window.location.reload();
	});
}

$(document).ready(function() {
	window.app.initialise();
}).on("click", "#logout", function() {
	window.app.logout();
});

window.app.initialise = function() {
	$(".modal").appendTo("body");
};

// Add additional global functions
if (!String.isNullOrEmpty) {
    Object.defineProperty(String, "isNullOrEmpty", {
        value: function(value) {
            return !(typeof value === 'string' && value.length > 0);
        },
        enumerable: false,
    });
}
