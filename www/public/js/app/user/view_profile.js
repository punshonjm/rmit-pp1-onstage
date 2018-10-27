var appPage = {};

$(document).ready(function() {
	appPage.initialise();
}).on("click", "#reportUser", function() {
	appPage.report($(this));
}).on("click", "#sendMessage", function() {
	appPage.send($(this));
}).on("click", "#resetMessage", function() {
	appPage.resetMessage($(this));
});

appPage.initialise = function() {
	$('.select2-instrument-view').select2({
		theme: "material",
		disabled: true
	});

	$('.select2-genre-view').select2({
		theme: "material",
		disabled: true
	});

	$(".select2-selection__arrow").addClass("material-icons").html("arrow_drop_down");
};

appPage.report = function($this) {
	var data = {};
	data.user_id = $this.data().id;
	data.tag_report = ($("#reportUser").find("#tag_reportReason").val());
	data.reportReason = ($("#reportUser").find("#reportReason").val().trim());

	$("#reportReason").closest(".row").hide();
	$(".reportStatus").closest(".row").show();
	$this.prop("disabled", true);

	if ( String.isNullOrEmpty(data.reportReason) ) {
		$("#reportReason").closest(".row").show();
		$this.prop("disabled", false);
		$(".reportStatus").append("<p class='text-danger'>Please make sure you have entered a reason why you are reporting this user.</p>");
	} else {
		$.post("/api/user/" + data.user_id + "/report", data, function(res) {
			$(".reportStatus").append("<p class='text-success'>Your report has been received, an admin will review this user within 48 hours. Thank you.</p>");
		}).fail(function() {
			$("#reportReason").closest(".row").show();
			$this.prop("disabled", false);
			if ( error.status == 401 && ("responseJSON" in error) ) {
				$(".reportStatus").append("<p class='text-danger'>" + error.responseJSON.message + "</p>");
			} else {
				$(".reportStatus").append("<p class='text-danger'>Something went wrong! Please try again.</p>");
			}
		});
	}
};

appPage.resetMessage = function($this) {
	setTimeout(function() {
		$(".messageContent").show();
		$(".messageNotice").hide();
		$('#messageContent').val('');
		$('#sendMessage').prop("disabled", false);
	}, 500);

}

appPage.send = function($this) {
	var data = {};

	data.message_to = $this.data().id;
	data.message = ($("#messageUser").find("#messageContent").val().trim());


	if ( data.message.length < 1 ) {
		// No content
	} else {

		$(".messageNotice").show();
		$(".messageContent").hide();

		$this.prop("disabled", true);

		$(".loading-indicator").find(".loading-status").text("Sending your message...");
		$(".loading-indicator").show();

		$.post("/api/messaging/send", data, function(resp) {
			$(".loading-indicator").find(".loading-status").text("All done!");

			$(".messageStatus").html("<h4>" + resp.message + "</h4>");

		}, "json").fail(function(error) {
			$this.prop("disabled", false);
			$(".loading-indicator").find(".loading-status").text("Something went wrong!");

			if ( ("responseJSON" in error) && ("errorSet" in error.responseJSON) ) {
				error.responseJSON.errorSet.map(function(err) {
					$("#" + err.key).addError("has-danger", err.message);
				});
			} else {
				$("#messageStatus").append("<p class='text-danger'>" + error.responseJSON.message || "An error occured!" + "</p>")
			}
		}).always(function() {
			setTimeout(function() {
				$(".loading-indicator").find(".loading-status").text("");
				$(".loading-indicator").hide();
			}, 500);
		});
	}
};
