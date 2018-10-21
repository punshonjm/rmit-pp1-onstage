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

appPage.sendMessage = function($this) {
	var data = {};
	data.thread_id = $this.closest(".thread-message").data().thread;
	data.content = $("#new-message").val();

	if ( data.content == "" || data.content == null ) {
		$("#new-message").addError("has-danger", "Type a message before pressing send.");
	} else {
		$this.prop("disabled", true);

		$.post("/api/messaging/send", data, function(resp) {
			console.log(resp);
			
		}).fail(function(error) {
			$("#new-message").addError("has-danger", error.responseJSON.message);
		}).always(function() {
			$this.prop("disabled", false);
		});
	}
};

$(document).ready(function() {
	appPage.initialise();
}).on("click", ".message", function() {
	appPage.openThread($(this));
}).on("click", ".send-message", function() {
	appPage.sendMessage($(this));
})
