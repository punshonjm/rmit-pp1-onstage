const router = require("express").Router();
const app = require("@modules/app");
const models = require("@modules/models");

router.get("/", (req, res) => {
    Promise.resolve().then(() => {
        var search = (req.query.search == null) ? '' : req.query.search;

		// Ensure search string is at least 2 characters in length
		if (search.length < 2) {
			res.status(200).json({results: []}).end();
			return Promise.reject();
		}

        return models.list.postcode.query(search);
    }).then((postcode) => {
        // Convert into Select2 format and return
        var postcodeRemap = postcode.map(row => ({
            id: row.id,
            text: row.name
        }));
		
        res.status(200)
            .json({results: postcodeRemap})
            .end();
    }).catch((error) => app.handleError(error, req, res));
});

module.exports = router;
