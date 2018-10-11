var appPage = {};

appPage.initialise = function() {
	$('.select2-genre').select2({
		placeholder: "Choose genres...",
		ajax: {
			url: '/api/genre/',
			data: function (params) {
				var query = {
					search: params.term
				};
				return query;
			}
		},
		theme: "material"
	});


$(document).ready(function() {
	appPage.initialise();
})
