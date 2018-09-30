var pageApp = {};
window.app = {};

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
