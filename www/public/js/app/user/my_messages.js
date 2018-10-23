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

	$.get("/api/messaging/thread", data, function(resp) {
		$this.closest(".message").addClass("active");
		console.log(resp);

		appPage.currentCaller = $this;
		appPage.currentThread = data.thread_id;

		let html = window.app.templates.thread(resp.thread);
		$("#messages-panel").html(html);

		// When message thread is loaded, hide current new message notification
		$("span").find(`[data-thread='${data.thread_id}']`).addClass("d-none");

		//$("#thread-list").addClass("d-none");
		$("#messages-panel").removeClass("d-none");
	}).fail(function(error) {

	}).always(function() {

	});
};

appPage.goBack = function() {
	$("#thread-list").removeClass("d-none");
	$("#messages-panel").addClass("d-none");
	$(".message.active").removeClass("active");

	$("#messages-panel").empty();
	appPage.currentCaller = null;
	appPage.currentThread = null;
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
			appPage.openThread(appPage.currentCaller);
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
}).on("click", ".go-back", function() {
	appPage.goBack();
})
