window.app = {};

window.app.logout = function() {
	$.get("/logout", function(res) {
		window.location.reload();
	}).fail(function() {

	});
}

$(document).ready(function() {

}).on("click", "#logout", function() {
	window.app.logout();
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
