const fs = require("fs");
const path = require("path");

const Handlebars = require('handlebars');
const moment = require("moment");
const router = require("express").Router();

const templating = require("./templating")(Handlebars);
const app = require("./app");

router.get("/", (request, response) => {
    return Promise.resolve().then(() => {
        return templating.compile("home", { pageName: "Home" });
    }).then((html) => {
        response.send(html).end();
    }).catch((err) => app.handleError(err, request, response));
});

const api = require("./api");
router.use("/api", api);

module.exports = router;
