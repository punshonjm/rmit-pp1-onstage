var appPage = {};

appPage.initialise = function() {

};
appPage.openThread = function($this) {
	var data = {};
	data.thread_id = $this.data().thread;

	$.get("/api/messaging/thread", data, function(resp) {
		console.log(resp);
	}).fail(function(error) {

	}).always(function() {

	});
};

$(document).ready(function() {
	appPage.initialise();
}).on("click", ".message", function() {
	appPage.openThread($(this));
})
