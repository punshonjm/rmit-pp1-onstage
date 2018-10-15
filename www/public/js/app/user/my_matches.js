var appPage = {};

$(document).ready(function() {
	appPage.initialise();
}).on("click", ".toggle-style", function() {
	appPage.toggleStyle($(this));
})

appPage.initialise = function() {

};
appPage.toggleStyle = function($this) {
	// Update button
	var style = ($this.data().style == "lines") ? "grid" : "lines";
	$this.find("i").hide();
	$this.find("i.view-" + style).show();
	$this.data("style", style);

	if ( style == "grid" ) {
		$("#matches").find(".match").each(function() {
			$(this).addClass("col-md-3").removeClass("col-md-12");
			$(this).find(".description").hide();
			$(this).find(".grid-item").show();
		});
	} else if ( style == "lines" ) {
		$("#matches").find(".match").each(function() {
			$(this).removeClass("col-md-3").addClass("col-md-12");
			$(this).find(".description").show();
			$(this).find(".grid-item").hide();
		});
	}
};
