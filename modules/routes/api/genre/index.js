const router = require("express").Router();
const app = require("@modules/app");
const models = require("@modules/models");

router.get("/", (req, res) => {
    Promise.resolve().then(() => {
        var search = req.query.search;
        return models.list.genre.query(search);
    }).then((genre) => {
        // Convert into Select2 format and return
        var genreRemap = genre.map(row => ({
            id: row.id,
            text: row.name
        }));
		
        res.status(200)
            .json({results: genreRemap})
            .end();
    }).catch((error) => app.handleError(error, req, res));
});

module.exports = router;
