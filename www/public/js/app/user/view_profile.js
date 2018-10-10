var appPage = {};

$(document).ready(function() {
	appPage.initialise();
}).on("click", ".reportUser", function() {
	appPage.report($(this));
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
	data.reportReason = $("#reportUser").find("#reportReason").val().trim();

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
