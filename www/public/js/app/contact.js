var appPage = {};

$(document).ready(function() {
	appPage.initialise();
}).on("click", "#send", function() {
	appPage.send($(this));
})

appPage.initialise = function() {

};
appPage.send = function($this) {
	$this.prop("disabled", true);
	$("#contact_status").empty();

	var data = {};
	if ( $("#name").is(":visible") ) {
		data.name = $("#name").val();
		data.email = $("#email").val();
	}

	data.subject = $("#subject").val();
	data.message = $("#message").val();
	data._csrf = $('[name="__csrf"]').val();

	var errors = [];
	Object.keys(data).map(function(key) {
		if ( data[key] == null || data[key] == "" ) errors.push(key);
	});

	if ( errors.length > 0 ) {
		$this.prop("disabled", false);
		errors.map(function(key) {
			$("#" + key).addError();
		});
	} else {
		$(".loading-indicator").find(".loading-status").text("Sending your message...");
		$(".loading-indicator").show();

		$.post("/api/contact", data, function(resp) {
			$(".loading-indicator").find(".loading-status").text("All done!");
			$(".contact-form").html("<h4>" + resp.message + "</h4>");
		}, "json").fail(function(error) {
			$this.prop("disabled", false);
			$(".loading-indicator").find(".loading-status").text("Something went wrong!");

			if ( ("responseJSON" in error) && ("errorSet" in error.responseJSON) ) {
				error.responseJSON.errorSet.map(function(err) {
					$("#" + err.key).addError("has-danger", err.message);
				});
			} else {
				$("#contact_status").append("<p class='text-danger'>" + error.responseJSON.message || "An error occured!" + "</p>")
			}
		}).always(function() {
			setTimeout(function() {
				$(".loading-indicator").find(".loading-status").text("");
				$(".loading-indicator").hide();
			}, 500);
		});
	}
};
