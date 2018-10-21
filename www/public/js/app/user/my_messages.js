var appPage = {};

appPage.currentCaller = {};

appPage.initialise = function() {
	window.app.templates.load({ path: "messaging/thread", name: "thread" });
};
appPage.openThread = function($this) {
	$("#messages-panel").empty();
	$(".message.active").removeClass("active");

	var data = {};
	data.thread_id = $this.data().thread;

	appPage.currentThread = data.thread_id;

	$.get("/api/messaging/thread", data, function(resp) {
		console.log(resp);

		$this.closest(".message").addClass("active");

		appPage.currentCaller = $this;
		let html = window.app.templates.thread(resp.thread);
		$("#messages-panel").html(html);
	}).fail(function(error) {

	}).always(function() {

	});
};

appPage.send = function($this) {
	var data = {};

	data.message_to = $this.data().id;
	data.message = $("#new-message").val().trim();

	if ( data.message.length === 0 ) {
		// No content
	} else {

		$.post("/api/messaging/send", data, function(resp) {

			appPage.openThread(appPage.currentCaller);

		}, "json").fail(function(error) {
			alert(error.responseJSON.message || "An error occured!");
		});
	}
};


$(document).ready(function() {
	appPage.initialise();
}).on("click", ".message", function() {
	appPage.openThread($(this));
}).on("click", "#send-message", function() {
	appPage.send($(this));
});