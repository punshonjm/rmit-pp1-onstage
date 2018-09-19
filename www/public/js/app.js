window.app = {};

window.app.logout = function() {
	$.get("/logout", function(res) {
		window.location.reload();
	});
}

$(document).ready(function() {

}).on("click", "#logout", function() {
	window.app.logout();
});
