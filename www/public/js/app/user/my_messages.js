var appPage = {};

appPage.initialise = function() {
	window.app.templates.load({ path: "messaging/thread", name: "thread" });
};
appPage.openThread = function($this) {
	$("#messages-panel").empty();
	$(".message.active").removeClass("active");

	var data = {};
	data.thread_id = $this.data().thread;

	$.get("/api/messaging/thread", data, function(resp) {
		console.log(resp);

		$this.closest(".message").addClass("active");

		let html = window.app.templates.thread(resp.thread);
		$("#messages-panel").html(html);
	}).fail(function(error) {

	}).always(function() {

	});
};

$(document).ready(function() {
	appPage.initialise();
}).on("click", ".message", function() {
	appPage.openThread($(this));
})
