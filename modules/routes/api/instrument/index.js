const router = require("express").Router();
const app = require("@modules/app");
const models = require("@modules/models");

router.get("/", (req, res) => {
    Promise.resolve().then(() => {
        var search = req.query.search || null;
        return models.list.instrument.query(search);
    }).then((instrument) => {
        res.status(200).json(instrument).end();
    }).catch((error) => app.handleError(error, req, res));
});

module.exports = router;
