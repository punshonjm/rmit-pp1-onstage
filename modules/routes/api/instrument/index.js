const router = require("express").Router();
const app = require("@modules/app");
const models = require("@modules/models");

router.get("/", (req, res) => {
    Promise.resolve().then(() => {
        var search = req.query.search;
        return models.list.instrument.query(search);
    }).then((instrument) => {
        // Convert into Select2 format and return
        var instrumentRemap = instrument.map(row => {
            return {
                id: row.id,
                text: row.name
            };
        });
        res.status(200)
            .json({results: instrumentRemap})
            .end();
    }).catch((error) => app.handleError(error, req, res));
});

module.exports = router;
